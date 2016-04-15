angular.module('sc-authentication')
    .provider('authorizationService', [function () {
      'use strict';

      var environment = 'STAGE';

      this.setEnvironment = function (env) {
        environment = env;
      };

      /*

      this.requireAuthenticatedUser = function (authenticationProvider) {
        return authenticationProvider.requireAuthenticatedUser();
      };

      this.redirectToHomeIfAuthenticated = function (authenticationProvider) {
        return authenticationProvider.redirectToHomeIfAuthenticated();
      };

      */

      this.$get = ['$q', 'authenticationService', '$location',
        function ($q, authenticationService, $location) {

          var service = {
            // Require that there is an authenticated user
            // (use this in a route resolve to prevent non-authenticated users from entering that route)
            requireAuthenticatedUser: function () {
              var user = authenticationService.getUser();
              if (user) {
                return $q.when(user);
              }
              else {
                authenticationService.authenticate(environment, $location.url());
                return $q.reject();
              }
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
