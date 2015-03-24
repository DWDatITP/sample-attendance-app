var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(request, response){
  response.render('index');
});

var server = app.listen(app.get('port'), function(){
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
