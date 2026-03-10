from google import genai

client = genai.Client(api_key="AIzaSyCmYRuDksaCaWR0HGj4v86AaJzjQbFSrIA")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain what an LLM is in 2 lines"
)

print(response.text)