var serverDB = require('itemTagsDB')({database:'serverDB'});
var usersDB = require('itemTagsDB')({database:'usersDB'});
var nodemailer = require('nodemailer');
var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');
var async = require('async');

var intervalId = undefined;
var emailTransporter = undefined;

exports.start = function(){
  if(intervalId != undefined) {
    console.log('service already running');
    return;
  }

  prepareMailer(function(err){
    if(err){
      console.log('failed to prepare emailer');
      return;
    }else{
      console.log('emailer ready');
    }

    intervalId = setInterval(function(){
      doRegularTask();
    },30000);

  });

}

exports.stop = function(){
  if(intervalId == undefined){
    console.log('service is not running');
    return;
  }

  clearInterval(intervalId);
}

function prepareMailer(iCallback){
  serverDB.fetchItemsSharingTags(['emailerConfig'], function(err, items){
    if(err){
      iCallback(err)
    }else{
      var options = items[0].getTagValue('emailerConfig');
      emailTransporter = nodemailer.createTransport(smtpPool(options));
      iCallback();
    }
  });
}


function doRegularTask(){
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

      async.series(
        [
          userSniffer.doSniff.bind(userSniffer),
          userWatcher.doDiff.bind(userWatcher)
        ],
        function(err, results){
          console.log(results);
        }
      )
      
    }
    
  });
}
