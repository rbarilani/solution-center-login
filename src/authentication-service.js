angular.module('sc-authentication', ['ngStorage', 'ngCookies', 'angular-jwt', 'solutioncenter.communicator'])
    .config(['$localStorageProvider',
      function ($localStorageProvider) {
        $localStorageProvider.setKeyPrefix('solutionCenter-');
      }])
    .provider('authenticationService', ['scEnvironmentsProvider', function (scEnvironmentsProvider) {
      'use strict';

      var internalCommunication = false;

      return {

        /**
         * Configures the environment for appropriate handling or redirections between the different apps within the Solution Center
         * @param name {string} Possible values: 'PRODUCTION', 'STAGE', 'INTEGRATION', 'DEVELOPMENT' (only for Norris team), 'LOCAL', 'TESTING'
         * @param port {number|string} Only used for development environments (LOCAL) if using a port different than the default one (3333)
         * @param tokenService {string} Only used for development environments (LOCAL) to allow mocking it in case it is necessary
         * @param domain {string} Only used for development environments (LOCAL) to allow overriding the domain
         * @returns Configured environment
         */
        configEnvironment: function (name, port, tokenService, domain) {
          var env = scEnvironmentsProvider.getSpecificEnvironment(name);

          // override port/token service if necessary
          env.PORT = port || env.PORT;
          env.TOKEN_SERVICE = tokenService || env.TOKEN_SERVICE;
          env.DOMAIN = domain || env.DOMAIN;

          return scEnvironmentsProvider.setCurrentEnvironment(env);
        },

        /**
         * Returns the configured environment of the app
         * @returns Configured environment
         */
        getEnvironment: function () {
          return scEnvironmentsProvider.getCurrentEnvironment();
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
        $get: authenticationFactory
      };
    }]);

authenticationFactory.$inject = ['$q', '$localStorage', '$cookies', 'environmentsService', '$window', '$injector', 'jwtHelper', '$location', '$timeout'];

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
    setBrand: setBrand,
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
   * Performs the authentication of the user
   * @param redirectUrl URL from the specific app where to redirect back after the authentication
   * @returns {*}
   */
  function authenticate(redirectUrl) {
    return handleTokenValidation(service.getToken(), redirectUrl);
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
              password: password,
              agent: getUserAgent()
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
              return handleTokenValidation(token);
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
   * Gets the token from the cookie
   * @returns {*|null}
   */
  function getToken() {
    return $cookies.get(TOKEN_COOKIE_KEY);
  }

  /**
   * Saves the token in the local storage and in the cookie
   * @param token
   */
  function setToken(token) {
    $cookies.put(TOKEN_COOKIE_KEY, token, getCookieConfig());
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
    return $cookies.get(BRAND_COOKIE_KEY);
  }

  /**
   * Saves the id of the current brand the user is accessing
   * @param brandId
   */
  function setBrand(brandId) {
    $cookies.put(BRAND_COOKIE_KEY, brandId, getCookieConfig());
  }

  /**
   * Removes all the credentials (token, user and brand)
   */
  function clearCredentials() {
    clearToken();
    clearUser();
    service.clearBrand();
  }

  /**
   * Removes the brand from the cookie
   */
  function clearBrand() {
    $cookies.remove(BRAND_COOKIE_KEY, getCookieConfig());
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
   * Performs the authentication of the user through the following steps:
   *  - Validation of the token (if already existent)
   *  - Storage of the credentials (if the token is valid/renewed)
   *  - Redirection to login page to prompt the user to login (non-existent or invalid token)
   * @param token
   * @param redirectUrl redirectUrl URL from the specific app where to redirect back after the authentication
   * @returns {*}
   */
  function handleTokenValidation(token, redirectUrl) {
    return validateToken(token)
      .then(
        function (response) {
          if (response.status === 200) {
            storeCredentials(response);
            return $q.when();
          }
        },
        function (response) {
          if (response.status === 409) {
            storeCredentials(response);
            return $q.when();
          }
          service.clearCredentials();
          if (redirectUrl) {
            redirectToLogin(redirectUrl);
          }
          return $q.reject();
        }
      );
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

    var payload = getTokenPayload(token);

    if (payload && payload.agent !== getUserAgent()) {
      return $q.reject("The current browser's user agent doesn't match the one stored in the token");
    }

    return $injector.get('$http')
        .get(environmentsService.getTokensAPI(self.getEnvironment()), token);
  }

  /**
   * Stores the credentials returned by the API
   * @param apiResponse
   */
  function storeCredentials(apiResponse) {
    var token = apiResponse.headers()['authorization'];
    service.setToken(token);
    setUser(apiResponse.data);
  }

  /**
   * Saves the user in local storage
   * @param user
   */
  function setUser(user) {
    $localStorage.user = user;
  }

  /**
   * Removes the token from local storage and the cookie
   */
  function clearToken() {
    $cookies.remove(TOKEN_COOKIE_KEY, getCookieConfig());
  }

  /**
   * Removes the token from local storage
   */
  function clearUser() {
    $localStorage.user = null;
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
   * Extracts the payload of the JWT token
   * @param token
   * @returns {*}
   */
  function getTokenPayload(token) {
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

  /**
   * Returns the user agent of the current browser used by user
   */
  function getUserAgent() {
    return $window.navigator.userAgent;
  }

  /**
   * Returns an object with our cookie settings, to be passed to calls to $cookies.put and $cookies.remove.
   * @returns {{domain: string, secure: boolean, expires: Date}}
   */
  function getCookieConfig() {
    var env = self.getEnvironment();
    var now = new Date();
    return {
      domain: env.DOMAIN,
      secure: env.NAME !== 'LOCAL',
      expires: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
    };
  }
}
