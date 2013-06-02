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
      var created = ('undefined' == typeof item.uuid)
      if( created ){
        item.uuid = uuid.v1()
        nosql.insert(item, function(){
          callback(undefined, item, created)
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
                callback(undefined, item, created)
              }              
            )
          }
        })
        
      }
    },
    "fetchOne":  function fetchOne (uuid, callback) {      
      nosql.count(
        _uuidFilter_(uuid), 
        function(count){
          if(count==0){
            callback("no item "+uuid+" found !")
          }else{
            nosql.one(_uuidFilter_(uuid), function(dbItem){
              callback(undefined, dbItem)
            })
          }
        }
      )
    },
    "fetchAll":  function fetchAll (callback) { callback('Not implemented yet'); },
    "deleteOne": function deleteOne (uuid, callback) { callback('Not implemented yet'); },
    "deleteAll": function deleteAll (callback) {
      nosql.clear(function(){
        if(callback) callback()
      })
    }
  }
 
};
