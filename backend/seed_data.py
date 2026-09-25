"""
Seed script: Populates Cross Crafted with realistic sample data.
Run: python3 /app/backend/seed_data.py
"""
import asyncio
import os
import bcrypt
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# ── PROFILE IMAGES ──
PROFILE_IMGS = [
    "https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=200&q=80",  # young woman brown hair
    "https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=200&q=80",  # bearded man
    "https://images.unsplash.com/photo-1758523672333-12a4099a60b0?w=200&q=80",  # woman blue wall
    "https://images.unsplash.com/photo-1758598302784-42d00ce2ba8f?w=200&q=80",  # man glasses
    "https://images.unsplash.com/photo-1618517047977-854f5c4b6976?w=200&q=80",  # man dark shirt
    "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=200&q=80",  # woman gray shirt
    "https://images.unsplash.com/photo-1618593706014-06782cd3bb3b?w=200&q=80",  # man collared
    "https://images.unsplash.com/photo-1582070595814-fe36a8d39532?w=200&q=80",  # man bw
]

# ── POST IMAGES ──
POST_IMGS = [
    "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80",  # worship hands
    "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80",  # bible coffee
    "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80",  # sunset
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",  # friends gathering
    "https://images.unsplash.com/photo-1470115636492-6d2b56f9b5d1?w=800&q=80",  # sunrise
    "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80",  # nature water
    "https://images.unsplash.com/photo-1760367120244-8db5e65191a4?w=800&q=80",  # congregation
    "https://images.unsplash.com/photo-1760367120345-2b96c53de838?w=800&q=80",  # prayer group
    "https://images.unsplash.com/photo-1760367120345-35a4bbadf3cf?w=800&q=80",  # church hall
    "https://images.unsplash.com/photo-1762013728525-4e093240ae7b?w=800&q=80",  # hall audience
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",  # field sunrise
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80",  # mountain hike
]

CHURCH_IMGS = [
    "https://images.unsplash.com/photo-1760367120345-35a4bbadf3cf?w=1000&q=80",
    "https://images.unsplash.com/photo-1762013728525-4e093240ae7b?w=1000&q=80",
    "https://images.unsplash.com/photo-1760367120244-8db5e65191a4?w=1000&q=80",
    "https://images.unsplash.com/photo-1760367120345-2b96c53de838?w=1000&q=80",
]

# ── USERS ──
USERS = [
    {"name": "Sarah Mitchell", "username": "sarah.faith", "email": "sarah@example.com", "bio": "Worship leader. Storyteller. Saved by grace. Sharing my testimony one post at a time.", "img": 0},
    {"name": "Marcus Johnson", "username": "marcusjay", "email": "marcus@example.com", "bio": "Found God at 19. Never looked back. Youth pastor at Hillside Church.", "img": 1},
    {"name": "Emily Rodriguez", "username": "em.restored", "email": "emily@example.com", "bio": "Anxiety almost won. But God. Sharing my journey to help others find hope.", "img": 2},
    {"name": "David Kim", "username": "dk.worship", "email": "david@example.com", "bio": "Musician. Songwriter. Leading worship since 16. Every song is a prayer.", "img": 3},
    {"name": "Aiden Brooks", "username": "aiden.walks", "email": "aiden@example.com", "bio": "Seminary student. Coffee addict. Learning to trust God one chapter at a time.", "img": 4},
    {"name": "Jasmine Carter", "username": "jas.beloved", "email": "jasmine@example.com", "bio": "Single mom of 2. God's faithfulness is my daily bread. He provides.", "img": 5},
    {"name": "Noah Parker", "username": "noah.redeemed", "email": "noah@example.com", "bio": "Former addict. 4 years clean through Christ. My story isn't pretty but it's real.", "img": 6},
    {"name": "Olivia Chen", "username": "liv.gracefully", "email": "olivia@example.com", "bio": "First-gen believer. Navigating faith in a family that doesn't understand. But God is faithful.", "img": 7},
]

# ── CHURCHES ──
CHURCHES = [
    {"name": "Hillside Community Church", "location": "Austin, TX", "desc": "A Christ-centered, multigenerational community rooted in worship, the Word, and real relationships. Everyone has a place here.", "times": "Sun 9:00 AM & 11:00 AM | Wed 7:00 PM"},
    {"name": "Grace City Fellowship", "location": "Nashville, TN", "desc": "Where messy people meet a perfect God. We don't do religious performance — we do real life, real faith, real community.", "times": "Sun 10:00 AM & 6:00 PM"},
    {"name": "The Gathering LA", "location": "Los Angeles, CA", "desc": "A movement of young believers in the heart of LA. Worship. Discipleship. Justice. We exist to make Jesus famous in our city.", "times": "Sun 11:00 AM | Thu 7:30 PM"},
    {"name": "Restoration Church ATL", "location": "Atlanta, GA", "desc": "Built on the belief that God restores broken things. If you're hurting, you belong here. No judgment, just Jesus.", "times": "Sun 10:30 AM | Fri 7:00 PM"},
    {"name": "Bridge Church NYC", "location": "Brooklyn, NY", "desc": "Bridging cultures, generations, and backgrounds through the gospel. A diverse family united by one faith.", "times": "Sun 10:00 AM & 12:30 PM"},
    {"name": "New Life Chapel", "location": "Denver, CO", "desc": "Small church, big God. We're a tight-knit family that prays hard, loves deep, and serves our neighbors relentlessly.", "times": "Sun 9:30 AM | Wed 6:30 PM"},
]

# ── POSTS (Testimony-style) ──
POSTS = [
    # Sarah
    {"user_idx": 0, "text": "Three years ago today I was sitting in a hospital bed wondering if God even cared. Today I'm leading worship for 300 people. He didn't just hear my prayer — He answered it beyond anything I imagined.", "img": 0, "hours_ago": 2},
    {"user_idx": 0, "text": "This morning's quiet time hit different. Psalm 46:10. Be still and know. Sometimes the most powerful thing you can do is stop trying to fix everything and just let God be God.", "img": 1, "hours_ago": 26},
    {"user_idx": 0, "text": "Throwback to the night I gave my life to Christ. I was 16, broken, and had nothing to lose. Best decision I ever made.", "img": None, "hours_ago": 72},

    # Marcus
    {"user_idx": 1, "text": "Youth group tonight was WILD. 12 kids gave their lives to Jesus. I'm literally crying typing this. God is moving in this generation and I'm here for it.", "img": 7, "hours_ago": 5},
    {"user_idx": 1, "text": "Before and after Christ: same face, completely different person. The joy is real, the peace is real, the freedom is REAL. If you're on the fence — jump. He'll catch you.", "img": 3, "hours_ago": 48},
    {"user_idx": 1, "text": "Mentoring young men is the most exhausting and rewarding thing I've ever done. Planting seeds. Trusting God for the harvest.", "img": None, "hours_ago": 96},

    # Emily
    {"user_idx": 2, "text": "I used to have panic attacks every single day. Couldn't leave my apartment. Couldn't hold a job. Then someone invited me to church and everything changed. Not overnight — but step by step, God walked me out of that darkness.", "img": None, "hours_ago": 8},
    {"user_idx": 2, "text": "Sharing this because someone needs to hear it: your mental health struggles don't disqualify you from faith. God meets you in the mess. He met me in mine.", "img": 4, "hours_ago": 36},
    {"user_idx": 2, "text": "One year anxiety-free today. Not because I'm strong. Because He is. Philippians 4:6-7 isn't just a verse — it's my testimony.", "img": 5, "hours_ago": 120},

    # David
    {"user_idx": 3, "text": "Wrote a new worship song at 3 AM. When God gives you a melody, you don't wait for business hours. Rough recording coming soon.", "img": None, "hours_ago": 12},
    {"user_idx": 3, "text": "Sunday worship was something else. There was a moment where the whole room just went silent. No instruments, no vocals — just the presence of God. You could feel it.", "img": 6, "hours_ago": 30},
    {"user_idx": 3, "text": "Leading worship isn't performing. It's surrendering. Every time I pick up my guitar, I'm reminding myself that this gift isn't mine — it's His.", "img": 0, "hours_ago": 54},

    # Aiden
    {"user_idx": 4, "text": "Seminary is breaking me in the best way. Everything I thought I knew about God is being rebuilt on a deeper foundation. Uncomfortable growth is still growth.", "img": None, "hours_ago": 15},
    {"user_idx": 4, "text": "Coffee + Romans 8 + sunrise. There is therefore now NO condemnation for those who are in Christ Jesus. I needed that today.", "img": 1, "hours_ago": 40},
    {"user_idx": 4, "text": "Had a conversation with a stranger at a coffee shop today. Turns out they were going through the exact thing I wrote my theology paper on. Coincidence? I don't believe in those anymore.", "img": 10, "hours_ago": 68},

    # Jasmine
    {"user_idx": 5, "text": "Single mom testimony: my kids asked me why I pray before every meal. I told them it's because there were nights I didn't know where the next meal was coming from. And God always provided. ALWAYS.", "img": None, "hours_ago": 3},
    {"user_idx": 5, "text": "My daughter drew a picture of our family at church today. She included Jesus sitting next to us in the pew. Kids see what we sometimes forget.", "img": None, "hours_ago": 20},
    {"user_idx": 5, "text": "God's provision looks different than I expected. I wanted a bigger paycheck. He gave me a community that shows up. My fridge has been full all month because of this church family.", "img": 3, "hours_ago": 50},

    # Noah
    {"user_idx": 6, "text": "4 years clean today. I remember the exact moment I cried out to God in a bathroom stall at rock bottom. He showed up. He literally showed up. I don't know how to explain it except that I felt Him there.", "img": None, "hours_ago": 6},
    {"user_idx": 6, "text": "Speaking at a recovery meeting tonight. Nervous but ready. My story isn't pretty. But it's real. And if one person hears it and decides not to give up, it's worth every uncomfortable moment.", "img": 8, "hours_ago": 24},
    {"user_idx": 6, "text": "The person I was 5 years ago wouldn't recognize me today. That's not self-improvement — that's God. Pure, undeserved, relentless grace.", "img": 11, "hours_ago": 76},

    # Olivia
    {"user_idx": 7, "text": "Being a first-generation Christian is lonely sometimes. My family thinks I've joined a cult. But I know what I've experienced is real. God's love isn't something I read about — it's something I FELT.", "img": None, "hours_ago": 10},
    {"user_idx": 7, "text": "Found my church family at Bridge Church in Brooklyn. For the first time, I feel like I belong. It took 23 years but God's timing is always perfect.", "img": 9, "hours_ago": 32},
    {"user_idx": 7, "text": "My mom asked me to pray for her today. She doesn't believe yet. But she asked ME to pray. That's a seed. That's God working. I'm crying.", "img": None, "hours_ago": 58},
]

# ── EVENTS ──
EVENTS = [
    {"title": "Night of Worship", "desc": "An evening of uninterrupted worship. No sermon. No agenda. Just us and God. Bring your friends, bring your burdens, bring your praise.", "church_idx": 0, "days_from_now": 5, "location": "Hillside Community Church, Austin TX"},
    {"title": "Gen Z Faith Conference", "desc": "A 2-day gathering for the next generation of believers. Speakers, workshops, worship, and real conversations about faith in a post-Christian world.", "church_idx": 2, "days_from_now": 14, "location": "The Gathering LA, Los Angeles CA"},
    {"title": "Men's Breakfast & Bible Study", "desc": "Pancakes, coffee, and the book of James. A space for men to be real about their struggles and grow together. All men welcome.", "church_idx": 1, "days_from_now": 3, "location": "Grace City Fellowship, Nashville TN"},
    {"title": "Testimony Night", "desc": "Open mic for your God stories. Share what He's done in your life. No story is too small, no testimony is too messy. Come as you are.", "church_idx": 3, "days_from_now": 7, "location": "Restoration Church ATL, Atlanta GA"},
    {"title": "Community Serve Day", "desc": "We're hitting the streets to serve our neighbors. Food distribution, park cleanup, and prayer walks. Be the church outside the building.", "church_idx": 4, "days_from_now": 10, "location": "Bridge Church, Brooklyn NY"},
    {"title": "Acoustic Worship Night", "desc": "Stripped-down worship. Just guitars, voices, and the Holy Spirit. An intimate evening of praise in our chapel.", "church_idx": 5, "days_from_now": 4, "location": "New Life Chapel, Denver CO"},
    {"title": "Young Adults Hangout", "desc": "Pizza, games, and deep conversations. If you're 18-30 and trying to figure out faith + life, this is your people.", "church_idx": 0, "days_from_now": 2, "location": "Hillside Community Church, Austin TX"},
    {"title": "Prayer & Fasting Weekend", "desc": "48 hours of corporate prayer and fasting. We're believing God for breakthrough in our city. Join us for any or all sessions.", "church_idx": 1, "days_from_now": 18, "location": "Grace City Fellowship, Nashville TN"},
]

# ── COMMENTS ──
COMMENT_POOL = [
    "This is so powerful. Thank you for sharing.",
    "Praying for you! God is faithful.",
    "Needed to hear this today. God's timing.",
    "Your testimony gives me hope.",
    "This made me cry. God is so good.",
    "Keep sharing! Your story matters.",
    "Wow. Just wow. Thank you.",
    "This is what this platform is about.",
    "God bless you for being so real.",
    "I went through something similar. You're not alone.",
    "This generation is different. Faith is rising.",
    "Amen! He never fails.",
    "Sharing this with my small group tonight.",
    "You are seen, you are loved, you are chosen.",
    "Can't stop reading these testimonies. So good.",
]


async def seed():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # ── Clean old sample data (keep admin & existing real data) ──
    # Only delete users we're about to create (by email)
    sample_emails = [u["email"] for u in USERS]
    await db.users.delete_many({"email": {"$in": sample_emails}})
    # Delete posts by these users (will be recreated)
    # We'll track by username
    sample_usernames = [u["username"] for u in USERS]

    # Also clean old test posts (but keep admin's posts)
    admin = await db.users.find_one({"email": "admin@crosscrafted.com"})
    admin_id = str(admin["_id"]) if admin else None

    # Delete old TEST_ posts
    await db.posts.delete_many({"content_text": {"$regex": "^TEST_"}})

    # ── Create Users ──
    pw_hash = hash_pw("Faith@123")
    user_ids = []
    now = datetime.now(timezone.utc)

    for i, u in enumerate(USERS):
        doc = {
            "email": u["email"],
            "username": u["username"],
            "password_hash": pw_hash,
            "name": u["name"],
            "bio": u["bio"],
            "profile_image": PROFILE_IMGS[u["img"]],
            "role": "creator" if i < 4 else "user",
            "followers": [],
            "following": [],
            "saved_posts": [],
            "created_at": now - timedelta(days=random.randint(10, 90)),
        }
        result = await db.users.insert_one(doc)
        user_ids.append(str(result.inserted_id))
        print(f"  Created user: {u['name']} (@{u['username']})")

    # ── Create follows (make it feel connected) ──
    for i, uid in enumerate(user_ids):
        # Each user follows 3-5 random others
        others = [oid for j, oid in enumerate(user_ids) if j != i]
        follows = random.sample(others, min(len(others), random.randint(3, 5)))
        if admin_id:
            follows.append(admin_id)
        await db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"following": follows}})
        for fid in follows:
            await db.users.update_one({"_id": ObjectId(fid)}, {"$addToSet": {"followers": uid}})
    print("  Follows created")

    # ── Create Churches ──
    church_ids = []
    for i, c in enumerate(CHURCHES):
        creator = user_ids[i % len(user_ids)]
        doc = {
            "name": c["name"],
            "description": c["desc"],
            "location": c["location"],
            "service_times": c["times"],
            "cover_image": CHURCH_IMGS[i % len(CHURCH_IMGS)],
            "followers": random.sample(user_ids, random.randint(3, 6)),
            "created_by": creator,
            "created_at": now - timedelta(days=random.randint(30, 120)),
        }
        result = await db.churches.insert_one(doc)
        church_ids.append(str(result.inserted_id))
        print(f"  Created church: {c['name']}")

    # ── Create Posts ──
    # First delete posts from sample users
    await db.posts.delete_many({"user_id": {"$in": user_ids}})

    post_ids = []
    for p in POSTS:
        u_idx = p["user_idx"]
        u = USERS[u_idx]
        uid = user_ids[u_idx]
        created = now - timedelta(hours=p["hours_ago"])

        # Random likes from other users
        like_pool = [oid for j, oid in enumerate(user_ids) if j != u_idx]
        likes = random.sample(like_pool, random.randint(2, min(len(like_pool), 6)))

        doc = {
            "user_id": uid,
            "user_name": u["name"],
            "user_username": u["username"],
            "user_image": PROFILE_IMGS[u["img"]],
            "content_text": p["text"],
            "image_url": POST_IMGS[p["img"]] if p["img"] is not None else "",
            "video_url": "",
            "likes": likes,
            "comments": [],
            "created_at": created,
        }

        result = await db.posts.insert_one(doc)
        post_id = str(result.inserted_id)
        post_ids.append(post_id)

    print(f"  Created {len(POSTS)} posts")

    # ── Add Comments ──
    for pid in post_ids:
        num_comments = random.randint(0, 4)
        if num_comments == 0:
            continue
        comments = []
        for _ in range(num_comments):
            commenter_idx = random.randint(0, len(USERS) - 1)
            comments.append({
                "user_id": user_ids[commenter_idx],
                "user_name": USERS[commenter_idx]["name"],
                "text": random.choice(COMMENT_POOL),
                "created_at": now - timedelta(hours=random.randint(1, 48)),
            })
        await db.posts.update_one({"_id": ObjectId(pid)}, {"$set": {"comments": comments}})
    print("  Comments added")

    # ── Create Events ──
    await db.events.delete_many({"title": {"$in": [e["title"] for e in EVENTS]}})
    event_ids = []
    for e in EVENTS:
        church_id = church_ids[e["church_idx"]]
        church_name = CHURCHES[e["church_idx"]]["name"]
        event_date = (now + timedelta(days=e["days_from_now"])).isoformat()
        doc = {
            "title": e["title"],
            "description": e["desc"],
            "date": event_date,
            "location": e["location"],
            "price": 0.0,
            "cover_image": CHURCH_IMGS[e["church_idx"] % len(CHURCH_IMGS)],
            "church_id": church_id,
            "church_name": church_name,
            "created_by": user_ids[e["church_idx"] % len(user_ids)],
            "created_at": now - timedelta(days=random.randint(1, 7)),
        }
        result = await db.events.insert_one(doc)
        eid = str(result.inserted_id)
        event_ids.append(eid)

        # Register some users
        registrants = random.sample(user_ids, random.randint(2, 5))
        for rid in registrants:
            await db.event_registrations.insert_one({"user_id": rid, "event_id": eid, "created_at": now})
        print(f"  Created event: {e['title']} ({len(registrants)} registered)")

    # ── Update admin profile to look nicer ──
    if admin_id:
        await db.users.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": {
                "name": "Cross Crafted",
                "bio": "Official account. Sharing stories that matter. Building a community of faith.",
                "followers": user_ids,
            }}
        )
        # Update admin's existing posts to have nicer user_name
        await db.posts.update_many(
            {"user_id": admin_id},
            {"$set": {"user_name": "Cross Crafted"}}
        )
        print("  Updated admin profile")

    print(f"\nSeed complete: {len(USERS)} users, {len(CHURCHES)} churches, {len(POSTS)} posts, {len(EVENTS)} events")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
