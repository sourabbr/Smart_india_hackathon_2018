var express = require('express');
var multer = require('multer');
var router = express.Router();
var users = require('./users');
var exec = require('child_process').exec;
const path = require('path');
var encryptor = require('file-encryptor');

var key = 'My Super Secret Key';

var Sector = require('../models/sector');
var Catalog = require('../models/catalog');
var Dataset = require('../models/dataset');
var officerProfile = require('../models/officerProfile');

router.use(express.static('public'));

var AWS = require('aws-sdk');
var fs = require("fs");
var s3 = new AWS.S3();

var bucketName = 'aws-s3-ddp';

var Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./Uploads");
    },
    filename: function(req, file, callback) {
        callback(null, file.originalname);
    }
});

var upload = multer({ storage: Storage }).array("Uploader", 4);

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	officerProfile.findOne({username:users.currentusername}).then((currentUser) => {
		if(currentUser){
			var sectorslist;
			var catalogslist;
			currentUser=JSON.stringify(currentUser);
			currentUser=JSON.parse(currentUser);
			Sector.find({},{'_id':0,'__v':0}, function (err, sectors) {
				if (err) return handleError(err);
				sectors=JSON.stringify(sectors);
				sectorslist=JSON.parse(sectors);
				Catalog.find({},{'_id':0,'__v':0}, function (err, catalogs) {
					if (err) return handleError(err);
					catalogs=JSON.stringify(catalogs);
					catalogslist=JSON.parse(catalogs);
					res.render('officer',{currentUser:currentUser,sectors:sectorslist,catalogs:catalogslist});
				});
			});
			
		}
		else{
			res.render('officer');
		}
	});
	
});

router.post('/officer-profile', ensureAuthenticated, function(req, res){
	officerProfile.findOne({username:req.body.username}).then((currentUser) => {
		if(currentUser){
			// already have this user
			var query={username:req.body.username};
			officerProfile.updateOne(query, req.body, {upsert:true}, function(err, data){
				if (err) return res.send(500, { error: err });
				officerProfile.findOne({username:req.body.username}).then((currentUser) => {
					res.json(currentUser);
				});
				
			});
		} else {
			// if not, create user profile in our db
			var newofficerProfile=officerProfile(req.body).save(function(err,data){
				if (err) return res.send(500, { error: err });
				officerProfile.findOne({username:req.body.username}).then((currentUser) => {
					res.json(currentUser);
				});
			});
		}
	});
});

router.post('/upload', ensureAuthenticated, function(req, res){
	upload(req, res, function(err) {
        if (err) {
            return res.end("Something went wrong!");
		}
		console.log(req.body);
		var sectorname;
		if(req.body.createSector!=''){
			sectorname=req.body.createSector;
		}
		else{
			sectorname=req.body.sector;
		}
		var catalogname;
		if(req.body.createCatalog!=''){
			catalogname=req.body.createCatalog;
		}
		else{
			catalogname=req.body.catalog;
		}
		if(req.body.filetype=="json"){
			fileUpload(req,res,sectorname,catalogname,"json");
		}
		else if(req.body.filetype=="csv"){
			exec("python csv-json.py",function(err,stdout){
				if(err){
					throw err;
				}
				//console.log(stdout);
				//aws s3 function for uploading the file
				fileUpload(req,res,sectorname,catalogname,"json");
			});
		}
		else if(req.body.filetype=="xml"){
			fileUpload(req,res,sectorname,catalogname,"xml");
			
		}
		else if(req.body.filetype=="txt"){
			fileUploadtxt(req,res,sectorname,catalogname,"txt");
			
		}
		
		
    });
});




function fileUpload(req,res,sectorname,catalogname,filetype){
	var s3data;
    fs.readFile("./Uploads/datafile."+filetype, function(err,data){
        if(err)
            console.log("Error in file reading :"+ err);
        else
        {
			console.log("File read successfully :" + data);
			if(filetype=="json"){
				data=JSON.parse(data);
				var numrows=data.data.length;
				var numcols=data.fields.length;
				data=JSON.stringify(data);
			}
			
            params = {Bucket:bucketName, Key:sectorname+"/"+catalogname+"/"+req.body.title+"/datafile."+filetype,Body:data};

            s3.putObject(params,function(err,data){
                if(err)
                    console.log("Error in putObject:"+ err);
                else
                {
					console.log("Uploaded successfully. :");
					s3data=data;
					//mongo functions to update sector, catalog and dataset
					//search for sector existence
					Sector.findOne({sector:req.body.sector}).then((sector) => {
						if(sector){
							// already have this sector
							sector=JSON.stringify(sector);
							sector=JSON.parse(sector);
							//search for catalog existence   
							Catalog.findOne({title:req.body.catalog}).then((catalog) => {
								if(catalog){
									// already have this catalog
									catalog=JSON.stringify(catalog);
									catalog=JSON.parse(catalog);
									//search for dataset existence
									Dataset.findOne({title:req.body.title}).then((dataset) => {
										if(dataset){
											//already have this dataset
											dataset=JSON.stringify(dataset);
											dataset=JSON.parse(dataset);
											Dataset.updateOne({title:req.body.title}, {$set : {"s3Etag":s3data.ETag}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
										
										}
										else{
											var newDataset=Dataset({
												title:req.body.title,
												sector:sectorname,
												catalog:catalogname,
												state:req.body.state,
												visual_access:0,
												granularity:0,
												size:req.body.size,
												downloads:0,
												reference_url:"",
												request_api:0,
												note:req.body.note,
												tyre:req.body.tyre,
												credibility:req.body.credibility,
												records:numrows,
												surveys:numcols,
												filetype:req.body.filetype,
												licence:req.body.license,
												s3Etag:s3data.ETag
											}).save(function(err,data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
											//increment sector dataset count
											Sector.updateOne({sector:req.body.sector}, {$inc: {datasets:1}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
											//increment catalog dataset count
											Catalog.updateOne({title:req.body.catalog}, {$inc: {datasets:1}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});

										}
									});
									
								}
								else{
									//catalog doesnt exists
									//create new catalog
									var newCatalog=Catalog({
										title:catalogname,
										sector:sectorname,
										description:req.body.description,
										datasets: 1,
										visual_access: 0,
										api: 0,
										last_update:"NA",
										views: 0,
										downloads:0
									}).save(function(err,data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//create new dataset
									var newDataset=Dataset({
										title:req.body.title,
										sector:sectorname,
										catalog:catalogname,
										state:req.body.state,
										visual_access:0,
										granularity:0,
										size:req.body.size,
										downloads:0,
										reference_url:"",
										request_api:0,
										note:req.body.note,
										tyre:req.body.tyre,
										credibility:req.body.credibility,
										records:numrows,
										surveys:numcols,
										filetype:req.body.filetype,
										licence:req.body.license,
										s3Etag:s3data.ETag
									}).save(function(err,data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//increment sector dataset count
									Sector.updateOne({sector:req.body.sector}, {$inc: {datasets:1}}, function(err, data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//increment sector catalog count
									Sector.updateOne({sector:req.body.sector}, {$inc: {catalog:1}}, function(err, data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									

								}
							});

						} else {
							// sector does not exists
							//create new sector
							var newSector=Sector({
								sector:sectorname,
								catalog:1,
								datasets: 1,
								visual_access: 0,
								api: 0
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});
							//create new catalog
							var newCatalog=Catalog({
								title:catalogname,
								sector:sectorname,
								description:req.body.description,
								datasets: 1,
								visual_access: 0,
								api: 0,
								last_update:"NA",
								views: 0,
								downloads:0
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});
							//create new dataset
							var newDataset=Dataset({
								title:req.body.title,
								sector:sectorname,
								catalog:catalogname,
								state:req.body.state,
								visual_access:0,
								granularity:0,
								size:req.body.size,
								downloads:0,
								reference_url:"",
								request_api:0,
								note:req.body.note,
								tyre:req.body.tyre,
								credibility:req.body.credibility,
								records:numrows,
								surveys:numcols,
								filetype:req.body.filetype,
								licence:req.body.license,
								s3Etag:s3data.ETag
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});

						}
					});
                }
			});
			setTimeout(function(){
				res.redirect('/sector');
			  }, 2000);
			
        }
	});
	

}
function fileUploadtxt(req,res,sectorname,catalogname,filetype){
	var s3data;
    fs.readFile("./Uploads/datafile."+filetype, function(err,data){
        if(err)
            console.log("Error in file reading :"+ err);
        else
        {
			console.log("File read successfully :" + data);
			if(filetype=="json"){
				data=JSON.parse(data);
				var numrows=data.data.length;
				var numcols=data.fields.length;
				data=JSON.stringify(data);
			}
			
            params = {Bucket:bucketName, Key:sectorname+"/"+catalogname+"/"+req.body.title+"/datafile."+filetype,Body:data};

            s3.putObject(params,function(err,data){
                if(err)
                    console.log("Error in putObject:"+ err);
                else
                {
					console.log("Uploaded successfully. :");
					s3data=data;
					//mongo functions to update sector, catalog and dataset
					//search for sector existence
					Sector.findOne({sector:req.body.sector}).then((sector) => {
						if(sector){
							// already have this sector
							sector=JSON.stringify(sector);
							sector=JSON.parse(sector);
							//search for catalog existence   
							Catalog.findOne({title:req.body.catalog}).then((catalog) => {
								if(catalog){
									// already have this catalog
									catalog=JSON.stringify(catalog);
									catalog=JSON.parse(catalog);
									//search for dataset existence
									Dataset.findOne({title:req.body.title}).then((dataset) => {
										if(dataset){
											//already have this dataset
											dataset=JSON.stringify(dataset);
											dataset=JSON.parse(dataset);
											Dataset.updateOne({title:req.body.title}, {$set : {"s3Etag":s3data.ETag}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
										
										}
										else{
											var newDataset=Dataset({
												title:req.body.title,
												sector:sectorname,
												catalog:catalogname,
												state:req.body.state,
												visual_access:0,
												granularity:0,
												size:req.body.size,
												downloads:0,
												reference_url:"",
												request_api:0,
												note:req.body.note,
												tyre:req.body.tyre,
												credibility:req.body.credibility,
												records:numrows,
												surveys:numcols,
												filetype:req.body.filetype,
												licence:req.body.license,
												s3Etag:s3data.ETag
											}).save(function(err,data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
											//increment sector dataset count
											Sector.updateOne({sector:req.body.sector}, {$inc: {datasets:1}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});
											//increment catalog dataset count
											Catalog.updateOne({title:req.body.catalog}, {$inc: {datasets:1}}, function(err, data){
												if (err) return res.send(500, { error: err });
												console.log(data);
											});

										}
									});
									
								}
								else{
									//catalog doesnt exists
									//create new catalog
									var newCatalog=Catalog({
										title:catalogname,
										sector:sectorname,
										description:req.body.description,
										datasets: 1,
										visual_access: 0,
										api: 0,
										last_update:"NA",
										views: 0,
										downloads:0
									}).save(function(err,data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//create new dataset
									var newDataset=Dataset({
										title:req.body.title,
										sector:sectorname,
										catalog:catalogname,
										state:req.body.state,
										visual_access:0,
										granularity:0,
										size:req.body.size,
										downloads:0,
										reference_url:"",
										request_api:0,
										note:req.body.note,
										tyre:req.body.tyre,
										credibility:req.body.credibility,
										records:numrows,
										surveys:numcols,
										filetype:req.body.filetype,
										licence:req.body.license,
										s3Etag:s3data.ETag
									}).save(function(err,data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//increment sector dataset count
									Sector.updateOne({sector:req.body.sector}, {$inc: {datasets:1}}, function(err, data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									//increment sector catalog count
									Sector.updateOne({sector:req.body.sector}, {$inc: {catalog:1}}, function(err, data){
										if (err) return res.send(500, { error: err });
										console.log(data);
									});
									

								}
							});

						} else {
							// sector does not exists
							//create new sector
							var newSector=Sector({
								sector:sectorname,
								catalog:1,
								datasets: 1,
								visual_access: 0,
								api: 0
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});
							//create new catalog
							var newCatalog=Catalog({
								title:catalogname,
								sector:sectorname,
								description:req.body.description,
								datasets: 1,
								visual_access: 0,
								api: 0,
								last_update:"NA",
								views: 0,
								downloads:0
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});
							//create new dataset
							var newDataset=Dataset({
								title:req.body.title,
								sector:sectorname,
								catalog:catalogname,
								state:req.body.state,
								visual_access:0,
								granularity:0,
								size:req.body.size,
								downloads:0,
								reference_url:"",
								request_api:0,
								note:req.body.note,
								tyre:req.body.tyre,
								credibility:req.body.credibility,
								records:numrows,
								surveys:numcols,
								filetype:req.body.filetype,
								licence:req.body.license,
								s3Etag:s3data.ETag
							}).save(function(err,data){
								if (err) return res.send(500, { error: err });
								console.log(data);
							});

						}
					});
				}
				
			});
        }
	});
	fs.readFile("./Uploads/README.doc", function(err,data){
		if(err)
            console.log("Error in file reading :"+ err);
        else
        {
			params = {Bucket:bucketName, Key:sectorname+"/"+catalogname+"/"+req.body.title+"/README.doc",Body:data};
    
			s3.putObject(params,function(err,data){
				if(err)
					console.log("Error in putObject:"+ err);
				else
				{
					console.log("Uploaded successfully. : "+data);
				}
			});
		}
	});
	fs.readFile("./Uploads/Data_Layout.xlsx", function(err,data){
		if(err)
            console.log("Error in file reading :"+ err);
        else
        {
			params = {Bucket:bucketName, Key:sectorname+"/"+catalogname+"/"+req.body.title+"/Data_Layout.xlsx",Body:data};
    
			s3.putObject(params,function(err,data){
				if(err)
					console.log("Error in putObject:"+ err);
				else
				{
					console.log("Uploaded successfully. : "+data);
				}
			});
		}
	});
	setTimeout(function(){
		res.redirect('/sector');
	  }, 2000);

	

}




function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/users/login');
	}
}

module.exports = router;