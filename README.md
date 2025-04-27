# Project Dave

## Why We Built Dave
We started **Project Dave** because we felt the pain ourselves:  
Finding the right people, reaching out, following up — it’s a grind that drains time and energy.  
As students, founders, and builders, we realized networking today feels **transactional and exhausting**, instead of meaningful.

We built Dave to flip the script.  
Dave automates the repetitive parts — **searching**, **cold outreach**, **email personalization**, **LinkedIn DMs**, even **voice-based commands** — so humans can focus on *real relationships*, *not busywork*.  
Built with heart, designed to be multilingual (English, French, Hindi, and more), and made for anyone who dreams of deeper connections.

---

# 📂 Codebase Structure & Setup Instructions

Each folder has its **own setup guide** inside.  
👉 **Go into each folder** and follow the **README.md** inside to set it up properly.

---

## Folder Breakdown

### 📦 `/backend/`
- Core backend services
- People search engine (powered by Fetch.ai ASI-1 Mini)
- API server for Dave's search and outreach features
- **Setup**:
  ```
  cd backend
  (Follow README for installing dependencies and running the server)
  ```

---

### 📦 `/dain/`
- DAIN voice automation agents
- Multilingual agents (English, French, Hindi, more)
- Automates LinkedIn, Twitter, Email DMs
- **Setup**:
  ```
  cd dain
  (Follow README to configure voice pipelines and DAIN endpoints)
  ```

---

### 📦 `/dave_fetchAI/`
- Fine-tuned models using Fetch.ai
- ASI-1 Mini specialization for people search
- Custom search engine enhancements
- **Setup**:
  ```
  cd dave_fetchAI
  (Follow README to load models and test inference locally)
  ```

---

### 📦 `/frontend/`
- Web frontend built with React, TailwindCSS, Butterfly UI (DAIN)
- Human-first interface for managing connections
- **Setup**:
  ```
  cd frontend
  npm install
  npm run dev
  ```

---

### 📦 `/kubernetes_setup/`
- GCP Kubernetes cluster setup
- Docker configs, Terraform (if applicable), deployment manifests
- **Setup**:
  ```
  cd kubernetes_setup
  (Follow README for deploying backend & DAIN agents on GCP Kubernetes)
  ```

---

# 🚀 Quickstart (for Local Dev)
If you want to just test the platform quickly:
1. Set up **`/frontend`** — run the web UI
2. Set up **`/backend`** — run the API server
3. (Optional) Run **`/dain`** locally if you want voice commands

---

# 🔥 Tech Stack Overview

# How we built it

**Frontend**:  
- React + TailwindCSS + Butterfly UI (DAIN-powered)  
- Vercel for fast deployments

**Backend**:  
- **Fetch.ai’s ASI-1 Mini model** fine-tuned for cross-platform people search  
- **Proprietary search engine** (Dockerized, scalable)  
- **Voice-enabled DAIN agents** (multilingual: English, French, Hindi, and more)  
- **GCP Kubernetes cluster** for scalable infrastructure  
- **GCP Firestore** for secure OAuth and user data storage  
- **GCP Artifact Registry + Cloud Run** for deployments  
- **Gemini models** used for email personalization and reply crafting  
- **CI/CD pipelines** with GCP + Vercel
- 
---

Would you like me to also prepare a **QUICK START COMMANDS.md** (just "copy-paste these 3–4 commands to run locally") so it’s easier for judges or teammates during hackathon/demo? 🚀  
Takes me 1 min if you want!  
Should I? 🎯

---

# 💬 Questions?
- Open an issue
- Reach out to the team
- Or just ask Dave 😉

---

# ❤️ Closing Thought
We believe real human connection should never feel like a chore.  
Dave handles the noise, so you can build relationships that truly matter.
