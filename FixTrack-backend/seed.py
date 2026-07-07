import asyncio

from passlib.context import CryptContext
from sqlalchemy import select

from app.config import settings
from app.db.database import async_session
from app.db.models import Technician, User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TECHNICIANS = [
    {
        "email": "ram@hostel.com",
        "password": "tech123",
        "name": "Ram Singh",
        "skills": ["plumbing", "carpentry"],
    },
    {
        "email": "shyam@hostel.com",
        "password": "tech123",
        "name": "Shyam Verma",
        "skills": ["electrical", "wifi"],
    },
    {
        "email": "sita@hostel.com",
        "password": "tech123",
        "name": "Sita Devi",
        "skills": ["cleaning", "plumbing"],
    },
    {
        "email": "gopal@hostel.com",
        "password": "tech123",
        "name": "Gopal Sharma",
        "skills": ["carpentry", "electrical"],
    },
    {
        "email": "anjali@hostel.com",
        "password": "tech123",
        "name": "Anjali Patel",
        "skills": ["wifi", "cleaning"],
    },
]


async def seed():
    async with async_session() as db:
        for t in TECHNICIANS:
            result = await db.execute(select(User).where(User.email == t["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"Skipping {t['email']} (already exists)")
                continue

            user = User(
                email=t["email"],
                password_hash=pwd_context.hash(t["password"]),
                role=UserRole.technician,
                name=t["name"],
            )
            db.add(user)
            await db.flush()

            tech = Technician(user_id=user.id, skills=t["skills"])
            db.add(tech)
            print(f"Created technician: {t['name']} ({t['email']}) skills={t['skills']}")

        await db.commit()
    print("\nSeed complete! 5 technicians added.")
    print("Login credentials: email/<tech123>")


if __name__ == "__main__":
    asyncio.run(seed())
