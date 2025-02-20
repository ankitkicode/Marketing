const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    left: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    right: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    referedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        }
    ],
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    nodeType: {
        type: String,
        enum: ['left', 'right'],
        // required: true,
    },
});



const User = mongoose.model('User', userSchema);

module.exports = User;
