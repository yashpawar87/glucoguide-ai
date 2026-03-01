import re
import json
from app.agent.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate


def generate_daily_recommendations(clinical_data: dict, daily_logs: list):
    """
    Generate personalized daily recommendations based on clinical markers + recent logs.
    Returns nutrition guide, movement plan, and today's actions with medicine tracker.
    """
    llm = get_llm()

    # Format daily log history for context
    log_summary = ""
    if daily_logs:
        log_entries = []
        for log in daily_logs:
            entry = (
                f"Date: {log.get('date', 'N/A')}, "
                f"Exercise: {log.get('exercise_minutes', 'N/A')} min, "
                f"Sleep: {log.get('sleep_hours', 'N/A')} hrs, "
                f"Glucose: {log.get('fasting_glucose', 'N/A')} mg/dL, "
                f"Diet: {log.get('diet_score', 'N/A')}/10, "
                f"Alcohol: {log.get('alcohol_units', 'N/A')} units, "
                f"Adherence: {log.get('adherence_score', 'N/A')}%"
            )
            log_entries.append(entry)
        log_summary = "\n".join(log_entries)
    else:
        log_summary = "No daily logs available yet."

    prompt = ChatPromptTemplate.from_template("""
You are an AI Metabolic Operating System designed for diabetic patient management in an Indian context.

Based on the patient's clinical biomarkers and recent daily log history, generate a personalized daily recommendation plan.

CLINICAL BIOMARKERS:
{clinical_data}

RECENT DAILY LOGS (last 7 days):
{log_summary}

Generate a STRICT JSON response with this exact structure:

{{
  "nutrition": {{
    "eat": ["item1", "item2", "item3", "item4"],
    "avoid": ["item1", "item2", "item3", "item4"],
    "ai_reasoning": "One sentence clinical reasoning about why these recommendations matter based on the biomarkers."
  }},
  "movement": {{
    "target_type": "Specific exercise type e.g. Zone 2 Aerobic (Brisk Walking)",
    "daily_goal": "Duration in mins e.g. 45 mins",
    "intensity": "Intensity with HR range e.g. Moderate (HR 110-125)",
    "clinical_logic": "One sentence explaining why this exercise is recommended based on the biomarkers."
  }},
  "actions": [
    {{"time": "08:00 AM", "task": "Fasting Glucose Log", "category": "CLINICAL"}},
    {{"time": "08:30 AM", "task": "Medication name and dose", "category": "MEDICATION"}},
    {{"time": "10:30 AM", "task": "Post-Breakfast Walk", "category": "LIFESTYLE"}},
    {{"time": "01:30 PM", "task": "Carb Count: Lunch", "category": "DIET"}},
    {{"time": "09:00 PM", "task": "Evening medication if applicable", "category": "MEDICATION"}}
  ]
}}

RULES:
- CONTEXT: Use Indian food examples (e.g., Moong Dal, Roti, Curd, Bhindi, Methi) and lifestyle habits suitable for an Indian user.
- MOVEMENT: Do NOT always suggest Brisk Walking. Vary the recommendations with Yoga (Surya Namaskar, Pranayama, Vajrasana after meals), resistance bands, or home workouts.
- Actions MUST include medication reminders (MEDICATION category) based on the clinical severity.
- If triglycerides > 500, always advise strict alcohol and sugar/jaggery avoidance.
- If HbA1c > 6.5, include medication tracking and post-meal glucose checks.
- If fasting glucose > 100, include morning glucose log as first action.
- Use recent daily log adherence to adjust intensity — if adherence is low, suggest gentler goals.
- Generate 4-6 actions covering CLINICAL, MEDICATION, LIFESTYLE, and DIET categories.
- Return ONLY valid JSON. No markdown, no explanation.
""")

    chain = prompt | llm
    response = chain.invoke({
        "clinical_data": json.dumps(clinical_data),
        "log_summary": log_summary
    })

    content = response.content.strip()

    # Clean markdown formatting
    content = re.sub(r"```json", "", content)
    content = re.sub(r"```", "", content)
    content = content.strip()

    # Extract JSON
    match = re.search(r"\{.*\}", content, re.DOTALL)

    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parse error: {e}\nExtracted: {match.group(0)}")

    raise ValueError(f"LLM did not return valid JSON. Got: {content}")
