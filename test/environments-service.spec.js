describe('environmentsService', function () {
  'use strict';

  var environmentsService, $rootScope;
  var environmentsProvider;

  var mockedEnvironment, mockedPort = 'MOCKED_PORT';

  beforeEach(function () {
    module('sc-authentication');
    module('solution.center.communicator');

    inject(
        function (_$rootScope_, _environmentsService_, _environments_) {
          $rootScope = _$rootScope_;
          environmentsService = _environmentsService_;
          environmentsProvider = _environments_;
        });

    mockedEnvironment = {
      NAME: 'MOCKED_NAME',
      PORT: mockedPort,
      URL: 'test-url'
    };
  });

  describe('initial state', function () {
    console.log('======================= environments pro');
    console.log(environmentsProvider);
    it('has known state', function () {
      expect(environmentsService.getSolutionCenterUrl).toBeDefined();
      expect(environmentsService.getLoginPath).toBeDefined();
      expect(environmentsService.getLogoutPath).toBeDefined();
      expect(environmentsService.getTokensAPI).toBeDefined();
      expect(environmentsService.getDomain).toBeDefined();
    });
  });

  /**
   * getSolutionCenterUrl
   */

  describe('getSolutionCenterUrl', function () {
    it('returns the solution center url for production environment', function () {
      mockedEnvironment.NAME = 'PRODUCTION';

      var url = environmentsService.getSolutionCenterUrl(mockedEnvironment);

      expect(typeof url).toBe('string');
    });

    it('returns the solution center url for integration environment', function () {
      mockedEnvironment.NAME = 'INTEGRATION';

      var url = environmentsService.getSolutionCenterUrl(mockedEnvironment);

      expect(typeof url).toBe('string');
    });

    it('returns the solution center url for stage environment', function () {
      mockedEnvironment.NAME = 'STAGE';

      var url = environmentsService.getSolutionCenterUrl(mockedEnvironment);

      expect(typeof url).toBe('string');
    });

    it('returns the solution center url for development environment', function () {
      mockedEnvironment.NAME = 'DEVELOPMENT';

      var url = environmentsService.getSolutionCenterUrl(mockedEnvironment);

      expect(typeof url).toBe('string');
    });

    it('returns the solution center url for local environment', function () {
      mockedEnvironment.NAME = 'LOCAL';

      var url = environmentsService.getSolutionCenterUrl(mockedEnvironment);

      expect(typeof url).toBe('string');
      expect(url.indexOf(mockedPort)).toBeGreaterThan(-1);
    });
  });

  /**
   * getLoginPath
   */

  describe('getLoginPath', function () {
    it('returns a valid path', function () {
      var path = environmentsService.getLoginPath();

      expect(typeof path).toBe('string');
      expect(path).toBe('/login');
    });
  });

  /**
   * getLogoutPath
   */

  describe('getLogoutPath', function () {
    it('returns a valid path', function () {
      var path = environmentsService.getLogoutPath();

      expect(typeof path).toBe('string');
      expect(path).toBe('/logout');
    });
  });

  /**
   * getTokensAPI
   */

  describe('getTokensAPI', function () {
    it('returns the token API endpoint for production environment', function () {
      mockedEnvironment.NAME = 'PRODUCTION';

      var endpoint = environmentsService.getTokensAPI(mockedEnvironment);

      expect(typeof endpoint).toBe('string');
      expect(endpoint.indexOf('/tokens')).toBeGreaterThan(-1);
    });

    it('returns the token API endpoint for integration environment', function () {
      mockedEnvironment.NAME = 'INTEGRATION';

      var endpoint = environmentsService.getTokensAPI(mockedEnvironment);

      expect(typeof endpoint).toBe('string');
      expect(endpoint.indexOf('/tokens')).toBeGreaterThan(-1);
    });

    it('returns the token API endpoint for stage environment', function () {
      mockedEnvironment.NAME = 'STAGE';

      var endpoint = environmentsService.getTokensAPI(mockedEnvironment);

      expect(typeof endpoint).toBe('string');
      expect(endpoint.indexOf('/tokens')).toBeGreaterThan(-1);
    });

    it('returns the token API endpoint for development environment', function () {
      mockedEnvironment.NAME = 'DEVELOPMENT';

      var endpoint = environmentsService.getTokensAPI(mockedEnvironment);

      expect(typeof endpoint).toBe('string');
      expect(endpoint.indexOf('/tokens')).toBeGreaterThan(-1);
    });

    it('returns the token API endpoint for local environment', function () {
      mockedEnvironment.NAME = 'LOCAL';

      var endpoint = environmentsService.getTokensAPI(mockedEnvironment);

      expect(typeof endpoint).toBe('string');
      expect(endpoint.indexOf('/tokens')).toBeGreaterThan(-1);
    });
  });

  /**
   * getDomain
   */

  describe('getDomain', function () {
    it('returns the domain for production environment', function () {
      mockedEnvironment.NAME = 'PRODUCTION';

      var domain = environmentsService.getDomain(mockedEnvironment);

      expect(typeof domain).toBe('string');
    });

    it('returns the domain for integration environment', function () {
      mockedEnvironment.NAME = 'INTEGRATION';

      var domain = environmentsService.getDomain(mockedEnvironment);

      expect(typeof domain).toBe('string');
    });

    it('returns the domain for stage environment', function () {
      mockedEnvironment.NAME = 'STAGE';

      var domain = environmentsService.getDomain(mockedEnvironment);

      expect(typeof domain).toBe('string');
    });

    it('returns the domain for development environment', function () {
      mockedEnvironment.NAME = 'DEVELOPMENT';

      var domain = environmentsService.getDomain(mockedEnvironment);

      expect(typeof domain).toBe('string');
    });

    it('returns the domain for local environment', function () {
      mockedEnvironment.NAME = 'LOCAL';

      var domain = environmentsService.getDomain(mockedEnvironment);

      expect(typeof domain).toBe('string');
    });
  });
});

