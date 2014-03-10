app.controller('MyAccountCtrl', function($scope, $http, $sce){
  $scope.user = bootstrapData.user;
  $scope.errorFlash = $sce.trustAsHtml(bootstrapData.errorFlash);
  console.log(bootstrapData);
  $scope.submit = function(){
    $http.post("/account", { user: $scope.user, password: $scope.password }).
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