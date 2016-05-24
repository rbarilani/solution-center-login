describe('authenticationService', function () {
  'use strict';

  var $rootScope, authenticationService, $q, $localStorage, $cookies, environmentsService, $location,
      $httpBackend, jwtHelper, $window, $timeout;

  var mockedToken = 'JWT_TOKEN';
  var mockedUserAgent = 'browser';
  var mockedUser = {id: 1, firstName: 'Chuck', lastName: 'Norris'};
  var mockedTokenPayload = {user: mockedUser, userAgent: mockedUserAgent};
  var mockedDomain = 'domain';
  var mockedRedirectionUrl = 'app.domain';
  var mockedOriginUrl = 'ORIGIN';
  var mockedTokensAPIEndpoint = 'TOKENS_API';
  var mockedLoginPath = '/LOGIN';
  var mockedBrandId = 1;
  var anyString = 'ANY_STRING';
  var mockedFunction = function () {
  };
  var mockedLocalstorage = {};
  var mockedCookieService = jasmine.createSpyObj('mockedCookieService', ['get', 'put', 'remove']);
  var BRAND_COOKIE_KEY = 'SC_BRAND';
  var TOKEN_COOKIE_KEY = 'SC_TOKEN';
  var resolved = false;
  var success = function () {
    resolved = true;
  };
  var failure = function () {
    resolved = false;
  };

  beforeEach(function () {
    module('sc-authentication', 'angular-jwt', 'ngStorage', 'ngCookies');
  });

  /**
   * GENERAL BEHAVIOUR WHEN COMMUNICATING WITH ANY APP DIFFERENT THAN THE SOLUTION CENTER
   * (because of different routing handling, using $window.location.href in this case)
   */

  describe('general behaviour', function () {
    beforeEach(function () {
      module('sc-authentication', function ($provide, authenticationServiceProvider) {
        $provide.value('$window', {location: {href: mockedOriginUrl}, navigator: {userAgent: mockedUserAgent}});
        $provide.value('$localStorage', mockedLocalstorage);
        $provide.value('$cookies', mockedCookieService);
        authenticationServiceProvider.setInternalCommunication(false);
        authenticationServiceProvider.configEnvironment('LOCAL', 3333);
      });

      inject(
          function (_$rootScope_, _authenticationService_, _$q_, _$localStorage_, _$cookies_, _environmentsService_,
                    _$httpBackend_, _jwtHelper_, _$window_) {
            $rootScope = _$rootScope_;
            authenticationService = _authenticationService_;
            $q = _$q_;
            $localStorage = _$localStorage_;
            $cookies = _$cookies_;
            environmentsService = _environmentsService_;
            $httpBackend = _$httpBackend_;
            jwtHelper = _jwtHelper_;
            $window = _$window_;

            spyOn(environmentsService, 'getDomain').and.returnValue(mockedDomain);
            spyOn(environmentsService, 'getTokensAPI').and.returnValue(mockedTokensAPIEndpoint);
            spyOn(jwtHelper, 'decodeToken').and.returnValue(mockedTokenPayload);
            spyOn(authenticationService, 'setToken').and.callThrough();
          });
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('initial state', function () {
      it('has known state', function () {
        expect(authenticationService.requireAuthenticatedUser).toBeDefined();
        expect(authenticationService.redirectToHomeIfAuthenticated).toBeDefined();
        expect(authenticationService.authenticate).toBeDefined();
        expect(authenticationService.login).toBeDefined();
        expect(authenticationService.silentLogin).toBeDefined();
        expect(authenticationService.logout).toBeDefined();
        expect(authenticationService.silentLogout).toBeDefined();
        expect(authenticationService.getToken).toBeDefined();
        expect(authenticationService.setToken).toBeDefined();
        expect(authenticationService.isAuthenticated).toBeDefined();
        expect(authenticationService.getUser).toBeDefined();
        expect(authenticationService.getBrand).toBeDefined();
        expect(authenticationService.setBrand).toBeDefined();
        expect(authenticationService.clearCredentials).toBeDefined();
        expect(authenticationService.clearBrand).toBeDefined();
      });
    });

    /**
     * requireAuthenticatedUser
     */

    describe('requireAuthenticatedUser', function () {
      it('tries to authenticate the user', function () {
        spyOn(authenticationService, 'authenticate').and.callFake(mockedFunction);

        authenticationService.requireAuthenticatedUser();

        expect(authenticationService.authenticate).toHaveBeenCalled();
      });
    });

    /**
     * redirectToHomeIfAuthenticated
     */

    describe('redirectToHomeIfAuthenticated', function () {
      it('redirects to home page if the user is authenticated', function () {
        var rejected = false;

        spyOn(authenticationService, 'isAuthenticated').and.returnValue(true);
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue($window.location.host);

        authenticationService.redirectToHomeIfAuthenticated()
            .catch(function () {
              rejected = true;
            });
        $rootScope.$digest();

        expect($window.location.href).not.toEqual(mockedOriginUrl);
        expect(rejected).toBeTruthy();
      });

      it('allows to land in the login page if the user is not authenticated', function () {
        var resolved = false;

        spyOn(authenticationService, 'isAuthenticated').and.returnValue(false);

        authenticationService.redirectToHomeIfAuthenticated()
            .then(function () {
              resolved = true;
            });
        $rootScope.$digest();

        expect(resolved).toBeTruthy();
      });
    });

    /**
     * authenticate
     */

    describe('authenticate', function () {
      it('updates the credentials if a new token is issued', function () {
        resolved = false;
        spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
        $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(200);

        authenticationService.authenticate(mockedRedirectionUrl).then(success, failure);
        $httpBackend.flush();

        expect(resolved).toBe(true);
        expect(authenticationService.getToken).toHaveBeenCalled();
        expect($localStorage.user.id).toBe(mockedUser.id);
        expect($localStorage.user.firstName).toBe(mockedUser.firstName);
        expect($localStorage.user.lastName).toBe(mockedUser.lastName);
        expect(mockedCookieService.put).toHaveBeenCalledWith(TOKEN_COOKIE_KEY, mockedToken, {domain: 'domain'});
      });

      it('updates the credentials if there is a token which is still valid (API returning HTTP 304)', function () {
        resolved = false;
        spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
        $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(304);

        authenticationService.authenticate(mockedRedirectionUrl).then(success, failure);
        $httpBackend.flush();

        expect(resolved).toBe(true);
        expect(authenticationService.getToken).toHaveBeenCalled();
        expect($localStorage.user.id).toBe(mockedUser.id);
        expect($localStorage.user.firstName).toBe(mockedUser.firstName);
        expect($localStorage.user.lastName).toBe(mockedUser.lastName);
        expect(mockedCookieService.put).toHaveBeenCalledWith(TOKEN_COOKIE_KEY, mockedToken, {domain: 'domain'});
      });

      it('updates the credentials if there is a token which is still valid but has to be reissued (API returning HTTP 409)', function () {
        var newToken = 'NEW_TOKEN';
        spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
        $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(409, newToken);
        resolved = false;

        authenticationService.authenticate(mockedRedirectionUrl).then(success, failure);
        $httpBackend.flush();

        expect(resolved).toBe(true);
        expect(authenticationService.getToken).toHaveBeenCalled();
        expect($localStorage.user).toBe(mockedUser);
        expect(mockedCookieService.put).toHaveBeenCalledWith(TOKEN_COOKIE_KEY, newToken, {domain: 'domain'});
      });

      it('redirects to login if there is a token but it is not valid (API returning HTTP 401)', function () {
        resolved = true;
        spyOn(authenticationService, 'clearCredentials');
        spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue(mockedDomain);
        $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(401);

        authenticationService.authenticate(mockedRedirectionUrl).then(success, failure);
        $httpBackend.flush();

        expect(resolved).toBe(false);
        expect(authenticationService.clearCredentials).toHaveBeenCalled();
        expect(environmentsService.getSolutionCenterUrl).toHaveBeenCalled();
        expect($window.location.href).toEqual(mockedDomain + '/#/login?redirect=' + mockedRedirectionUrl);
      });

      it('redirects to login if there is no token', function () {
        spyOn(authenticationService, 'clearCredentials');
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue(mockedDomain);
        spyOn(authenticationService, 'getToken').and.returnValue(undefined);
        authenticationService.authenticate(mockedRedirectionUrl);
        $rootScope.$digest();

        expect(authenticationService.clearCredentials).toHaveBeenCalled();
        expect(environmentsService.getSolutionCenterUrl).toHaveBeenCalled();
        expect($window.location.href).toEqual(mockedDomain + '/#/login?redirect=' + mockedRedirectionUrl);
      });
    });

    /**
     * login
     */

    describe('login', function () {
      it('accepts correct responses', function () {
        resolved = false;
        $httpBackend.expectPOST(mockedTokensAPIEndpoint).respond(200);

        authenticationService.login(anyString, anyString).then(success, failure);
        $httpBackend.flush();
        $rootScope.$digest();

        expect(resolved).toBe(true);
      });

      it('rejects error responses', function () {
        resolved = false;
        $httpBackend.expectPOST(mockedTokensAPIEndpoint).respond(401);

        authenticationService.login(anyString, anyString).then(success, failure);
        $httpBackend.flush();
        $rootScope.$digest();

        expect(resolved).toBe(false);
      });

      it('sets the token in the storage if the credentials provided are valid to log in', function () {
        $httpBackend.expectPOST(mockedTokensAPIEndpoint).respond(200, mockedToken);

        authenticationService.login(anyString, anyString).then(success, failure);
        $httpBackend.flush();
        $rootScope.$digest();

        expect(authenticationService.setToken).toHaveBeenCalled();
      });

      it('does not set any token in the storage if the credentials are invalid', function () {
        $httpBackend.expectPOST(mockedTokensAPIEndpoint).respond(401);

        authenticationService.login(anyString, anyString).then(success, failure);
        $httpBackend.flush();
        $rootScope.$digest();

        expect(authenticationService.setToken).not.toHaveBeenCalled();
      });
    });

    /**
     * silentLogin
     */

    describe('silentLogin', function () {
      it('stores the credentials when the login is successful', function () {
        spyOn(authenticationService, 'login').and.returnValue($q.when(mockedToken));

        authenticationService.silentLogin(anyString, anyString);
        $rootScope.$digest();

        expect(mockedCookieService.put).toHaveBeenCalledWith(TOKEN_COOKIE_KEY, mockedToken, {domain: 'domain'});
      });

      it('does not store any credential when the login is not possible', function () {
        spyOn(authenticationService, 'login').and.returnValue($q.reject());

        authenticationService.silentLogin(anyString, anyString);
        $rootScope.$digest();

        expect(mockedCookieService.put).toHaveBeenCalledWith(TOKEN_COOKIE_KEY, mockedToken, {domain: 'domain'});
      });
    });

    /**
     * getToken
     */

    describe('getToken', function () {
      it('returns the token if it is stored in the cookie', function () {
        $localStorage.token = null;
        $cookies.get.and.returnValue(mockedToken);

        expect(authenticationService.getToken()).toEqual(mockedToken);
      });

      it('returns the token if it is stored both in local storage and cookie', function () {
        $localStorage.token = mockedToken;
        $cookies.get.and.returnValue(mockedToken);

        expect(authenticationService.getToken()).toEqual(mockedToken);
      });

      it('returns null if there is no token stored in either local storage or cookie', function () {
        $localStorage.user = null;
        $cookies.get.and.returnValue(null);

        expect(authenticationService.getUser()).toEqual(null);
      });
    });

    /**
     * logout
     */

    describe('logout', function () {
      beforeEach(function () {
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue(mockedDomain);
      });

      it('invalidates the token', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);

        authenticationService.logout();
        $httpBackend.flush();
      });

      it('clears the stored credentials', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);
        spyOn(authenticationService, 'clearCredentials');

        authenticationService.logout();
        $httpBackend.flush();

        expect(authenticationService.clearCredentials).toHaveBeenCalled();
      });

      it('redirects to login page', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);
        spyOn(environmentsService, 'getLoginPath').and.returnValue(mockedLoginPath);

        authenticationService.logout();
        $httpBackend.flush();

        expect(environmentsService.getLoginPath).toHaveBeenCalled();
        expect($window.location.href).toBe(mockedDomain + "/#" + mockedLoginPath);
      });
    });

    /**
     * silentLogout
     */

    describe('silentLogout', function () {
      it('invalidates the token', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);

        authenticationService.silentLogout();
        $httpBackend.flush();
      });

      it('clears the stored credentials', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);
        spyOn(authenticationService, 'clearCredentials');

        authenticationService.silentLogout();
        $httpBackend.flush();

        expect(authenticationService.clearCredentials).toHaveBeenCalled();
      });

      it('does not perform any redirection', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);
        expect($window.location.href).toBe(mockedOriginUrl);

        authenticationService.silentLogout();
        $httpBackend.flush();

        expect($window.location.href).toBe(mockedOriginUrl);
      });
    });

    /**
     * isAuthenticated
     */
    describe('isAuthenticated', function () {
      it('returns true if there is an authenticated user', function () {
        $localStorage.user = mockedUser;

        expect(authenticationService.isAuthenticated()).toBeTruthy();
      });

      it('returns false if there is no authenticated user', function () {
        $localStorage.user = null;

        expect(authenticationService.isAuthenticated()).toBeFalsy();
      });
      it('returns false if the user is undefined', function () {
        $localStorage.user = undefined;
        expect(authenticationService.isAuthenticated()).toBeFalsy();
      });
    });

    /**
     * getUser
     */

    describe('getUser', function () {
      it('returns the user if there is one logged in', function () {
        $localStorage.user = mockedUser;

        expect(authenticationService.getUser()).toEqual(mockedUser);
      });

      it('returns null if there is no user logged in', function () {
        $localStorage.user = null;

        expect(authenticationService.getUser()).toEqual(null);
      });
    });

    /**
     * getBrand
     */

    describe('getBrand', function () {
      it('returns a brand if the user has accessed it', function () {
        mockedCookieService.get.and.returnValue(mockedBrandId);

        expect(authenticationService.getBrand()).toEqual(mockedBrandId);
      });

      it('returns null if the user has not accessed any brand', function () {
        mockedCookieService.get.and.returnValue(undefined);

        expect(authenticationService.getBrand()).toBe(undefined);
      });
    });

    /**
     * setBrand
     */

    describe('setBrand', function () {
      it('sets a brand in the cookie', function () {
        authenticationService.setBrand(mockedBrandId);

        expect(mockedCookieService.put).toHaveBeenCalledWith(BRAND_COOKIE_KEY, mockedBrandId, {domain: 'domain'});
      });
    });
  });

  /**
   * WHEN COMMUNICATING WITH THE SOLUTION CENTER
   * (because of different routing handling, using $location in this case)
   */

  describe('when communicating with the Solution Center app', function () {
    beforeEach(function () {
      module('sc-authentication', function ($provide, authenticationServiceProvider) {
        authenticationServiceProvider.setInternalCommunication(true);
        // Skip the configuration of the environment to test that it falls back to the default values as expected
      });

      inject(
          function (_$rootScope_, _authenticationService_, _environmentsService_, _$location_, _$httpBackend_, _$timeout_) {
            $rootScope = _$rootScope_;
            authenticationService = _authenticationService_;
            environmentsService = _environmentsService_;
            $location = _$location_;
            $httpBackend = _$httpBackend_;
            $timeout = _$timeout_;

            spyOn(environmentsService, 'getDomain').and.returnValue(mockedDomain);
            spyOn(environmentsService, 'getTokensAPI').and.returnValue(mockedTokensAPIEndpoint);
            spyOn($location, 'url');
          });
    });

    /**
     * logout
     */

    describe('logout', function () {
      it('redirects to logout page using the $location service', function () {
        $httpBackend.expectDELETE(mockedTokensAPIEndpoint).respond(200);
        spyOn(environmentsService, 'getLoginPath').and.returnValue(mockedLoginPath);

        authenticationService.logout();
        $httpBackend.flush();
        $timeout.flush();

        expect(environmentsService.getLoginPath).toHaveBeenCalled();
        expect($location.url).toHaveBeenCalledWith(mockedLoginPath);
        $timeout.verifyNoPendingTasks();
      });
    });
  });
});

