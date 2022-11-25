require('dotenv').config();
var mongo = require('mongodb');
var mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortId = require('shortid');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}))

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.on('error',() => {console.error('error occured')});
connection.once('open',() => {
  console.log('connection established')
})

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
})
const URL = mongoose.model("URL",urlSchema);

app.post('/api/shorturl/new', async function(req,res,next) {
  const url = req.body.url_input
  const urlCode = shortId.generate()
  if(!validUrl.isWebUri(url)) {
    res.status(401).json({
      error: 'invalid URL'
    })
  } else {
    try {
      let findOne =   await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url  
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).send('server error')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function(req,res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).send('no url found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
  }
})

app.use(cors());
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
