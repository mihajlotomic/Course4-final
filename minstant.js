Chats = new Mongo.Collection("chats");

if (Meteor.isClient) {
  
  Meteor.subscribe("chats");
  Meteor.subscribe("users");
  Meteor.subscribe('emojis');
  
  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    console.log("rendering root /");
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {
    // the user they want to chat to has id equal to 
    // the id sent in after /chat/... 
    var otherUserId = this.params._id;
    // find a chat that has two users that match current user id
    // and the requested user id
    var filter = {$or:[
                {user1Id:Meteor.userId(), user2Id:otherUserId},                 
                {user1Id:otherUserId, user2Id:Meteor.userId()}
                ]};
    var chat = Chats.findOne(filter);
    if (!chat){// no chat matching the filter - need to insert a new one
      chatId = Chats.insert({user1Id:Meteor.userId(), user2Id:otherUserId});
    }
    else {// there is a chat going already - use that. 
      chatId = chat._id;
    }
    if (chatId){// looking good, save the id to the session
      Session.set("chatId",chatId);
      console.log("other user = " + otherUserId);
      Session.set("txUser",otherUserId);
    }
    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});  
  });

  ///
  // helper functions 
  /// 
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  })
 Template.available_user.helpers({
    getUsername:function(userId){
      user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    }, 
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  })


  Template.chat_page.helpers({
    messages:function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      return chat.messages;
    },   
    isReady:function(){
      var chat = Chats.findOne({_id:Session.get("chatId")});
      if (chat) { return true; } 
      else { return false; }

      },
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    },
    getUsername:function(userId){
      var remoteUser = Meteor.users.findOne({_id:Session.get("txUser")});  
      return remoteUser.profile.username;
    }
  })
 Template.chat_page.events({
  // this event fires when the user sends a message on the chat page
  'submit .js-send-chat':function(event){
    // stop the form from triggering a page reload
    event.preventDefault();
    // see if we can find a chat object in the database
    // to which we'll add the message
    var chat = Chats.findOne({_id:Session.get("chatId")});
    if (chat){// ok - we have a chat to use
      var msgs = chat.messages; // pull the messages property
      if (!msgs){// no messages yet, create a new array
        msgs = [];
      }   
      // is a good idea to insert data straight from the form
      // (i.e. the user) into the database?? certainly not. 
      // push adds the message to the end of the array
      var localUser  = Meteor.users.findOne({_id:Meteor.userId()});
      var remoteUser = Meteor.users.findOne({_id:Session.get("txUser")});  
      
      console.log("local user = " +localUser);
      
      var element = {
        avatar:localUser.profile.avatar,
        username:localUser.profile.username,
        text: event.target.chat.value
      }
      msgs.push(element);


      console.log("chat passed to method = " + Session.get("chatId") );
      // reset the form
      event.target.chat.value = "";
      // put the messages array onto the chat object
            
      chat.messages = msgs;
      // update the chat object in the database.
      
      Meteor.call("updateChat", chat);
      //Chats.update(chat._id, chat);
      //console.log(remoteUser);      

    }
  }
 })
}


// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (Meteor.isServer) {

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
  
  //Methods implement write security 
  //by constraining the allowing writes
  //to the database.
  Meteor.methods( {
    updateChat: function(doc){
      //User must be logged in to make changes
      if (Meteor.userId() ) {        
        Chats.update(doc._id, doc)
        console.log("in method!");
      }
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
}
