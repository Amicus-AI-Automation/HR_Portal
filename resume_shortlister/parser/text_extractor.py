"""
PDF text extractor.

Fast path  : pdfplumber  — handles text-layer PDFs without any ML.
Fallback   : pypdfium2 (renders pages) + EasyOCR — handles image/scanned PDFs.
             No Poppler dependency required.
"""

import numpy as np
import pdfplumber

# ── Lazy singletons ────────────────────────────────────────────
_ocr_reader = None

def _get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        print("[OCR] Initialising EasyOCR (first OCR call)...", flush=True)
        import easyocr
        _ocr_reader = easyocr.Reader(["en"], gpu=False)
        print("[OCR] EasyOCR ready.", flush=True)
    return _ocr_reader


# ── Core function ──────────────────────────────────────────────
def extract_text_from_pdf(file_path: str) -> str:
    """
    Return all text found in the PDF.

    1. Tries pdfplumber (instant, zero ML).
    2. Falls back to pypdfium2 page-rendering + EasyOCR for image-only PDFs.
    """
    text = _try_pdfplumber(file_path)
    if text.strip():
        return text

    print(f"[OCR] No text layer in {file_path!r} -> falling back to OCR...", flush=True)
    return _ocr_with_pypdfium2(file_path)


def _try_pdfplumber(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[ERROR] pdfplumber error on {file_path!r}: {e}", flush=True)
    return text


def _ocr_with_pypdfium2(file_path: str) -> str:
    """Render each PDF page to an image via pypdfium2, then run EasyOCR."""
    text = ""
    try:
        import pypdfium2 as pdfium
        reader = _get_ocr_reader()

        pdf = pdfium.PdfDocument(file_path)
        for page_index in range(len(pdf)):
            page   = pdf[page_index]
            bitmap = page.render(scale=1)          # 1x scale for speed
            pil_img = bitmap.to_pil()
            img_np  = np.array(pil_img.convert("RGB"))

            results = reader.readtext(img_np, detail=0, paragraph=True)
            text += " ".join(results) + "\n"

        pdf.close()
    except Exception as e:
        print(f"[ERROR] OCR failed on {file_path!r}: {e}", flush=True)

    return text
