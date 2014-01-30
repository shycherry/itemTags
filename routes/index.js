
var db = require('itemTagsDB')({database:'itemTags'});
var usersDB = require('itemTagsDB')({database:'usersDB'});
var watcher = require('itemTagsWatcher')({configDB:'testConfigDB'});
var watcherReady = null;

watcher.on('ready', function(){
  watcherReady = watcher;
});


/*
 * GET home page.
 */

exports.index = function(req, res){  
  watcherReady.doWatch(function(){
    watcherReady.getDB().fetchAll(function(err, items){
      var lastPage = req.session.lastPage
      if(!lastPage)
        lastPage = 'none';
      req.session.lastPage = '/index';
      res.render('index', { title: 'ItemsDB', lastPage : lastPage,  items: items});
    });
  });
  
};


/*
 * GET login page.
 */

exports.GETlogin = function(req, res){  
  res.render('login', { title: 'ItemsDB'});
};


/*
 * POST login page.
 */

exports.POSTlogin = function(req, res){  
  var login = req.body.login;
  var password = req.body.password;

  var _userFilter = function(iName, iPassword){
    return function(itemAsUser){
      return (itemAsUser.name == iName ) && (itemAsUser.mdp == iPassword);
    }  
  }
  
  usersDB.fetchOneByFilter(_userFilter(login, password), function(err, user){
    if(err){
      res.render('login', { title: 'Error'});
    }else{
      res.render('login', { title: 'Hey '+user.name});
    }
  });
  
};