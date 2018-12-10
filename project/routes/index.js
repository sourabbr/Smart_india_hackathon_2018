var Sector = require('../models/sector');
var Catalog = require('../models/catalog');
var Dataset = require('../models/dataset');
var Downloader = require('../models/downloader');
const path = require('path');
var exec = require('child_process').exec;
var nodemailer = require('nodemailer');
var encryptor = require('file-encryptor');

var key = 'My Super Secret Key';

var express = require('express');
var router = express.Router();

router.use(express.static('public'));

var AWS = require('aws-sdk');
var fs = require("fs");
var s3 = new AWS.S3();

var bucketName = 'aws-s3-ddp';

router.get('/', function(req, res){
	res.render('root',{layout: false});
});

router.get('/sector',ensureAuthenticated, function(req, res){
	Sector.find({},{'_id':0,'__v':0}, function (err, sectors) {
		if (err) return handleError(err);
		sectors=JSON.stringify(sectors);
        sectors=JSON.parse(sectors);
		res.render('sector',{model:sectors});
	});

	
});

router.get('/catalogs',ensureAuthenticated,function(req,res){
	Catalog.find({sector:req.query.sector},{'_id':0,'__v':0}, function (err, catalogs) {
		if (err) return handleError(err);
		catalogs=JSON.stringify(catalogs);
		catalogs=JSON.parse(catalogs);
		res.render('catalog',{model:catalogs});
	});
});

router.get('/datasets',ensureAuthenticated,function(req,res){
	Sector.find({},{'_id':0,'__v':0}, function (err, sectors) {
		if (err) return handleError(err);
		sectors=JSON.stringify(sectors);
        sectors=JSON.parse(sectors);
	
		Dataset.find({catalog:req.query.catalog},{'_id':0,'__v':0}, function (err, datasets) {
			if (err) return handleError(err);
			datasets=JSON.stringify(datasets);
			datasets=JSON.parse(datasets);
			for(i=0;i<datasets.length;i++){
				if(datasets[i].tyre=="free"){
					datasets[i].tyre=true;
				}
				else if(datasets[i].tyre=="paid"){
					datasets[i].tyre=false;
				}
			}
			res.render('dataset',{model:datasets,sectorlist:sectors});
			
			// setTimeout(function(){
				
			//   }, 2000);
			
		});
	});
});
router.get('/TandC', ensureAuthenticated, function(req, res){
	res.render('tc');
});	
router.get('/payment', ensureAuthenticated, function(req, res){
	res.render('payment',req.query);
});	

router.get('/dataset/visualize', ensureAuthenticated, function(req, res){
	downloadFileVisual(req,res);
});	

//for downloading
router.get('/download/json', ensureAuthenticated, function(req, res){
	downloadFile(req,res);
});	
router.get('/download/csv', ensureAuthenticated, function(req, res){
	downloadFile(req,res);
});	
router.get('/download/xml', ensureAuthenticated, function(req, res){
	downloadFile(req,res);
});	
router.post('/pay', ensureAuthenticated, function(req, res){
	console.log(req.body);
	//add req.body.rows to req.body.downloadurl
	//mailer
	var nodemailer = require('nodemailer');

	let transporter = nodemailer.createTransport({
	service: 'gmail',
	secure: false,
	port: 3000,
	auth: {
		user: 'shravankp14@gmail.com',
		pass: 'qwerty@321'
	},
	tls: {
		rejectUnauthorized: false
	}
	});

	let HelperOptions = {
	from: 'Shravan kp <shravankp14@gmail.com>',
	to: 'sourabbr@gmail.com',
	subject: 'Dataset download link',
	text: "127.0.0.1:3000"+req.body.downloadurl+"&username="+req.body.username+"&rows="+req.body.rows
	};



  transporter.sendMail(HelperOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("The message was sent!");
	console.log(info);
	
  });
  res.redirect('https://bharatkosh.gov.in/MinistryInfo.aspx');

		
});	
router.get('/download', ensureAuthenticated, function(req, res){
	downloadFile(req,res);
});	
router.post('/visualize', ensureAuthenticated, function(req, res){
	var visual_json=fs.readFileSync('./Downloads/datafile.json','utf8');
	visual_json=JSON.parse(visual_json);
	res.json(visual_json);
});	


function downloadFile(req,res){
	console.log(req.query.sector+"/"+req.query.catalog+"/"+req.query.dataset);
    params = {Bucket:bucketName, Key:req.query.sector+"/"+req.query.catalog+"/"+req.query.dataset+"/datafile.json"};
    
    s3.getObject(params,function(err,data){
        if(err)
            console.log("Error in getObject:"+ err);
        else
        {
            fs.writeFile("./Downloads/datafile.json",data.Body,'utf8',function(err,data){
                if(err)
                    console.log("Error in file write :" + err);
                else{
					if(req.query.type=="json"){
						exec("python json-json-row.py "+req.query.rows,function(err,stdout){
							if(err){
								throw err;
							}
							exec("python encrypt.py",function(err,stdout){
								if(err){
									throw err;
								}

								//console.log(stdout);
								console.log("File downloaded successfully.");
								var file = 'data.json.aes';
								var fileLocation = path.join('./Downloads', file);
								console.log(fileLocation);
								res.download(fileLocation, file);
							});
						});
						
					}
					else if(req.query.type=="csv"){
						exec("python json-csv-row.py "+req.query.rows,function(err,stdout){
							if(err){
								throw err;
							}
							exec("python encryptcsv.py",function(err,stdout){
								if(err){
									throw err;
								}
							//console.log(stdout);
							console.log("File downloaded successfully.");
							var file = 'data.csv.aes';
							var fileLocation = path.join('./Downloads', file);
							console.log(fileLocation);
							res.download(fileLocation, file);
							});
						});
					}
					else if(req.query.type=="xml"){
						exec("python json-xml-row.py "+req.query.rows,function(err,stdout){
							if(err){
								throw err;
							}
							//console.log(stdout);
							console.log("File downloaded successfully.");
							var file = 'datafile.'+req.query.type;
							var fileLocation = path.join('./Downloads', file);
							console.log(fileLocation);
							res.download(fileLocation, file);
						});
					}
				}
			});
			Dataset.updateOne({title:req.query.dataset}, {$inc: {downloads:1}}, function(err, data){
				if (err) return res.send(500, { error: err });
				console.log(data);
			});
			var newDownloader=Downloader({username:req.query.username,dataset:req.query.dataset}).save(function(err,data){
				if (err) return res.send(500, { error: err });
				console.log(data);
			});
        }
    });
}

function downloadFileVisual(req,res){
    params = {Bucket:bucketName, Key:req.query.sector+"/"+req.query.catalog+"/"+req.query.dataset+"/datafile.json"};
    
    s3.getObject(params,function(err,data){
        if(err)
            console.log("Error in getObject:"+ err);
        else
        {
            fs.writeFile("./Downloads/datafile.json",data.Body,'utf8',function(err,data){
                if(err)
                    console.log("Error in file write :" + err);
                else{
					console.log("File downloaded successfully.");	
					res.render('visualize',{layout:false});
				}
            });
        }
    });
}

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/users/login');
	}
}

//routes for putting data into database
router.get('/sectordata',function(req,res){
	Sector(req.body).save(function(err,data){
		if (err) return res.send(500, { error: err });
		return res.send("succesfully inserted");
	});	
});
router.post('/catalogdata',function(req,res){
	Catalog(req.body).save(function(err,data){
		if (err) return res.send(500, { error: err });
		return res.send("succesfully inserted");
	});
});
router.post('/datasetdata',function(req,res){
	Dataset(req.body).save(function(err,data){
		if (err) return res.send(500, { error: err });
		return res.send("succesfully inserted");
	});
});

module.exports = router;