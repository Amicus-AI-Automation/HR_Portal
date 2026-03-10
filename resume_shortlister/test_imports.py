try:
    import sentence_transformers
    from sentence_transformers import SentenceTransformer
    print("sentence_transformers imported successfully")
    import fastapi
    print("fastapi imported successfully")
    import numpy
    print("numpy imported successfully")
except ImportError as e:
    print(f"Import failed: {e}")
