describe('authenticationService', function () {
  'use strict';

  var $rootScope, authenticationService, $q, $localStorage, $cookies, environmentsService, $location,
      $httpBackend, jwtHelper, $window;

  var mockedToken = 'JWT_TOKEN';
  var mockedDomain = 'domain';
  var mockedRedirectionUrl = 'app.domain';
  var mockedOriginUrl = 'ORIGIN';
  var mockedUser = {id: 1, firstName: 'Chuck', lastName: 'Norris'};
  var mockedTokensAPIEndpoint = 'TOKENS_API';
  var mockedLogoutPath = '/LOGOUT';
  var mockedFunction = function () {
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
        $provide.value('$window', {location: {href: mockedOriginUrl}});
        authenticationServiceProvider.setInternalCommunication(false);
        authenticationServiceProvider.configEnvironment('LOCAL', 3000);
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
            spyOn(jwtHelper, 'decodeToken').and.returnValue(mockedUser);
          });
    });

    describe('initial state', function () {
      it('has known state', function () {
        expect(authenticationService.requireAuthenticatedUser).toBeDefined();
        expect(authenticationService.redirectToHomeIfAuthenticated).toBeDefined();
        expect(authenticationService.authenticate).toBeDefined();
        expect(authenticationService.redirectToLogin).toBeDefined();
        expect(authenticationService.getToken).toBeDefined();
        expect(authenticationService.logout).toBeDefined();
        expect(authenticationService.getUser).toBeDefined();
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
      it('uses $window service to do redirections', function () {
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue('DIFFERENT_DOMAIN');

        expect($window.location.href).toEqual(mockedOriginUrl);

        authenticationService.redirectToLogin(mockedRedirectionUrl);

        expect($window.location.href).not.toEqual(mockedOriginUrl);
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
     * logout
     */

    describe('logout', function () {
      beforeEach(function () {
        spyOn(environmentsService, 'getSolutionCenterUrl').and.returnValue($window.location.host);
      });

      it('clears the stored credentials', function () {
        $localStorage.sc_token = mockedToken;
        $localStorage.sc_user = mockedUser;

        authenticationService.logout();

        expect($localStorage.sc_token).toBe(null);
        expect($localStorage.sc_user).toBe(null);
      });

      it('redirects to logout page using the $window service', function () {
        spyOn(environmentsService, 'getLogoutPath').and.returnValue(mockedLogoutPath);

        expect($window.location.href).toEqual(mockedOriginUrl);

        authenticationService.logout();

        expect($window.location.href).not.toEqual(mockedOriginUrl);
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

  /**
   * WHEN COMMUNICATING WITH THE SOLUTION CENTER
   * (because of different routing handling, using $location in this case)
   */

  describe('when communicating with the Solution Center app', function () {
    beforeEach(function () {
      module('sc-authentication', function ($provide, authenticationServiceProvider) {
        authenticationServiceProvider.setInternalCommunication(true);
      });

      inject(
          function (_$rootScope_, _authenticationService_, _environmentsService_, _$location_) {
            $rootScope = _$rootScope_;
            authenticationService = _authenticationService_;
            environmentsService = _environmentsService_;
            $location = _$location_;

            spyOn(environmentsService, 'getDomain').and.returnValue(mockedDomain);
            spyOn($location, 'url').and.callFake(mockedFunction);
          });
    });

    /**
     * redirectToLogin
     */

    describe('redirectToLogin', function () {
      it('uses $location service to do redirections', function () {
        authenticationService.redirectToLogin(mockedRedirectionUrl);

        expect($location.url).toHaveBeenCalledWith("/login?redirect=" + mockedRedirectionUrl);
      });
    });

    /**
     * logout
     */

    describe('logout', function () {
      it('redirects to logout page using the $location service', function () {
        spyOn(environmentsService, 'getLogoutPath').and.returnValue(mockedLogoutPath);

        authenticationService.logout();

        expect($location.url).toHaveBeenCalledWith(mockedLogoutPath);
      });
    });
  });
});

