module.exports = function (swig) {
  var full_name = function (user) {
    var name = [];
    if (user.name && (user.name.first || user.name.last)) {
      if (user.name.first) {
        name.push(user.name.first);
      }
      if (user.name.last) {
        name.push(user.name.last);
      }
    } else {
      name.push(user.email);
    }
    return name.join(" ");
  }; 

  var login_or_user = function (user) {
    var u;
    if(u = user) {
      return "Logged in as "+full_name(u);
    } else {
      // return "<a href='/login'>Log In</a> or <a href='/register'>Sign Up</a>";
      return "Log in or Register";
    }
  };
  login_or_user.safe = true;
  swig.setFilter('login_or_user', login_or_user);

  var nickname = function (user) {
    if(user.nickname) {
      return user.nickname;
    } else if(user.name && user.name.first) {
      return user.name.first;
    } else {
      return "Anonymous User";
    }
  }; 

  // nickname.safe = true;
  swig.setFilter('nickname', nickname);

  var shorten = function (teamname) {
    return teamname.replace("State","St.");
  }; 

  // nickname.safe = true;
  swig.setFilter('shorten', shorten);
  
  var beautify_master_bracket = function (bracket_json) {
    str =  bracket_json.replace(/\]\],\[\[/g,"]],\n[[");
    return str.replace("            ", "");
  }; 

  // nickname.safe = true;
  swig.setFilter('beautify_master_bracket', beautify_master_bracket);

};
