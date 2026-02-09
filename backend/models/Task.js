const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // 1. Link to User (CRITICAL: Required for Dashboard to work)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 2. Standard Task Details
  title: {
    type: String,
    required: true
  },
  deadline: {
    type: Date, // Kept as Date for math calculations
    required: true
  },
  
  // ✅ CHANGED: We use 'status' instead of 'isCompleted' to match your Controller logic
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed","overdue","ignored"], 
    default: "pending"
  },

  // 3. The "Unhinged" Chaos Fields
  escalationLevel: { 
    type: String, 
    enum: ["normal", "warning", "panic", "hysterical"], 
    default: "normal" 
  },
  despairContribution: {
    type: Number,
    default: 10
  },
  npcComments: [{
    npc: String, // e.g., "Hostile Mentor"
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);