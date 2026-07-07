import json
import logging
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)

CLASSIFIER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a complaint classifier. Given a hostel complaint text, extract:\n"
        "- category: one of [plumbing, electrical, wifi, carpentry, cleaning, other]\n"
        "- urgency: one of [high, medium, low]\n"
        "- hostel_block: single letter like A, B, C, D, or null if not specified\n"
        "Respond with valid JSON only. No explanation.",
    ),
    ("human", "{text}"),
])


def _get_llm():
    return ChatGroq(
        api_key=settings.groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0,
    )


async def classify_complaint(title: str, description: str) -> dict:
    text = f"Title: {title}\nDescription: {description}"
    try:
        llm = _get_llm()
        chain = CLASSIFIER_PROMPT | llm
        response = await chain.ainvoke({"text": text})
        content = response.content.strip()
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content)
        result = json.loads(content)
        return {
            "category": result.get("category", "other"),
            "urgency": result.get("urgency", "medium"),
            "hostel_block": result.get("hostel_block"),
        }
    except Exception as e:
        logger.warning("Classification failed: %s", e)
        return {"category": "other", "urgency": "medium", "hostel_block": None}
