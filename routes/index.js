
var usersDB = require('itemTagsDB')({database:'usersDB'});
var sessionsUsersMap = {};

var hashString = function(iString){
  var Crypto = require('crypto');
  var hash = Crypto.createHash('sha512');
  hash.update(iString);
  return hash.digest('hex');
};

var getCheckedSessionUser = function(req, res){
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

var getCheckedSessionUserWatcher = function(req, res){
  var sessionUser = getCheckedSessionUser(req, res);
  if(!sessionUser) return null;

  if(!sessionUser.watcher){
    var configDB = sessionUser.getTagValue('user')['watcherConfigDB'];
    if(!configDB){
      res.respond('bad watcherConfigDB', 500);
      return null;
    }

    var userWatcher = require('itemTagsWatcher')({configDB: configDB});
    if(!userWatcher){
      res.respond('can\'t retrieve userWatcher', 500);
      return null;
    }    
    sessionUser.watcher = userWatcher;
  }

  return sessionUser.watcher;
}

/*
 * GET home page.
 */

exports.index = function(req, res){
  var lastPage = req.session.lastPage;
  req.session.lastPage = '/';

  var sessionUser = getCheckedSessionUser(req, res);  
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
  var userWatcher = getCheckedSessionUserWatcher(req, res);
  if(!userWatcher) return;

  userWatcher.getDB( function(err, database){
    if(err){
      res.respond(err, 500);
    }else{
      database.fetchAll(function(err, items){
        res.respond(err||items, err ? 500 : 200);
      });  
    }
  });

};

exports.GET_fetch_all_tags = function(req, res){
  var userWatcher = getCheckedSessionUserWatcher(req, res);
  if(!userWatcher) return;

  userWatcher.getDB( function(err, database){
    if(err){
      res.respond(err, 500);
    }else{
      database.fetchAllTags(function(err, tags){
        res.respond(err||tags, err ? 500 : 200);
      });  
    }
  });

};


exports.GET_do_watch = function(req, res){
  var userWatcher = getCheckedSessionUserWatcher(req, res);
  if(!userWatcher) return;

  userWatcher.doWatch(function(err){
    if(err){
      res.respond(err, 500);
    }else{
      res.respond(null, 200);
    }
  });
};

exports.GET_do_diff = function(req, res){
  var userWatcher = getCheckedSessionUserWatcher(req, res);
  if(!userWatcher) return;

  userWatcher.doDiff(function(err, diffReport){
    if(err){
      res.respond(err, 500);
    }else{
      res.respond(diffReport, 200);
    }
  });
};

exports.GET_do_switch = function(req, res){
  var userWatcher = getCheckedSessionUserWatcher(req, res);
  if(!userWatcher) return;

  userWatcher.doSwitch(function(err){
    if(err){
      res.respond(err, 500);
    }else{
      res.respond(null, 200);
    }
  });
};
