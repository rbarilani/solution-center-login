# Solution Center Login
Login service to handle authentication in the Zalando Solution Center

### Installation

Install via bower

```shell
bower install solution-center-login
```

Install via npm

```shell
npm install solution-center-login
```

### Usage

1. Load the script in your `<head>` from Bower:

    ```html
    <script src="../bower_components/solution-center-login/dist/solution-center-login.js"></script>
    ```
    
    Or from NPM:
    
    
    ```html
    <script src="../node_modules/solution-center-login/dist/solution-center-login.js"></script>
    ```

2. Inject the **authenticationServiceProvider** in the config method of your app and add the module dependency of **sc-authentication**:

    ```javascript
    angular.module('my-module', ['sc-authentication']).
      .config(['authenticationServiceProvider', function(authenticationServiceProvider) {
    ```

3. Configure the required environment ('PRODUCTION', 'INTEGRATION', 'STAGING', 'DEVELOPMENT' or 'LOCAL') for correct redirection handling:

    ```javascript
    authenticationServiceProvider.configEnvironment('STAGING');
    ```
    
The default value is 'LOCAL' and you can also optionally set a port in case you run your application in this environment using a different port than the default one (3000):

    ```javascript
    authenticationServiceProvider.configEnvironment('LOCAL', 3001);
    ```    
    
4. Due to limitations of redirecting using the $window service, the Solution Center application needs to activate a flag to use a different redirection with using the $location service. The rest of applications can ignore this configuration since it's disabled by default.

    ```javascript
    authenticationServiceProvider.setSolutionCenterCommunication(true);
    ```    

### Develop

Clone the repository, then run:

```shell
bower install
npm install
```

Install Gulp via npm if you don't have it already:

```shell
npm install -g gulp
```

#### Available commands

* `gulp build`: build the project and make new files in `dist`
* `gulp serve`: start a server to serve the demo page and launch a browser then watches for changes in `src` files to reload the page
* `gulp test`: run unit tests

### License
MIT
