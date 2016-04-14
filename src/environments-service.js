angular.module('sc-authentication', [])
    .factory('environments', [
        function() {
            var environments = {
                PRODUCTION: {
                    name: 'PRODUCTION',
                    url: 'solutions.zalando.com',
                    tokenservice: 'https://token-management.norris.zalan.do'
                },
                INTEGRATION: {
                    name: 'INTEGRATION',
                    url: 'usf-integration.norris.zalan.do',
                    tokenservice: 'https://tm-integration.norris.zalan.do'
                },
                STAGING: {
                    name: 'STAGING',
                    url: 'usf-stage.norris.zalan.do',
                    tokenservice: 'https://tm-stage.norris.zalan.do'
                },
                DEVELOPMENT: {
                    name: 'DEVELOPMENT',
                    url: 'usf-dev.norris.zalan.do',
                    tokenservice: 'https://tm-dev-ext.norris.zalan.do'
                },
                LOCAL: {
                    name: 'LOCAL',
                    url: 'localhost',
                    tokenservice: 'https://tm-dev-ext.norris.zalan.do'
                }
            };

            function getUrl(environment) {

            }

            function getLoginUrl (environment) {

            }

            function getLogourUrl (environment) {

            }

            function getTokensEndpointUrl (environment) {

            }
        }
        ]);
