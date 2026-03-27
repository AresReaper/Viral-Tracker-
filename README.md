# 📈 ViralTracker

ViralTracker is an AI-powered dashboard designed for content creators to discover trending niches across Instagram Reels and YouTube Shorts. It analyzes current trends, generates ready-to-use viral video scripts, and even connects to your Instagram account to provide highly personalized content strategies.

## ✨ Features

* **🔥 Trend Tracking**: Discover the hottest niches on Instagram and YouTube with AI-generated trend scores and viral examples.
* **🤖 AI Script Generation**: Instantly generate punchy, fast-paced video scripts tailored to any trending niche.
* **#️⃣ Viral Hashtags & Tools**: Get optimized tags, recommended free editing tools (like CapCut/Canva), and watermark removal guides.
* **📱 Instagram Integration**: Securely connect your Instagram account to let the AI analyze your recent posts and suggest personalized niches that fit your exact style.
* **💾 Save Your Scripts**: Securely log in with Google and save your generated scripts to your personal dashboard.
* **🎨 Multiple Themes**: Seamlessly switch between Light, Dark, and Dracula themes.

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Lucide Icons
* **Backend**: Node.js, Express (for secure Instagram OAuth handling)
* **AI**: Google Gemini API (`gemini-3.1-pro-preview` & `gemini-3-flash-preview`)
* **Database & Auth**: Firebase (Firestore & Google Authentication)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed. You will also need API keys for Google Gemini, Firebase, and an Instagram Developer App.

### Environment Variables
Create a `.env` file in the root directory and add the following variables:

```env
# App URL (e.g., http://localhost:3000 for local development)
APP_URL="http://localhost:3000"

# Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key"

# Instagram Basic Display API Credentials
INSTAGRAM_CLIENT_ID="your_instagram_app_id"
INSTAGRAM_CLIENT_SECRET="your_instagram_app_secret"

# Firebase Configuration (Add your Firebase project details)
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
