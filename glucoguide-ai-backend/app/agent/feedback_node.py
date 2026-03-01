from app.agent.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate

def generate_feedback(trend: str, average_score: float):

    llm = get_llm()

    prompt = ChatPromptTemplate.from_template("""
You are a diabetes lifestyle coach.

User adherence trend: {trend}
Average adherence score: {score}

Provide motivational and corrective feedback in 3-5 sentences.
Be supportive and practical.
""")

    chain = prompt | llm
    response = chain.invoke({
        "trend": trend,
        "score": average_score
    })

    return response.content.strip()
