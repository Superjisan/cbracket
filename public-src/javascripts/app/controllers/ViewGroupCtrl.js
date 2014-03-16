app.controller('ViewGroupCtrl', function($scope, $http, Global){
  $scope.group = bootstrapData.group;
  $scope.brackets = bootstrapData.brackets || [];

  if ($scope.group && $scope.group.bracket) {
    $scope.bracket = _.where($scope.brackets, {_id: $scope.group.bracket._id})[0] || "";
  } else {
    $scope.bracket = "";
  }


  $scope.submit = function() {
    $http.put("/groups", { group: $scope.group, bracket: $scope.bracket}).
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