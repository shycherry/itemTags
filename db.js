module.exports = function (options) {
   
  /**
   * Module options
   */
  var uuid = require('uuid')
  var nosql = null
  if ('undefined' != typeof options) _set_options_(options)
  /**
   * Privates
   */
  function _set_options_(options){
    if('undefined' != typeof options.database){
      nosql = require('nosql').load(options.database)
      console.log(options.database+' db loaded !')
    }  
  }
  
  function _uuidFilter_(uuid){
    return function(dbItem){
      return uuid == dbItem.uuid
    }
  }

   /**
   * exposed API
   */
  return {
    
    "configure": _set_options_,

    "save": function save (item, callback) {
      var isCreation = ('undefined' == typeof item.uuid)
      if( isCreation ){
        item.uuid = uuid.v1()
        nosql.insert(item, function(){
          callback(undefined, item, true)
        })
      }else{
        this.fetchOne(item.uuid, function(err, dbItem){
          if(err){ return callback(err) }
          if(dbItem){
            nosql.update(
              function(dbItem){
                if(dbItem.uuid == item.uuid){
                  dbItem = item
                }
                return dbItem
              },
              function(){
                callback(undefined, item, false)
              }              
            )
          }
        })
        
      }
    },

    "fetchItemsSharingTags": function fetchItemsSharingTags(tagsList, callback){
      nosql.all(null, function(dbItems){
        var itemsSharingTags = []
        for(var itemIdx in dbItems){
          var itemTags = dbItems[itemIdx].tags
          if(itemTags){
            for(var tagIdx in itemTags){
              if(tagsList.lastIndexOf(itemTags[tagIdx]) != -1){
                itemsSharingTags.push(dbItems[itemIdx])
              }
            }
          }
        }
        callback(undefined, itemsSharingTags)
      })
    },

    "fetchAllTags": function fetchAllTags(callback){      
      nosql.all(null, function(dbItems){
        var tagsList=[]
        for(var itemIdx in dbItems){
          var itemTags = dbItems[itemIdx].tags
          if(itemTags){
            for(var tagIdx in itemTags){
              if(tagsList.lastIndexOf(itemTags[tagIdx]) == -1){
                tagsList.push(itemTags[tagIdx])
              }
            }
          }
        }
        callback(undefined, tagsList)
      })
    },

    "fetchByFilter": function fetchByFilter(filter, callback){
      nosql.one(filter, function(dbItem){
        if(!dbItem){
          callback('not found !')
        }
        else{
          callback(undefined, dbItem)
        }
      })
    },

    "fetchOne":  function fetchOne (uuid, callback) {      
      nosql.one(_uuidFilter_(uuid), function(dbItem){
        if(!dbItem){
          callback('not found !')
        }
        else{
          callback(undefined, dbItem)
        }
      })
    },

    "fetchAll":  function fetchAll (callback) {
      nosql.all(null, function(dbItems){
        callback(undefined, dbItems)
      })
    },
    
    "deleteOne": function deleteOne (uuid, callback) {
      nosql.remove(_uuidFilter_(uuid), function(removedCount){
        callback(undefined, removedCount)
      })
    },
    
    "deleteAll": function deleteAll (callback) {
      nosql.clear(function(){
        if(callback) callback(undefined, null)
      })
    }

  }
 
};
