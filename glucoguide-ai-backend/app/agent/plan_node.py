import re
import json
from app.agent.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate


def generate_protocol(clinical_data: dict):

    llm = get_llm()

    prompt = ChatPromptTemplate.from_template("""
You are an AI Metabolic Operating System designed for the Indian context.

Step 1:
Analyze clinical biomarkers.
Identify the highest metabolic risk.

Step 2:
Generate a structured 7-day intervention protocol.
Vary the exercise routine: Suggest Yoga (Surya Namaskar, Kapalbhati), Strength Training, or Walking. Do NOT default to just walking.

Return STRICT JSON only.

Required format:

{{
  "risk_analysis": {{
    "primary_risk": "",
    "severity": "",
    "priority_level": "1-5"
  }},
  "protocol_duration_days": 7,
  "routine": [
    {{
      "time": "e.g. 7:00 AM",
      "activity": "Detailed activity (use Indian context for meals/habits e.g. Methi water, Yoga, Roti)",
      "priority": "Mandatory | Priority | Optimized",
      "reason": ""
    }}
  ],
  "restrictions": [
    {{
      "type": "",
      "duration_hours": "",
      "reason": ""
    }}
  ],
  "monitoring_focus": []
}}

Clinical Data:
{data}
""")

    chain = prompt | llm
    response = chain.invoke({"data": json.dumps(clinical_data)})

    content = response.content.strip()

    # Clean markdown
    content = re.sub(r"```json", "", content)
    content = re.sub(r"```", "", content)

    match = re.search(r"\{.*\}", content, re.DOTALL)

    if match:
        return json.loads(match.group(0))

    raise ValueError("Protocol JSON invalid")
