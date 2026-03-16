<div align="center">

<img width="2752" height="1536" alt="logo" src="https://github.com/user-attachments/assets/3fbca4e7-6be8-47a3-b19c-ebdf721d95ae" />

# Aura Genesis: Multimodal Cinematic Orchestrator
**Built for the Gemini Live Agent Challenge**

[![Hackathon](https://img.shields.io/badge/Hackathon-Gemini%20Live%20Agent-blueviolet)](#)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Google%20Cloud%20Run-blue)](https://cloud.google.com/run)

</div>

---

# 🎬 Project Overview

**Aura Genesis** is a high-fidelity cinematic character and concept generator.  
It takes a single user prompt and orchestrates **five specialized Gemini models** to generate a complete media kit, including:

- Backstories
- High-resolution character portraits
- Movie-style posters with consistent typography
- AI-generated video clips
- An immersive voiced **"Simulate"** experience

---

# 🧠 Multimodal Model Symphony

This project demonstrates advanced AI orchestration by chaining the following models:

- **Gemini 3.0 Flash Preview**  
  Acts as the **Creative Director**, generating the structured JSON brief.

- **Imagen 3**  
  Generates the initial **3:4 Hero Portrait**.

- **Imagen 3 Pro**  
  Uses the portrait as a reference to create **16:9 cinematic posters with embedded typography**.

- **Veo 3.1 Fast**  
  Animates the Hero Portrait into a **high-quality video clip**.

- **Lyria 3 (TTS)**  
  Narrates the story using the authoritative **"Fenrir" voice profile**.

![Uploading architectural_diagram.png…]()

---

# 🚀 Spin-Up Instructions (Reproducibility)

To ensure this project is fully reproducible for the judges, follow these steps to run the application locally.

---

## 1️⃣ Prerequisites

- **Node.js**  
  Ensure you have Node.js **v18 or higher** installed.  
  https://nodejs.org/

- **Gemini API Key**  
  Obtain an API key from **Google AI Studio**.  
  https://aistudio.google.com/

---

## 2️⃣ Setup & Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd aura-genesis
npm install
```

---

## 3️⃣ Environment Configuration

Create a `.env.local` file in the root directory and add your API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

---

## 4️⃣ Run the Development Server

Start the application locally:

```bash
npm run dev
```

Open the application in your browser:

```
http://localhost:3000
```

---

# ☁️ Google Cloud Deployment

This application is designed to deploy seamlessly to **Google Cloud Run** using a professional CI/CD pipeline.

## Steps to Deploy

### 1️⃣ Containerize

The project includes:

- `Dockerfile`
- `cloudrun.yaml`

---

### 2️⃣ Secret Management

Add your `GEMINI_API_KEY` to **Google Cloud Secret Manager**.

---

### 3️⃣ Deploy

1. Push this repository to **GitHub**  
2. Connect GitHub to **Cloud Run** in the Google Cloud Console  
3. Ensure the `GEMINI_API_KEY` environment variable references the Secret Manager entry

---

# 📖 Content & Social Media

**Medium Article**  
[Building Aura Genesis with One Click](https://zackmendel.medium.com/building-aura-genesis-with-one-click-orchestrating-5-gemini-models-on-google-cloud-f3f8f8153d73)

**Hashtag**

```
#GeminiLiveAgentChallenge
```

---

# 🛠 Tech Stack

**Frontend**

- Next.js (App Router)
- React

**Styling**

- Tailwind CSS

**Animation**

- motion/react (Framer Motion)

**AI SDK**

- @google/genai

**Infrastructure**

- Google Cloud Run
- Cloud Build
- Secret Manager

---

# ⚠️ Disclaimer

I created this project and the associated content for the purposes of entering the **Gemini Live Agent Challenge hackathon**.
