var mongoose = require('mongoose');

var datasetSchema=new mongoose.Schema(mongoose.Schema.Types.Mixed, {strict: false});

var Dataset=mongoose.model('Dataset',datasetSchema);

module.exports = Dataset;