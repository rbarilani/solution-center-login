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
        var token = getToken();

        return validateToken(token, environment)
            .then(
              function () {
                return storeCredentials(token);
              },
              function (response) {
                if (response.status === 304) {
                  return storeCredentials(token);
                }
                else if (response.status === 409) {
                  var newToken = response.data;
                  return storeCredentials(newToken);
                }
                redirectToLogin(environment, redirectUrl);
                return $q.reject();
              }
            );
      }

      function storeCredentials(token) {
        $localStorage.sc_token = token;
        $localStorage.sc_user = getUserFromToken(token);

        return $q.when(token);
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

      function validateToken(token, environment) {
        if (!token) {
          return $q.reject("null token");
        }

        return $injector.get('$http')
            .get(environments.getTokensAPI(environment.name), token);
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
