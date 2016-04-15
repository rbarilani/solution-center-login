/*!
 * solution-center-login
 * https://github.com/zalando/solution-center-login
 * License: MIT
 */


angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
    .factory('authenticationService', [
      '$q',
      '$localStorage',
      '$cookies',
      'environments',
      '$window',
      '$injector',
      'jwtHelper',
      function ($q, $localStorage, $cookies, environments, $window, $injector, jwtHelper) {

        'use strict';

        var TOKEN_COOKIE_KEY = "SC_TOKEN";

        function authenticate(environment, redirectUrl) {
          isAuthenticated()
              .then(
                  function (token) {
                    // TODO login Only write if it's different than current value
                    $localStorage.sc_token = token;
                    $localStorage.sc_user = getUserFromToken(token);

                    return token;
                  },
                  function () {
                    redirectToLogin(environment, redirectUrl);
                  });
        }

        function redirectToLogin(environment, redirectUrl) {
          $window.location.href = environments.getLoginUrl(environment) + "?redirect=" + redirectUrl;
        }

        function logout(environment) {
          $localStorage.sc_token = null;
          $localStorage.sc_user = null;

          $window.location.href = environments.getLogoutUrl(environment);
        }

        function getToken() {
          return $localStorage.sc_token || $cookies.get(TOKEN_COOKIE_KEY);
        }

        function getUser() {
          return $localStorage.sc_user;
        }

        /*
         PRIVATE METHODS
         */

        /**
         * Returns a valid token in case the user is authenticated or null in case there's no user
         * @returns {*}
         */
        function isAuthenticated() {
          var token = getToken();
          return validateToken(token).then(
              function () {
                // TODO remove - should never happen?
                return $q.when(token);
              },
              function (response) {
                // TODO test this
                if (response.status === 304) {
                  return $q.when(token);
                }
                if (response.status === 409) {
                  var newToken = response.data;
                  return $q.when(newToken);
                }
                return $q.reject();
              });
        }

        function validateToken(token) {
          if (!token) {
            return $q.reject("null token");
          }

          return $injector.get('$http').get(environments.getTokensAPI(), token);
        }

        function getUserFromToken(token) {
          return jwtHelper.decodeToken(token);
        }

        return {
          authenticate: authenticate,
          redirectToLogin: redirectToLogin,
          getToken: getToken,
          logout: logout,
          getUser: getUser
        };
      }
    ]);

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

      this.$get = ['$q', 'authenticationService', '$window',
        function ($q, authenticationService, $window) {

          var service = {
            // Require that there is an authenticated user
            // (use this in a route resolve to prevent non-authenticated users from entering that route)
            requireAuthenticatedUser: function () {
              var user = authenticationService.getUser();
              if (user) {
                return $q.when(user);
              }
              else {
                authenticationService.authenticate(environment, $window.location.href);
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

angular.module('sc-authentication')
  .factory('environments', [
    function () {
      var environments = {
        PRODUCTION: {
          url: 'solutions.zalando.com',
          tokenservice: 'https://token-management.norris.zalan.do'
        },
        INTEGRATION: {
          url: 'usf-integration.norris.zalan.do',
          tokenservice: 'https://tm-integration.norris.zalan.do'
        },
        STAGING: {
          url: 'usf-stage.norris.zalan.do',
          tokenservice: 'https://tm-stage.norris.zalan.do'
        },
        DEVELOPMENT: {
          url: 'usf-dev.norris.zalan.do',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        },
        LOCAL: {
          url: 'localhost',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        }
      };

      function getUrl(environment) {
        return environments[environment].url;
      }

      function getLoginUrl(environment) {
        return getUrl(environment) + '/#/login';
      }

      function getLogourUrl(environment) {
        return getUrl(environment) + '/#/logout';
      }

      function getTokensAPI(environment) {
        return environments[environment].tokenservice + '/tokens';
      }

      return {
        getLoginUrl: getLoginUrl,
        getLogoutUrl: getLogourUrl,
        getTokensAPI: getTokensAPI
      };
    }
  ]);
