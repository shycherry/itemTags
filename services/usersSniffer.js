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
  },30000);

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
      var userWatcherConfigDBName = items[iUser].getTagValue('user')['watcherConfigDB'];
      if(!userWatcherConfigDBName){
        console.log('Bad watcherConfigDB name, skipping this user');
        break;
      }

      var userWatcher = require('itemTagsWatcher')({configDB: userWatcherConfigDBName});
      if(!userWatcher){
        console.log('Can\'t retrieve watcher, skipping this user');
        break;
      }

      var userSnifferConfigDBName = items[iUser].getTagValue('user')['snifferConfigDB'];
      if(!userSnifferConfigDBName){
        console.log('Bad snifferConfigDB name, skipping this user');
        break;
      }

      var userSniffer = require('itemTagsSniffer')({configDB: userSnifferConfigDBName});
      if(!userSniffer){
        console.log('Can\'t retrieve sniffer, skipping this user');
        break;
      }

      userSniffer.doSniff(function(err){
        if(err){
          console.log(err);
          return;
        }

        userWatcher.doDiff(function(err, diffReport){
          if(err){
            console.log(err);
            return;
          }
          console.log(diffReport);
        });  

      });
      
    }
    
  });
}
