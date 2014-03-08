(function(){

  var app = angular.module('codeYourBracket', []);

  app.
    directive('equals', function() {
      return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
          if(!ngModel) return; // do nothing if no ng-model

          // watch own value and re-validate on change
          scope.$watch(attrs.ngModel, function() {
            validate();
          });

          // observe the other value and re-validate on change
          attrs.$observe('equals', function (val) {
            validate();
          });

          var validate = function() {
            // values
            var val1 = ngModel.$viewValue;
            var val2 = attrs.equals;
            // set validity
            ngModel.$setValidity('equals', val1 === val2);
          };
        }
      }
    }).
    controller('ForgotPasswordCtrl', function($scope, $http){
      $scope.submit = function() {
        $http.post("/forgot-password", { email: $scope.email }).
          success(function(data, status, headers, config){
            $scope.responseText = data.msg;
          }).
          error(function(data, status, headers, config){
            $scope.responseText = data.msg || 'An error occured. Please try again';
          });
      }
    }).
    controller('ResetPasswordCtrl', function($scope, $http){
      $scope.submit = function(){
        $http.post("/reset-password", { token: bootstrapData.token, password: $scope.password }).
          success(function(data, status, headers, config){
            $scope.responseText = data.msg;
          }).
          error(function(data, status, headers, config){
            $scope.responseText = data.msg || 'An error occured. Please try again';
          });
      }
    });

})();