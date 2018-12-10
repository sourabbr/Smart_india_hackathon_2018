var mongoose = require('mongoose');

var sectorSchema=new mongoose.Schema(mongoose.Schema.Types.Mixed, {strict: false});

var Sector=mongoose.model('Sector',sectorSchema);

module.exports = Sector;