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
          isAuthenticated(environment)
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
          $window.location.href = environments.getLoginUrl(environment) + "?redirect=" + encodeURIComponent(redirectUrl);
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
        function isAuthenticated(environment) {
          var token = getToken();
          return validateToken(token, environment).then(
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
