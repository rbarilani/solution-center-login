angular.module('sc-authentication')
    .provider('authorizationService', [function () {
      'use strict';

      var environment = {
        name: 'LOCAL',
        port: '3000'
      };

      this.configEnvironment = function (name, port) {
        environment.name = name;
        if (port) {
          environment.port = port;
        }
      };

      /*

      this.requireAuthenticatedUser = function (authenticationProvider) {
        return authenticationProvider.requireAuthenticatedUser();
      };

      this.redirectToHomeIfAuthenticated = function (authenticationProvider) {
        return authenticationProvider.redirectToHomeIfAuthenticated();
      };

      */

      this.$get = ['$q', 'authenticationService', '$window',
        function ($q, authenticationService, $window) {

          var service = {
            // Require that there is an authenticated user
            // (use this in a route resolve to prevent non-authenticated users from entering that route)
            requireAuthenticatedUser: function () {
              return authenticationService.authenticate(environment, $window.location.href);
            } /*,

            // Redirect to home page in case there is a user already authenticated
            // (use this in the login resolve to prevent users seeing the login dialog when they are already authenticated)
            redirectToHomeIfAuthenticated: function () {
              return security.requestCurrentUser()
                  .then(
                      function () {
                        security.showHomePage();
                        return $q.reject();
                      },
                      function () {
                        return $q.when();
                      });
            }*/
          };

          return service;
        }];
    }]);
