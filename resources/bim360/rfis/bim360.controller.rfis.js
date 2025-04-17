const {default : axios} = require('axios');
const {format} = require('morgan');

const {mapUserIdsToNames} = require ('../../../libs/utils/user.mapper.libs.js')
const {fetchAllPaginatedResults} = require("../../../libs/utils/pagination.libs.js");

const GetRfis = async (req, res) => {
    const token =  req.cookies['access_token'];
    let projectId = req.params.projectId;

    if (projectId.startsWith('b.')) {
        projectId = projectId.substring(2);
    }

    if (!token) {
        return res.status(401).json({
            data: null,
            error: 'No token provided',
            message: 'Authorization token is required'
        });
    }

    try {
        const rfis = await fetchAllPaginatedResults(`https://developer.api.autodesk.com/bim360/rfis/v2/containers/${projectId}/rfis`, token);
        
        //console.log('RFIs data:', rfis);

        const userFields = ['createdBy', 'assignedTo', 'managerId', 'respondedBy', 'reviewerId', 'updatedBy', 'closedBy'];
        const userMap = await mapUserIdsToNames(rfis, projectId, token, userFields);

        //console.log ('User Map:', userMap);

        const rfisdatawithnames = rfis.map(rfi => {
            const disciplineName = Array.isArray(rfi.discipline) && rfi.discipline.length > 0
              ? rfi.discipline.join(', ')
              : 'Not specified';
          
            return {
              ...rfi,
              createdBy: userMap[rfi.createdBy] || 'Unknown User',
              assignedTo: userMap[rfi.assignedTo] || 'Unknown User',
              managerId: userMap[rfi.managerId] || 'Unknown User',
              respondedBy: userMap[rfi.respondedBy] || 'Unknown User',
              reviewerId: userMap[rfi.reviewerId] || 'Unknown User',
              updatedBy: userMap[rfi.updatedBy] || 'Unknown User',
              closedBy: userMap[rfi.closedBy] || 'Unknown User',
              discipline: disciplineName,
            };
          });

          //console.log('RFIs with names:', rfisdatawithnames);

        res.status(200).json({
            data: {
                rfis: rfisdatawithnames
            },
            error: null,
            message: "Rfis fetched successfully"
        });

    }catch (error) {
        console.error('Error fetching RFIs:', error.message || error);
        res.status(500).json({
            data: null,
            error : error.message || error,
            message: 'Error fetching RFIs',
        });
    }
}

module.exports = {
    GetRfis,
}