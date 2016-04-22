angular.module('sc-authentication')
  .factory('environmentsService', [
    function () {
      var environments = {
        PRODUCTION: {
          url: 'solutions.zalando.com',
          tokenservice: 'https://token-management.norris.zalan.do',
          domain: 'solutions.zalando.com'
        },
        INTEGRATION: {
          url: 'usf-integration.norris.zalan.do',
          tokenservice: 'https://tm-integration.norris.zalan.do',
          domain: '.zalan.do'
        },
        STAGING: {
          url: 'usf-stage.norris.zalan.do',
          tokenservice: 'https://tm-stage.norris.zalan.do',
          domain: '.zalan.do'
        },
        DEVELOPMENT: {
          url: 'usf-dev.norris.zalan.do',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do',
          domain: '.zalan.do'
        },
        LOCAL: {
          url: 'localhost:{PORT}',
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
