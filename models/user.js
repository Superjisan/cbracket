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
    donated_amount: Number,
    birthdate: Date,
    groups: [{
      owner: {
        type: ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      bracket: {
        type: ObjectId,
        ref: 'Bracket'
      }
    }],
    facebook : {},
    twitter: {},
    provider : String,
    stripe_id: String
  });

  userSchema.index({email: 1, 'groups.name': 1}, {unique: true});
  userSchema.index({email: 1, 'groups.name': 1, 'groups.bracket': 1}, {unique: true});

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
    var displayName = this.email;

    if (this.nickname) {
      displayName = this.nickname;
    } else if(this.name && this.name.first && this.name.last) {
      displayName = this.name.first + " " + this.name.last;
    }
    return displayName;
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
