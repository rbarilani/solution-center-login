angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
    .provider('authenticationService', [function () {
      'use strict';

      var environment = {
        name: 'LOCAL',
        port: '3000'
      };

      return {
        configEnvironment: function (name, port) {
          environment.name = name;
          if (port) {
            environment.port = port;
          }
        },

        getEnvironment: function () {
          return environment;
        },

        $get: [
          '$q', '$localStorage', '$cookies', 'environments', '$window', '$injector', 'jwtHelper', '$location',
          authenticationFactory
        ]
      };
    }]);

function authenticationFactory($q, $localStorage, $cookies, environments, $window, $injector, jwtHelper, $location) {
  'use strict';

  var self = this;
  var TOKEN_COOKIE_KEY = "SC_TOKEN";

  var service = {
    requireAuthenticatedUser: requireAuthenticatedUser,
    authenticate: authenticate,
    redirectToLogin: redirectToLogin,
    getToken: getToken,
    logout: logout,
    getUser: getUser
  };

  return service;

  ///////////////////////////////////

  // Require that there is an authenticated user
  // (use this in a route resolve to prevent non-authenticated users from entering that route)
  function requireAuthenticatedUser() {
    return this.authenticate($window.location.href);
  }

  // Redirect to home page in case there is a user already authenticated
  // (use this in the login resolve to prevent users seeing the login dialog when they are already authenticated)
  /*
   function redirectToHomeIfAuthenticated() {
   return security.requestCurrentUser()
   .then(
   function () {
   security.showHomePage();
   return $q.reject();
   },
   function () {
   return $q.when();
   });
   }
   */

  function authenticate(redirectUrl) {
    var token = service.getToken();

    /* TODO
       Validate redirectUrl is in the same domain!!!
     */

    return validateToken(token)
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
              clearCredentials();
              service.redirectToLogin(redirectUrl);
              return $q.reject();
            }
        );
  }

  function redirectToLogin(redirectUrl) {
    var redirectionPath = environments.getLoginPath() + "?redirect=" + redirectUrl;

    redirect(redirectionPath);
  }

  function logout() {
    clearCredentials();

    var redirectPath = environments.getLogoutPath();
    redirect(redirectPath);
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

  function storeCredentials(token) {
    $localStorage.sc_token = token;
    $localStorage.sc_user = getUserFromToken(token);

    return $q.when(token);
  }

  function clearCredentials() {
    $localStorage.sc_token = null;
    $localStorage.sc_user = null;
  }

  function validateToken(token) {
    if (!token) {
      return $q.reject("There is no token");
    }

    return $injector.get('$http')
        .get(environments.getTokensAPI(self.getEnvironment()), token);
  }

  function getUserFromToken(token) {
    return jwtHelper.decodeToken(token);
  }

  /**
   * Redirects to another URL using different handlers depending whether both origin and target have the same
   * host or not because of problems with the usage of # in URLs together with redirection using $window
   * @param redirectionPath
   */
  function redirect(redirectionPath) {
    redirectionPath = redirectionPath || '/';
    var redirectionHost = environments.getDomain(self.getEnvironment());

    if ($window.location.host === redirectionHost) {
      $location.url(redirectionPath);
    }
    else {
      $window.location.href = redirectionHost + "/#" + redirectionPath;
    }
  }
}
