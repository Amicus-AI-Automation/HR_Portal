import sys
import os

print("Check path...", flush=True)
sys.path.append(os.getcwd())

print("Import pdfplumber...", flush=True)
import pdfplumber
print("Import easyocr...", flush=True)
import easyocr
print("Create reader...", flush=True)
reader = easyocr.Reader(['en'])
print("Reader ready.", flush=True)
