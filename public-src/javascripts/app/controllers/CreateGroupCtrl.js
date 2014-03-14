app.controller('CreateGroupCtrl', function($scope, $http){
  var brackets = bootstrapData.brackets || [];
  $scope.brackets = brackets;
  $scope.bracket = $scope.brackets[0];
  $scope.submit = function() {
    $http.post("/groups", { name: $scope.name, bracket: $scope.bracket }).
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