const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { model } = require("mongoose");

const ajv = new Ajv({ coerceTypes: true, removeAdditional: true, allowUnionTypes: true  });
addFormats(ajv);

const usersSchema = {
  type: "object",
  properties: {
    _key: { type: "string" },
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
    _key: { type: "string" },
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
    _key: { type: "string" },
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
    _key: { type: "string" },
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
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  definitions: {
    nullableString: {
      anyOf: [
        { type: "string" },
        { type: "null" },
        { type: "string", maxLength: 0 }
      ]
    },
    nullableNumber: {
      anyOf: [
        { type: "number" },
        { type: "null" }
      ]
    },
    nullableDate: {
      anyOf: [
        { type: "null" },
        { type: "string", format: "date" },
        { type: "string", maxLength: 0 }
      ]
    }
  },
  properties: {
    dbId: { $ref: "#/definitions/nullableString" },
    Code: { $ref: "#/definitions/nullableString" },
    Discipline: { $ref: "#/definitions/nullableString" },
    ElementType: { $ref: "#/definitions/nullableString" },
    TypeName: { $ref: "#/definitions/nullableString" },
    Description: { $ref: "#/definitions/nullableString" },
    TypeMark: { $ref: "#/definitions/nullableString" },

    Length: { $ref: "#/definitions/nullableNumber" },
    Width: { $ref: "#/definitions/nullableNumber" },
    Height: { $ref: "#/definitions/nullableNumber" },
    Perimeter: { $ref: "#/definitions/nullableNumber" },
    Area: { $ref: "#/definitions/nullableNumber" },
    Volume: { $ref: "#/definitions/nullableNumber" },
    Thickness: { $ref: "#/definitions/nullableNumber" },

    Level: { $ref: "#/definitions/nullableString" },
    Material: { $ref: "#/definitions/nullableString" },

    PlanedConstructionStartDate: { $ref: "#/definitions/nullableDate" },
    PlanedConstructionEndDate:   { $ref: "#/definitions/nullableDate" },
    RealConstructionStartDate:    { $ref: "#/definitions/nullableDate" },
    RealConstructionEndDate:      { $ref: "#/definitions/nullableDate" },

    Unit:           { $ref: "#/definitions/nullableString" },
    Quantity:       { $ref: "#/definitions/nullableNumber" },
    UnitCost:       { $ref: "#/definitions/nullableNumber" },
    TotalCost:      { $ref: "#/definitions/nullableNumber" },

    EnergyConsumption: { $ref: "#/definitions/nullableNumber" },
    WaterConsumption:  { $ref: "#/definitions/nullableNumber" },
    CarbonFootprint:   { $ref: "#/definitions/nullableNumber" },
    LifeCycleStage:    { $ref: "#/definitions/nullableNumber" },
    LEEDcreditCategory:{ $ref: "#/definitions/nullableString" },
    LEEDcredit:        { $ref: "#/definitions/nullableString" },

    Manufacturer:        { $ref: "#/definitions/nullableString" },
    Model:               { $ref: "#/definitions/nullableString" },
    Keynote:             { $ref: "#/definitions/nullableString" },
    Comments:            { $ref: "#/definitions/nullableString" },
    Warranty:            { $ref: "#/definitions/nullableString" },
    MaintenancePeriod:   { $ref: "#/definitions/nullableString" },
    MaintenanceSchedule: { $ref: "#/definitions/nullableString" },
    MaintenanceCost:     { $ref: "#/definitions/nullableNumber" },
    SerialNumber:        { $ref: "#/definitions/nullableString" },
  },
  required: ["dbId"],
  additionalProperties: false,
};

const plansDataSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  definitions: {
    nullableString: {
      anyOf: [
        { type: "string" },
        { type: "null" },
        { type: "string", maxLength: 0 }
      ]
    },
    nullableNumber: {
      anyOf: [
        { type: "number" },
        { type: "null" }
      ]
    },
    nullableDate: {
      anyOf: [
        { type: "null" },
        { type: "string", format: "date" },
        { type: "string", maxLength: 0 }
      ]
    }
  },
  properties: {
    Id: { $ref: "#/definitions/nullableString" },
    SheetName: { $ref: "#/definitions/nullableString" },
    SheetNumber: { $ref: "#/definitions/nullableString" },
    Discipline: { $ref: "#/definitions/nullableString" },
    Revision: { $ref: "#/definitions/nullableString" },
    RevisionDate: { $ref: "#/definitions/nullableString" },

  },
  required: ["Id"],
  additionalProperties: false,
};


const validateUsers = ajv.compile(usersSchema);
const validateIssue = ajv.compile(issueSchema);
const validateRfis = ajv.compile(rfisSchema);
const validateSubmittals = ajv.compile(submittalsSchema);
const validateModelData = ajv.compile(modelDataSchema);
const validatePlansData = ajv.compile(plansDataSchema);

module.exports = {
  validateUsers,
  validateIssue,
  validateRfis,
  validateSubmittals,
  validateModelData,
  validatePlansData,
};
