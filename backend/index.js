// backend/index.js
const express    = require("express");
const http       = require("http");
const socketIo   = require("socket.io");
const cors       = require("cors");
const mongoose   = require("mongoose");
const cron       = require('node-cron');
require("dotenv").config();

const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const uploadRoutes       = require("./routes/uploadRoutes");
const taskRoutes         = require("./routes/taskRoutes");
const dashboardRoutes    = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const SocketManager      = require("./socket/socketManager");

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: {
    origin:      ["http://localhost:5173", "http://localhost:5175"],
    credentials: true
  }
});

const socketManager = new SocketManager(io);
app.set('socketManager', socketManager);

app.use(cors({
  origin:         ["http://localhost:5173", "http://localhost:5175", "http://localhost:3000"],
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/academic-victim")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => { console.error("MongoDB connection error:", err); process.exit(1); });

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/upload",        uploadRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    message:        "Academic Victim Backend is running",
    connectedUsers: socketManager.getConnectedCount(),
    endpoints: {
      auth:          "/api/auth",
      upload:        "/api/upload",
      tasks:         "/api/tasks",
      dashboard:     "/api/dashboard",
      notifications: "/api/notifications"
    }
  });
});

// ── Cron: contextual roasts every 6 hours ────────────────────────────────────
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Running contextual roast check...');
  const NotificationService = require('./services/notificationService');
  const notificationService = new NotificationService(socketManager);
  await notificationService.checkAndSendContextualRoasts();
});

// ── ADDED: Cron: escalation level refresh every 6 hours ──────────────────────
// Keeps escalationLevel current so the frontend can show the right animation
// without requiring a task update event to trigger the recalculation.
cron.schedule('30 */6 * * *', async () => {
  console.log('[Cron] Refreshing task escalation levels...');
  const taskController = require('./controllers/taskController');
  await taskController.updateAllEscalationLevels();
});

// ── ADDED: Cron: Schrödinger task resolution every hour ──────────────────────
// Checks for Schrödinger tasks whose deadline has passed and collapses their
// wave function. 50/50 chance of 'submitted' or 'failed'. Sends notification.
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Checking for Schrödinger tasks to resolve...');
  const taskController = require('./controllers/taskController');
  await taskController.resolveSchrodingerTasks(socketManager);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE FILES YOU NEED TO UPDATE (not included as I don't have those files):
//
// backend/routes/taskRoutes.js — add:
//   router.patch('/:id/schrodinger', auth, taskController.toggleSchrodinger);
//
// backend/routes/dashboardRoutes.js — add:
//   router.post('/accept-fate', auth, dashboardController.acceptFate);
// ─────────────────────────────────────────────────────────────────────────────
