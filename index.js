//the config method takes a .env file path as an argument, it parses it and sets environment vars defined in that file in process.env
require('dotenv').config();
const express = require('express');
//cors for fcc testing
const cors = require('cors');
const app = express();
//Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
const bodyParser = require('body-parser');
//A library of string validators and sanitizers.
const validator = require('validator');
// Mongoose
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true});

// Basic Configuration
const port = process.env.PORT || 3000;
const ERROR_OBJECT = {error: 'invalid url'};

//Loading middleware to all reqs
app.use(cors());
//links static pages
//process.cwd returns working dir
app.use('/public', express.static(`${process.cwd()}/public`));
//loads middleware on all post and get reqs
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Mongoose schemas
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
});
let urlModel = mongoose.model("URL", urlSchema);

//post action request
app.post("/api/shorturl",async function(req, res, next) {
  let originalURL = req.body.url;
  console.log("original url:", originalURL);
  if(!originalURL || !validator.isURL(originalURL)) {
    res.json(ERROR_OBJECT);
  } else {
//find duplicate
  let duplicate = await urlModel.findOne({original_url: originalURL});
  //check if duplicate exists
  if(duplicate) {
     console.log("Duplicate found:",duplicate.original_url, duplicate.short_url);
    res.json({
      original_url: duplicate.original_url,
      short_url: duplicate.short_url
    });
  } else {
    //we need a better way of storing short urls
    //stateful mongoose counter object???
    //this code can map the same shorturl to many urls
    //leave for now
    let shortURL = Math.floor(Math.random() * 1000);
    console.log("short url", shortURL);
    let toSave = {
        original_url: originalURL,
        short_url: shortURL
    };
    let newURL = new urlModel(toSave);
    await newURL.save();
    res.json(toSave);
  }
  }
});

//get action request at specified shorturl
app.get("/api/shorturl/:shorturl?", (req, res) => {
  let shortURL = req.params.shorturl;
  if(!shortURL) {
    //return req not completed err and err obj required by fcc
    res.status(401).json(ERROR_OBJECT);
  } else {
    urlModel.findOne({short_url: shortURL}, function(err,foundUrlObj){
  if(err) return console.log(err);
  console.log(foundUrlObj);
  res.redirect(foundUrlObj.original_url);    
   })
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});