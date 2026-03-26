import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESUME_FOLDER = os.path.join(BASE_DIR, "resumes")
ALT_RESUME_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resumes")

print(f"Current File: {os.path.abspath(__file__)}")
print(f"BASE_DIR: {BASE_DIR}")
print(f"RESUME_FOLDER (root): {RESUME_FOLDER}")
print(f"ALT_RESUME_FOLDER (subdir): {ALT_RESUME_FOLDER}")

if os.path.exists(RESUME_FOLDER):
    print(f"Root resumes exists, contains {len(os.listdir(RESUME_FOLDER))} files")
else:
    print("Root resumes does NOT exist")

if os.path.exists(ALT_RESUME_FOLDER):
    print(f"Subdir resumes exists, contains {len(os.listdir(ALT_RESUME_FOLDER))} files")
else:
    print("Subdir resumes does NOT exist")
