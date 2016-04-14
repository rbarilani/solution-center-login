angular.module('sc-authentication', [])
    .factory('solutionCenterAuth', [
        '$q',
        '$localStorage',
        '$cookies',
        'solutionCenterEnvironments',
        '$location',
        '$http',
        function ($q, $localStorage, $cookies, environments, $location, $http) {

            'use strict';

            var service = {
                authenticate: authenticate,
                redirectToLogin: redirectToLogin,
                getToken: getToken,
                logout: logout,
                parseToken: parseToken,
                getUser: getUser
            };

            return service;

            //////////////////////

            var TOKEN_COOKIE_KEY = "SC_TOKEN";

            function authenticate(environment, redirectUrl) {
                var token = isAuthenticated();

                if (!token) {
                    redirectToLogin(environment, redirectUrl);
                }

                $localStorage.sc_token = token;
                $localStorage.sc_user = getUserFromToken(token);

                return token;
            }

            function redirectToLogin(environment, redirectUrl) {
                $location.url = environments.getLoginUrl(environment) + "?redirect=" + redirectUrl;
            }

            function logout(environment) {
                $localStorage.sc_token = null;
                $localStorage.sc_user = null;

                $location.url = environments.getLogoutUrl(environment); // XXX Cookies is reset in our app
            }

            function getToken() {
                return $localStorage.sc_token || $cookies.get(TOKEN_COOKIE_KEY);
            }

            function getUser() {
                return $localStorage.sc_user;
            }

            /*
             PRIVATE METHODS
             */

            /**
             * Returns a valid token in case the user is authenticated or null in case there's no user
             * @returns {*}
             */
            function isAuthenticated() {
                var token = getToken();
                return validateToken(token);
            }

            /*
             XXX Returns either null or a valid token
             */
            function validateToken(token) {
                if (token === null) {
                    return null;
                }

                // $http.

                // TODO Call GET /tokens
            }

            function getUserFromToken(token) {
                var parts = token.split('.');

                var base64Data = decodeURIComponent(escape(atob(parts[1])));
                var user = angular.fromJson(base64Data);

                return user;
            }
        }
    ]);
