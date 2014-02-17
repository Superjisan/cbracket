module.exports = function (swig) {
  var full_name = function (user) {
    var name = [];
    if (user.first_name || user.last_name) {
      if (user.first_name) {
        name.push(user.first_name);
      }
      if (user.last_name) {
        name.push(user.last_name);
      }
    } else {
      name.push(user.email);
    }
    return name.join(" ");
  };

  var login_or_user = function (user) {
    if(user) {
      return "Logged in as "+full_name(user);
    } else {
      // return "<a href='/login'>Log In</a> or <a href='/register'>Sign Up</a>";
      return "Welcome! Log in or Register";
    }
  };
  login_or_user.safe = true;
  swig.setFilter('login_or_user', login_or_user);

};