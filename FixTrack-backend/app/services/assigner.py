import json
import logging
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)

ASSIGNER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a complaint assigner that outputs ONLY valid JSON. "
        "Pick the best-fit technician based on skills and workload.\n"
        'Respond with EXACTLY this JSON format, nothing else:\n'
        '{{"technician_id": <integer>, "reason": "<brief reason>"}}\n'
        "CRITICAL: Start your response with '{{' and end with '}}'. "
        "No markdown, no backticks, no explanation before or after.",
    ),
    (
        "human",
        "Complaint: category={category}, urgency={urgency}, hostel_block={hostel_block}\n"
        "Available technicians: {technicians}\n"
        "Pick the best fit.",
    ),
])


async def assign_technician(
    category: str,
    urgency: str,
    hostel_block: str | None,
    technicians: list[dict],
) -> int | None:
    if not technicians:
        logger.warning("No available technicians to assign")
        return None

    try:
        llm = ChatGroq(
            api_key=settings.groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=0,
        )
        chain = ASSIGNER_PROMPT | llm
        response = await chain.ainvoke({
            "category": category,
            "urgency": urgency,
            "hostel_block": hostel_block or "unknown",
            "technicians": json.dumps(technicians),
        })
        content = response.content.strip()
        logger.info("Raw LLM response: '%s'", content[:2000])
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content)
        content = content.strip()
        match = re.search(r"\{[^{}]*\}", content)
        if match:
            content = match.group()
        result = json.loads(content)
        return int(result["technician_id"])
    except Exception as e:
        logger.warning("Assignment failed: %s", e)
        return None
