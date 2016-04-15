angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
  .factory('authenticationService', [
    '$q',
    '$localStorage',
    '$cookies',
    'environments',
    '$location',
    '$injector',
    'jwtHelper',
    function ($q, $localStorage, $cookies, environments, $location, $injector, jwtHelper) {

      'use strict';

      var TOKEN_COOKIE_KEY = "SC_TOKEN";

      function authenticate(environment, redirectUrl) {
        var token = isAuthenticated();

        if (!token) {
          redirectToLogin(environment, redirectUrl);
        }

        // TODO login Only write if it's different than current value

        $localStorage.sc_token = token;
        $localStorage.sc_user = getUserFromToken(token);

        return token;
      }

      function redirectToLogin(environment, redirectUrl) {
        $location.url(environments.getLoginUrl(environment) + "?redirect=" + redirectUrl);
      }

      function logout(environment) {
        $localStorage.sc_token = null;
        $localStorage.sc_user = null;

        $location.url(environments.getLogoutUrl(environment));
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
            return token;
          },
          function (response) {
            // TODO test this
            if (response.status === 304) {
              return token;
            }
            if (response.status === 409) {
              return response.data;
            }
            return null;
          });
      }

      function validateToken(token) {
        if (token === null) {
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
