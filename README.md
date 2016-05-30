# Solution Center Login
Login service to handle authentication in the Zalando Solution Center

### Installation

Install via bower or npm

```shell
bower install solution-center-login
npm install solution-center-login
```

### Usage

1. Load the script in your `<head>` from Bower or NPM:

    ```html
    <script src="../bower_components/solution-center-login/dist/solution-center-login.js"></script>
    <script src="../node_modules/solution-center-login/dist/solution-center-login.js"></script>
    ```
    For Bower, if you are using [wiredep](https://github.com/taptapship/wiredep), it will be loaded automatically.

2. Add **sc-authentication** as a module dependency.

    ```javascript
    angular.module('my-module', ['sc-authentication'])
    ```

3. Configure the application by injecting **authenicationServiceProvider** in your config block and setting the environment.

    ```javascript
    .config(['authenticationServiceProvider', function(authenticationServiceProvider) {
        authenticationServiceProvider.configEnvironment('STAGE');
    }
    ```
    Environment options:
    * 'LOCAL' (see [Running locally](#running-locally))
    * 'INTEGRATION'
    * 'STAGE'
    * 'PRODUCTION'

4. Protect a certain view (or your entire application) by attaching a resolve to the route (works with [ngRoute](https://docs.angularjs.org/api/ngRoute/provider/$routeProvider) and [UI Router](https://github.com/angular-ui/ui-router).

    ```javascript
    resolve: {
        auth : function(authenticationService) {
            return authenticationService.requireAuthenticatedUser();
        }
    }
```    

### Running locally

When running locally, you need to connect this service to a real (or mocked) login page to handle authentication. You have two options:

#### Run Solution Center locally alongside your application
1. Pull the latest version of the [Solution Center](https://github.bus.zalan.do/norris/solution-center).
2. Follow instructions for [installing and running locally](https://github.bus.zalan.do/norris/solution-center#local-installation). Note the <PORT> it is running on.
3. Configure this application to use your local copy for login.

    ```javascript
    authenticationServiceProvider.setInternalCommunication(true);
    authenticationServiceProvider.configEnvironment('LOCAL', <PORT>);
    ```
4. (Optional) Override the token service URL to point to a different Solution Center environment (default is DEVELOPMENT).

    ```javascript
    authenticationServiceProvider.configEnvironment('LOCAL', <PORT>, 'tm-integration.norris.zalan.do');
    ```

#### Mock the Solution Center locally
1. Use any login page you like, as long as it is served locally at `/login`.
2. Call `authenticationService.silentLogin(email, password)` from the mocked login.
3. Configure this application to use your local login mock.

    ```javascript
    authenticationServiceProvider.setInternalCommunication(true);
    authenticationServiceProvider.configEnvironment('LOCAL', <PORT>);
    ```
4. (Optional) Override the token service URL to point to a mocked token endpoint.

    ```javascript
    authenticationServiceProvider.configEnvironment('LOCAL', <PORT>, 'your.mocked.token.endpoint');
    ```
Note: to work correctly with this library, your mocked token endpoint should conform to our [token API spec](https://token-management.norris.zalan.do/api/index.html#/Token).

### Develop

1. Clone the repository, then run:

```shell
bower install
npm install
```

2. Install Gulp via npm if you don't have it already:

```shell
npm install -g gulp
```

#### Available commands

* `gulp build`: build the project and make new files in `dist`
* `gulp test`: run unit tests

### License
MIT
