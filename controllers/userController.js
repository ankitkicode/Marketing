const User = require('../models/User');
const bcrypt = require('bcrypt');
const findNextAvailableNode = require('../utils/FindAvailablePosition');

const registerUser = async (req, res) => {
    try {
        const { name, mobile, password, parentId, nodeType } = req.body;

        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const userCount = await User.countDocuments({});
        const newUserRole = userCount === 0 ? 'admin' : 'user';

        const hashedPassword = await bcrypt.hash(password, 10);

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

const referUser = async (req, res) => {
    try {
        const { referrerId, name, mobile, password } = req.body;

        const referrer = await User.findById(referrerId);

        if (!referrer) {
            return res.status(404).json({ error: 'Referrer not found' });
        }

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
        //   parent.referedUsers.push(newUser._id);
          referrer.referedUsers.push(newUser._id);

        await parent.save();
        await referrer.save();

        res.status(201).json({
            message: "User referred successfully",
            user: newUser
        });

    } catch (error) {
        console.error('Error referring user:', error);
        res.status(400).json({ error: error.message });
    }
};

const getMyReferrals = async (req, res) => {
    try {
        const { userId } = req.params;
        // const user = await User.findById(userId).populate('referedUsers').populate('parentId').populate('left').populate('right');
        const user = await User.findById(userId)
        .populate({
            path: 'referedUsers',
            select: '_id name mobile role left right parentId nodeType'
        })
        .populate({
            path: 'parentId',
            select: '_id' 
        })
        .populate({
            path: 'left',
            select: '_id name mobile role left right parentId nodeType'
        })
        .populate({
            path: 'right',
            select: '_id name mobile role left right parentId nodeType'
        })
        .select('_id name mobile role left right referedUsers parentId nodeType'); // Sirf yahi fields chahiye
    
    
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            message : "Referrals fetched successfully",
            user : user,
      
        });
    } catch (error) {
        console.error('Error getting referrals:', error);
        res.status(400).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('_id name mobile role left right parentId nodeType');
        res.status(200).json({
            message: "Users fetched successfully",
            users: users
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(400).json({ error: error.message });
    }
};









module.exports = {
    registerUser,
    referUser,
    getMyReferrals,
    getAllUsers
};
