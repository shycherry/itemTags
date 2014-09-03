var serverDB = require('itemTagsDB')({database:'serverDB'});
var usersDB = require('itemTagsDB')({database:'usersDB'});
var nodemailer = require('nodemailer');
var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');
var async = require('async');

var intervalId = undefined;
var emailTransporter = undefined;
var usersSnifferConfig = {};

exports.start = function(){
  if(intervalId != undefined) {
    console.log('service already running');
    return;
  }

  var taskQueue = async.queue(function(iTask, iCallback){
    doRegularTask(iCallback);
  },1);

  taskQueue.drain = function(){
    console.log('regular task done');
  };

  prepareService(function(err){
    if(err){
      console.log('failed to prepare notifiers');
      return;
    }else{
      console.log('notifiers ready');
    }

    intervalId = setInterval(function(){
      if(taskQueue.idle()){
        taskQueue.push({});
      }
    },usersSnifferConfig.interval||60000);

  });

}

exports.stop = function(){
  if(intervalId == undefined){
    console.log('service is not running');
    return;
  }

  clearInterval(intervalId);
}

function loadUsersSnifferConfig(iCallback){
  serverDB.fetchItemsSharingTags(['usersSnifferConfig'], function(err, items){
    if(err){
      iCallback(err)
    }else{
      usersSnifferConfig = items[0].getTagValue('usersSnifferConfig');
      iCallback();
    }
  });
}

function prepareService(iCallback){
  if(!iCallback)
    iCallback = function(){};
  
  async.series([
    loadUsersSnifferConfig,
    prepareMailer
    ], iCallback);
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

function emptyReportFilterHandler(iReport, iCallback){
  var filteredReport = [];
  for(var iNotifyTaskIdx in iReport){
    var currentNotifyTask = iReport[iNotifyTaskIdx];
    if(
      (currentNotifyTask['addedItems'].length >= 1) || 
      (currentNotifyTask['removedItems'].length >= 1)
    ){
      filteredReport.push(currentNotifyTask);
    }
  }
  iCallback(null, filteredReport);
}

function emailReportHandler(iReport, iWatcherConfigDB, iCallback){
  var emailReport = []
  for(var iNotifyTaskIdx in iReport){
    var currentNotifyTask = iReport[iNotifyTaskIdx];
    if(currentNotifyTask['notifier'] && currentNotifyTask['notifier']['type'] == 'email')
      emailReport.push(currentNotifyTask);
  }

  //batch by email id
  var emailIdBatch = {};
  for(var iNotifyTaskIdx in emailReport){
    var currentEmailId = emailReport[iNotifyTaskIdx]['notifier']['email'];
    if(!emailIdBatch[currentEmailId])
       emailIdBatch[currentEmailId] = [];
     emailIdBatch[currentEmailId].push(emailReport[iNotifyTaskIdx]);
  }

  function getEmailItemFn(iEmailUuid){
    return function(iCallback){
      iWatcherConfigDB.fetchOne(iEmailUuid, function(err, item){
          if(err){
            iCallback(err);
          }else{
            
            var newEmailBatchItem = {
              'email':item.getTagValue('email'),
              'tagsChanges':emailIdBatch[iEmailId]
            }

            emailBatch.push(newEmailBatchItem);
            iCallback();
          }
      });
    }
  }
  
  //fetch email from id
  var emailBatch = [];
  var fetchFunctions = [];
  for(var iEmailId in emailIdBatch){
    var currentFn = getEmailItemFn(iEmailId);
    fetchFunctions.push(currentFn);
  }
  
  async.series(fetchFunctions, function(err){
    if(err){
      iCallback(err);
    }else{
      if(err){
        iCallback(err);
      }else{
        async.each(emailBatch, sendEmail, function(err){
          iCallback(null, iReport);
        });
      }
    }
  });
}

function getHtmlFromItem(iItem){
 var text = '';
  if(iItem.hasAllTags(['file'])){
    text+=iItem.getTagValue('file')['uri'];
    text+=' <i>(tags: '+iItem.getTags().toString()+')</i>';
  }
  return text;
}

function getTextFromItem(iItem){
  var text = '';
  if(iItem.hasAllTags(['file'])){
    text+=iItem.getTagValue('file')['uri'];
    text+=' (tags: '+iItem.getTags().toString()+')';
  }
  return text;
}

function getHtmlEmail(iTagsChanges){
  var text = '';
  for(var tagChangeIdx in iTagsChanges){
    var currentTagChanges = iTagsChanges[tagChangeIdx];
    text += '<br>';
    text += '<h1>Change report for '+currentTagChanges['tag'] +':</h1><br>';
    
    var addedItems = currentTagChanges['addedItems'];
    if(addedItems.length>=1){
      text += '<b>+++Added items+++</b><br>';
      for(var addedItemsIdx in addedItems){
        text += getHtmlFromItem(addedItems[addedItemsIdx]);
        text += '<br>';
      }
    }
    
    var removedItems = currentTagChanges['removedItems'];
    if(removedItems.length>=1){
      text += '<b>---Removed items---</b><br>';
      for(var removedItemsIdx in removedItems){
        text += getHtmlFromItem(removedItems[removedItemsIdx]);
        text += '<br>';
      }
    }
    
    text+='<br>';
  }
  return text;
}

function getTextEmail(iTagsChanges){
  var text = '';
  for(var tagChangeIdx in iTagsChanges){
    var currentTagChanges = iTagsChanges[tagChangeIdx];
    text += '\n';
    text += 'Change report for '+currentTagChanges['tag'] +':\n';
    
    var addedItems = currentTagChanges['addedItems'];
    if(addedItems.length>=1){
      text += '+++Added items+++\n';
      for(var addedItemsIdx in addedItems){
        text += getTextFromItem(addedItems[addedItemsIdx]);
        text += '\n';
      }
    }
    
    var removedItems = currentTagChanges['removedItems'];
    if(removedItems.length>=1){
      text += '---Removed items---\n';
      for(var removedItemsIdx in removedItems){
        text += getTextFromItem(removedItems[removedItemsIdx]);
        text += '\n';
      }
    }
    
    text+='\n';
  }
  return text;
}

function sendEmail(iEmailBatchItem, iCallback){
  var emailOptions = {
    from: 'itemTags-notify <noreply@itemtags.db>',
    to: iEmailBatchItem['email'],
    subject: 'Change among your watched tags !',
    text: getTextEmail(iEmailBatchItem['tagsChanges']),
    html: getHtmlEmail(iEmailBatchItem['tagsChanges'])
  }
  console.log(emailOptions);
  // iCallback();
  emailTransporter.sendMail(emailOptions, function(err, infos){
    if(err){
      iCallback(err);
    }else{
      iCallback();
    }
  });
  
}

function handleDiffReport(iReport, iWatcherConfigDB, iCallback){
  async.waterfall(
    [
      function(callback){return emptyReportFilterHandler(iReport, callback);},
      function(iReport, callback){return emailReportHandler(iReport, iWatcherConfigDB, callback)}
    ],
    function(err, result){
      if(err){
        iCallback(err);
      }else{
        iCallback(null);
      }
    }
  );
}

function transferContextForHandler(iDiffReport, iCallback){
  iCallback(null, iDiffReport, this);
}

function doRegularTask(iCallback){
  usersDB.fetchItemsSharingTags(['user'], function(err, items){
    if(err){
      iCallback(err);
    }else{
      
      var taskQueue = async.queue(function(iTask, iCallback){
        async.waterfall(
          [
            iTask.userSniffer.doSniff.bind(iTask.userSniffer),
            iTask.userWatcher.doDiff.bind(iTask.userWatcher),
            transferContextForHandler.bind(iTask.userWatcherConfigDB),
            function(iDiffReport, iWatcherConfigDB, iCallback){return handleDiffReport(iDiffReport, iWatcherConfigDB, iCallback);},
            iTask.userWatcher.doSwitch.bind(iTask.userWatcher),
          ],
          function(err, result){
            iCallback(err);
          }
        );
      },1);

      taskQueue.drain = iCallback;
      
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

        var userWatcherConfigDB = require('itemTagsDB')({database:userWatcherConfigDBName});

        taskQueue.push({
          "userSniffer": userSniffer,
          "userWatcher": userWatcher,
          "userWatcherConfigDB": userWatcherConfigDB,
        });

        // async.waterfall(
        //   [
        //     userSniffer.doSniff.bind(userSniffer),
        //     userWatcher.doDiff.bind(userWatcher),
        //     transferContextForHandler.bind(userWatcherConfigDB),
        //     function(iDiffReport, iWatcherConfigDB, iCallback){return handleDiffReport(iDiffReport, iWatcherConfigDB, iCallback);},
        //     userWatcher.doSwitch.bind(userWatcher),
        //   ],
        //   function(err, result){
        //     if(err){
        //       console.log(err);            
        //     }else{
        //       console.log('handle OK')
        //     }
        //   }
        // );
      }
      if(taskQueue.idle())
        iCallback();
    }
  });
}
