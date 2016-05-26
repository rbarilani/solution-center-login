angular.module('sc-authentication')
  .factory('environmentsService', [
    function () {
      
      function getSolutionCenterUrl(environment) {
        var url = environment.URL;
        var port = (environment.PORT && ':'.concat(environment.PORT)) || '';

        return url.concat(port);
      }

      function getLoginPath() {
        return '/login';
      }

      function getLogoutPath() {
        return '/logout';
      }

      function getTokensAPI(environment) {
        return environment.TOKEN_SERVICE.BASE_URL + '/tokens';
      }

      function getDomain(environment) {
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
