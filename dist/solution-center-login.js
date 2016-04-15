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
    '$location',
    function ($q, $localStorage, $cookies, environments, $window, $injector, jwtHelper, $location) {

      'use strict';

      var TOKEN_COOKIE_KEY = "SC_TOKEN";

      function authenticate(environment, redirectUrl) {
        //var token = ;
        //if (!token) {
        //  redirectToLogin(environment, redirectUrl);
        //  return $q.reject();
        //}
        return validateToken(getToken(), environment).then(
          function () {
            $localStorage.sc_token = token;
            $localStorage.sc_user = getUserFromToken(token);

            return $q.when(token);
          },
          function (response) {
            if (response.status === 304) {
              $localStorage.sc_token = token;
              $localStorage.sc_user = getUserFromToken(token);
              return $q.when(token);
            }
            if (response.status === 409) {
              var newToken = response.data;
              $localStorage.sc_token = newToken;
              $localStorage.sc_user = getUserFromToken(newToken);
              return $q.when(newToken);
            }
            redirectToLogin(environment, redirectUrl);
            return $q.reject();
          });
      }


      function redirectToLogin(environment, redirectUrl) {
        var redirectionDomain = environments.getDomain(environment);
        var redirectionPath = environments.getLoginPath() + "?redirect=" + redirectUrl;

        if ($window.location.host === redirectionDomain) {
          $location.url(redirectionPath);
        }
        else {
          $window.location.href = redirectionDomain + "/#" + redirectionPath;
        }
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


      function validateToken(token, environment) {
        if (!token) {
          return $q.reject("null token");
        }

        return $injector.get('$http').get(environments.getTokensAPI(environment), token);
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
          url: 'localhost:{PORT}',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        }
      };

      function getDomain(environment) {
        var url = environments[environment.name].url;
        if (environment.name === 'LOCAL') {
          url = url.replace('{PORT}', environment.port);
        }
        return url;
      }

      function getLoginPath() {
        return '/login';
      }

      function getLogourPath() {
        return '/logout';
      }

      function getTokensAPI(environment) {
        return environments[environment].tokenservice + '/tokens';
      }

      return {
        getDomain: getDomain,
        getLoginPath: getLoginPath,
        getLogoutPath: getLogourPath,
        getTokensAPI: getTokensAPI
      };
    }
  ]);
