const {default : axios} = require ('axios');
const {format} = require ('morgan');

const GetUserProfile = async (req, res) => {

    try {
        const token = req.cookies ['access_token'];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const response = await axios.get ('https://developer.api.autodesk.com/userprofile/v1/users/@me',
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return res.status(200).json ({
            user: response.data,
            error: null,
            message: 'User profile fetched successfully',
        });
    } catch (error) {
        console.error ('Error fetching user profile:', error.message);
        return res.status(500).json ({
            data: null,
            error: error.message,
            message: 'Error fetching user profile',
        });
    }
}

module.exports = {
    GetUserProfile,
}