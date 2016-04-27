angular.module('sc-authentication')
  .factory('environmentsService', [
    function () {
      var environments = {
        PRODUCTION: {
          url: 'https://www.solutions.zalando.com',
          tokenservice: 'https://token-management.norris.zalan.do',
          domain: 'solutions.zalando.com'
        },
        INTEGRATION: {
          url: 'https://usf-integration.norris.zalan.do',
          tokenservice: 'https://tm-integration.norris.zalan.do',
          domain: '.zalan.do'
        },
        STAGING: {
          url: 'https://usf-stage.norris.zalan.do',
          tokenservice: 'https://tm-stage.norris.zalan.do',
          domain: '.zalan.do'
        },
        DEVELOPMENT: {
          url: 'https://usf-dev.norris.zalan.do',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do',
          domain: '.zalan.do'
        },
        LOCAL: {
          url: 'http://localhost:{PORT}',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do',
          domain: 'localhost'
        }
      };

      function getSolutionCenterUrl(environment) {
        var url = environments[environment.name].url;
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
        return environments[environment.name].tokenservice + '/tokens';
      }

      function getDomain(environment) {
        return environments[environment.name].domain;
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
