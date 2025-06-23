const env = require("../../config/index.js");
const express = require("express");
const axios = require("axios");
const router = express.Router();
const { format } = require("morgan");

const { fetchAllPaginatedResults } = require("../utils/pagination.libs");

const GetUserbyUserId = async (userId, projectId, token) => {
  const url = `${env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users/${userId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { name: "User removed or unknown" };
    }

    console.error(
      "Error fetching user by userId:",
      error.response?.data || error.message
    );

    throw error;
  }
};

const GetIssueTypeName = async (projectId, token) => {
  const url = `${env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-types`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    return data;
  } catch (error) {
    console.error(
      "Error fetching issue attribute mappings:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const GetIssueAttributeDefinitions = async (projectId, token) => {
  const url = `${env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-attribute-definitions`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    //console.log ('Issue Attribute Definitions:', data.results[0]);
    return data;
  } catch (error) {
    console.error(
      "Error fetching Issue Attributes definition:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  GetUserbyUserId,
  GetIssueTypeName,
  GetIssueAttributeDefinitions,
};
