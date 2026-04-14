// backend/controllers/userController.js
const User = require('../models/User');

exports.setActiveNPC = async (req, res) => {
  try {
    const { activeNPC } = req.body;
    const VALID = ['hostileMentor', 'chaoticFriend', 'momFriend', 'theMirror'];
    
    if (!VALID.includes(activeNPC)) {
      return res.status(400).json({ message: 'Invalid NPC selection.' });
    }

    // The Mirror is only accessible once you've hit 80%+ despair
    if (activeNPC === 'theMirror') {
      const user = await User.findById(req.user.userId);
      if ((user?.worstEverDespair || 0) < 80) {
        return res.status(403).json({
          message: 'The Mirror is locked. Reach 80%+ despair to unlock it. You\'re not there yet.'
        });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { activeNPC },
      { new: true }
    );
    res.json({ activeNPC: updated.activeNPC, message: 'Companion updated.' });
  } catch (err) {
    console.error('[setActiveNPC]', err);
    res.status(500).json({ message: 'Failed to update companion.' });
  }
};