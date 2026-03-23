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
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "overdue", "ignored", "panic"], 
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
  npcComments: [{
    npc: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  lastRoastedAt: {  // NEW FIELD - prevents multiple roasts for same task
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);