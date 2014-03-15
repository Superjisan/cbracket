app.controller('UsersCtrl', function($scope, $http, Global){
  $scope.global = Global;
  // $('#donateAmount').val($scope.otherValue)
  // $('#totalDonationAmt').html($scope.otherValue)
  $scope.donationAmount = 20;
  $scope.useOtherVal = false;
  
  $scope.showOther = function (obj,$event) {
    $scope.useOtherVal = true;
  };
  
  $scope.hideOther = function (obj,$event) {
    $('#other_amt').hide();
  };
  
});
