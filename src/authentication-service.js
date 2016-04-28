angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt'])
  .config(['$localStorageProvider',
    function ($localStorageProvider) {
      $localStorageProvider.setKeyPrefix('solutionCenter-');
    }])
  .provider('authenticationService', ['ENVIRONMENTS', function (ENVIRONMENTS) {
    'use strict';

    var environment;
    var defaultEnvironmentName = 'LOCAL';

    var internalCommunication = false;

    /**
     * Helper method to verify whether the selected environment during the configuration phase is valid
     * @param name
     * @returns {boolean}
     */
    var isValidEnvironment = function (name) {
      return !!ENVIRONMENTS[name];
    };

    return {
      /**
       * Configures the environment for appropriate handling or redirections between the different apps within the Solution Center
       * @param name Possible values: 'PRODUCTION', 'INTEGRATION', 'STAGING', 'LOCAL'
       * @param port Only used for development environments (LOCAL) if using a port different than the default one (3000)
       * @param tokenService Only used for development environments (LOCAL) to allow mocking it in case it is necessary
       */
      configEnvironment: function (name, port, tokenService) {
        environment = {};
        environment.name = isValidEnvironment(name) ? name : defaultEnvironmentName;

        if (environment.name === defaultEnvironmentName) {
          environment.port = port || ENVIRONMENTS[defaultEnvironmentName].port;
          environment.tokenService = tokenService || ENVIRONMENTS[defaultEnvironmentName].tokenservice;
        }
      },

      /**
       * Returns the configured environment of the app
       * If it was not configured before it sets it to the default environment values (LOCAL)
       * @returns {{name: string, port: string, tokenService: string}}
       */
      getEnvironment: function () {
        if (!environment) {
          environment = {
            name: defaultEnvironmentName,
            port: ENVIRONMENTS[defaultEnvironmentName].port,
            tokenService: ENVIRONMENTS[defaultEnvironmentName].tokenservice
          };
        }
        return environment;
      },

      /**
       * Specifies that the Authentication app is hosted in the same domain as the Solution Center app for proper
       * redirection handling
       * To be used ONLY by the Central Services team and in localhost environments
       * @param isInternalCommunication
       */
      setInternalCommunication: function (isInternalCommunication) {
        internalCommunication = isInternalCommunication;
      },

      /**
       * Returns true if the Authentication app and the Solution Center app are hosted in the same domain or
       * false in case they are hosted in different ones (normal case)
       * @returns {boolean}
       */
      isInternalCommunication: function () {
        return internalCommunication;
      },

      /**
       * Factory implementation
       */
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

  /**
   * Requires the existence of an authenticated user
   * To be used in a route's resolve method to prevent non-authenticated users from accessing it
   * @returns {*} A promise since it's the value expected by the resolve method
   */
  function requireAuthenticatedUser() {
    return service.authenticate(encodeURIComponent($window.location.href));
  }

  /**
   * Redirects to home page in case there is a user already authenticated
   * To be used in the login route's resolve method to prevent users seeing the login dialog when they are already
   * authenticated
   * @returns {*} A promise since it's the value expected by the resolve method
   */
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
    return $localStorage.token || $cookies.get(TOKEN_COOKIE_KEY);
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
    return $localStorage.user;
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
    $localStorage.token = token;
    $localStorage.user = getUserFromToken(token);

    return $q.when(token);
  }

  /**
   * Removes the credentials (token and user) from local storage
   */
  function clearCredentials() {
    $localStorage.token = null;
    $localStorage.user = null;
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
   * Redirects to another URL using different handlers depending whether it is the Solution Center itself ($location) or
   * a service provider ($window) which is trying to login because of problems with the usage of # in URLs together
   * with redirection using $window
   * @param redirectionPath Path to redirect to. It falls back to home page if undefined
   */
  function redirect(redirectionPath) {
    redirectionPath = redirectionPath || '/';

    if (self.isInternalCommunication()) {
      $location.url(redirectionPath);
    }
    else {
      $window.location.href = environmentsService.getSolutionCenterUrl(self.getEnvironment()) + "/#" + redirectionPath;
    }
  }
}
