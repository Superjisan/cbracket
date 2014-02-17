module.exports = {
  // if key is found in obj, return it
  // else return undefined, or def if specified
  dig: function (obj,key,def) {
    var thedef = def;
    if (typeof def == "undefined") {
      thedef = undefined;
    }
    
    if (typeof obj[key] !== "undefined") {
      return obj[key];
    } else {
      return thedef;
    }
  }
};

