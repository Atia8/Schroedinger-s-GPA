const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // refers to the User collection
        required: true
    },
    
    title: {
        type: String,
        required: true
    },
    deadline: {
        type: String,
        required: true
    },
    despairContribution: {
        type: Number,
        default: 5
    },
    status: {
        type: String,
        default: 'panic'
    },
    npcComments: {
        type: Array,
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
