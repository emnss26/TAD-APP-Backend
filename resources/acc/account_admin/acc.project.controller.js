const { default: axios } = require("axios");
const { format } = require("morgan");
const {authorizedHubs} = require ('../../../const/target.hubs.js')

const GetProject = async (req,res)=>{
    const token = req.cookies['access_token']
    const projectId = req.params.projectId
    const accountId = req.params.accountId

    if (!token) {
        return res.status(401).json({
            data: null,
            error: 'No token provided',
            message: 'Authorization token is required'
        });
    }

    try {
        const {data : projectdata } = await axios.get (`https://developer.api.autodesk.com/project/v1/hubs/${accountId}/projects/${projectId}`,{
            headers : {
                Authorization: `Bearer ${token}`,
            }
        })  

        //console.log("Project data", projectdata)

        res.status(200).json({          
            data : {
                project: projectdata,
                id: projectdata.data.id,
                name: projectdata.data.attributes.name,
            }, error : null, 
            message: "Data generated correclty"
        })

    } catch (error) {
        console.error('Error fetching project:', error.message || error);
        res.status(500).json({
            data : null,
            error : null, 
            message: "Error to access the project"            
        })
    }
}

module.exports = {
    GetProject,
}
