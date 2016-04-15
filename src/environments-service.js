angular.module('sc-authentication')
  .factory('environments', [
    function () {
      var environments = {
        PRODUCTION: {
          url: 'solutions.zalando.com',
          tokenservice: 'https://token-management.norris.zalan.do'
        },
        INTEGRATION: {
          url: 'usf-integration.norris.zalan.do',
          tokenservice: 'https://tm-integration.norris.zalan.do'
        },
        STAGING: {
          url: 'usf-stage.norris.zalan.do',
          tokenservice: 'https://tm-stage.norris.zalan.do'
        },
        DEVELOPMENT: {
          url: 'usf-dev.norris.zalan.do',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        },
        LOCAL: {
          url: 'localhost:{PORT}',
          tokenservice: 'https://tm-dev-ext.norris.zalan.do'
        }
      };

      function getDomain(environment) {
        var url = environments[environment.name].url;
        if (environment.name === 'LOCAL') {
          url = url.replace('{PORT}', environment.port);
        }
        return url;
      }

      function getLoginPath() {
        return '/login';
      }

      function getLogourPath() {
        return '/logout';
      }

      function getTokensAPI(environment) {
        return environments[environment].tokenservice + '/tokens';
      }

      return {
        getDomain: getDomain,
        getLoginPath: getLoginPath,
        getLogoutPath: getLogourPath,
        getTokensAPI: getTokensAPI
      };
    }
  ]);
