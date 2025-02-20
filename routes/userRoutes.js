const express = require('express');
const { registerUser, referUser, getMyReferrals, getAllUsers } = require('../controllers/userController');
const User = require('../models/User');
const router = express.Router();

router.post('/register', registerUser);

router.post('/refer', referUser);
router.get('/referrals/:userId', getMyReferrals,

);

router.get('/users', getAllUsers);

router.get("/", async (req, res) => {
    try {
        const users = await User.find({})
            .populate({
                path: 'referedUsers',
                model: 'User', // Ensure it refers to the correct collection
                select: '_id name mobile role left right parentId nodeType'
            })
            .populate({
                path: 'parentId',
                model: 'User',
                select: '_id name'
            })
            .populate({
                path: 'left',
                model: 'User',
                select: '_id name mobile role left right parentId nodeType'
            })
            .populate({
                path: 'right',
                model: 'User',
                select: '_id name mobile role left right parentId nodeType'
            })
            .select('_id name mobile role left right referedUsers parentId nodeType')
            .lean(); // Convert Mongoose objects to plain JS objects

        if (!users || users.length === 0) {
            return res.status(404).send("No users found");
        }

        console.log("Fetched Users:", JSON.stringify(users, null, 2));

        // Function to build a structured binary tree
        function buildTree(user) {
            if (!user) return null;
            
            return {
                id: user._id,
                name: user.name || "No Name",
                parentId: user.parentId ? user.parentId._id : null,
                left: user.left ? buildTree(users.find(u => u._id.toString() === user.left._id.toString())) : null,
                right: user.right ? buildTree(users.find(u => u._id.toString() === user.right._id.toString())) : null,
                referedUsers: user.referedUsers 
                    ? user.referedUsers.map(refUser => buildTree(users.find(u => u._id.toString() === refUser._id.toString())))
                    : []
            };
        }

        // Find root user (Admin - no parentId)
        const rootUser = users.find(user => !user.parentId);

        if (!rootUser) {
            return res.status(404).send("Root user not found");
        }

        // Build tree from the root user
        const treeData = buildTree(rootUser);

        console.log("Formatted Tree Data:", JSON.stringify(treeData, null, 2));

        // Render the UI with properly structured tree data
        res.render("index", { users: treeData });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});







module.exports = router;
