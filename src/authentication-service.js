angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
    .provider('authenticationService', [function () {
      'use strict';

      var environment = {
        name: 'LOCAL',
        port: '3000'
      };

      return {
        /**
         * Configures the environment for appropriate handling or redirections between the different apps within the Solution Center
         * @param name Possible values: 'PRODUCTION', 'INTEGRATION', 'STAGING', 'DEVELOPMENT', 'LOCAL'
         * @param port Only important for localhost if using a port diffent than the default one (3000)
         */
        configEnvironment: function (name, port) {
          environment.name = name;
          if (port) {
            environment.port = port;
          }
        },

        /**
         * Returns the configured environment of the app
         * @returns {{name: string, port: string}}
         */
        getEnvironment: function () {
          return environment;
        },

        $get: [
          '$q', '$localStorage', '$cookies', 'environmentsService', '$window', '$injector', 'jwtHelper', '$location',
          authenticationFactory
        ]
      };
    }]);

function authenticationFactory($q, $localStorage, $cookies, environmentsService, $window, $injector, jwtHelper, $location) {
  'use strict';

  var self = this;
  var TOKEN_COOKIE_KEY = "SC_TOKEN";

  var service = {
    requireAuthenticatedUser: requireAuthenticatedUser,
    redirectToHomeIfAuthenticated: redirectToHomeIfAuthenticated,
    authenticate: authenticate,
    redirectToLogin: redirectToLogin,
    getToken: getToken,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getUser: getUser
  };

  return service;

  ///////////////////////////////////

  // Require that there is an authenticated user
  // (use this in a route resolve to prevent non-authenticated users from entering that route)
  function requireAuthenticatedUser() {
    return service.authenticate($window.location.href);
  }

  // Redirect to home page in case there is a user already authenticated
  // (use this in the login resolve to prevent users seeing the login dialog when they are already authenticated)
  function redirectToHomeIfAuthenticated() {
    if (service.isAuthenticated()) {
      redirect();
      return $q.reject();
    }
    else {
      return $q.when();
    }
  }

  /**
   * Performs the authentication of the user through the following steps:
   *  - Validation of the token (if already existent)
   *  - Storage of the credentials (if the token is valid/renewed)
   *  - Redirection to login page to prompt the user to login (non-existent or invalid token)
   * @param redirectUrl URL from the specific app where to redirect back after the authentication
   * @returns {*}
   */
  function authenticate(redirectUrl) {
    var token = service.getToken();

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

  /**
   * Redirects to the login page of the Solution Center
   * @param redirectUrl URL from the specific app where to redirect back after the authentication
   */
  function redirectToLogin(redirectUrl) {
    var redirectionPath = environmentsService.getLoginPath();

    if (isValidRedirectionUrl(redirectUrl)) {
      redirectionPath += "?redirect=" + redirectUrl;
    }

    redirect(redirectionPath);
  }

  /**
   * Removes the user credentials from the storage and redirects to the logout page of the Solution Center
   */
  function logout() {
    clearCredentials();

    var redirectPath = environmentsService.getLogoutPath();
    redirect(redirectPath);
  }

  /**
   * Gets the token (if any) from local storage or the cookie (prioritizing the former)
   * @returns {*|null}
   */
  function getToken() {
    return $localStorage.sc_token || $cookies.get(TOKEN_COOKIE_KEY);
  }

  /**
   * Checks if a user is already authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return service.getUser() !== null;
  }

  /**
   * Gets the user (if any) from local storage
   * @returns {*|null}
   */
  function getUser() {
    return $localStorage.sc_user;
  }

  /*
   PRIVATE METHODS
   */

  /**
   * Saves the credentials (token and user) in local storage
   * @param token
   * @returns {*|Promise}
   */
  function storeCredentials(token) {
    $localStorage.sc_token = token;
    $localStorage.sc_user = getUserFromToken(token);

    return $q.when(token);
  }

  /**
   * Removes the credentials (token and user) from local storage
   */
  function clearCredentials() {
    $localStorage.sc_token = null;
    $localStorage.sc_user = null;
  }

  /**
   * Performs an API call to verify whether a token is valid or not
   * @param token
   * @returns {*} A promise with the response from the API or directly rejected if there is no token to validate
   */
  function validateToken(token) {
    if (!token) {
      return $q.reject("There is no token");
    }

    return $injector.get('$http')
        .get(environmentsService.getTokensAPI(self.getEnvironment()), token);
  }

  /**
   * Extracts the user information from the body part of the JWT token
   * @param token
   * @returns {*}
   */
  function getUserFromToken(token) {
    return jwtHelper.decodeToken(token);
  }

  /**
   * Checks whether a URL is valid to be redirected to within the Solution Center, i.e. it's in the same domain
   * @param redirectionUrl
   * @returns {boolean}
   */
  function isValidRedirectionUrl(redirectionUrl) {
    var domain = environmentsService.getDomain(self.getEnvironment());

    return redirectionUrl.indexOf(domain) !== -1;
  }

  /**
   * Redirects to another URL using different handlers depending whether both origin and target have the same
   * host or not because of problems with the usage of # in URLs together with redirection using $window
   * @param redirectionPath path to redirect to. It falls back to home page if undefined
   */
  function redirect(redirectionPath) {
    redirectionPath = redirectionPath || '/';
    var redirectionHost = environmentsService.getSolutionCenterUrl(self.getEnvironment());

    if ($window.location.host === redirectionHost) {
      $location.url(redirectionPath);
    }
    else {
      $window.location.href = redirectionHost + "/#" + redirectionPath;
    }
  }
}
