app.controller('CreateGroupCtrl', function($scope, $http, invite, $sce){
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

    $http.post("/groups", { name: $scope.name, bracket: $scope.bracket, emails: $scope.emails  }).
      success(function(data, status, headers, config){
        $scope.status = true;
        $scope.responseText = $sce.trustAsHtml(data.msg);
        reset();
      }).
      error(function(data, status, headers, config){
        $scope.status = false;
        $scope.responseText = $sce.trustAsHtml(data.msg) || 'An error occured. Please try again';
      });
  };
});