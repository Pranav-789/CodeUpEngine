# CodeUp Analytics & Recommendation Engine 🚀

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

A next-generation, microservices-based recommendation engine for competitive programmers on Codeforces. 

## 📋 Table of Contents
- [Project Idea & Concept](#-project-idea--concept)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Core Flows](#-core-flows)
  - [The Cold Start](#1-the-cold-start)
  - [The Recommendation Flow](#2-the-recommendation-flow)
- [Setup & Installation Instructions](#-setup--installation-instructions)
- [License](#-license)

---

## 💡 Project Idea & Concept

Unlike traditional platforms that rely on item-based cosine similarity (which often traps users in a "comfort zone" echo chamber of similar, easy problems), this platform introduces a **Peer-Based Collaborative Filtering** approach driven by an **Aspirational Vector**.

> [!NOTE]
> **The Zone of Proximal Development (ZPD)**
> Our algorithm evaluates users across **38 distinct problem tags** using a Player vs. Environment (PvE) Elo system. By artificially mutating the user's Elo vector forward by `+100` points in non-mastered topics, the system actively finds peers who are exactly one step ahead of the user. It then recommends the specific problems those peers used to bridge the gap.

---

## 🏗 Tech Stack & Architecture

This platform leverages a robust microservices architecture, heavily utilizing the MERN stack coupled with a dedicated Python Machine Learning microservice.

### Backend (Traffic & Data Orchestration)
The central nervous system of the platform, handling high-throughput web traffic, user validation, and task queuing.
* **Core:** Node.js, Express, TypeScript.
* **Database:** Mongoose (MongoDB) for atomic, schema-validated document storage.
* **Security & Auth:** Secure JWT-based authentication with a proprietary Token Vault system.
* **Asynchronous Processing:** BullMQ and Redis handle intensive, long-running ML orchestration without blocking the main event loop.

### ML Service (The Brain)
A lightning-fast, stateless Python microservice strictly dedicated to statistical computation and standard Machine Learning algorithms.
* **Core:** Python 3.10, FastAPI, Uvicorn.
* **Data & Matrix Math:** Scikit-Learn, NumPy, Pandas.
* **Database:** Motor (Asynchronous Python driver for MongoDB).
* **Architecture:** Maintains a **KD-Tree Singleton** in server memory for ultra-fast K-Nearest Neighbors (KNN) clustering in multi-dimensional space, avoiding deep learning overhead in favor of pure, explainable statistical ML.

### Frontend (User Interface)
* **Core:** React.
* **Real-time UX:** Utilizes intelligent short-polling to track BullMQ asynchronous job statuses, ensuring a seamless, non-blocking user experience while generating complex mathematical recommendations.

---

## ⚙️ Core Flows

### 1. The Cold Start
When new users register, they are automatically initialized into the ecosystem. Their MongoDB `UserMetrics` document is populated with a strictly validated, **38-dimensional vector** where every problem tag is assigned a base PvE rating of `1200`.

### 2. The Recommendation Flow
The core lifecycle of generating targeted, growth-oriented problems:

1. **Token Deduction & Queueing:** The user clicks "Generate Recommendation". The Node.js API deducts `5 tokens` from their vault and offloads the intensive orchestration task to a BullMQ queue.
2. **Worker Dispatch:** A Node.js background worker picks up the job, retrieves the user's 38D vector and up to 75 recent submissions, and forwards them to the FastAPI ML service.
3. **PvE Elo Recalibration:** Python processes the historical submissions, calculating Elo fluctuations by comparing problem difficulty against the user's specific tag ratings (awarding points for correct solves, deducting for incorrect attempts).
4. **Aspirational Mutation & KNN:** Python isolates the user's weakest topics and applies a `+100` Aspirational Mutation to their vector. It then queries the in-memory **KD-Tree** to locate the 5 nearest neighbors (peers exactly one step ahead), filters out already-solved problems, and extracts the top 5 progressive recommendations.
5. **Persistence:** The Node.js worker receives the mathematical payload, updates the user's vector in MongoDB, and caches the active recommendations.
6. **Frontend Resolution:** The React frontend, which has been polling the `/status/:jobId` endpoint, detects the `COMPLETED` state and beautifully renders the newly generated problem set.

---

## 🚀 Setup & Installation Instructions

Follow these steps to deploy the microservices architecture locally.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/problem_recommendation_system.git
cd problem_recommendation_system
```

### 2. Configure Environment Variables
You must set up `.env` files in both the `backend` and `ml_service` directories. 

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://admin:30406@localhost:27017/CodeUpEngine?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_key
```

**`ml_service/.env`**
```env
MONGO_URI=mongodb://admin:30406@localhost:27017/?authSource=admin
MONGO_DB_NAME=CodeUpEngine
```
*(Note: If using Docker, the `compose.yaml` file automatically overrides localhost variables to use internal Docker DNS).*

### 3. Install Local Dependencies
If running without Docker, initialize the respective environments:

**Node.js Backend:**
```bash
cd backend
npm install
```

**Python ML Service:**
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Seed the Database
> [!IMPORTANT]
> The KD-Tree Machine Learning model requires a mathematically clustered ecosystem to function properly. You **must** seed the database before generating recommendations.

From the `backend` directory, run the seeder script. This uses standard Gaussian distribution to generate 1,000 synthetic users grouped into archetypes (e.g., Math Specialists, Graph Experts), allowing the KNN algorithm to form legitimate peer clusters.
```bash
npx tsx scripts/seedDatabase.ts
```

### 5. Run the Platform (Docker Compose)
The ideal, production-mirrored way to run this architecture is via Docker Compose, which synchronously spins up Redis, MongoDB, Node.js, and FastAPI within an isolated bridge network.

From the root directory:
```bash
docker compose up --build -d
```
* **Backend:** Accessible at `http://localhost:5000`
* **ML Service:** Accessible at `http://localhost:8000`
* **Frontend:** *(Once initialized)* Accessible at `http://localhost:3000`

---
*Built with precision for the competitive programming community.*
