const { default: axios } = require("axios");
const { format } = require("morgan");

const fetchAllPaginatedResults = async (initialUrl, token) => {
    
    //console.log("Fetching paginated results from URL:", initialUrl);
    //console.log("Using token:", token);
    
    let results = [];
    let nextUrl = initialUrl;
  
    while (nextUrl) {
      const { data } = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (Array.isArray(data.results)) {
        results = results.concat(data.results);
      }
  
      nextUrl = data.pagination?.nextUrl || null;
    }

    //console.log ('results', results[0])
  
    return results;
  };

  module.exports = { fetchAllPaginatedResults };