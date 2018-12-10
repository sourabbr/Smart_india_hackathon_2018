var mongoose = require('mongoose');

var officerProfileSchema=new mongoose.Schema(mongoose.Schema.Types.Mixed, {strict: false});

var officerProfile=mongoose.model('officerProfile',officerProfileSchema);

module.exports = officerProfile;