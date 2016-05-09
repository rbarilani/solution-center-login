angular.module('sc-authentication')
    .constant('ENVIRONMENTS', {
      PRODUCTION: {
        url: 'https://www.solutions.zalando.com',
        tokenservice: 'https://token-management.norris.zalan.do',
        userservice: 'https://user-management.norris.zalan.do',
        domain: 'solutions.zalando.com'
      },
      STAGE: {
        url: 'https://sc-stage.norris.zalan.do',
        tokenservice: 'https://tm-stage.norris.zalan.do',
        userservice: 'https://um-stage.norris.zalan.do',
        domain: '.zalan.do'
      },
      INTEGRATION: {
        url: 'https://sc-integration.norris.zalan.do',
        tokenservice: 'https://tm-integration.norris.zalan.do',
        userservice: 'https://um-integration.norris.zalan.do',
        domain: '.zalan.do'
      },
      DEVELOPMENT: {
        url: 'https://sc-development.norris.zalan.do',
        tokenservice: 'https://tm-development.norris.zalan.do',
        userservice: 'https://um-development.norris.zalan.do',
        domain: '.zalan.do'
      },
      LOCAL: {
        url: 'http://localhost:{PORT}',
        port: 3333,
        tokenservice: 'https://tm-development.norris.zalan.do',
        userservice: 'https://um-development.norris.zalan.do',
        domain: 'localhost'
      }
    });
