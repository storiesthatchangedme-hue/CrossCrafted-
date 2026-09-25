"""
Migration: Add Indian state, city, and languages to existing data.
Run: python3 /app/backend/migrate_india.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

USER_LOCATIONS = [
    {"email": "sarah@example.com", "state": "Karnataka", "city": "Bangalore", "languages": ["English", "Kannada"]},
    {"email": "marcus@example.com", "state": "Tamil Nadu", "city": "Chennai", "languages": ["English", "Tamil"]},
    {"email": "emily@example.com", "state": "Maharashtra", "city": "Mumbai", "languages": ["English", "Hindi", "Marathi"]},
    {"email": "david@example.com", "state": "Kerala", "city": "Kochi", "languages": ["English", "Malayalam"]},
    {"email": "aiden@example.com", "state": "Delhi", "city": "New Delhi", "languages": ["Hindi", "English"]},
    {"email": "jasmine@example.com", "state": "West Bengal", "city": "Kolkata", "languages": ["Bengali", "English", "Hindi"]},
    {"email": "noah@example.com", "state": "Tamil Nadu", "city": "Madurai", "languages": ["Tamil", "English"]},
    {"email": "olivia@example.com", "state": "Telangana", "city": "Hyderabad", "languages": ["Telugu", "English", "Hindi"]},
    {"email": "admin@crosscrafted.com", "state": "Karnataka", "city": "Bangalore", "languages": ["English", "Hindi", "Kannada"]},
]

CHURCH_UPDATES = [
    {"name": "Hillside Community Church", "state": "Karnataka", "city": "Bangalore", "languages": ["English", "Kannada"], "location": "Koramangala, Bangalore"},
    {"name": "Grace City Fellowship", "state": "Tamil Nadu", "city": "Chennai", "languages": ["English", "Tamil"], "location": "Anna Nagar, Chennai"},
    {"name": "The Gathering LA", "state": "Maharashtra", "city": "Mumbai", "languages": ["English", "Hindi", "Marathi"], "location": "Bandra West, Mumbai"},
    {"name": "Restoration Church ATL", "state": "Kerala", "city": "Kochi", "languages": ["Malayalam", "English"], "location": "Fort Kochi, Kochi"},
    {"name": "Bridge Church NYC", "state": "Delhi", "city": "New Delhi", "languages": ["Hindi", "English", "Punjabi"], "location": "Connaught Place, New Delhi"},
    {"name": "New Life Chapel", "state": "Telangana", "city": "Hyderabad", "languages": ["Telugu", "English", "Hindi"], "location": "Banjara Hills, Hyderabad"},
]

EVENT_LOCATIONS = [
    {"title": "Night of Worship", "state": "Karnataka", "city": "Bangalore", "languages": ["English", "Kannada"], "location": "Koramangala, Bangalore"},
    {"title": "Gen Z Faith Conference", "state": "Maharashtra", "city": "Mumbai", "languages": ["English", "Hindi"], "location": "Bandra West, Mumbai"},
    {"title": "Men's Breakfast & Bible Study", "state": "Tamil Nadu", "city": "Chennai", "languages": ["English", "Tamil"], "location": "Anna Nagar, Chennai"},
    {"title": "Testimony Night", "state": "Kerala", "city": "Kochi", "languages": ["Malayalam", "English"], "location": "Fort Kochi, Kochi"},
    {"title": "Community Serve Day", "state": "Delhi", "city": "New Delhi", "languages": ["Hindi", "English"], "location": "Connaught Place, New Delhi"},
    {"title": "Acoustic Worship Night", "state": "Telangana", "city": "Hyderabad", "languages": ["Telugu", "English"], "location": "Banjara Hills, Hyderabad"},
    {"title": "Young Adults Hangout", "state": "Karnataka", "city": "Bangalore", "languages": ["English", "Kannada", "Hindi"], "location": "Indiranagar, Bangalore"},
    {"title": "Prayer & Fasting Weekend", "state": "Tamil Nadu", "city": "Chennai", "languages": ["Tamil", "English"], "location": "T. Nagar, Chennai"},
]


async def migrate():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Update users
    for u in USER_LOCATIONS:
        result = await db.users.update_one(
            {"email": u["email"]},
            {"$set": {"state": u["state"], "city": u["city"], "languages": u["languages"]}}
        )
        print(f"User {u['email']}: {'updated' if result.modified_count else 'skipped'}")

    # Update churches
    for c in CHURCH_UPDATES:
        result = await db.churches.update_one(
            {"name": c["name"]},
            {"$set": {"state": c["state"], "city": c["city"], "languages": c["languages"], "location": c["location"]}}
        )
        print(f"Church {c['name']}: {'updated' if result.modified_count else 'skipped'}")

    # Update events
    for e in EVENT_LOCATIONS:
        result = await db.events.update_one(
            {"title": e["title"]},
            {"$set": {"state": e["state"], "city": e["city"], "languages": e["languages"], "location": e["location"]}}
        )
        print(f"Event {e['title']}: {'updated' if result.modified_count else 'skipped'}")

    client.close()
    print("\nMigration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
