var mongoose = require('mongoose');

var downloaderSchema=new mongoose.Schema(mongoose.Schema.Types.Mixed, {strict: false});

var Downloader=mongoose.model('Downloader',downloaderSchema);

module.exports = Downloader;