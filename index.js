var express = require('express');
var exphbs  = require('express-handlebars');
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var bodyParser = require('body-parser');

var app = express();

app.set('port', (process.env.PORT || 5000));

var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };

var mongodbUri = process.env.MONGOLAB_URI || 'mongodb://heroku_app35176489:5cmbghi6v477uak6rtcflhv2h1@ds031661.mongolab.com:31661/heroku_app35176489';
var mongooseUri = uriUtil.formatMongoose(mongodbUri);
mongoose.connect(mongooseUri, options);
var db = mongoose.connection;

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended:true}));

var studentSchema = mongoose.Schema({
  name: String,
  email: String
});

var Student = mongoose.model('students', studentSchema);

app.get('/', function(request, response){
  Student.find(function(err, students){
    if (err) { return console.error(err); }
    response.render('index', {students:students});
  });
});

app.get('/students/new', function(request, response){
  response.render('students/new');
});

app.post('/students', function(request, response){
  var name = request.body.name;
  var email = request.body.email;
  var student = new Student({name: name, email: email});
  student.save(function(err){
    if (err) { return console.error(err); }
    response.redirect('/');
  });
});

db.once('open', function(){
  console.log('app started on port',app.get('port'));
  app.listen(app.get('port'));
});

db.on('error', function(error){
  console.log('error with db:',error);
});

