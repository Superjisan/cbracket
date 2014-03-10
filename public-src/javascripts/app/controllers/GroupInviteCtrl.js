app.controller('GroupInviteCtrl', function($scope, $http){
  $scope.groups = bootstrapData.groups || [];
  $scope.group = $scope.groups[0];

  $scope.submit = function() {
    $http.post("/groups/invite", { group: $scope.group, email: $scope.email }).
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