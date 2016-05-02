angular.module('sc-authentication')
    .constant('ENVIRONMENTS', {
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
      STAGE: {
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
        port: 3000,
        tokenservice: 'https://tm-dev-ext.norris.zalan.do',
        domain: 'localhost'
      }
    });
