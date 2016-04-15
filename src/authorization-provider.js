angular.module('sc-authentication')

  // This service provides guard methods to support AngularJS routes.
  // You can add them as resolves to routes to require authorization levels
  // before allowing a route change to complete
  .provider('securityAuthorization', {

    requireUser: ['securityAuthorization', function (securityAuthorization) {
      'use strict';
      return securityAuthorization.requireAuthenticatedUser();
    }],

    redirectToHomeIfAuthenticated: ['securityAuthorization', function (securityAuthorization) {
      'use strict';
      return securityAuthorization.redirectToHomeIfAuthenticated();
    }],

    $get: ['$q', 'solutionCenterAuth', function ($q, solutionCenterAuth) {
      'use strict';

      var service = {
        // Require that there is an authenticated user
        // (use this in a route resolve to prevent non-authenticated users from entering that route)
        requireAuthenticatedUser: function () {
          // TODO get user and redirect - refactor to use service
          return security.requestCurrentUser()
            .catch(function () {
              security.showLogin();
              return $q.reject();
            });
        },

        // Redirect to home page in case there is a user already authenticated
        // (use this in the login resolve to prevent users seeing the login dialog when they are already authenticated)
        redirectToHomeIfAuthenticated: function () {
          return security.requestCurrentUser()
            .then(
              function () {
                security.showHomePage();
                return $q.reject();
              },
              function () {
                return $q.when();
              });
        }
      };

      return service;
    }]
  });
