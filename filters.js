module.exports = function (swig) {
  var full_name = function (user) {
    var name = [];
    if (user.first || user.last) {
      if (user.first) {
        name.push(user.first);
      }
      if (user.last) {
        name.push(user.last);
      }
    } else {
      name.push(user.email);
    }
    return name.join(" ");
  };

  var login_or_user = function (user) {
    if(u = user) {
      return "Logged in as "+full_name(u);
    } else {
      // return "<a href='/login'>Log In</a> or <a href='/register'>Sign Up</a>";
      return "Log in or Register";
    }
  };
  login_or_user.safe = true;
  swig.setFilter('login_or_user', login_or_user);
};
