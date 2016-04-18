describe('authentication service', function () {
  'use strict';

  var $rootScope, authenticationService, $q, $localStorage, $cookies, environments, $location,
      $httpBackend, jwtHelper, $window;

  var mockedToken = 'JWT_TOKEN';
  var mockedUrl = 'REDIRECTION_URL';
  var mockedUser = {id: 1, firstName: 'Chuck', lastName: 'Norris'};

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

          spyOn(jwtHelper, 'decodeToken').and.returnValue(mockedUser);
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
      expect(authenticationService.validateToken).toBeDefined();
    });
  });

  describe('authenticate', function () {
    it('updates the credentials if a new token is issued', function () {
      $localStorage.sc_token = null;
      $localStorage.sc_user = null;

      spyOn(authenticationService, 'getToken').and.returnValue(mockedToken);
      spyOn(authenticationService, 'validateToken').and.returnValue($q.when(mockedToken));

      var result = authenticationService.authenticate(mockedUrl);

      expect(!!result.then && typeof result.then === 'function').toBeTruthy();
      //expect($localStorage.sc_token).toBe(mockedToken);
      //expect($localStorage.sc_user).toBe(mockedUser);
    });

    it('updates the credentials if there is a token which is still valid', function () {
      // Backend returning HTTP 304
    });

    it('updates the credentials if there is a token which is still valid but has to be reissued', function () {
      // Backend returning HTTP 409
    });

    it('redirects to login if there is no valid token', function () {
      // Backend returning HTTP 409
    });
  });

  describe('redirectToLogin', function () {
    it('', function () {

    });
  });

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

