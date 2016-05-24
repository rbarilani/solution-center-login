/*!
 * solution-center-login
 * https://github.com/zalando-incubator/solution-center-login
 * License: MIT
 */


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
         * @param name Possible values: 'PRODUCTION', 'INTEGRATION', 'STAGE', 'LOCAL'
         * @param port Only used for development environments (LOCAL) if using a port different than the default one (3333)
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
          '$q', '$localStorage', '$cookies', 'environmentsService', '$window', '$injector', 'jwtHelper', '$location', '$timeout',
          authenticationFactory
        ]
      };
    }]);

function authenticationFactory($q, $localStorage, $cookies, environmentsService, $window, $injector, jwtHelper, $location, $timeout) {
  'use strict';

  var self = this;

  var TOKEN_COOKIE_KEY = "SC_TOKEN";
  var BRAND_COOKIE_KEY = "SC_BRAND";

  var service = {
    requireAuthenticatedUser: requireAuthenticatedUser,
    redirectToHomeIfAuthenticated: redirectToHomeIfAuthenticated,
    authenticate: authenticate,
    login: login,
    silentLogin: silentLogin,
    logout: logout,
    silentLogout: silentLogout,
    getToken: getToken,
    setToken: setToken,
    isAuthenticated: isAuthenticated,
    getUser: getUser,
    getBrand: getBrand,
    changeBrand: changeBrand,
    clearCredentials: clearCredentials,
    clearBrand: clearBrand
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
              service.clearCredentials();
              redirectToLogin(redirectUrl);
              return $q.reject();
            }
        );
  }

  /**
   * Attempts to login an user by its email and password
   * If it is successful it sets the token returned by the backend into the storage
   * @param email
   * @param password
   * @returns {Function} A resolved promise with the token in case the user could be logged in or a rejected one in any other case
   */
  function login(email, password) {
    return $injector.get('$http')
        .post(
            environmentsService.getTokensAPI(self.getEnvironment()),
            {
              email: email,
              password: password
            })
        .then(
            function (response) {
              service.setToken(response.data);
              return $q.when(response.data);
            },
            function () {
              return $q.reject("Wrong credentials");
            });
  }

  /**
   * Performs a silent login without any redirection between apps and sets all the credentials (token, user and brand) in the storage
   * To be used ONLY in development environments by the service providers to speed up their development processes, NEVER in production
   * @param email
   * @param password
   */
  function silentLogin(email, password) {
    return service.login(email, password)
        .then(
            function (token) {
              storeCredentials(token);
              return $q.when();
            },
            function () {
              return $q.reject();
            }
        );
  }

  /**
   * Removes the user credentials from the storage and redirects to the login page of the Solution Center
   */
  function logout() {
    return invalidateToken(getToken())
        .catch(function () {
          // TODO Log error
        })
        .finally(function () {
          service.clearCredentials();
          redirect(environmentsService.getLoginPath());
          return $q.when();
        });
  }

  /**
   * Removes the user credentials from the storage and logs the user out without redirecting anywhere
   */
  function silentLogout() {
    return invalidateToken(getToken())
        .catch(function () {
          // TODO Log error
        })
        .finally(function () {
          service.clearCredentials();
          return $q.when();
        });
  }

  /**
   * Gets the token (if any) from local storage or the cookie (prioritizing the former)
   * @returns {*|null}
   */
  function getToken() {
    return $localStorage.token || $cookies.get(TOKEN_COOKIE_KEY);
  }

  /**
   * Saves the token in the local storage and in the cookie
   * @param token
   */
  function setToken(token) {
    $localStorage.token = token;
    $cookies.put(TOKEN_COOKIE_KEY, token, {'domain': environmentsService.getDomain(self.getEnvironment())});
  }

  /**
   * Checks if a user is already authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return !!service.getUser();
  }

  /**
   * Gets the user (if any) from local storage
   * @returns {*|null}
   */
  function getUser() {
    return $localStorage.user;
  }

  /**
   * Gets the user (if any) from the cooker or from local storage (prioritizing the former)
   * @returns {*|null}
   */
  function getBrand() {
    return $cookies.get(BRAND_COOKIE_KEY) || $localStorage.brand;
  }

  /**
   * Updates the id of current brand the user is accessing to
   * @param brandId
   */
  function changeBrand(brandId) {
    setBrand(brandId);
  }

  /**
   * Removes the credentials (token, user and brand) from local storage
   */
  function clearCredentials() {
    clearToken();
    clearUser();
    service.clearBrand();
  }

  /**
   * Removes the brand from the storage
   */
  function clearBrand() {
    $localStorage.brand = null;
    $cookies.remove(BRAND_COOKIE_KEY);
  }

  /*
   PRIVATE METHODS
   */

  /**
   * Redirects to the login page of the Solution Center specifying a parameter pointing to the URL where the user should
   * be redirected after authenticating
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
   * Saves the credentials (token, user and brand) in local storage
   * @param token
   * @returns {*|Promise}
   */
  function storeCredentials(token) {
    service.setToken(token);
    setUser(getUserFromToken(token));

    return $q.when(token);
  }

  /**
   * Saves the user in local storage
   * @param user
   */
  function setUser(user) {
    $localStorage.user = user;
  }

  /**
   * Saves the id of the current brand the user is accessing to
   * @param brandId
   */
  function setBrand(brandId) {
    $localStorage.brand = brandId;
    $cookies.put(BRAND_COOKIE_KEY, brandId, {'domain': environmentsService.getDomain(self.getEnvironment())});
  }

  /**
   * Removes the token from local storage and the cookie
   */
  function clearToken() {
    $localStorage.token = null;
    $cookies.remove(TOKEN_COOKIE_KEY);
  }

  /**
   * Removes the token from local storage
   */
  function clearUser() {
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
   * Performs an API call to invalidate a token
   * @param token
   * @returns {HttpPromise} A promise with the response from the API
   */
  function invalidateToken(token) {
    return $injector.get('$http')
        .delete(environmentsService.getTokensAPI(self.getEnvironment()), {headers: {'Authorization': token}});
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

    return !!redirectionUrl && redirectionUrl.indexOf(domain) !== -1;
  }

  /**
   * Redirects to another URL using different handlers because of problems with the usage of # in URLs together
   * with redirection using $window:
   * - uses $location when the app performing the actual authentication through the User Service (typically the Solution
   * center app but could be any other in localhost) is hosted in the same subdomain as the Authentication app
   * - uses $window in the rest of cases
   * @param redirectionPath Path to redirect to. It falls back to home page if undefined
   */
  function redirect(redirectionPath) {
    redirectionPath = redirectionPath || '/';

    if (self.isInternalCommunication()) {
      $timeout(function () {
        $location.url(redirectionPath);
      });
    }
    else {
      $window.location.href = environmentsService.getSolutionCenterUrl(self.getEnvironment()) + "/#" + redirectionPath;
    }
  }
}

angular.module('sc-authentication')
    .constant('ENVIRONMENTS', {
      PRODUCTION: {
        url: 'https://www.solutions.zalando.com',
        tokenservice: 'https://token-management.norris.zalan.do',
        userservice: 'https://user-management.norris.zalan.do',
        domain: 'solutions.zalando.com'
      },
      STAGE: {
        url: 'https://sc-stage.norris.zalan.do',
        tokenservice: 'https://tm-stage.norris.zalan.do',
        userservice: 'https://um-stage.norris.zalan.do',
        domain: '.zalan.do'
      },
      INTEGRATION: {
        url: 'https://sc-integration.norris.zalan.do',
        tokenservice: 'https://tm-integration.norris.zalan.do',
        userservice: 'https://um-integration.norris.zalan.do',
        domain: '.zalan.do'
      },
      DEVELOPMENT: {
        url: 'https://sc-development.norris.zalan.do',
        tokenservice: 'https://tm-development.norris.zalan.do',
        userservice: 'https://um-development.norris.zalan.do',
        domain: '.zalan.do'
      },
      LOCAL: {
        url: 'http://localhost:{PORT}',
        port: 3333,
        tokenservice: 'https://tm-development.norris.zalan.do',
        userservice: 'https://um-development.norris.zalan.do',
        domain: 'localhost'
      }
    });

angular.module('sc-authentication')
  .factory('environmentsService', ['ENVIRONMENTS',
    function (ENVIRONMENTS) {
      function getSolutionCenterUrl(environment) {
        var url = ENVIRONMENTS[environment.name].url;
        if (environment.name === 'LOCAL') {
          url = url.replace('{PORT}', environment.port);
        }
        return url;
      }

      function getLoginPath() {
        return '/login';
      }

      function getLogoutPath() {
        return '/logout';
      }

      function getTokensAPI(environment) {
        if (environment.name === 'LOCAL') {
          return environment.tokenService + '/tokens';
        }
        return ENVIRONMENTS[environment.name].tokenservice + '/tokens';
      }

      function getDomain(environment) {
        return ENVIRONMENTS[environment.name].domain;
      }

      return {
        getSolutionCenterUrl: getSolutionCenterUrl,
        getLoginPath: getLoginPath,
        getLogoutPath: getLogoutPath,
        getTokensAPI: getTokensAPI,
        getDomain: getDomain
      };
    }
  ]);
