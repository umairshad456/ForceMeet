const participantModel = require('../models/participantModel');
const authModel = require('../models/authModel');


exports.fetchParticipants = async (req, res) => {
    try {
        // loggedin user 
        const loggedInUser = req.user.userId

        const participants = await authModel
            .find({ _id: { $ne: loggedInUser } })
            .select({ _id: 1, username: 1, email: 1 });

        res.status(200).json(participants && participants.length > 0 ? participants : []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
