import os 
from langchain_groq import ChatGroq

def get_llm():
    return ChatGroq(
        model_name="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2
    )

