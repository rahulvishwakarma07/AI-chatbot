const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  ID: { type: String, required: true },
  data_type: { type: String, required: true },
  fund: { type: String },
  folioNumber: { type: String },
  schemeCode: { type: String },
  fundDesc: { type: String },
  taxStatus: { type: String },
  transMode: { type: String },
  transDate: { type: Date },           // e.g., "2011-04-01"
  price: { type: Number },
  unit: { type: Number },
  amt: { type: Number },
  agentCode: { type: String },
  transactionID: { type: String },
  scheme: { type: String },
  nav: { type: String },               // Storing nav as string to match your data; can change to Number
  scheme_type: { type: String },
  arn_id: { type: Number },
  status: { type: String },
  conclusion_desc2: { type: String },
  clientID: { type: String },
  assetType: { type: String },
  insertDate: { type: Date }           // e.g., "2024-11-22 17:39:08"
}, { collection: 'transaction'});

module.exports = mongoose.model('Transaction', transactionSchema);
