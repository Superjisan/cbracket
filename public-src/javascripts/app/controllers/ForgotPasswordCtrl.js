app.controller('ForgotPasswordCtrl', function($scope, $http){
  $scope.submit = function() {
    $http.post("/forgot-password", { email: $scope.email }).
      success(function(data, status, headers, config){
        $scope.responseText = data.msg;
      }).
      error(function(data, status, headers, config){
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  };
});