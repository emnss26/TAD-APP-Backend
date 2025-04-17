const { GetUserbyUserId } = require("../acc/acc.libs");

const mapUserIdsToNames = async (items, projectId, token, userFields = []) => {
    
    //console.log ('Items in mapUserIdsToNames:', items);

    const userIds = new Set();
  
    items.forEach(item => {
      userFields.forEach(field => {
        if (item[field]) userIds.add(item[field]);
      });
    });
  
    const uniqueUserIds = Array.from(userIds);

    //console.log('Unique user IDs mapuser:', uniqueUserIds);

    const userMap = {};
  
    await Promise.all(uniqueUserIds.map(async userId => {
      try {
        const user = await GetUserbyUserId(userId, projectId, token);
        const name = user?.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        userMap[userId] = name || 'Unknown User';
      } catch {
        userMap[userId] = 'Unknown User';
      }
    }));
  
    return userMap;
  };
  
  module.exports = { mapUserIdsToNames };