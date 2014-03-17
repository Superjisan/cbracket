app.controller('CreateGroupCtrl', function($scope, $http, invite){
  var brackets = bootstrapData.brackets || [];
  $scope.brackets = brackets;
  $scope.bracket = '';

  invite.init(setEmails);

  function reset() {
    $scope.emails = [];
    $scope.emailList = '';
    $scope.name = '';
    $scope.bracket = '';
    $scope.createGroupForm.$setPristine();
  }

  function setEmails(emails) {
    var oldList = $scope.emailList ? $scope.emailList.split(',') : [];
    var newList = _.isArray(emails) && emails.length ? oldList.concat(emails) : oldList;

    $scope.emails = newList;
    $scope.emailList = newList.join(', ');
    $scope.$digest();
  }

  $scope.submit = function() {
    $http.post("/groups", { name: $scope.name, bracket: $scope.bracket, emails: $scope.emails  }).
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