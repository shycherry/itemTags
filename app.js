
/**
 * Module dependencies.
 */
var WebSocketServer = require('websocket').server;
var express = require('express'),
  routes = require('./routes'),
  user = require('./routes/user'),
  https = require('https'),
  fs = require('fs'),
  path = require('path');
require('./response');

var credentials = {
  key: fs.readFileSync('./shycherry.fr.key'),
  cert: fs.readFileSync('./shycherry.fr.cert')
};

var db = exports.db = require('itemTagsDB')({database:'./itemTags.nosql'});
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/items', function(req, res){
  db.fetchAll(function(err, items){
    res.respond(err||items, err ? 500 : 200);
  });
});
app.post('/item', function(req, res){
  console.log(req);
  res.send("post !");
});

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var wsServer = new WebSocketServer({
  httpServer: httpsServer
});

wsServer.on('request', function(request){
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
});
