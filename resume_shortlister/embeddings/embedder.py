from sentence_transformers import SentenceTransformer

_model = None

def _get_model():
    global _model
    if _model is None:
        print("[EMBEDDER] Loading SentenceTransformer model...", flush=True)
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[EMBEDDER] Model loaded.", flush=True)
    return _model

def create_embedding(text):
    model = _get_model()
    return model.encode(text)
