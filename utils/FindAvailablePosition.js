//  Function to find the next available position in the tree
const { compareSync } = require('bcrypt');
const User = require('../models/User');

const findNextAvailableNode = async (parentNode) => {
    let queue = [parentNode];
    console.log("Queue:", queue);

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


module.exports = findNextAvailableNode;