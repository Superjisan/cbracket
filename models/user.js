var passportLocalMongoose = require('passport-local-mongoose');
var fn = require('../modules/functions.js');

module.exports = function(m) {
  var mongoose = m || require('mongoose');
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var userSchema = new Schema({

    name: {
      first: String,
      last: String
    },
    location: {
      city: String,
      state: String,
      zip: String
    },
    coder_level: Number,
    email: {
      type: String,
      index: {
        unique: true
      }
    },
    nickname: String,
    verified: Boolean,
    birthdate: Date,
    groups: [{
      ownerId: ObjectId,
      name: String,
      password: String,
      invites: [{
        email: String,
        accepted: Boolean
      }],
      members: [{
        id: ObjectId
      }]
    }],
    facebook : {},
    twitter: {},
    provider : String
  });

  userSchema.index({email: 1, 'groups.name': 1}, {unique: true});
  userSchema.index({email: 1, 'groups.invites.email': 1}, {unique: true});

  userSchema.plugin(passportLocalMongoose, {
    usernameField: "email",
    usernameLowerCase: true
  });

  userSchema.virtual('name.full').get(function () {
    var fullname = [], first, last;
    if (first = fn.dig(this.name,'first')) {
      fullname.push(first);
    }
    if (last = fn.dig(this.name,'last')) {
      fullname.push(last);
    }
    return fullname.join(" ");
  });

  userSchema.virtual('display_name').get(function () {
    var displayname = [], first, last, nick, email;
    if (first = fn.dig(this.name,'first')) {
      displayname.push(first);
    }
    if (last = fn.dig(this.name,'last')) {
      displayname.push(last);
    }
    if (!displayname.length) {
      if (nick = this.nickname) {
        displayname.push(nick);
      }
    }
    if (!displayname.length) {
      if (email = this.email) {
        displayname.push(email);
      }
    }
    return displayname.join(" ");
  });

  userSchema.virtual('hometown').get(function () {
    var place = [], city, state;
    if (city = fn.dig(this.location, 'city')) {
      place.push(city);
    }
    if (state = fn.dig(this.location,'state')) {
      place.push(state);
    }
    return place.join(", ");
  });

  userSchema.statics.verifyUser = function(token, done) {
    models.VerifyToken.findOne({token: token}, function (err, doc){
        if (err) return done(err);
        models.User.findOne({_id: doc._userId}, function (err, user) {
            if (err) return done(err);
            user.verified = true;
            user.save(function(err) {
                done(err, user);
            });
        });
    });
  };

  var User = mongoose.model('User', userSchema);
  return {model: User};
};
