app.controller('ViewGroupInviteCtrl', function($scope, $http, $sce){
  $scope.token = bootstrapData.token;
  $scope.submit = function() {
    $http.post("/groups/invite/" + $scope.token).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = $sce.trustAsHtml(data.msg);
        $scope.accepted = true;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = $sce.trustAsHtml(data.msg) || 'An error occured. Please try again';
      });
  };

  $scope.submitNew = function() {
    $http.post("/groups/invite/" + $scope.token, { user: $scope.user }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = $sce.trustAsHtml(data.msg);
        $scope.accepted = true;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = $sce.trustAsHtml(data.msg) || 'An error occured. Please try again';
      });
  };
});