# ⚡ NEURAL STUDY AI

> **Your Intelligent Learning Companion Powered by Free Unlimited AI**

A premium, cinematic AI study assistant with ChatGPT-like interface. Ask anything, get explanations, generate notes, create quizzes, and learn faster—all without API keys.

![Neural Study AI](https://img.shields.io/badge/AI-Powered-00D9FF?style=for-the-badge)
![Free](https://img.shields.io/badge/100%25-Free-9D4EDD?style=for-the-badge)
![No API Key](https://img.shields.io/badge/No_API_Key-Required-00F0FF?style=for-the-badge)

---

## ✨ Features

### 🧠 **8 Intelligent Study Modes**
- **💬 Ask Anything** - General conversational AI for any question
- **🧠 Smart Explain** - Multi-level explanations with examples & analogies
- **📝 Notes Generator** - Structured, exam-ready study notes
- **🎯 Quiz Maker** - Custom quizzes with answers (MCQ, True/False, etc.)
- **🎴 Flashcards** - Spaced repetition Q&A pairs
- **📅 Study Planner** - Personalized learning roadmaps
- **🔍 Problem Solver** - Step-by-step solutions for any subject
- **💻 Code Helper** - Programming assistance in any language

### 🎨 **Premium Features**
- ✅ **Real AI** - Powered by GPT-4o, Claude 3.5, and Gemini 1.5 (FREE)
- ✅ **No API Key Required** - Works instantly
- ✅ **Streaming Responses** - Real-time typing like ChatGPT
- ✅ **Chat History** - Auto-saves all conversations
- ✅ **Export Chats** - Download as text files
- ✅ **Markdown Support** - Code highlighting, tables, formatting
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Dark Premium UI** - Glassmorphism design with animations
- ✅ **3 AI Models** - Switch between GPT-4o, Claude, and Gemini

---

## 🚀 Quick Start

### Option 1: Direct Open (Easiest)
1. Download the project
2. Open `index.html` in your browser
3. Start asking questions!

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

### Option 3: Deploy Online
- **Vercel**: Drag & drop the folder
- **Netlify**: Drag & drop the folder
- **GitHub Pages**: Push to repo and enable Pages

---

## 📁 Project Structure

```
neural-study-ai/
├── index.html              # Main HTML file
├── README.md               # This file
├── package.json            # Project metadata
├── .gitignore             # Git ignore rules
│
├── css/
│   ├── style.css          # Main styles
│   ├── animations.css     # Animations & effects
│   └── responsive.css     # Mobile styles
│
├── js/
│   ├── app.js            # Main application logic
│   ├── ai.js             # AI integration
│   └── utils.js          # Helper functions
│
├── assets/
│   ├── icons/            # App icons
│   └── images/           # Images
│
└── docs/
    ├── SETUP.md          # Detailed setup guide
    └── API.md            # API documentation
```

---

## 🎯 How to Use

### 1. **Ask Anything**
Type any question in the input box:
- "Explain quantum physics like I'm 5"
- "What is the capital of France?"
- "How does photosynthesis work?"

### 2. **Use Study Modes**
Click sidebar modes for specialized help:
- **Smart Explain**: Get detailed breakdowns
- **Notes**: "Create notes on World War 2"
- **Quiz**: "Make 10 questions on algebra"
- **Code**: "Write Python web scraper"

### 3. **Switch AI Models**
Bottom right: Choose between:
- **GPT-4o** (Default, balanced)
- **Claude** (Better for analysis)
- **Gemini** (Fast responses)

### 4. **Quick Prompts**
Click the 6 cards on welcome screen for instant help

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling & Animations |
| **Vanilla JavaScript** | Logic (No frameworks!) |
| **Puter.js** | Free AI API (GPT-4o, Claude, Gemini) |
| **Marked.js** | Markdown parsing |
| **Highlight.js** | Code syntax highlighting |
| **Tailwind CSS** | Utility classes (via CDN) |

### Why No API Key?
We use [Puter.js](https://puter.com) which provides free, unlimited access to major AI models through a user-pays model. No signup, no keys, no backend needed!

---

## 💡 Example Prompts

### 📚 Study Help
```
"Explain Newton's laws with real-life examples"
"Create detailed notes on cell biology for NEET"
"Make a 7-day plan to learn JavaScript"
```

### 🧮 Problem Solving
```
"Solve: x² + 5x + 6 = 0 step by step"
"If a train travels 120km in 2 hours, what's its speed?"
"Balance this chemical equation: H2 + O2 → H2O"
```

### 💻 Coding
```
"Write Python code for a to-do list app"
"Explain React hooks with examples"
"Debug this JavaScript function..."
```

### 🎯 Quiz & Flashcards
```
"Create 10 MCQs on Indian history with answers"
"Make flashcards for Spanish vocabulary"
"Generate true/false questions on photosynthesis"
```

---

## 🎨 Customization

### Change Colors
Edit `css/style.css`:
```css
:root {
    --electric-blue: #00D9FF;  /* Change primary color */
    --purple-glow: #9D4EDD;     /* Change accent */
}
```

### Add New Mode
Edit `js/app.js`:
```javascript
const modePrompts = {
    yourMode: "Your custom prompt here..."
};
```

### Modify AI Behavior
Edit `js/ai.js`:
```javascript
temperature: 0.7,  // 0 = focused, 1 = creative
max_tokens: 2000,  // Response length
```

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile | ✅ Responsive |

---

## 🔒 Privacy & Data

- **No data collection** - Everything runs in your browser
- **Local storage only** - Chats saved locally, not on servers
- **No tracking** - Zero analytics or cookies
- **Open source** - Inspect all code

Your conversations are stored in browser's localStorage. Clear anytime via Settings.

---

## 🐛 Troubleshooting

### AI Not Responding?
1. Check internet connection
2. Try switching AI model (bottom right)
3. Refresh page
4. Clear browser cache

### Slow Responses?
- Switch to "Gemini" model (fastest)
- Shorten your prompts
- Check internet speed

### History Not Saving?
- Enable localStorage in browser
- Don't use incognito mode
- Check browser storage permissions

---

## 🚀 Deployment

### Vercel (1-click)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Netlify
1. Drag folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Done!

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```
Then enable Pages in repo settings.

---

## 🤝 Contributing

Contributions welcome! 

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License - Free for personal and commercial use.

---

## 🙏 Credits

- **AI Models**: OpenAI, Anthropic, Google via Puter.js
- **Icons**: Emoji icons (native)
- **Fonts**: System fonts (SF Pro, Segoe UI)
- **Inspiration**: ChatGPT, Claude, Apple Vision Pro UI

---

## 📞 Support

- **Issues**: Open GitHub issue
- **Discussions**: GitHub Discussions
- **Email**: Support via repo

---

## 🌟 Star History

If this helped you, please ⭐ star the repo!

---

**Made with ⚡ by Neural Study AI Team**

*Learn anything, faster.*