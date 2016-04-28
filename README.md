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

3. Configure the required environment ('PRODUCTION', 'INTEGRATION', 'STAGE', 'DEVELOPMENT' or 'LOCAL') for correct redirection handling:

    ```javascript
    authenticationServiceProvider.configEnvironment('STAGE');
    ```
    
    The default value is 'LOCAL' and you can also optionally set:
    - A port in case you run your application in this environment using a different port than the default one (3000)
    - An endpoint for the Token Service in case you want to mock it instead of using the default one ('https://tm-development.norris.zalan.do')

    ```javascript
    authenticationServiceProvider.configEnvironment('LOCAL', 3001, 'mockedTokenService');
    ```    
    
4. Due to limitations of redirecting using the $window service, whenever any app which performs the actual authentication through the User Service and redirects back to the Authentication app after completing it (typically the Solution Center app), is hosted in the same subdomain as the Authentication app, a different redirection mechanism using the $location service has to be used, which can be enabled through the following method: 

    ```javascript
    authenticationServiceProvider.setInternalCommunication(true);
    ```    
    
    In most of the cases you can simply ignore this flag since the mechanism is *disabled by default* which is the most common situation. However, it becomes necessary when configured in any of the two following situations:
    - Solution Center app (since the Authentication app will always be hosted in its same domain)
    - In local development, when mocking the Solution Center mechanism to authenticate via the User Service, in order to bypass it and avoid the need of having the Solution Center app running locally
    
5. Protect a certain view, requiring the existence of an authenticated user to access it by calling the specific method for it inside the resolve method of your routing provider (ngRoute, UI-router):

    ```javascript
    resolve: {
        auth : function(authenticationService) {
            return authenticationService.requireAuthenticatedUser();
        }
    }
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
