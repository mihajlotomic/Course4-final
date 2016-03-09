  Meteor.publish("chats", function(){
    if (this.userId ) {
      return Chats.find({$or:[
          {user1Id: this.userId},
          {user2Id: this.userId}      
          ]    
      });
    }        
    console.log("publish = " + this.userId);
    return false;
  }); 
  Meteor.publish("users", function(){
    var cursor = Meteor.users.find({});
    console.log(cursor.count());
    return cursor;
  });  
  
  Meteor.publish('emojis', function() {
  // Here you can choose to publish a subset of all emojis
  // if you'd like to.
  return Emojis.find();
});
////////////////////////
///// METHODS
////////////////////////
  //Methods implement write security 
  //by constraining the allowing writes
  //to the database.
Meteor.methods( {
  insertChat: function(otherId){
      //User must be logged in to make changes
     console.log("insert method running!");
      if (this.userId ) {        
        chatId = Chats.insert({user1Id:this.userId,        user2Id:otherId});        
      }
      return;
  },
  updateChat: function(doc){
      //User must be logged in to make changes
     console.log("updateChat method running!");
      if (this.userId ) {        
        Chats.update(doc._id, doc)
        console.log("in method!");
      }
      return;
  },
  addComment: function(comment){
    console.log("addComment method running!");
    if (this.userId){// we have a user      
      comment.userId = this.userId;
      return Comments.insert(comment);
    }
    return;
  }
})
  

  Chats.deny({
    update: function (userId, doc, fields, modifier) {
    // can't change owners
    return _.contains(fields, 'owner');
    },
    remove: function (userId, doc) {
      // can't remove locked documents
    return doc;
    }
  });
  
  
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
      for (var i=1;i<9;i++){
        var email = "user"+i+"@test.com";
        var username = "user"+i;
        var avatar = "ava"+i+".png"
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
      }
    } 
  });