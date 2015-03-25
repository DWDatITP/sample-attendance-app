var express = require('express');
var exphbs  = require('express-handlebars');
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');
var bodyParser = require('body-parser');
var moment = require('moment');

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
  email: String,
  weeks: Array
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
  var student = new Student({
    name: name,
    email: email,
    weeks: []
  });
  student.save(function(err){
    if (err) { return response.send('error: ' + err); }
    response.redirect('/');
  });
});

var classes = [
  {number: 1, startsAt: moment.utc('2015-02-25 21:00'), endsAt: moment.utc('2015-03-26 1:00')},
  {number: 2, startsAt: moment.utc('2015-04-01 21:00'), endsAt: moment.utc('2015-04-02 1:00')},
  {number: 3, startsAt: moment.utc('2015-04-08 21:00'), endsAt: moment.utc('2015-04-09 1:00')},
  {number: 4, startsAt: moment.utc('2015-04-15 21:00'), endsAt: moment.utc('2015-04-16 1:00')},
  {number: 5, startsAt: moment.utc('2015-04-22 21:00'), endsAt: moment.utc('2015-04-23 1:00')},
  {number: 6, startsAt: moment.utc('2015-04-29 21:00'), endsAt: moment.utc('2015-04-30 1:00')},
  {number: 7, startsAt: moment.utc('2015-05-06 21:00'), endsAt: moment.utc('2015-05-07 1:00')},
];

function findCurrentClass(){
  var now = moment.utc();
  for (var i=0; i<classes.length; i++) {
    var currentClass = classes[i];
    if (currentClass.startsAt < now && currentClass.endsAt > now) {
      return currentClass;
    }
  }
}

app.get('/students/:id/attendance', function(request, response){
  var studentId = request.params.id;
  Student.findById(studentId, function(err, student){
    if (err) { response.send('error: ' + err); }
    var currentClass = findCurrentClass();
    response.render('students/attendance', {
      student: student,
      currentClass: currentClass
    });
  });
});

// This endpoints gets a POST http verb, which means it comes from a form.
// It looks up the student by the id given and then
// checks to see if that student's "weeks" array already has the
// weekNumber from the form. If it does not, it adds it to the array of
// week numbers that this student has attended.
app.post('/students/:id/attendance', function(request, response){
  var studentId = request.params.id;
  var weekNumber = request.body.week;

  // find student
  Student.findById(studentId, function(err, student){
    // if there was an error finding the student, say so here
    if (err) { return response.send('error: ' + err); }

    // if the student doesn't yet have a "weeks" property, set it here
    if (!student.weeks) { student.weeks = []; }

    // if the student doesn't already have this weekNumber recorded,
    // add it to the "weeks" array
    if (student.weeks.indexOf(weekNumber) === -1) {
      student.weeks.push(weekNumber);
    }

    // sort the weeks. This is so it is easier to display them on the
    // main index page.
    student.weeks = student.weeks.sort();

    student.save(function(err){
      if (err) { return response.send('error: ' + err); }
      response.render('students/attendance_marked');
    });
  });
});

db.once('open', function(){
  console.log('app started on port',app.get('port'));
  app.listen(app.get('port'));
});

db.on('error', function(error){
  console.log('error with db:',error);
});
