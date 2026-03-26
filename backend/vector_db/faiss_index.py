import faiss
import numpy as np
import pickle
import os

# Bump this string whenever the index format changes — forces a clean rebuild
INDEX_VERSION = "v2-cosine-ip"


class ResumeVectorDB:
    """
    Persistent FAISS vector database using cosine similarity (IndexFlatIP
    with L2-normalised embeddings).  Stores both file paths and cached
    resume texts so callers never need to re-parse PDFs on every search.
    """

    def __init__(
        self,
        dimension: int,
        db_path: str   = "vector_db/faiss_index.bin",
        map_path: str  = "vector_db/resume_map.pkl",
        text_path: str = "vector_db/resume_texts.pkl",
        ver_path: str  = "vector_db/index_version.txt",
    ):
        self.dimension  = dimension
        self.db_path    = db_path
        self.map_path   = map_path
        self.text_path  = text_path
        self.ver_path   = ver_path

        self.index        = faiss.IndexFlatIP(dimension)  # inner-product == cosine after normalisation
        self.resume_map   = {}   # {int_idx: str_path}
        self.resume_texts = {}   # {int_idx: str_text}

        self.load()

    #normalisation
    @staticmethod
    def _normalize(embeddings) -> np.ndarray:
        arr   = np.array(embeddings, dtype="float32")
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)   # guard against zero-vectors
        return arr / norms

    #add
    def add_resumes(self, embeddings, paths, texts):
        normed = self._normalize(embeddings)
        self.index.add(normed)

        base = len(self.resume_map)
        for i, (path, text) in enumerate(zip(paths, texts)):
            self.resume_map[base + i]   = path
            self.resume_texts[base + i] = text

        self.save()

    #search
    def search(self, query_embedding, top_k: int = 10, min_cosine: float = 0.20):
        """
        Returns a list of dicts sorted by cosine similarity (descending).
        Only entries with cosine_score >= min_cosine are included.
        """
        normed_q = self._normalize([query_embedding])
        k = min(top_k, max(self.index.ntotal, 1))
        scores, indices = self.index.search(normed_q, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx not in self.resume_map:
                continue
            if float(score) < min_cosine:
                continue
            results.append({
                "idx":          int(idx),
                "path":         self.resume_map[idx],
                "text":         self.resume_texts.get(idx, ""),
                "cosine_score": float(score),
            })
        return results

    #persistence
    def save(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        faiss.write_index(self.index, self.db_path)
        with open(self.map_path,  "wb") as f: pickle.dump(self.resume_map,   f)
        with open(self.text_path, "wb") as f: pickle.dump(self.resume_texts, f)
        with open(self.ver_path,  "w")  as f: f.write(INDEX_VERSION)
        print(f"[FAISS] Index saved ({len(self.resume_map)} entries).", flush=True)

    def load(self):
        # Version check — wipe stale index to force a clean rebuild
        if os.path.exists(self.ver_path):
            with open(self.ver_path) as f:
                ver = f.read().strip()
            if ver != INDEX_VERSION:
                print(f"[WARN] Index version mismatch ({ver!r} != {INDEX_VERSION!r}). Rebuilding...", flush=True)
                self._wipe_files()
                return

        if os.path.exists(self.db_path) and os.path.exists(self.map_path):
            try:
                self.index = faiss.read_index(self.db_path)
                with open(self.map_path,  "rb") as f: self.resume_map   = pickle.load(f)
                with open(self.text_path, "rb") as f: self.resume_texts = pickle.load(f)
                print(f"[FAISS] Persistent index loaded — {len(self.resume_map)} resumes ready.", flush=True)
            except Exception as e:
                print(f"[ERROR] Failed to load index: {e}. Rebuilding...", flush=True)
                self._wipe_files()

    def _wipe_files(self):
        for p in [self.db_path, self.map_path, self.text_path, self.ver_path]:
            if os.path.exists(p):
                os.remove(p)
        self.index        = faiss.IndexFlatIP(self.dimension)
        self.resume_map   = {}
        self.resume_texts = {}
