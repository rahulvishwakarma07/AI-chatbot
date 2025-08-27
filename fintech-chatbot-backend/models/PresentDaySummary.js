const mongoose = require('mongoose');

const presentDaySummarySchema = new mongoose.Schema({
  arn_id: { type: Number, required: true },
  data_type: { type: String, required: true },
  ID: { type: String, required: true },
  folio: { type: String },
  pur_nav: { type: String },       // Consider converting to Number if needed
  units: { type: String },         // Consider converting to Number if needed
  amt_inv: { type: String },
  fund: { type: String },
  fundDesc: { type: String },
  date: { type: Date },            // ISO date string like "2025-08-24"
  cur_val: { type: String },
  code: { type: String },
  pur_amt: { type: String },
  pur_unit: { type: String },
  agentCode: { type: String },
  cagr_values: [{ type: String }], // Array of strings; use Number if you want numerical operations
  cagr_dates: [{ type: String }]   // Epoch timestamps in string format; can be changed to Number or Date
}, { collection: 'present_day_summary'});

module.exports = mongoose.model('PresentDaySummary', presentDaySummarySchema);
