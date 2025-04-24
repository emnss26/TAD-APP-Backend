const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { model } = require("mongoose");

const ajv = new Ajv({ coerceTypes: true, removeAdditional: true });
addFormats(ajv);

const usersSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    status: { type: "string" },
    companyName: { type: "string" },
  },
  required: ["email"],
  additionalProperties: false,
};

const issueSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    displayId: { type: "string" },
    description: { type: "string" },
    status: { type: "string" },
    issueTypeName: { type: "string" },
    createdAt: { type: ["string","object","null"], format: "date-time" },
    createdBy: { type: "string" },
    assignedTo: { type: "string" },
    closedBy: { type: "string" },
    dueDate: { type: ["string","object","null"], format: "date-time"  },
    updatedAt: { type: ["string","object","null"], format: "date-time" },
    updatedBy: { type: "string" },
    closedAt: { type: ["string","object","null"], format: "date-time" },
    
  },
  required: ["id"],
  additionalProperties: false,
};

const rfisSchema = {
  type: "object",
  properties: {
    customIdentifier: { type: "string" },
    title: { type: "string" },
    discipline: { type: "string" },
    priority: { type: "string" },
    status: { type: "string" },
    question: { type: "string" },
    officialResponse: { type: "string" },
    createdBy: { type: "string" },
    assignedTo: { type: "string" },
    managerId: { type: "string" },
    respondedBy: { type: "string" },
    respondedAt: { type: ["string","object","null"], format: "date-time" },
    createdAt: { type: ["string","object","null"], format: "date-time" },
    reviwerId: { type: "string" },
    updatedBy: { type: "string" },
    dueDate: { type: ["string","object","null"], format: "date-time" },
    updatedAt: { type: ["string","object","null"], format: "date-time" },
    closedAt: { type: ["string","object","null"], format: "date-time" },
    closedBy: { type: "string" },
  },
  required: ["customIdentifier"],
  additionalProperties: false,
};

const submittalsSchema = {
  type: "object",
  properties: {
    identifier: { type: "string" },
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    stateId: { type: "string" },
    priority: { type: "string" },
    specIdentifier: { type: "string" },
    specTitle: { type: "string" },
    submittedBy: { type: "string" },
    submitterByName: { type: "string" },
    submitterDueDate: { type: ["string","object","null"], format: "date-time" },
    managerName: { type: "string" },
    updatedByName: { type: "string" },
    publishedByName: { type: "string" },
    sentToReviewByName: { type: "string" },
    createdAt: { type: ["string","object","null"], format: "date-time" },
    createdByName: { type: "string" },
    dueDate: { type: ["string","object","null"], format: "date-time" },
    updatedAt: { type: ["string","object","null"], format: "date-time" },
    updatedBy: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

const modelDataSchema = {
  type: "object",
  properties: {
    dbId: { type: "string" },
    code: { type: "string" },
    discipline: { type: "string" },
    elementType: { type: "string" },
    typeName: { type: "string" },
    description: { type: "string" },

    length: { type: "number" },
    width: { type: "number" },
    height: { type: "number" },
    perimeter: { type: "number" },
    area: { type: "number" },
    volume: { type: "number" },
    thickness: { type: "number" },

    level: { type: "string" },
    materials: { type: "string" },

    plannedConstructionStartDate: { type: ["string","object","null"], format: "date-time" },
    plannedConstructionEndDate: { type: ["string","object","null"], format: "date-time" },
    realConstructionStartDate: { type: ["string","object","null"], format: "date-time" },
    realConstructionEndDate: { type: ["string","object","null"], format: "date-time" },

    unit: { type: "string" },
    quantity: { type: "number" },
    unitCost: { type: "number" },
    totalCost: { type: "number" },

    energyConsumption: { type: "number" },
    waterConsumption: { type: "number" },
    carbonFootprint: { type: "number" },
    lifeCycleStage: { type: "number" },
    LEEDcreditCategory: { type: "string" },
    LEEDcredit: { type: "string" },

    manufacturer: { type: "string" },
    model: { type: "string" },
    keynote: { type: "string" },
    comments: { type: "string" },
    warranty: { type: "string" },
    maintenancePeriod: { type: "string" },
    maintenanceSchedule: { type: "string" },
    maintenanceCost: { type: "number" },
    serialNumber: { type: "string" },
  },
  required: ["dbId"],
  additionalProperties: false,
};

const validateUsers = ajv.compile(usersSchema);
const validateIssue = ajv.compile(issueSchema);
const validateRfis = ajv.compile(rfisSchema);
const validateSubmittals = ajv.compile(submittalsSchema);
const validateModelData = ajv.compile(modelDataSchema);

module.exports = {
  validateUsers,
  validateIssue,
  validateRfis,
  validateSubmittals,
  validateModelData,
};
