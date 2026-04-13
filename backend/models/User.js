// backend/models/User.js
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

  // ── ADDED: NPC relationship memory ────────────────────────────────────────
  // Each NPC tracks how the relationship has evolved based on the user's history.
  // Transitions: neutral → concerned → disappointed → given_up → impressed
  // 'impressed' is achievable by going on a completion streak after a low point.
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

  // ── ADDED: Despair history ─────────────────────────────────────────────────
  worstEverDespair: {
    type:    Number,
    default: 0
  },
  // Used to compute despairDelta on each dashboard load
  lastDespairScore: {
    type:    Number,
    default: 0
  },

  // ── ADDED: Acceptance button counter ──────────────────────────────────────
  // Clicking "I Accept My Fate" 3+ times in a week unlocks the Zen of Failure ritual.
  acceptanceClicks: {
    type:    Number,
    default: 0
  },
  lastAcceptanceAt: {
    type:    Date,
    default: null
  }

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
