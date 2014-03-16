app.controller('CreateGroupCtrl', function($scope, $http, invite){
  var brackets = bootstrapData.brackets || [];
  $scope.brackets = brackets;
  $scope.bracket = '';

  invite.init(setEmails);

  function reset() {
    $scope.emails = null;
    $scope.email = null;
    $scope.name = '';
    $scope.bracket = '';
    $scope.createGroupForm.$setPristine();
  }

  function setEmails(emails) {
    $scope.emails = emails;
  }

  $scope.submit = function() {
    var emails = $scope.emails || [];

    if ($scope.email) {
      emails.push($scope.email);
    }

    $http.post("/groups", { name: $scope.name, bracket: $scope.bracket, emails: emails  }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = data.msg;
        reset();
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = data.msg || 'An error occured. Please try again';
      });
  };
});