import os
import re
import threading
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import sys
import requests
import json
import concurrent.futures
from fastapi.staticfiles import StaticFiles
import asyncio

print("[START] Starting Resume Intelligence Backend...", flush=True)

try:
    print("[INIT] Importing modules...", flush=True)
    from parser.text_extractor  import extract_text_from_pdf
    from parser.contact_extractor import extract_contact_details
    from embeddings.embedder    import create_embedding
    from vector_db.faiss_index  import ResumeVectorDB
    from database.mongo_db      import db
    print("[INIT] All imports OK.", flush=True)
except ImportError as e:
    print(f"[ERROR] Missing dependency — {e}", flush=True)
    sys.exit(1)

# ── App ────────────────────────────────────────────────────────
app = FastAPI(title="Resume Shortlister API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files route
app.mount("/resumes", StaticFiles(directory="resumes"), name="resumes")

def get_openrouter_key():
    import os
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("VITE_OPENROUTER_API_KEY="):
                    return line.strip().split("=", 1)[1]
    return ""

# ── Config ─────────────────────────────────────────────────────
RESUME_FOLDER   = "resumes"
MIN_COSINE      = 0.25    # minimum cosine similarity to be considered a match
MIN_FINAL_SCORE = 35.0    # minimum ATS % score to appear in results
MAX_RESULTS     = 10      # hard cap on returned candidates

# ── Globals ────────────────────────────────────────────────────
vector_db: ResumeVectorDB | None = None
_db_ready = False
_db_lock  = threading.Lock()

# ── Pydantic Models ────────────────────────────────────────────
class JDRequest(BaseModel):
    jd_text: str
    jd_id: Optional[str] = None

class JDSaveRequest(BaseModel):
    title: str
    department: str
    experience: str
    location: str
    content: str

class StatusUpdateRequest(BaseModel):
    jd_id: str
    resume_path: str
    status: str

class QuestionRequest(BaseModel):
    resume_path: str
    jd_text: str
    jd_id: str
    candidate_name: str

# ── ATS Scoring ────────────────────────────────────────────────
def calculate_ats_score(resume_text: str, jd_text: str, cosine_sim: float) -> float:
    """
    ATS score = 80% cosine semantic similarity + 20% keyword overlap.
    cosine_sim is already in [0, 1] range (after normalisation).
    """
    semantic = cosine_sim * 80.0

    jd_tokens     = set(re.findall(r"[a-zA-Z]{3,}", jd_text.lower()))
    resume_tokens = set(re.findall(r"[a-zA-Z]{3,}", resume_text.lower()))
    if jd_tokens:
        overlap_ratio = len(jd_tokens & resume_tokens) / len(jd_tokens)
        keyword_bonus = min(20.0, overlap_ratio * 40.0)
    else:
        keyword_bonus = 0.0

    return min(98.0, round(semantic + keyword_bonus, 1))

# ── Summary Extraction ─────────────────────────────────────────
_SUMMARY_TRIGGERS = ("experience", "skill", "objective", "summary",
                     "profile", "expertise", "qualification", "about")

def generate_summary(resume_text: str, jd_text: str) -> str:
    """
    Generate an AI summary using Llama 3.3 via OpenRouter API.
    """
    api_key = get_openrouter_key()
    if not api_key:
        lines = [l.strip() for l in resume_text.splitlines() if len(l.strip()) > 40]
        for line in lines:
            if any(kw in line.lower() for kw in _SUMMARY_TRIGGERS):
                return line[:200] + ("…" if len(line) > 200 else "")
        return lines[0][:200] + ("…" if len(lines[0]) > 200 else "") if lines else "Candidate matches job requirements."

    # Truncate to limit tokens processing heavily
    resume_trunc = resume_text[:3000]
    jd_trunc = jd_text[:2000]

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", # Required for some free models
        "X-Title": "HR Intelligence Portal"
    }
    # Use the fastest available model for shortlisting summaries to avoid timeouts
    data = {
        "model": "google/gemini-3.1-flash-lite-preview",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert HR assistant. Write a precise, 2-3 sentence summary of why this candidate fits the role. Highlight relevant experience or skills. Do not include placeholders or greetings."
            },
            {
                "role": "user",
                "content": f"JOB DESCRIPTION:\n{jd_trunc}\n\nRESUME:\n{resume_text[:3000]}"
            }
        ],
        "temperature": 0.5,
        "max_tokens": 300
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        response.raise_for_status()
        res_json = response.json()
        
        if "choices" in res_json and len(res_json["choices"]) > 0:
            return res_json["choices"][0]["message"]["content"].strip()
        else:
            raise ValueError("Empty response from LLM")

    except Exception as e:
        print(f"[LLM_ERROR] {str(e)}", flush=True)
        return "Match analysis suggests alignment with core technical requirements and domain experience."

# ── VectorDB Boot ──────────────────────────────────────────────
def initialize_vector_db():
    global vector_db, _db_ready
    try:
        print("[VECTOR_DB] Initialising Vector Database...", flush=True)

        # Determine embedding dimension via a tiny probe
        probe_emb = create_embedding("probe")
        dimension = len(probe_emb)

        with _db_lock:
            vector_db = ResumeVectorDB(dimension)

        n_indexed = len(vector_db.resume_map)

        if n_indexed > 0:
            print(f"[VECTOR_DB] Loaded {n_indexed} pre-indexed resumes from disk.", flush=True)
        else:
            # Fresh index — parse and embed every PDF in the resumes folder
            print("[VECTOR_DB] Empty database. Scanning resumes folder...", flush=True)
            if not os.path.exists(RESUME_FOLDER):
                os.makedirs(RESUME_FOLDER)
                print(f"[WARN] Created folder: {RESUME_FOLDER}", flush=True)
            else:
                pdfs = sorted(
                    f for f in os.listdir(RESUME_FOLDER) if f.lower().endswith(".pdf")
                )
                if not pdfs:
                    print("[WARN] No PDF files found in 'resumes/' folder.", flush=True)
                else:
                    texts, paths = [], []
                    for fname in pdfs:
                        fpath = os.path.join(RESUME_FOLDER, fname)
                        try:
                            t = extract_text_from_pdf(fpath)
                            if t.strip():
                                texts.append(t)
                                paths.append(fpath)
                                print(f"   [OK] {fname}", flush=True)
                            else:
                                print(f"   [WARN] {fname} — empty text, skipped", flush=True)
                        except Exception as e:
                            print(f"   [ERROR] {fname} — {e}", flush=True)

                    if texts:
                        print(f"[ENCODE] Encoding {len(texts)} resumes...", flush=True)
                        embeddings = [create_embedding(t) for t in texts]
                        with _db_lock:
                            vector_db.add_resumes(embeddings, paths, texts)
                        print(f"[SUCCESS] Indexed {len(texts)} resumes.", flush=True)

        _db_ready = True
        print("[VECTOR_DB] Ready — server fully operational.", flush=True)

    except Exception as e:
        import traceback
        print(f"[ERROR] VectorDB init error: {e}", flush=True)
        traceback.print_exc()

# ── Startup  ───────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    # Heavy work in a background thread so uvicorn binds instantly
    threading.Thread(target=initialize_vector_db, daemon=True).start()

# ── Routes ─────────────────────────────────────────────────────
@app.get("/")
def read_root():
    n = len(vector_db.resume_map) if vector_db else 0
    return {"status": "online", "db_ready": _db_ready, "indexed_resumes": n}

@app.get("/health")
def health():
    return {"status": "ok", "db_ready": _db_ready}

@app.get("/jds")
async def get_jds():
    jds = await db.get_all_jds()
    return {"jds": jds}

@app.post("/jds")
async def save_jd(request: JDSaveRequest):
    data = request.model_dump() if hasattr(request, "model_dump") else request.dict()
    jd_id = await db.save_jd(data)
    return {"id": jd_id, "status": "saved"}

@app.get("/candidates")
async def get_candidates():
    candidates = await db.get_accepted_candidates()
    return {"candidates": candidates}

@app.post("/candidates/status")
async def update_status(request: StatusUpdateRequest):
    # Lookup the accurate resume_id from MongoDB
    resume_id = None
    res = await db.resumes.find_one({"path": request.resume_path})
    if res:
        resume_id = str(res["_id"])
    
    if resume_id:
        await db.update_candidate_status(request.jd_id, resume_id, request.status)
        return {"status": "updated"}
    
    raise HTTPException(status_code=404, detail="Candidate not found in database.")

@app.post("/shortlist")
async def shortlist(request: JDRequest):
    jd_text = request.jd_text.strip()
    print(f"[SEARCH] Shortlist request — JD {len(jd_text)} chars", flush=True)

    if not _db_ready or vector_db is None:
        return {
            "top_candidates": [],
            "warning": "The database is still initialising. Please wait a moment and try again.",
        }

    if len(vector_db.resume_map) == 0:
        return {
            "top_candidates": [],
            "warning": "No resumes are indexed. Add PDF files to the 'resumes/' folder and restart the server.",
        }

    if not jd_text:
        raise HTTPException(status_code=422, detail="jd_text must not be empty.")

    try:
        jd_embedding = create_embedding(jd_text)

        # Semantic search — returns pre-filtered results (cosine >= MIN_COSINE)
        with _db_lock:
            results = vector_db.search(
                jd_embedding,
                top_k=MAX_RESULTS * 2,   # fetch extra so threshold filtering still gives enough
                min_cosine=MIN_COSINE,
            )

        preliminary_candidates = []
        for r in results:
            text       = r["text"]
            cosine_sim = r["cosine_score"]
            score      = calculate_ats_score(text, jd_text, cosine_sim)

            if score < MIN_FINAL_SCORE:
                continue
                
            preliminary_candidates.append((r, score))
            
        # Sort and cap before generating summaries (saves API calls)
        preliminary_candidates.sort(key=lambda x: x[1], reverse=True)
        preliminary_candidates = preliminary_candidates[:MAX_RESULTS]

        top_candidates = []
        
        # Parallel LLM Summary Generator
        async def process_candidate(item):
            r, score = item
            text = r["text"]
            
            # Offload blocking API calls to threads
            summary = await asyncio.to_thread(generate_summary, text, jd_text)
            contact = await asyncio.to_thread(extract_contact_details, text)
            
            filename = os.path.basename(r["path"])
            file_url = f"http://localhost:8000/resumes/{filename}"

            # Read PDF bytes from disk to store in MongoDB
            try:
                with open(r["path"], "rb") as f:
                    pdf_bytes = f.read()
            except Exception:
                pdf_bytes = b""

            # Save/Track in MongoDB — flattened contact fields, no nested object
            resume_id = await db.get_or_create_resume(
                filename, r["path"], text, pdf_bytes,
                name=contact.get("name"),
                email=contact.get("email"),
                phone=contact.get("phone")
            )
            if request.jd_id:
                await db.save_shortlist_result(request.jd_id, resume_id, score, summary, jd_text)

            return {
                "name":    contact.get("name") or filename,
                "email":   contact.get("email"),
                "phone":   contact.get("phone"),
                "score":   score,
                "summary": summary,
                "path":    r["path"],
                "file_url": file_url,
                "resume_id": resume_id
            }

        # Process all candidates in parallel
        results = await asyncio.gather(*(process_candidate(item) for item in preliminary_candidates))
        top_candidates = list(results)

        # Re-sort to maintain order
        top_candidates.sort(key=lambda x: x["score"], reverse=True)

        print(f"[SUCCESS] Returning {len(top_candidates)} qualified candidates.", flush=True)
        return {"top_candidates": top_candidates}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-questions")
async def generate_interview_questions(request: QuestionRequest):
    api_key = get_openrouter_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API Key not found.")

    # Find the resume text from our database
    resume_text = ""
    with _db_lock:
        if vector_db:
            for idx, path in vector_db.resume_map.items():
                if path == request.resume_path:
                    # We might need to handle how text is stored or retrieved.
                    # In current implementation, vector_db.search returns text. 
                    # If we don't have an easy lookup, we might need to re-parse or add a lookup.
                    # Looking at vector_db implementation...
                    pass
    
    # If the text isn't easily searchable by path in the current ResumeVectorDB, 
    # we'll re-parse it for now (it's fast enough for a single file)
    if not resume_text:
        try:
            from parser.text_extractor import extract_text_from_pdf
            resume_text = extract_text_from_pdf(request.resume_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read resume file: {e}")

    prompt = f"""
    Act as a senior interviewer. Based on the candidate's resume and the job description, generate 10 highly relevant, technical, and behavioral interview questions.
    
    CANDIDATE: {request.candidate_name}
    JOB DESCRIPTION:
    {request.jd_text[:2000]}
    
    RESUME:
    {resume_text[:3000]}
    
    Return the response as a JSON array of strings, where each string is a single question. No preamble or markdown formatting, just the raw JSON.
    """

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "google/gemini-3.1-flash-lite-preview",
        "messages": [
            {"role": "system", "content": "You are a professional HR specialist. Always return a raw JSON array of strings."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "response_format": { "type": "json_object" },
        "max_tokens": 1000
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=25)
        response.raise_for_status()
        res_json = response.json()
        content = res_json["choices"][0]["message"]["content"]
        
        # Parse the JSON array.
        try:
            parsed = json.loads(content)
            questions = []
            if isinstance(parsed, dict) and "questions" in parsed:
                questions = parsed["questions"]
            elif isinstance(parsed, list):
                questions = parsed
            else:
                questions = parsed # fallback
            
            # Save to MongoDB
            # We need to find the resume_id
            resume_id = None
            res_doc = await db.resumes.find_one({"path": request.resume_path})
            if res_doc:
                resume_id = str(res_doc["_id"])
            
            if resume_id and request.jd_id:
                await db.save_questions(request.jd_id, resume_id, questions)

            return {"questions": questions}
        except:
            # Plan B: Try to extract JSON from the string using regex
            import re
            match = re.search(r"\[.*\]", content, re.DOTALL)
            if match:
                qs = json.loads(match.group())
                # Save Plan B results too
                res_doc = await db.resumes.find_one({"path": request.resume_path})
                if res_doc and request.jd_id:
                    await db.save_questions(request.jd_id, str(res_doc["_id"]), qs)
                return {"questions": qs}
            raise
    except Exception as e:
        print(f"[CRITICAL_QUESTION_FAILURE] {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

# ── Entry Point ────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("[SERVER] Binding to http://0.0.0.0:8000 ...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
