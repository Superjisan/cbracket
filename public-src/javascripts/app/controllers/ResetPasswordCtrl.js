app.controller('ResetPasswordCtrl', function($scope, $http){
  $scope.submit = function(){
    $http.post("/reset-password", { token: bootstrapData.token, password: $scope.password }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = data.msg;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  };
});