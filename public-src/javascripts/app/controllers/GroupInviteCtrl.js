app.controller('GroupInviteCtrl', function($scope, $http){
  $scope.groups = bootstrapData.groups || [];
  $scope.group = $scope.groups[0];

  window.csPageOptions = {
    domain_key:'32EWR3P5QM6ZMUUPH7KR',
    textarea_id:"contact_list",
    afterSubmitContacts: getContacts
  };

  function getContacts(contacts, source, owner) {
    $scope.emails = _.map(contacts, function(contact){
        return contact.primaryEmail();
    });
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