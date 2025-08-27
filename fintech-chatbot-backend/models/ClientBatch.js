const mongoose = require('mongoose');

const clientBatchSchema = new mongoose.Schema({
  ID: { type: String, required: true },              // Assuming ID is a string, not number
  name: { type: String, required: true },
  address: { type: String },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },
  aadhar: { type: String },
  pan: { type: String },
  status: { type: String },
  DOB: { type: Date },
  phone: { type: String },
  mobile: { type: String },
  email: { type: String },
  familyID: { type: String },                        // This is "0" as a string in your data
  arn_id: { type: Number },
  dID: { type: String },
  CM: { type: String },
  FH: { type: String },
  mapped_clients: { type: [mongoose.Schema.Types.Mixed], default: [] }
  
},{ collection: 'client_batch'}); 

module.exports = mongoose.model('ClientBatch', clientBatchSchema);