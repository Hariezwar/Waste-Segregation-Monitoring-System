# ♻️ Waste Segregation Monitoring System for Urban Local Bodies

> **Turning everyday waste into valuable resources through smart technology.**

## 🌱 About the Project

The **Waste Segregation Monitoring System** is a smart solution that helps Urban Local Bodies (ULBs) monitor, manage, and improve waste segregation. It provides real-time updates on waste collection, tracks compliance metrics, and supports better decision-making using digital technology.

Our vision is simple:

**"Segregate Better. Collect Smarter. Build Cleaner Cities."**

---

## 🎯 Problem Statement

Many cities still depend on manual waste monitoring, which often results in:

- Mixed waste reaching processing centers
- Overflowing bins
- Delayed waste collection
- Increased operational costs
- Low recycling efficiency
- Poor communication between citizens and authorities

This project addresses these challenges with a smart and user-friendly monitoring system.

---

## 💡 Our Solution

The system connects citizens, sanitation workers, and municipal officials on a single platform.

It helps to:

- Monitor waste bins in real time
- Encourage proper waste segregation
- Track collection activities
- Generate useful reports
- Improve recycling efficiency
- Support cleaner and greener cities

---

## ✨ Key Features

### 🏢 Municipality & Management Dashboard

- **Analytical Overview**: Live summary statistics for total Wet, Dry, and Hazardous waste collected.
- **Segregation Compliance**: Progress meters comparing actual compliance percentages against local targets.
- **Leaderboard**: Area-wise/ward performance rankings to track best-performing regions.
- **Alert System**: Immediate notifications for underperforming zones or vehicle maintenance outages.
- **Historic Logs**: View, search, and filter all past collection entries.

### 📝 Collection Logging

- **Supervisor Logs**: Submission form to record tons/kg of wet, dry, and hazardous waste collected daily.
- **Auto-Metrics**: Automatically recalculates compliance metrics, updates the database, and syncs with the live dashboard.

### 🚚 Fleet Management

- **GPS Map Tracking**: Live simulation tracking map showing garbage trucks moving along their routes.
- **Vehicle Status Board**: Change status (Active, Idle, Maintenance) and dynamically reassign routes to vehicles.

---

## 🛠 Technology Stack

**Frontend**
- React + Vite
- Vanilla CSS (Glassmorphism design & premium styling)
- Lucide React (Icons)

**Backend**
- Node.js
- Express.js (REST API)

**Database**
- SQLite (Local persistent DB, automatically seeded with demo data)

---

## 📂 Project Structure

```
waste-segregation-monitor
├── backend/
│   ├── db.js                 # SQLite database setup and seeding logic
│   ├── server.js             # Express REST API server
│   ├── package.json          # Backend npm configurations
│   └── waste_segregation.db  # SQLite database file
├── frontend/
│   ├── index.html            # Main HTML template & meta headers
│   ├── vite.config.js        # Vite build configurations
│   ├── package.json          # Frontend npm configurations & dependencies
│   └── src/
│       ├── main.jsx          # App entrypoint
│       ├── App.jsx           # Core dashboard UI & state manager
│       └── index.css         # Custom styling and HSL theme definitions
├── setup.bat                 # Automatic dependency installation script (Windows)
├── run.bat                   # Automatic application execution script (Windows)
├── zip-project.ps1           # Packaging utility script
├── package.json              # Root concurrent execution script
└── README.md                 # Project documentation
```

---

## 🔄 Workflow

```
Supervisor Logs Collection Data
           ↓
   SQLite Database Updates
           ↓
Backend API Broadcasts Changes
           ↓
Dashboard Renders New Analytics
           ↓
Fleet Operations Dispatched As Needed
```

---

## 🌍 Benefits

🌿 Cleaner Environment

♻ Better Recycling

📊 Accurate Monitoring

*🚛 Efficient Waste Collection*

💰 Reduced Operational Cost

🏙 Smart City Development

👨‍👩‍👧 Better Citizen Participation

---

## 🚀 Setup and Running

### Prerequisites
- Node.js (v16.0 or higher recommended) installed.

### Automated Run (Windows)
1. Double-click `setup.bat` to automatically install all dependencies across the root, frontend, and backend folders.
2. Double-click `run.bat` to start the backend API and frontend dev server concurrently.

### Manual Run (All Platforms)
1. **Install dependencies**:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```
2. **Start servers concurrently**:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`. The backend will be listening on `http://localhost:5000`.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Hariezwar U
