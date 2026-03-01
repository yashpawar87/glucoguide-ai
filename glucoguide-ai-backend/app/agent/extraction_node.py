from app.agent.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate
import json
import re 

def extract_clinical_data(raw_text: str): 
    # Truncate text to avoid token limits (Groq Llama-3 limit ~6k tokens)
    # 12,000 chars is approx 3,000 tokens, leaving room for prompt + response
    if len(raw_text) > 12000:
        raw_text = raw_text[:12000] + "\n...[TRUNCATED]..."

    llm = get_llm()

    prompt = ChatPromptTemplate.from_template("""
You are a medical data extraction assistant.

Extract the following fields from the lab report text:

- hba1c
- fasting_glucose
- triglycerides
- hdl
- bmi
- blood_pressure

Return ONLY valid JSON.
Do not include explanations.
Do not include markdown.

Lab Report Text:
{report}
    """)    

    chain = prompt | llm
    response = chain.invoke({"report": raw_text})

    content = response.content.strip()
    
    # Remove markdown formatting if present
    content = re.sub(r"```json", "", content)
    content = re.sub(r"```", "", content)
    content = content.strip()

    # Extract JSON object using regex
    match = re.search(r"\{.*\}", content, re.DOTALL)

    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parse error: {e}\nExtracted: {json_str}")

    raise ValueError(f"LLM did not return valid JSON. Got: {content}")