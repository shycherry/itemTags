
var usersDB = require('itemTagsDB')({database:'usersDB'});
var sessionsUsersMap = {};

var hashString = function(iString){
  var Crypto = require('crypto');
  var hash = Crypto.createHash('sha512');
  hash.update(iString);
  return hash.digest('hex');
};

/*
 * GET home page.
 */

exports.index = function(req, res){
  var lastPage = req.session.lastPage;
  req.session.lastPage = '/';

  var sid = req.session.sid;
  var sessionUser = sessionsUsersMap[sid];
  
  if(!sessionUser){
    console.log('not in session users, redirect to login');
    res.redirect('/login');
  }else{
    console.log('in session users... continue !');
    var userWatcher = require('itemTagsWatcher')({configDB: sessionUser.watcherConfigDB});
    
    userWatcher.on('ready', function(){
      userWatcher.doWatch(function(){
        userWatcher.getDB().fetchAll(function(err, items){
          res.render('index', { title: 'ItemsDB', username: sessionUser.name,  lastPage : lastPage,  items: items});
        });
      });
    });
  }

};


/*
 * GET login page.
 */

exports.GETlogin = function(req, res){
  delete req.session.sid;
  res.render('login', { title: 'ItemsDB'});
};


/*
 * POST login page.
 */

exports.POSTlogin = function(req, res){
  var login = req.body.login;
  var password = req.body.password;
  var hashedPasswd = hashString(password);

  var _userFilter = function(iName, iPassword){
    return function(itemAsUser){
      return (itemAsUser.name == iName ) && (itemAsUser.mdp == iPassword);
    };
  };
  
  usersDB.fetchOneByFilter(_userFilter(login, hashedPasswd), function(err, user){
    if(err){
      res.render('login', { title: 'Error'});
    }else{
      //res.render('login', { title: 'Hey '+user.name});
      var UUID = require('uuid');
      var sid = UUID.v1();
      sessionsUsersMap[sid] = user;
      req.session.sid = sid;
      res.redirect(req.session.lastPage || '/');
    }
  });
  
};