var db = require('../db')({database:'./test.nosql'})
console.log('start db test')

var item1 = {
  uuid : '52c124e0-cbcd-11e2-b635-597c8217dfaf',
  name: 'item1'
}

var item2 = {    
  name: 'item2'
}

function test1(){
  db.save(item1, function(err, dbItem, created){
    if(!err || dbItem || created){
      throw 'FAILED'
    }
    test2()
  })    
}

function test2(){
  db.save(item2, function(err, dbItem, created){
    if( err || !dbItem.uuid || !created){
      throw 'FAILED'
    }
    test3(dbItem.uuid)
  })
}

function test3(uuid){
  db.fetchOne(uuid, function(err, dbItem){
    if(err || !dbItem){
      throw 'FAILED'
    }
    test4(dbItem)    
  }) 
}

function test4(dbItem){
  dbItem.name="itemNewName"
  db.save(dbItem, function(err, dbItem, created){
    if(err || !dbItem || created){
      throw 'FAILED'
    }
    if(dbItem.name != "itemNewName"){
      throw 'FAILED'
    }      
    clean()
  })
}

function clean(){
  db.deleteAll()
  console.log('db cleaned')      
}

try{
  
    test1()
  
}catch(ex){
  clean()
  throw ex
}

