app.controller('CreateGroupCtrl', function($scope, $http){
  $scope.submit = function() {
    $http.post("/groups", { name: $scope.name }).
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