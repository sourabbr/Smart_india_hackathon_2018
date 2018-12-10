var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const path = require('path');

var User = require('../models/user');

var currentusername;
var usertype;
var onSuccessRedirect;
router.use(express.static('public'));

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var dob = req.body.dob;
	var gender = req.body.gender;
	var phone = req.body.phone;

	// Validation
	req.checkBody('firstname', 'Name is required').notEmpty();
	req.checkBody('lastname', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	req.checkBody('dob', 'dob is required').notEmpty();
	req.checkBody('gender', 'Gender is required').notEmpty();
	req.checkBody('phone', 'Phone number is required').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			firstname: firstname,
			lastname: lastname,
			email:email,
			username: username,
			password: password,
			dob: dob,
			gender: gender,
			phone: phone,
			usertype:"general"
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
		}
		usertype=user.usertype;
		if(usertype=="officer"){
			onSuccessRedirect={successRedirect:'/officer', failureRedirect:'/users/login',failureFlash: true};
		}
		else if(usertype=="general"){
			onSuccessRedirect={successRedirect:'/sector', failureRedirect:'/users/login',failureFlash: true};
		} 

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
			module.exports.currentuserid=user._id;
			module.exports.currentusername=user.username;
			// if(user.usertype=="general")
			// {
			// 	user.usertype=false;
			// }
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',passport.authenticate('local', onSuccessRedirect),function(req, res) {
	if(usertype=="officer"){
		res.redirect('/officer');
	}
	else if(usertype=="general"){
		res.redirect('/sector');
	} 
		
});

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/');
});


module.exports.router = router;