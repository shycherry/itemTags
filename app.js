
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

var wsClients = [];
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
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'f82f07c0-854b-11e3-b7dd-6f7dbce5dff6',
  store: express.session.MemoryStore({reapInterval : 60000*10})
}));

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

app.get('/awesome', function(req, res) {
  if(req.session.lastPage) {     
     res.send('Last page was: ' + req.session.lastPage + '. \n'+'Your Awesome.');
     console.log('yo');
   }else{
    res.send('Your Awesome.'); 
   }
   req.session.lastPage = '/awesome';      
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

  connexion.on('close', function(connexion){
    console.log((new Date())+' Peer '+connexion.remoteAddress + ' disconnected.');
    wsClients.splice(clientIdx, 1);
  });

});
