from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import google.generativeai as genai
import io
import json
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Models =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    theme: str = "calm"  # calm, dark, vibrant
    growth_tokens: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str

class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    author: str
    category: str  # wellness, mindfulness, motivation

class ModerationResult(BaseModel):
    label: str  # SAFE, AMBIGUOUS, PROFANITY_ONLY, NEGATIVE, TOXIC, HATE
    confidence: float
    reason: str
    suggestion: Optional[str] = None

class CommunityReply(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_name: str
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    is_anonymous: bool = True
    replies: List[CommunityReply] = Field(default_factory=list)
    #likes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_flagged: bool = False
    moderation_label: Optional[str] = None

class CommunityPostCreate(BaseModel):
    content: str
    is_anonymous: bool = True

class CommunityReplyCreate(BaseModel):
    text: str

# ============= Social Bubble Models =============

class Bubble(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    description: str
    members: List[str] = Field(default_factory=list)  # user IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BubbleCreate(BaseModel):
    name: str
    description: str

class BubbleInvite(BaseModel):
    bubble_id: str
    invitee_email: str
    message: Optional[str] = None

class BubbleInviteRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bubble_id: str
    from_user_id: str
    invitee_id: str
    invitee_email: EmailStr
    message: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BubblePost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bubble_id: str
    author_id: str
    author_name: str
    caption: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    replies: List[dict] = Field(default_factory=list)

class BubblePostCreate(BaseModel):
    bubble_id: str
    caption: str
    image_url: Optional[str] = None

class BubbleReply(BaseModel):
    post_id: str
    text: str

class WeeklyChallenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    week_start: str  # ISO date
    title: str
    description: str
    tag: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeCompletion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    challenge_id: str
    post_id: str
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Flashcard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: str
    question: str
    answer: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FlashcardRequest(BaseModel):
    topic: str
    content: str

class ThemeUpdate(BaseModel):
    theme: str

class AnalyticsData(BaseModel):
    total_screen_time: int = 0
    toxic_content_detected: int = 0
    positive_interactions: int = 0
    wellness_streak: int = 0

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

def normalize_text(text: str) -> str:
    """Normalize text for moderation: handle leetspeak, repeated chars, etc."""
    text = text.lower()
    
    # Leetspeak normalization
    leetspeak_map = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', 
        '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's'
    }
    for leet, normal in leetspeak_map.items():
        text = text.replace(leet, normal)
    
    # Remove repeated characters (e.g., "fuuuuck" -> "fuck")
    text = re.sub(r'(.)\1{2,}', r'\1', text)
    
    # Remove special characters between letters (e.g., "f*u*c*k" -> "fuck")
    text = re.sub(r'([a-z])[^a-z]+([a-z])', r'\1\2', text)
    
    return text

async def moderate_content_with_gemini(text: str) -> ModerationResult:
    """Use Gemini API for semantic content moderation"""
    
    if not GEMINI_API_KEY:
        # Fallback to basic moderation if no API key
        return ModerationResult(
            label="SAFE",
            confidence=0.5,
            reason="API key not configured, using basic filtering"
        )
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""You are a content moderator for a mental wellness application focused on creating safe, supportive spaces.

Analyze this user text for harmful content. Consider CONTEXT and INTENT, not just keywords.

Text: "{text}"

Classify into exactly ONE category:
- SAFE: Positive, supportive, or neutral content
- AMBIGUOUS: Unclear intent, could be interpreted multiple ways
- PROFANITY_ONLY: Contains profanity but used as intensifier, not to harm (e.g., "you're fucking amazing")
- NEGATIVE: Judgmental or pessimistic but not abusive
- TOXIC: Insults, derogatory language, personal attacks
- HATE: Targets protected groups (race, gender, religion, etc.)

Important rules:
1. "fucking beautiful" or "damn good" = PROFANITY_ONLY (positive intent)
2. Obfuscated profanity with positive context = PROFANITY_ONLY
3. Sarcasm attacking someone = TOXIC
4. Indirect insults = TOXIC
5. Ambiguous statements = AMBIGUOUS

Respond in JSON format:
{{
  "label": "CATEGORY",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation",
  "suggestion": "Optional: If AMBIGUOUS, suggest clearer wording"
}}"""

        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Extract JSON from response
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(result_text)
        
        return ModerationResult(
            label=result.get('label', 'SAFE'),
            confidence=float(result.get('confidence', 0.5)),
            reason=result.get('reason', 'Analyzed by AI'),
            suggestion=result.get('suggestion')
        )
        
    except Exception as e:
        logging.error(f"Gemini moderation error: {e}")
        # Enhanced fallback with keyword detection
        text_lower = text.lower()
        
        # Check for obvious toxic patterns
        toxic_keywords = ['hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 'loser']
        hate_keywords = ['racist', 'sexist', 'homophobic', 'hate all']
        
        if any(word in text_lower for word in hate_keywords):
            return ModerationResult(
                label="TOXIC",
                confidence=0.8,
                reason="Contains hateful language (fallback detection)"
            )
        elif any(word in text_lower for word in toxic_keywords):
            return ModerationResult(
                label="TOXIC",
                confidence=0.7,
                reason="Contains potentially harmful language (fallback detection)"
            )
        else:
            return ModerationResult(
                label="SAFE",
                confidence=0.4,
                reason=f"AI moderation unavailable, basic filter passed"
            )

async def chat_with_gemini(message: str, system_prompt: str, session_id: str = "default") -> str:
    """Chat with Gemini API"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # For now, use simple generation (stateless)
        # TODO: Implement chat history management
        full_prompt = f"{system_prompt}\n\nUser: {message}\nAssistant:"
        
        response = model.generate_content(full_prompt)
        return response.text
        
    except Exception as e:
        logging.error(f"Gemini chat error: {e}")
        return "I'm having trouble connecting right now. Here's a mindful reminder: Take a deep breath, and remember that it's okay to feel what you're feeling. Would you like to try the breathing exercise or explore our wellness resources?"

async def generate_flashcards_with_gemini(topic: str, content: str) -> List[dict]:
    """Generate flashcards using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""Generate 5 educational flashcards from this content.

Topic: {topic}
Content: {content[:5000]}

Return ONLY a JSON array with this exact format:
[
  {{"question": "...", "answer": "..."}},
  {{"question": "...", "answer": "..."}},
  {{"question": "...", "answer": "..."}},
  {{"question": "...", "answer": "..."}},
  {{"question": "...", "answer": "..."}}
]

No additional text, just the JSON array."""

        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Extract JSON from response
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        flashcards = json.loads(result_text)
        return flashcards if isinstance(flashcards, list) else []
        
    except Exception as e:
        logging.error(f"Flashcard generation error: {e}")
        return [
            {"question": "What is the main topic?", "answer": topic},
            {"question": "Key concept?", "answer": "Review the provided content"}
        ]

# ============= Auth Routes =============

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    user = User(email=user_data.email, name=user_data.name)
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create default bubble for user
    default_bubble = Bubble(
        owner_id=user.id,
        name=f"{user.name}'s Bubble",
        description="My personal safe space",
        members=[user.id]
    )
    bubble_dict = default_bubble.model_dump()
    bubble_dict['created_at'] = bubble_dict['created_at'].isoformat()
    await db.bubbles.insert_one(bubble_dict)
    
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    del user_doc['password']
    del user_doc['_id']
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.patch("/auth/theme")
async def update_theme(theme_data: ThemeUpdate, current_user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"theme": theme_data.theme}}
    )
    return {"message": "Theme updated successfully", "theme": theme_data.theme}

# ============= Wellness Routes =============

@api_router.post("/wellness/chat")
async def chat_with_bot(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        system_prompt = "You are a compassionate mental wellness companion. Help users track their mood, provide emotional support, and offer mindfulness advice. Be empathetic, encouraging, and brief in your responses."
        
        response_text = await chat_with_gemini(
            request.message,
            system_prompt,
            session_id=f"user-{current_user.id}"
        )
        
        chat_record = ChatMessage(
            user_id=current_user.id,
            message=request.message,
            response=response_text
        )
        chat_dict = chat_record.model_dump()
        chat_dict['timestamp'] = chat_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(chat_dict)
        
        return {"response": response_text}
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Unable to process chat request")

@api_router.get("/wellness/quotes", response_model=List[Quote])
async def get_quotes():
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(100)
    if not quotes:
        default_quotes = [
            {"id": str(uuid.uuid4()), "text": "Peace comes from within. Do not seek it without.", "author": "Buddha", "category": "mindfulness"},
            {"id": str(uuid.uuid4()), "text": "The present moment is filled with joy and happiness. If you are attentive, you will see it.", "author": "Thich Nhat Hanh", "category": "mindfulness"},
            {"id": str(uuid.uuid4()), "text": "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.", "author": "Unknown", "category": "motivation"},
            {"id": str(uuid.uuid4()), "text": "Happiness is not something ready made. It comes from your own actions.", "author": "Dalai Lama", "category": "wellness"},
        ]
        await db.quotes.insert_many(default_quotes)
        return [Quote(**q) for q in default_quotes]
    return [Quote(**q) for q in quotes]

@api_router.get("/wellness/breathing")
async def get_breathing_exercise():
    return {
        "exercise": "4-7-8 Breathing",
        "instructions": [
            "Breathe in through your nose for 4 seconds",
            "Hold your breath for 7 seconds",
            "Exhale slowly through your mouth for 8 seconds",
            "Repeat 4 times"
        ],
        "duration": 76
    }

# ============= Community Routes =============

@api_router.get("/community/posts", response_model=List[CommunityPost])
async def get_community_posts(current_user: User = Depends(get_current_user)):
    posts = await db.community_posts.find(
        {"is_flagged": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
    
    return [CommunityPost(**post) for post in posts]

@api_router.post("/community/posts", response_model=CommunityPost)
async def create_community_post(post_data: CommunityPostCreate, current_user: User = Depends(get_current_user)):
    # Enhanced moderation with Gemini
    moderation = await moderate_content_with_gemini(post_data.content)
    
    # Block TOXIC and HATE content
    if moderation.label in ["TOXIC", "HATE"] and moderation.confidence > 0.7:
        raise HTTPException(
            status_code=400,
            detail=f"Content filtered: {moderation.reason}"
        )
    
    # Handle AMBIGUOUS content
    if moderation.label == "AMBIGUOUS":
        if moderation.suggestion:
            raise HTTPException(
                status_code=400,
                detail=f"Please clarify your message. Suggestion: {moderation.suggestion}"
            )
    
    post = CommunityPost(
        user_id=current_user.id if not post_data.is_anonymous else "anonymous",
        content=post_data.content,
        is_anonymous=post_data.is_anonymous,
        moderation_label=moderation.label
    )
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    
    await db.community_posts.insert_one(post_dict)
    return post

@api_router.post("/community/posts/{post_id}/reply")
async def reply_to_community_post(post_id: str, reply: CommunityReplyCreate, current_user: User = Depends(get_current_user)):
    post = await db.community_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    moderation = await moderate_content_with_gemini(reply.text)
    if moderation.label in ["TOXIC", "HATE"] and moderation.confidence > 0.7:
        raise HTTPException(status_code=400, detail=f"Content filtered: {moderation.reason}")

    reply_obj = {
        "id": str(uuid.uuid4()),
        "author_id": current_user.id,
        "author_name": "Anonymous",
        "text": reply.text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.community_posts.update_one(
        {"id": post_id},
        {"$push": {"replies": reply_obj}}
    )

    return {"message": "Reply added"}


@api_router.delete("/community/posts/{post_id}")
async def delete_community_post(post_id: str, current_user: User = Depends(get_current_user)):
    """Delete a community post (author or admin only)"""
    post = await db.community_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user is the author or anonymous post they created
    if post.get('user_id') != current_user.id and post.get('user_id') != 'anonymous':
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.community_posts.delete_one({"id": post_id})
    return {"message": "Post deleted successfully"}

# ============= Social Bubble Routes =============

@api_router.get("/bubbles", response_model=List[Bubble])
async def get_my_bubbles(current_user: User = Depends(get_current_user)):
    """Get all bubbles where user is a member"""
    bubbles = await db.bubbles.find(
        {"members": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    for bubble in bubbles:
        if isinstance(bubble.get('created_at'), str):
            bubble['created_at'] = datetime.fromisoformat(bubble['created_at'])
    
    return [Bubble(**b) for b in bubbles]

@api_router.post("/bubbles", response_model=Bubble)
async def create_bubble(bubble_data: BubbleCreate, current_user: User = Depends(get_current_user)):
    """Create a new bubble"""
    bubble = Bubble(
        owner_id=current_user.id,
        name=bubble_data.name,
        description=bubble_data.description,
        members=[current_user.id]
    )
    bubble_dict = bubble.model_dump()
    bubble_dict['created_at'] = bubble_dict['created_at'].isoformat()
    
    await db.bubbles.insert_one(bubble_dict)
    return bubble

@api_router.post("/bubbles/invite")
async def invite_to_bubble(invite: BubbleInvite, current_user: User = Depends(get_current_user)):
    """Invite someone to a bubble"""
    bubble = await db.bubbles.find_one({"id": invite.bubble_id})
    if not bubble:
        raise HTTPException(status_code=404, detail="Bubble not found")
    
    if current_user.id not in bubble['members']:
        raise HTTPException(status_code=403, detail="Only bubble members can invite")
    
    invitee = await db.users.find_one({"email": invite.invitee_email})
    if not invitee:
        raise HTTPException(status_code=404, detail="User not found")
    
    if invitee['id'] in bubble['members']:
        raise HTTPException(status_code=400, detail="User already in bubble")

    existing_invite = await db.bubble_invites.find_one({
        "bubble_id": invite.bubble_id,
        "invitee_id": invitee['id'],
        "status": "pending"
    })
    if existing_invite:
        raise HTTPException(status_code=400, detail="An invite is already pending for this user")
    
    invite_record = BubbleInviteRecord(
        bubble_id=invite.bubble_id,
        from_user_id=current_user.id,
        invitee_id=invitee['id'],
        invitee_email=invite.invitee_email,
        message=invite.message
    )
    invite_dict = invite_record.model_dump()
    invite_dict['created_at'] = invite_dict['created_at'].isoformat()

    await db.bubble_invites.insert_one(invite_dict)
    
    return {"message": f"Invite sent to {invite.invitee_email}"}

@api_router.get("/bubbles/invites")
async def get_incoming_invites(current_user: User = Depends(get_current_user)):
    """Get incoming bubble invites"""
    invites = await db.bubble_invites.find(
        {"invitee_id": current_user.id, "status": "pending"},
        {"_id": 0}
    ).to_list(100)

    for invite in invites:
        if isinstance(invite.get('created_at'), str):
            invite['created_at'] = datetime.fromisoformat(invite['created_at'])
        bubble = await db.bubbles.find_one({"id": invite['bubble_id']}, {"name": 1, "_id": 0})
        invite['bubble_name'] = bubble['name'] if bubble else 'Unknown bubble'
        inviter = await db.users.find_one({"id": invite['from_user_id']}, {"name": 1, "_id": 0})
        invite['inviter_name'] = inviter['name'] if inviter else 'Someone'
    return invites

@api_router.post("/bubbles/invites/{invite_id}/respond")
async def respond_to_invite(invite_id: str, action: dict, current_user: User = Depends(get_current_user)):
    """Accept or reject a bubble invite"""
    invite = await db.bubble_invites.find_one({"id": invite_id})
    if not invite or invite['invitee_id'] != current_user.id:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite['status'] != "pending":
        raise HTTPException(status_code=400, detail="Invite already responded to")

    if action.get('accept'):
        bubble = await db.bubbles.find_one({"id": invite['bubble_id']})
        if not bubble:
            raise HTTPException(status_code=404, detail="Bubble not found")
        if current_user.id not in bubble['members']:
            await db.bubbles.update_one(
                {"id": invite['bubble_id']},
                {"$push": {"members": current_user.id}}
            )
        await db.bubble_invites.update_one(
            {"id": invite_id},
            {"$set": {"status": "accepted"}}
        )
        return {"message": "Invite accepted"}

    await db.bubble_invites.update_one(
        {"id": invite_id},
        {"$set": {"status": "rejected"}}
    )
    return {"message": "Invite rejected"}

@api_router.delete("/bubbles/{bubble_id}/leave")
async def leave_bubble(bubble_id: str, current_user: User = Depends(get_current_user)):
    """Leave the bubble or remove the current user from it"""
    bubble = await db.bubbles.find_one({"id": bubble_id})
    if not bubble:
        raise HTTPException(status_code=404, detail="Bubble not found")
    
    await db.bubbles.update_one(
        {"id": bubble_id},
        {"$pull": {"members": current_user.id}}
    )
    
    return {"message": "Left bubble successfully"}

@api_router.get("/bubbles/{bubble_id}/posts", response_model=List[BubblePost])
async def get_bubble_posts(bubble_id: str, current_user: User = Depends(get_current_user)):
    """Get all posts in a bubble"""
    bubble = await db.bubbles.find_one({"id": bubble_id})
    if not bubble or current_user.id not in bubble['members']:
        raise HTTPException(status_code=403, detail="Not a member of this bubble")
    
    posts = await db.bubble_posts.find(
        {"bubble_id": bubble_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
    
    return [BubblePost(**p) for p in posts]

@api_router.post("/bubbles/posts", response_model=BubblePost)
async def create_bubble_post(post_data: BubblePostCreate, current_user: User = Depends(get_current_user)):
    """Create a post in a bubble"""
    bubble = await db.bubbles.find_one({"id": post_data.bubble_id})
    if not bubble or current_user.id not in bubble['members']:
        raise HTTPException(status_code=403, detail="Not a member of this bubble")
    
    # Moderate content
    moderation = await moderate_content_with_gemini(post_data.caption)
    if moderation.label in ["TOXIC", "HATE"] and moderation.confidence > 0.7:
        raise HTTPException(status_code=400, detail=f"Content filtered: {moderation.reason}")
    
    post = BubblePost(
        bubble_id=post_data.bubble_id,
        author_id=current_user.id,
        author_name=current_user.name,
        caption=post_data.caption,
        image_url=post_data.image_url
    )
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    
    await db.bubble_posts.insert_one(post_dict)
    
    # Check if this completes a weekly challenge
    await check_challenge_completion(current_user.id, post_data.caption, post.id)
    
    return post

@api_router.post("/bubbles/posts/{post_id}/reply")
async def reply_to_post(post_id: str, reply: BubbleReply, current_user: User = Depends(get_current_user)):
    """Add a supportive reply to a bubble post"""
    post = await db.bubble_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    bubble = await db.bubbles.find_one({"id": post['bubble_id']})
    if not bubble or current_user.id not in bubble['members']:
        raise HTTPException(status_code=403, detail="Not a member of this bubble")
    
    # Moderate reply
    moderation = await moderate_content_with_gemini(reply.text)
    if moderation.label in ["TOXIC", "HATE"] and moderation.confidence > 0.7:
        raise HTTPException(status_code=400, detail=f"Content filtered: {moderation.reason}")
    
    reply_obj = {
        "id": str(uuid.uuid4()),
        "author_id": current_user.id,
        "author_name": current_user.name,
        "text": reply.text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bubble_posts.update_one(
        {"id": post_id},
        {"$push": {"replies": reply_obj}}
    )
    
    return {"message": "Reply added"}

@api_router.delete("/bubbles/posts/{post_id}")
async def delete_bubble_post(post_id: str, current_user: User = Depends(get_current_user)):
    """Delete a bubble post (author only)"""
    post = await db.bubble_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post['author_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.bubble_posts.delete_one({"id": post_id})
    return {"message": "Post deleted successfully"}

# ============= Weekly Challenge Routes =============

@api_router.get("/challenges/current", response_model=WeeklyChallenge)
async def get_current_challenge():
    """Get this week's challenge"""
    # Get current week start (Monday)
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())
    week_start_str = week_start.isoformat()
    
    challenge = await db.weekly_challenges.find_one({"week_start": week_start_str}, {"_id": 0})
    
    if not challenge:
        # Generate new challenge for the week
        challenge_data = {
            "id": str(uuid.uuid4()),
            "week_start": week_start_str,
            "title": "Digital Detox Day",
            "description": "Take a 24-hour break from social media and share your experience",
            "tag": "#detox",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.weekly_challenges.insert_one(challenge_data)
        if isinstance(challenge_data.get('created_at'), str):
            challenge_data['created_at'] = datetime.fromisoformat(challenge_data['created_at'])
        return WeeklyChallenge(**challenge_data)
    
    if isinstance(challenge.get('created_at'), str):
        challenge['created_at'] = datetime.fromisoformat(challenge['created_at'])
    return WeeklyChallenge(**challenge)

@api_router.get("/challenges/my-completions")
async def get_my_challenge_completions(current_user: User = Depends(get_current_user)):
    """Get user's challenge completion history (private)"""
    completions = await db.challenge_completions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    for comp in completions:
        if isinstance(comp.get('completed_at'), str):
            comp['completed_at'] = datetime.fromisoformat(comp['completed_at'])
    
    return {
        "total_tokens": current_user.growth_tokens,
        "completions": completions
    }

async def check_challenge_completion(user_id: str, caption: str, post_id: str):
    """Check if post completes current challenge"""
    challenge = await db.weekly_challenges.find_one(
        {"week_start": (datetime.now(timezone.utc).date() - timedelta(days=datetime.now(timezone.utc).date().weekday())).isoformat()}
    )
    
    if challenge and challenge['tag'].lower() in caption.lower():
        # Check if already completed this week
        existing = await db.challenge_completions.find_one({
            "user_id": user_id,
            "challenge_id": challenge['id']
        })
        
        if not existing:
            # Award token
            completion = {
                "user_id": user_id,
                "challenge_id": challenge['id'],
                "post_id": post_id,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            await db.challenge_completions.insert_one(completion)
            
            # Increment user tokens
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"growth_tokens": 1}}
            )

# ============= Learning Routes =============

@api_router.post("/learning/flashcards/generate")
async def generate_flashcards(request: FlashcardRequest, current_user: User = Depends(get_current_user)):
    try:
        flashcards_data = await generate_flashcards_with_gemini(request.topic, request.content)
        
        flashcards = []
        for fc_data in flashcards_data:
            flashcard = Flashcard(
                user_id=current_user.id,
                topic=request.topic,
                question=fc_data['question'],
                answer=fc_data['answer']
            )
            fc_dict = flashcard.model_dump()
            fc_dict['created_at'] = fc_dict['created_at'].isoformat()
            await db.flashcards.insert_one(fc_dict)
            flashcards.append(flashcard)
        
        return {"flashcards": flashcards, "count": len(flashcards)}
    except Exception as e:
        logging.error(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail="Unable to generate flashcards")

@api_router.get("/learning/flashcards", response_model=List[Flashcard])
async def get_flashcards(current_user: User = Depends(get_current_user)):
    flashcards = await db.flashcards.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for fc in flashcards:
        if isinstance(fc.get('created_at'), str):
            fc['created_at'] = datetime.fromisoformat(fc['created_at'])
    
    return [Flashcard(**fc) for fc in flashcards]

@api_router.post("/learning/flashcards/upload")
async def upload_file_for_flashcards(file: UploadFile = File(...), topic: str = "", current_user: User = Depends(get_current_user)):
    try:
        content = await file.read()
        text_content = content.decode('utf-8')
        
        request = FlashcardRequest(topic=topic or file.filename, content=text_content[:5000])
        return await generate_flashcards(request, current_user)
    except Exception as e:
        logging.error(f"File upload error: {e}")
        raise HTTPException(status_code=400, detail="Unable to process file")

@api_router.delete("/learning/flashcards/{flashcard_id}")
async def delete_flashcard(flashcard_id: str, current_user: User = Depends(get_current_user)):
    """Delete a flashcard (author only)"""
    flashcard = await db.flashcards.find_one({"id": flashcard_id})
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    if flashcard['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this flashcard")
    
    await db.flashcards.delete_one({"id": flashcard_id})
    return {"message": "Flashcard deleted successfully"}

# ============= Dashboard Routes =============

@api_router.get("/dashboard/analytics", response_model=AnalyticsData)
async def get_analytics(current_user: User = Depends(get_current_user)):
    extension_data = await db.extension_data.find_one(
        {"user_id": current_user.id},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    chat_count = await db.chat_messages.count_documents({"user_id": current_user.id})
    posts_count = await db.community_posts.count_documents({"user_id": current_user.id})
    bubble_posts_count = await db.bubble_posts.count_documents({"author_id": current_user.id})
    flashcards_count = await db.flashcards.count_documents({"user_id": current_user.id})
    
    if extension_data and extension_data.get('stats'):
        stats = extension_data['stats']
        return AnalyticsData(
            total_screen_time=stats.get('totalScreenTime', 0) // 60000,
            toxic_content_detected=stats.get('toxicContentDetected', 0),
            positive_interactions=chat_count + posts_count + bubble_posts_count,
            wellness_streak=flashcards_count
        )
    
    return AnalyticsData(
        total_screen_time=0,
        toxic_content_detected=0,
        positive_interactions=chat_count + posts_count + bubble_posts_count,
        wellness_streak=flashcards_count
    )

# ============= Chrome Extension Routes =============

class ExtensionStats(BaseModel):
    totalScreenTime: int
    toxicContentDetected: int
    interventionsShown: int
    sitesVisited: List[str]

class ExtensionSyncRequest(BaseModel):
    stats: ExtensionStats
    timestamp: str

class ExtensionLogRequest(BaseModel):
    eventType: str
    data: dict
    timestamp: str

@api_router.post("/extension/sync")
async def sync_extension_data(request: ExtensionSyncRequest, current_user: User = Depends(get_current_user)):
    try:
        sync_record = {
            "user_id": current_user.id,
            "stats": request.stats.model_dump(),
            "timestamp": request.timestamp,
            "synced_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.extension_data.insert_one(sync_record)
        
        return {"message": "Data synced successfully", "timestamp": request.timestamp}
    except Exception as e:
        logging.error(f"Extension sync error: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync data")

@api_router.post("/extension/log")
async def log_extension_event(request: ExtensionLogRequest, current_user: User = Depends(get_current_user)):
    try:
        event_record = {
            "user_id": current_user.id,
            "event_type": request.eventType,
            "data": request.data,
            "timestamp": request.timestamp,
            "logged_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.extension_logs.insert_one(event_record)
        
        return {"message": "Event logged successfully"}
    except Exception as e:
        logging.error(f"Extension log error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log event")

# ============= Base Route =============

@api_router.get("/")
async def root():
    return {"message": "MindEase API v2.0", "status": "active", "ai_provider": "Google Gemini"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
