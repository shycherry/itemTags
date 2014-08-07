var usersDB = require('itemTagsDB')({database:'usersDB'});
// var userWatcher = require('itemTagsWatcher')({configDB: configDB});
var intervalId = undefined;

exports.start = function(){
  if(intervalId != undefined) {
    console.log('service already running');
    return;
  }

  intervalId = setInterval(function(){
    doRegularTask();
  },1000);

}

exports.stop = function(){
  if(intervalId == undefined){
    console.log('service is not running');
    return;
  }

  clearInterval(intervalId);
}

var doRegularTask = function(){
  usersDB.fetchItemsSharingTags(['user'], function(err, items){
    if(err){
      console.log(err);
      return;
    }
    for(iUser in items){
      var userWatcherConfigDB = items[iUser].getTagValue('user')['watcherConfigDB'];
      if(!userWatcherConfigDB){
        console.log('Bad watcherConfigDB, skipping this user');
        break;
      }
      var userWatcher = require('itemTagsWatcher')({configDB: userWatcherConfigDB});
      if(!userWatcher){
        console.log('Can\'t retrieve watcher, skipping this user');
        break;
      }

      userWatcher.doDiff(function(err, diffReport){
        if(err){
          console.log(err);
          return;
        }
        console.log(diffReport);
      });
    }
    
  });
}
