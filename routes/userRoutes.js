const express = require('express');
const { registerUser, referUser, getMyReferrals, getAllUsers } = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);

router.post('/refer', referUser);
router.get('/referrals/:userId', getMyReferrals);

router.get('/users', getAllUsers);



module.exports = router;
