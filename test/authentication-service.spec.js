describe('authentication service', function () {
  'use strict';

  var $q, $localStorage, $cookies, environments, $location, $httpBackend, jwtHelper, solutionCenterAuth;

  beforeEach(function () {
    module('sc-authentication', 'angular-jwt', 'ngStorage', 'ngCookies');

    inject(function(_$q_, _$localStorage_, _$cookies_, _environments_, _$location_, _$httpBackend_, _jwtHelper_,
                    _solutionCenterAuth_) {
      $q = _$q_;
      $localStorage = _$localStorage_;
      $cookies = _$cookies_;
      environments = _environments_;
      $location = _$location_;
      $httpBackend = _$httpBackend_;
      jwtHelper = _jwtHelper_;
      solutionCenterAuth = _solutionCenterAuth_;

      spyOn(jwtHelper, 'decodeToken');
    });
  });

  describe('initial state', function () {
    it('has known state', function () {
      expect(solutionCenterAuth.authenticate).toBeDefined();
    });
  });
});