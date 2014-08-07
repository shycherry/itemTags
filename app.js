
/**
 * Module dependencies.
 */
var WebSocketServer = require('websocket').server;
var express = require('express'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  expressSession = require('express-session'),
  routes = require('./routes'),
  user = require('./routes/user'),
  spdy = require('spdy'),
  fs = require('fs'),
  path = require('path');
require('./response');

var credentials = {
  key: fs.readFileSync('./shycherry.fr.key'),
  cert: fs.readFileSync('./shycherry.fr.cert')
};

var wsClients = [];
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(cookieParser());
app.use(expressSession({
  secret: 'f82f07c0-854b-11e3-b7dd-6f7dbce5dff6',
  store: expressSession.MemoryStore({reapInterval : 60000*10}),
  resave: true,
  saveUninitialized: true
}));

//service impl
app.get('/', routes.index);
app.get('/login', routes.GETlogin);
app.post('/login', routes.POSTlogin);
app.get('/fetch_user_watcher_config', routes.GET_fetch_user_watcher_config);

//itdb impl
app.get('/fetch_all', routes.GET_fetch_all);
app.get('/fetch_all_tags', routes.GET_fetch_all_tags);
app.get('/do_watch', routes.GET_do_watch);
app.get('/do_diff', routes.GET_do_diff);
app.get('/do_switch', routes.GET_do_switch);
app.post('/save', routes.POST_save);
app.get('/do_switch', routes.GET_do_switch);

app.get('/users', user.list);

//watch service
require('./services/usersWatcher').start();

var spdyServer = spdy.createServer(credentials, app);
spdyServer.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var wsServer = new WebSocketServer({
  httpServer: spdyServer
});

wsServer.on('request', function(request){
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  var connexion = request.accept(null, request.origin);
  var clientIdx = wsClients.push(connexion) - 1;

  console.log((new Date()) + ' Connexion accepted.');

  connexion.on('message', function(message){
    console.log(JSON.stringify(message));
    
    for(var idx = 0; idx < wsClients.length; idx++){
      wsClients[idx].sendUTF(JSON.stringify({
        type: 'message',
        data: message.utf8Data
      }));
    }
    
  });

  connexion.on('close', function(reasonCode, description){
    console.log((new Date())+' Peer '+connexion.remoteAddress + ' disconnected. rc:'+reasonCode+', description:'+description);
    wsClients.splice(clientIdx, 1);
  });

});
