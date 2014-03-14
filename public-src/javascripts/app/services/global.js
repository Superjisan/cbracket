'use strict';

//Global service for global variables
app.factory('Global', [
  function() {
        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: (!!window.user) && (!!window.user.stripe_id)
        };
            // authenticated: (!!window.user)

        return _this._data;
    }
]);
