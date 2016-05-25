angular.module('sc-authentication')
  .factory('environmentsService', ['ENVIRONMENTS',
    function (ENVIRONMENTS) {
      function getSolutionCenterUrl(environment) {
        // var url = ENVIRONMENTS[environment.name].url;
        // if (environment.name === 'LOCAL') {
        //   url = url.replace('{PORT}', environment.port);
        // }
        // return url;
        console.log('getSolutionCenterUrl', environment);
      }

      function getLoginPath() {
        return '/login';
      }

      function getLogoutPath() {
        return '/logout';
      }

      function getTokensAPI(environment) {
        // if (environment.name === 'LOCAL') {
        //   return environment.tokenService + '/tokens';
        // }
        // return ENVIRONMENTS[environment.name].tokenservice + '/tokens';
        return environment.TOKEN_SERVICE.BASE_URL + '/tokens';
      }

      function getDomain(environment) {
        //return ENVIRONMENTS[environment.name].domain;
        console.log('ddddooommmmain', environment.DOMAIN);
        return environment.DOMAIN;
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
