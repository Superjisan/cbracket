app.controller('GroupInviteCtrl', function($scope, $http, invite){
  $scope.group = bootstrapData.group;

  invite.init(setEmails);

  function reset() {
    $scope.emails = null;
    $scope.email = null;
    $scope.name = '';
    $scope.bracket = '';
    $scope.groupInviteForm.$setPristine();
  }

  function setEmails(emails) {
    $scope.emails = emails;
  }

  $scope.submit = function() {
    var emails = $scope.emails || [];

    if ($scope.email) {
      emails.push($scope.email);
    }

    $http.post("/groups/invite", { group: $scope.group, emails: emails }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = data.msg;
        $scope.email = null;
        $scope.emails = null;
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  };
});