angular.module('sc-authentication')
  .factory('environmentsService', [
    function () {
      var environments = {
        PRODUCTION: {
          domain: 'solutions.zalando.com',
          tokenservice: 'https://token-management.norris.zalan.do'
        },
        INTEGRATION: {
          domain: 'usf-integration.norris.zalan.do',
          tokenservice: 'https://tm-integration.norris.zalan.do'
        },
        STAGING: {
          domain: 'usf-stage.norris.zalan.do',
          tokenservice: 'https://tm-stage.norris.zalan.do'
        },
        DEVELOPMENT: {
          domain: 'usf-dev.norris.zalan.do',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        },
        LOCAL: {
          domain: 'localhost:{PORT}',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        }
      };

      function getDomain(environment) {
        var domain = environments[environment.name].domain;
        if (environment.name === 'LOCAL') {
          domain = domain.replace('{PORT}', environment.port);
        }
        return domain;
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

      return {
        getDomain: getDomain,
        getLoginPath: getLoginPath,
        getLogoutPath: getLogoutPath,
        getTokensAPI: getTokensAPI
      };
    }
  ]);
