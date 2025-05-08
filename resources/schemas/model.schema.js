const mongoose = require("mongoose");

const modeldatabaseSchema = new mongoose.Schema(
  {
    dbId: { type: String, required: true, unique: true, index: true },
    Code: String,
    Discipline: String,
    ElementType: String,
    TypeName: String,
    Description: String,
    Length: Number,
    Width: Number,
    Height: Number,
    Perimeter: Number,
    Area: Number,
    Volume: Number,
    Thickness: Number,
    Level: String,
    Material: String,
    PlanedConstructionStartDate: Date,
    PlanedConstructionEndDate: Date,
    RealConstructionStartDate: Date,
    RealConstructionEndDate: Date,
    Unit: String,
    Quantity: Number,
    UnitCost: Number,
    TotalCost: Number,
    EnergyConsumption: Number,
    WaterConsumption: Number,
    CarbonFootprint: Number,
    LifeCycleStage: String,
    LEEDcreditCategory: String,
    LEEDcredit: String,
    Manufacturer: String,
    Model: String,
    Keynote: String,
    Comments: String,
    Warranty: String,
    MaintenancePeriod: String,
    MaintenanceSchedule: String,
    MaintenanceCost: Number,
    SerialNumber: String,
  },
  { timestamps: true }
);

modeldatabaseSchema.index({ dbId: 1 }, { unique: true });

module.exports = modeldatabaseSchema;
