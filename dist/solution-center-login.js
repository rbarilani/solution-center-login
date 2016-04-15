/*!
 * solution-center-login
 * https://github.com/zalando/solution-center-login
 * License: MIT
 */


angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
  .factory('solutionCenterAuth', [
    '$q',
    '$localStorage',
    '$cookies',
    'environments',
    '$location',
    '$http',
    'jwtHelper',
    function ($q, $localStorage, $cookies, environments, $location, $http, jwtHelper) {

      'use strict';

      var TOKEN_COOKIE_KEY = "SC_TOKEN";

      function authenticate(environment, redirectUrl) {
        var token = isAuthenticated();

        if (!token) {
          redirectToLogin(environment, redirectUrl);
        }

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

        return $http.get(environments.getTokensAPI(), token);
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
