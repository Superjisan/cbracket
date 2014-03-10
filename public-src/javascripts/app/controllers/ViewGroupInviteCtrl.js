app.controller('ViewGroupInviteCtrl', function($scope, $http){
  $scope.token = bootstrapData.token;
  $scope.submit = function() {
    $http.post("/groups/invite/" + $scope.token).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = data.msg;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  };

  $scope.submitNew = function() {
    $http.post("/groups/invite/" + $scope.token, { user: $scope.user }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = data.msg;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  }
});