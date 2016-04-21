describe('authenticationService', function () {
  'use strict';

  var $rootScope, authenticationService, $q, $localStorage, $cookies, environments, $location,
      $httpBackend, jwtHelper, $window;

  var mockedToken = 'JWT_TOKEN';
  var mockedRedirectionUrl = 'REDIRECTION_URL';
  var mockedUser = {id: 1, firstName: 'Chuck', lastName: 'Norris'};
  var mockedTokensAPIEndpoint = 'TOKENS_API';
  var mockedFunction = function() {};

  beforeEach(function () {
    module('sc-authentication', 'angular-jwt', 'ngStorage', 'ngCookies');

    inject(
        function (_$rootScope_, _authenticationService_, _$q_, _$localStorage_, _$cookies_, _environments_, _$location_,
                  _$httpBackend_, _jwtHelper_, _$window_) {
          $rootScope = _$rootScope_;
          authenticationService = _authenticationService_;
          $q = _$q_;
          $localStorage = _$localStorage_;
          $cookies = _$cookies_;
          environments = _environments_;
          $location = _$location_;
          $httpBackend = _$httpBackend_;
          jwtHelper = _jwtHelper_;
          $window = _$window_;

          spyOn(environments, 'getTokensAPI').and.returnValue(mockedTokensAPIEndpoint);
          spyOn(jwtHelper, 'decodeToken').and.returnValue(mockedUser);
          spyOn($location, 'url').and.callFake(mockedFunction);
        });
  });

  describe('initial state', function () {
    it('has known state', function () {
      expect(authenticationService.requireAuthenticatedUser).toBeDefined();
      expect(authenticationService.authenticate).toBeDefined();
      expect(authenticationService.redirectToLogin).toBeDefined();
      expect(authenticationService.getToken).toBeDefined();
      expect(authenticationService.logout).toBeDefined();
      expect(authenticationService.getUser).toBeDefined();
    });
  });

  /**
   * authenticate
   */

  describe('authenticate', function () {
    it('updates the credentials if a new token is issued', function () {
      $localStorage.sc_token = null;
      $localStorage.sc_user = null;

      spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
      $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(200);

      var result = authenticationService.authenticate(mockedRedirectionUrl);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(!!result.then && typeof result.then === 'function').toBeTruthy();
      expect($localStorage.sc_token).toBe(mockedToken);
      expect($localStorage.sc_user).toBe(mockedUser);
    });

    it('updates the credentials if there is a token which is still valid', function () {
      // Backend returning HTTP 304
      spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
      $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(304);

      var result = authenticationService.authenticate(mockedRedirectionUrl);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(!!result.then && typeof result.then === 'function').toBeTruthy();
      expect($localStorage.sc_token).toBe(mockedToken);
      expect($localStorage.sc_user).toBe(mockedUser);
    });

    it('updates the credentials if there is a token which is still valid but has to be reissued', function () {
      // Backend returning HTTP 409
      var newToken = 'NEW_TOKEN';
      spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
      $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(409, newToken);

      var result = authenticationService.authenticate(mockedRedirectionUrl);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(!!result.then && typeof result.then === 'function').toBeTruthy();
      expect($localStorage.sc_token).toBe(newToken);
      expect($localStorage.sc_user).toBe(mockedUser);
    });

    it('redirects to login if there is a token but it is not valid', function () {
      // Backend returning HTTP 401
      $localStorage.sc_token = mockedToken;
      $localStorage.sc_user = mockedUser;

      spyOn(authenticationService, 'redirectToLogin').and.callFake(mockedFunction);
      spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
      $httpBackend.expectGET(mockedTokensAPIEndpoint).respond(401);

      var result = authenticationService.authenticate(mockedRedirectionUrl);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(!!result.then && typeof result.then === 'function').toBeTruthy();
      expect($localStorage.sc_token).toBe(null);
      expect($localStorage.sc_user).toBe(null);
      expect(authenticationService.redirectToLogin).toHaveBeenCalledWith(mockedRedirectionUrl);
    });

    it('redirects to login if there is no token', function () {
      $localStorage.sc_token = null;
      $localStorage.sc_user = null;

      spyOn(authenticationService, 'redirectToLogin').and.callFake(mockedFunction);
      spyOn(authenticationService, 'getToken').and.returnValue(undefined);

      authenticationService.authenticate(mockedRedirectionUrl);
      $rootScope.$digest();

      expect($localStorage.sc_token).toBe(null);
      expect($localStorage.sc_user).toBe(null);
      expect(authenticationService.redirectToLogin).toHaveBeenCalledWith(mockedRedirectionUrl);
    });
  });

  /**
   * redirectToLogin
   */

  describe('redirectToLogin', function () {
    it('uses $location to redirect if the url to redirect to is in the same domain as the login app', function () {
      spyOn(environments, 'getDomain').and.returnValue($window.location.host);

      authenticationService.redirectToLogin(mockedRedirectionUrl);

      expect($location.url).toHaveBeenCalledWith("/login?redirect=" + mockedRedirectionUrl);
    });

    xit('uses $window to redirect if the url to redirect to is in a different domain than the login app', function () {
      spyOn(environments, 'getDomain').and.returnValue('DIFFERENT_DOMAIN');

      authenticationService.redirectToLogin(mockedRedirectionUrl);

      expect($location.url).not.toHaveBeenCalledWith("/login?redirect=" + mockedRedirectionUrl);
    });
  });

  /**
   * getToken
   */

  describe('getToken', function () {
    it('returns the token if it is stored in local storage', function () {
      $localStorage.sc_token = mockedToken;

      expect(authenticationService.getToken()).toEqual(mockedToken);
    });

    it('returns the token if it is stored in the cookie', function () {
      $localStorage.sc_token = null;
      spyOn($cookies, 'get').and.returnValue(mockedToken);

      expect(authenticationService.getToken()).toEqual(mockedToken);
    });

    it('returns the token if it is stored both in local storage and cookie', function () {
      $localStorage.sc_token = mockedToken;
      spyOn($cookies, 'get').and.returnValue(mockedToken);

      expect(authenticationService.getToken()).toEqual(mockedToken);
    });

    it('returns null if there is no token stored in either local storage or cookie', function () {
      $localStorage.sc_user = null;
      spyOn($cookies, 'get').and.returnValue(null);

      expect(authenticationService.getUser()).toEqual(null);
    });
  });

  /**
   * isAuthenticated
   */
  describe('isAuthenticated', function () {
    it('returns true if there is an authenticated user', function () {
      $localStorage.sc_user = mockedUser;

      expect(authenticationService.isAuthenticated()).toBeTruthy();
    });

    it('returns true if there is no authenticated user', function () {
      $localStorage.sc_user = null;

      expect(authenticationService.isAuthenticated()).toBeFalsy();
    });
  });


  /**
   * getUser
   */

  describe('getUser', function () {
    it('returns the user if there is one logged in', function () {
      $localStorage.sc_user = mockedUser;

      expect(authenticationService.getUser()).toEqual(mockedUser);
    });

    it('returns null if there is no user logged in', function () {
      $localStorage.sc_user = null;

      expect(authenticationService.getUser()).toEqual(null);
    });
  });
});

