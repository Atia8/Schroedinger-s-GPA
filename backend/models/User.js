// backend/models/User.js
// CHANGED: Added `activeNPC` field. Everything else is identical to what you had.
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true
  },
  password: {
    type:      String,
    required:  true,
    minlength: 6
  },
  username: {
    type:    String,
    default: function() {
      return `Academic Victim ${Date.now().toString().slice(-4)}`;
    }
  },
  profilePicture:  { type: String, default: null },
  profilePublicId: { type: String, default: null },
  lastLogin:       { type: Date, default: null },

  sarcasmLevel: {
    type:    String,
    enum:    ['mild', 'brutal', 'damage'],
    default: 'brutal'
  },
  notificationPreferences: {
    deadlineReminders: { type: Boolean, default: true  },
    dailyRoasts:       { type: Boolean, default: false },
    despairAlerts:     { type: Boolean, default: true  }
  },

  // ── ADDED: Active NPC companion ────────────────────────────────────────────
  // Controls whose voice is used for all commentary (dashboard, tasks, notifications).
  // 'theMirror' is only settable once worstEverDespair >= 80 — enforced in the
  // PATCH /api/users/npc controller.
  activeNPC: {
    type:    String,
    enum:    ['hostileMentor', 'chaoticFriend', 'momFriend', 'theMirror'],
    default: 'hostileMentor'
  },

  // ── NPC relationship memory ────────────────────────────────────────────────
  npcRelationshipState: {
    hostileMentor: {
      type:    String,
      enum:    ['neutral', 'concerned', 'disappointed', 'given_up', 'impressed'],
      default: 'neutral'
    },
    chaoticFriend: {
      type:    String,
      enum:    ['neutral', 'concerned', 'disappointed', 'given_up', 'impressed'],
      default: 'neutral'
    },
    momFriend: {
      type:    String,
      enum:    ['neutral', 'concerned', 'disappointed', 'given_up', 'impressed'],
      default: 'neutral'
    }
  },

  // ── Despair history ────────────────────────────────────────────────────────
  worstEverDespair:  { type: Number, default: 0 },
  lastDespairScore:  { type: Number, default: 0 },

  // ── Acceptance button counter ──────────────────────────────────────────────
  acceptanceClicks:  { type: Number, default: 0 },
  lastAcceptanceAt:  { type: Date,   default: null }

}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
