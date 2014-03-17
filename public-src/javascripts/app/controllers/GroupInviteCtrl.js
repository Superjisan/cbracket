app.controller('GroupInviteCtrl', function($scope, $http, invite){
  $scope.group = bootstrapData.group;

  invite.init(setEmails);

  function reset() {
    $scope.emails = [];
    $scope.emailList = '';
    $scope.groupInviteForm.$setPristine();
  }

  function setEmails(emails) {
    combineLists(emails);
    $scope.$digest();
  }

  function combineLists(emails) {
    var oldList = $scope.emailList ? $scope.emailList.split(',') : [];
    var newList = _.isArray(emails) && emails.length ? oldList.concat(emails) : oldList;

    $scope.emails = newList;
    $scope.emailList = newList.join(', ');
  }

  $scope.submit = function() {
    combineLists();

    $http.post("/groups/invite", { group: $scope.group, emails: $scope.emails }).
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