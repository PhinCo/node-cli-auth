# node-cli-auth

Simple module for authenticating a command line tool

Enable your command line tool with commands such as:
```sh
tool login -u username -p password
tool logout
tool whoami
```

Auth details are stored in hidden file in the user's HOME directory (default is `~/.node-cli-auth`.

You can supply any authentication strategy (default simply stores current user).

## Installation

`npm install @connectedyard/node-cli-auth`

## Usage

You can use the module directly as follows:

```js
var auth = require('node-cli-auth');

auth.isAuthenticated()
.then( function( authData ){
    if( authData ){
        /** continue with authData.name and authData.secret **/
    }else{
        console.log("Use must be logged in");
    }
});
```

Or wrap the module in your own for customization

```js
/* mytool-auth.js, usage: var auth = require('mytool.js') */
var auth = require('@connectedyard/node-cli-auth');
var service = require('my-authenticated-service');

auth.authFileName = '.mytool';
auth.authStrategy = function( name, secret ){
    return service.login( { email: name, password: secret } );
};

module.exports = auth;
```

## API

#### authFileName
string, default ".node-cli-auth"

#### authKey
string, default "auth"

Set **authFileName** to your preferred file name, and **authKey** to your 
preferred key. This is where the response from your authentication strategy
will be stored. The auth file must be a JSON file. If it does not already exist
if will be created.

You can extend this file with own configuration data.


#### authStrategy
function( name, secret), returns Promise resolving to authentication results.

default always authenticates, resolving to **name**

Set **authStragey** to your authentication function. Your function will passed
a name and secret, and should return a Promise.

On Authentication Success, your function should resolve to the authentication
result you need to store. On Authentication Failure, resolve to false.


#### login( name, secret )
Promise, resolves to your authentication response on success, or false on failure.

**name* and **secret** will be passed to the authentication strategy. The results will
be stored in the auth file before being returned to you.


#### isAuthenticated()
Promise, resolves to the last authentication response, or false if not logged in.


#### logout()
Promise

Removes your authentication response data from the auth file.


## Implementing Auth CLI

With `node-cli-auth` and `commander` it's easy to create auth command in your CLI.

### mytool-login

```js
#!/usr/bin/env node
var program = require( 'commander' );
var auth = require('@connectedyard/node-cli-auth');

program
.option( '-e, --email [email]' )
.option( '-p, --password [password]' )
.parse( process.argv );

if( !program.email || !program.password ){
	console.error("required inputs missing");
	process.exit(1);
}
auth.login( program.email, program.password )
.then( function( authData ){
	console.log("Logged in as " + program.email);
})
.catch( function( error ){
	console.error("Failed to login as " + program.email);
	process.exit(1);
});
```

### mytool-logout
```js
#!/usr/bin/env node
var auth = require('@connectedyard/node-cli-auth');
auth.logout();
```

### mytool-whoami
```js
#!/usr/bin/env node
var auth = require('@connectedyard/node-cli-auth');
auth.isAuthenticated()
.then( function( authData ){
	if( authData.name ){
		console.log( authData.name );
		process.exit(0);
	}else{
		console.log( "Not logged in. Use mytool-login");
		process.exit(1);
	}
});
```