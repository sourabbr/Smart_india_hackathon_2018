var mongoose = require('mongoose');

var catalogSchema=new mongoose.Schema(mongoose.Schema.Types.Mixed, {strict: false});

var Catalog=mongoose.model('Catalog',catalogSchema);

module.exports = Catalog;