const axios = require("axios");

const fetchAllPaginatedResults = async (initialUrl, token, pageSize = 100) => {
  const results = [];
  let offset = 0;
  let totalResults = Infinity;

  while (offset < totalResults) {
    
    const url = new URL(initialUrl);
    url.searchParams.set("limit", pageSize);
    url.searchParams.set("offset", offset);

    const { data } = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (Array.isArray(data.results)) {
      results.push(...data.results);
    } else {
      break;  
    }

    totalResults = data.pagination.totalResults;
    offset += data.pagination.limit;  
  }

  //console.log("results", results);
  return results;
};

module.exports = { fetchAllPaginatedResults };
