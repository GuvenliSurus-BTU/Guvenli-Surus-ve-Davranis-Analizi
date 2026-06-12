const mongoose = require('mongoose');

const analysisRunSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    readingsCount: { type: Number, required: true },
    alarmsCount: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AnalysisRun', analysisRunSchema);
