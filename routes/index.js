
var usersDB = require('itemTagsDB')({database:'usersDB'});
var sessionsUsersMap = {};

var hashString = function(iString){
  var Crypto = require('crypto');
  var hash = Crypto.createHash('sha512');
  hash.update(iString);
  return hash.digest('hex');
};

var getCheckedUserSession = function(req, res){
  var sid = req.session.sid;
  var sessionUser = sessionsUsersMap[sid];

  if(!sessionUser){
    res.redirect('/login');
    //res.respond('login required', 401);
    return null;
  }

  console.log('in session users... continue !');
  return sessionUser;
}

/*
 * GET home page.
 */

exports.index = function(req, res){
  var lastPage = req.session.lastPage;
  req.session.lastPage = '/';

  var sessionUser = getCheckedUserSession(req, res);  
  if(!sessionUser) return;
    
  res.render('index', { title: 'ItemsDB', username: sessionUser.name,  lastPage : lastPage});

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
    return JSON.stringify({
      "@user" : {
        "name" : iName,
        "mdp" : iPassword
      }
    });
  };
  
  usersDB.fetchOneByFilter(_userFilter(login, hashedPasswd), function(err, user){
    if(err){
      res.render('login', { title: 'Error'});
    }else{
      var UUID = require('uuid');
      var sid = UUID.v1();
      sessionsUsersMap[sid] = user;
      req.session.sid = sid;
      res.redirect(req.session.lastPage || '/');
    }
  });
  
};

/*
 * GET fetchAll
 */

exports.GET_fetch_all = function(req, res){
  
  var sessionUser = getCheckedUserSession(req, res);
  if(!sessionUser) return;
  
  var configDB = sessionUser.getTagValue('user')['watcherConfigDB'];
  if(!configDB){
    res.respond('bad watcherConfigDB', 500);
    return;
  }

  var userWatcher = require('itemTagsWatcher')({configDB: configDB});
  if(!userWatcher){
    res.respond('can\'t retrieve userWatcher', 500);
  }

  userWatcher.on('ready', function(){
    userWatcher.doWatch(function(err){
      if(err){
        res.respond(err, 500);
      }else{
        userWatcher.getDB().fetchAll(function(err, items){
          res.respond(err||items, err ? 500 : 200);
        });
      }
      
    });
  });

  
};

exports.GET_fetch_all_by_filter = function(req, res){
  
  var sessionUser = getCheckedUserSession(req, res);
  if(!sessionUser) return;
  
};
