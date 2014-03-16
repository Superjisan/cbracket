//Global service for global variables
app.factory('Global', [
  function() {
    'use strict';

        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: false
        };
            // authenticated: (!!window.user) && (!!window.user.stripe_id)

        return _this._data;
    }
]);
