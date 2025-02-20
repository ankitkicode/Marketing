const User = require('../models/User');
const bcrypt = require('bcrypt');

// ✅ Register User
const registerUser = async (req, res) => {
    try {
        const { name, mobile, password, parentId, nodeType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Count existing users to determine role (First user = Admin, others = User)
        const userCount = await User.countDocuments({});
        const newUserRole = userCount === 0 ? 'admin' : 'user';

        // Encrypt password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            mobile,
            password: hashedPassword,
            role: newUserRole,
            parentId: parentId || null,
            nodeType: nodeType || null,
        });

        // Save new user
        await newUser.save();

        // Handle Parent-Child Relationship (Binary Tree)
        if (parentId) {
            const parentUser = await User.findById(parentId);
            if (!parentUser) {
                return res.status(404).json({ error: 'Parent user not found' });
            }

            if (nodeType === 'left' && !parentUser.left) {
                parentUser.left = newUser._id;
            parentUser.referedUsers.push(newUser._id);

            } else if (nodeType === 'right' && !parentUser.right) {
                parentUser.right = newUser._id;
            parentUser.referedUsers.push(newUser._id);

            } else {
                return res.status(400).json({ error: 'Selected nodeType is already occupied' });
            }

            // Save parent with updated left/right child
            await parentUser.save();
        }

        res.status(201).json({
            message: `${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} created successfully`,
            user: newUser,
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(400).json({ error: error.message });
    }
};

// Function to find the next available position in the tree
const findNextAvailableNode = async (parentNode) => {
    let queue = [parentNode];

    while (queue.length > 0) {
        let current = queue.shift();

        // Check left position first
        if (!current.left) return { parent: current, nodeType: 'left' };
        if (!current.right) return { parent: current, nodeType: 'right' };

        // Push children to queue for level-order traversal
        const leftChild = await User.findById(current.left);
        const rightChild = await User.findById(current.right);
        
        if (leftChild) queue.push(leftChild);
        if (rightChild) queue.push(rightChild);
    }
    return null; // No available position (unlikely in a growing tree)
};

// ✅ Refer a User (With Auto Placement)
const referUser = async (req, res) => {
    try {
        const { referrerId, name, mobile, password } = req.body;

        // Validate referrer exists
        const referrer = await User.findById(referrerId);
        if (!referrer) {
            return res.status(404).json({ error: 'Referrer not found' });
        }

        // Find the next available node if referrer has both positions filled
        let nodeInfo;
        if (!referrer.left || !referrer.right) {
            nodeInfo = { parent: referrer, nodeType: !referrer.left ? 'left' : 'right' };
        } else {
            nodeInfo = await findNextAvailableNode(referrer);
        }

        if (!nodeInfo) {
            return res.status(400).json({ error: 'No available position in the tree' });
        }

        const { parent, nodeType } = nodeInfo;

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const newUser = new User({
            name,
            mobile,
            password: hashedPassword,
            role: 'user',
            parentId: parent._id,
            nodeType
        });

        // Save the new user
        await newUser.save();

        // Update parent node with new child
        if (nodeType === 'left') {
            parent.left = newUser._id;
        } else {
            parent.right = newUser._id;
        }
          // Push new user's ID into referrer's `referedUsers` array
          parent.referedUsers.push(newUser._id);

        await parent.save();

        res.status(201).json({
            message: "User referred successfully",
            user: newUser
        });

    } catch (error) {
        console.error('Error referring user:', error);
        res.status(400).json({ error: error.message });
    }
};



module.exports = {
    registerUser,
    referUser
};
