var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var connection = require('../model/connection');
//var connectionDB = require('../model/connectionDB');
var connectiondb_mongo = require('../model/db_mongo/connectiondb_mongo');
var userProfiledb_mongo = require("../model/db_mongo/userProfiledb_mongo");
const {check, validationResult} = require('express-validator');

router.get('/index', function (req, res) {
  res.render("index", {session:req.session.userdetails});
});

router.get('/', function (req, res) {
  res.render("index", {session:req.session.userdetails});
});

router.get('/contact', function (req, res) {
  res.render("contact",{session:req.session.userdetails});
});

router.get('/about', function (req, res) {
  res.render("about",{session:req.session.userdetails});
});

router.get('/info', function (req, res) {
  res.render("info",{session:req.session.userdetails});
});

router.get('/newConnection', function (req, res) {
  res.render("newConnection",{session:req.session.userdetails,errors_inp:[]});
});

router.get('/login', function (req, res) {
  res.render("login",{session:req.session.userdetails,errors_inp:[]});
});

router.get('/signup', function (req, res) {
  res.render("signup",{session:req.session.userdetails,errors_inp:[]});
});

router.all('/connection', async function (req, res) {
 // res.redirect("connections")
  if(Object.keys(req.query).length!=0){
    var connectiondb_mongo_Obj = new connectiondb_mongo();
    var conObj = await connectiondb_mongo_Obj.getConnection(req.query.conID);
    console.log(conObj);
    if(conObj.connectionId==undefined){
      res.redirect("connections")
    }
    else{
      res.render("connection", {connection:conObj,session:req.session.userdetails,action:req.query.action ? req.query.action:'save'});
        }
    
  }
  else{
    res.redirect("connections")
  }
  });

router.get('/connections', async function (req, res) {
  var connectiondb_mongo_Obj = new connectiondb_mongo();
  var connectionsList = await connectiondb_mongo_Obj.getConnections();
  console.log(connectionsList);
  res.render("connections", {connections:connectionsList, session:req.session.userdetails, categories:await connectiondb_mongo_Obj.categories()});
  });

router.get('/logout', function (req, res){
  req.session.destroy();
  res.render("index", {session:undefined});
});

router.post("/newConnection",urlencodedParser,[
  check('connection_category').trim().not().isEmpty().withMessage("Connection category should'nt be blank").escape(),
  check('connection_name').trim().not().isEmpty().withMessage("Please provide the connection name").escape(),
  check('details').trim().not().isEmpty().withMessage("Please provide the venue details").escape(),
  check('dateAndTime').isAfter(),
  check('hostedBy').trim().not().isEmpty().withMessage("Please provide the Host details").escape(),
  check('image').not().isEmpty().withMessage("Please add the hyperlink for the image to render").escape(),
],async function(req,res){
  const errors = validationResult(req);
        if(!errors.isEmpty()){
            console.log(errors.array())
            res.render("newConnection",{session:req.session.userdetails,errors_inp: errors.array()});
          }
        else{
          try{
            var connectiondb_mongo_Obj = new connectiondb_mongo();
            const conIdCounter = await connectiondb_mongo_Obj.getConIDsequence();
            //conIdCounter[0].connectionId +1
            //console.log("conIdCounter",conIdCounter);
            var conObject = new connection(conIdCounter[0].connectionId +1, req.body.connection_name, req.body.connection_category, req.body.details, req.body.dateAndTime, req.body.hostedBy,req.body.venue,req.body.image)
            var userID = req.session.userdetails.userID;
            await connectiondb_mongo_Obj.addConnections(conObject,userID);
            var userProfiledb_mongo_Obj = new userProfiledb_mongo();
            await userProfiledb_mongo_Obj.addUserConnection(userID,conObject.connectionId,'yes');
            res.redirect('SavedConnections');
          }catch(err){
            console.error(err);
          }
        }
  
});

module.exports = router;  