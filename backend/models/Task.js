// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  // ADDED: was used in taskController but missing from schema
  description: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "overdue", "ignored", "panic", "done"],
    default: "pending"
  },
  escalationLevel: {
    type: String,
    enum: ["normal", "warning", "panic", "hysterical"],
    default: "normal"
  },
  despairContribution: {
    type: Number,
    default: 10
  },
  // ADDED: set when task status transitions to 'done'
  // Used by the momentum factor in calculateDespairIndex
  completedAt: {
    type: Date,
    default: null
  },
  // ADDED: Schrödinger's Task mechanic
  // When true, the task exists in quantum superposition — simultaneously done and not done.
  // A cron job resolves it randomly at the deadline: 'submitted' or 'failed'.
  isSchrodinger: {
    type: Boolean,
    default: false
  },
  schrodingerResolved: {
    type: Boolean,
    default: false
  },
  schrodingerOutcome: {
    type: String,
    enum: ['submitted', 'failed', null],
    default: null
  },
  npcComments: [{
    npc:       String,
    comment:   String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastRoastedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
