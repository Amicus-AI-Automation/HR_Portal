import os

from parser.text_extractor import extract_text_from_pdf
from parser.contact_extractor import extract_contact_details
from embeddings.embedder import create_embedding
from vector_db.faiss_index import ResumeVectorDB


RESUME_FOLDER = "resumes"
JD_FILE = "jd/jd.txt"


def load_resumes():

    texts = []
    paths = []

    for file in os.listdir(RESUME_FOLDER):

        path = os.path.join(RESUME_FOLDER, file)

        text = extract_text_from_pdf(path)

        texts.append(text)

        paths.append(path)

    return texts, paths


def main():

    jd = open(JD_FILE).read()

    resume_texts, resume_paths = load_resumes()

    resume_embeddings = [create_embedding(t) for t in resume_texts]

    dimension = len(resume_embeddings[0])

    vector_db = ResumeVectorDB(dimension)

    vector_db.add_resumes(resume_embeddings, resume_paths)

    jd_embedding = create_embedding(jd)

    top_resumes = vector_db.search(jd_embedding, top_k=3)

    print("\nTop Matching Candidates\n")

    for resume in top_resumes:

        text = extract_text_from_pdf(resume)

        contact = extract_contact_details(text)

        print(contact)


if __name__ == "__main__":
    main()