# 🐱📦 Schrödinger's GPA

### *The Academic Victim Unit*

> "Your grades are simultaneously passing and failing until you check the portal."

**Schrödinger's GPA** is not just a task manager; it's a **psychological thriller** for students. Unlike boring productivity apps that falsely promise "balance," this MERN stack application embraces the chaos of academic life. It quantifies your despair, gamifies your procrastination, and offers "support" through hostile NPC AIs who roast your poor life choices.

---

## 💀 Key Features (The Chaos)

* **📉 The Despair Index (Panic Meter)**: A real-time gauge that tracks your stress levels based on overdue assignments and looming deadlines.
* **🤖 NPC Companions**: Choose your abuser—I mean, mentor:
* **Hostile Mentor**: Roasts you for breathing wrong.
* **Chaotic Friend**: Encourages you to skip class.
* **Mom Friend**: Just wants you to drink water (and study).


* **🔥 Unhinged Task Manager**: Tasks aren't just "due." They escalate from **Normal** → **Warning** → **Panic** → **Hysterical**.
* **🔮 Coping Ritual Generator**: Feeling overwhelmed? Click a button to get a random ritual (e.g., *"Stare at a wall for 5 minutes"*).
* **🔐 Authentication**: Secure login/signup that reminds you that "You are not special" (but your data is safe).

---

## 🛠️ Tech Stack

### **Frontend (The Face)**

* **React + Vite**: For blazing fast regret.
* **Tailwind CSS**: Custom "Despair Black" & "Panic Orange" theme.
* **Lucide React**: Icons to visualize your doom.
* **React Router**: To navigate between your problems.

### **Backend (The Brains)**

* **Node.js & Express**: Handling the logic of your downfall.
* **MongoDB & Mongoose**: Storing your failures (and tasks) permanently.
* **JWT (JSON Web Tokens)**: Secure sessions (because we care, sort of).
* **BCrypt**: Password hashing.

---

## 🚀 Installation & Setup

Follow these steps to deploy the chaos locally.

### 1. Clone the Repository

```bash
git clone https://github.com/atia8/schroedinger-s-gpa.git
cd schroedinger-s-gpa

```

### 2. Install Dependencies

You need to install libraries for both the **Client** (Frontend) and **Server** (Backend).

**Backend Setup:**

```bash
cd backend
npm install

```

**Frontend Setup:**

```bash
cd ../frontend
npm install

```

### 3. Environment Configuration

Create a `.env` file in the `backend/` folder and add your secrets:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/academic-victim
JWT_SECRET=your_super_secret_key_that_you_will_forget

```

### 4. Run the Project

You need **two terminals** running simultaneously (Split Terminal in VS Code recommended).

**Terminal 1 (Backend):**

```bash
cd backend
npx nodemon index.js

```

*Output: `🚀 Server running on port 5000*`

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev

```

*Output: `➜ Local: http://localhost:5173/*`

---

## 📂 Project Structure

```text
schroedinger-s-gpa/
├── backend/                # The server-side logic
│   ├── config/             # Database connection
│   ├── controllers/        # Logic for Despair & Tasks
│   ├── models/             # Mongoose Schemas (User, Task)
│   ├── routes/             # API Endpoints
│   └── index.js            # Entry point
│
└── frontend/               # The client-side UI
    ├── src/
    │   ├── components/     # Reusable UI (Navbar, PanicMeter)
    │   ├── pages/          # Full screens (Dashboard, Login)
    │   └── assets/         # Images & Icons
    └── tailwind.config.js  # The "Panic Orange" theme config

```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/auth/register` | Create a new victim account |
| **POST** | `/api/auth/login` | Return to your bad decisions |
| **GET** | `/api/dashboard` | Fetch Despair Index & NPC Roasts |
| **GET** | `/api/tasks` | Get all tasks (sorted by panic level) |
| **POST** | `/api/tasks` | Create a new task |
| **DELETE** | `/api/tasks/:id` | Delete a task (pretend it didn't happen) |

---

## 🤝 Contributing

1. Pick a task (or procrastinate on it).
2. Create a branch (`git checkout -b feature/unhinged-feature`).
3. Commit your changes (`git commit -m "Added more chaos"`).
4. Push to the branch (`git push origin feature/unhinged-feature`).
5. Open a Pull Request (and pray).

---

### 📜 License

Licensed under the **MIT License** (Mental Instability Tolerance).

---

> *"I'd tell you to panic, but you're already vibrating."* — Hostile Mentor NPC
