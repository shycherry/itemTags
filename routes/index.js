
/*
 * GET home page.
 */

var db = require('itemTagsDB')({database:'itemTags'});
var watcher = require('itemTagsWatcher')({configDB:'testConfigDB'});
var watcherReady = null;

watcher.on('ready', function(){
  watcherReady = watcher;
});

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