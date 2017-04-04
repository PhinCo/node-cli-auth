( function(){

	var Promise = require('bluebird');
	var fs = require('fs');
	var path = require('path');
	var _ = require('lodash');


	function NodeAuth( filename, optionalAuthKey ){
		if( !filename ) throw Error("Filename required to constructor of NodeAuth" );

		this.authDataKey = optionalAuthKey || "auth";
		const USER_HOME_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE || "";
		this.authFilePath = path.join( USER_HOME_PATH, filename );

		_ensureAuthFile( this );
	}

	NodeAuth.prototype.authStrategy = function( authData ){
		console.warn( "NodeAuth authStrategy not implemented. authentication always granted" );
		return Promise.resolve( authData );
	};

	NodeAuth.prototype.login = function( authData ){
		var self = this;
		return self.authStrategy( authData )
		.then( function( authData ){
			return _setAuthData( self, authData );
		})
	};

	NodeAuth.prototype.isAuthenticated = function(){
		var self = this;
		return _getAuthData( self )
		.then( function( authFileData ){
			return authFileData[ self.authDataKey ];
		});
	};

	NodeAuth.prototype.logout = function(){
		var self = this;
		return _setAuthData( self );
	};

	/** File Access Functions **/


	function _getAuthData( auth ){
		return _loadAuthFileData( auth )
	}

	function _setAuthData( auth, authData ){
		if( !authData ) authData = false;		// JSON safe falsey value

		return _loadAuthFileData( auth )
		.then( function( authFileData ){
			authFileData[ auth.authDataKey ] = authData;
			return _storeAuthFileData( auth, authFileData );
		});
	}

	function _loadAuthFileData( auth ){
		return new Promise( function( resolve, reject ){
			var jsonData = null;
			var authFileData = null;

			try{
				jsonData = fs.readFileSync( auth.authFilePath, { encoding: "utf8" } );
			}catch( error ){
				if( error && error.code === 'ENOENT' ){
					return resolve({});
				} else {
					console.error( "Failed to read auth data from file: ", auth.authFilePath );
					return reject( error );
				}
			}

			if( !jsonData || jsonData.length == 0 ){
				return resolve( {} );
			}


			try{
				authFileData = JSON.parse( jsonData );
			}catch( error ){
				console.error( "Failed to parse auth file data" );
				return reject( error );
			}

			resolve( authFileData );
		});
	}

	function _ensureAuthFile( auth ){
		if( !fs.existsSync( auth.authFilePath ) ){
			fs.writeFileSync( auth.authFilePath, "{}", { encoding: "utf8" });
		}
	}

	function _storeAuthFileData( auth, authFileData ){
		return new Promise( function( resolve, reject ){
			var jsonData = null;
			try{
				jsonData = JSON.stringify( authFileData, null, 2 );
			}catch( error ){
				console.error("Failed to stringify auth file data");
				return reject( error );
			}

			try{
				fs.writeFileSync( auth.authFilePath, jsonData, { encoding: "utf8" });
			}catch( error ){
				console.error("Failed to write auth data to file: ", auth.authFilePath );
				return reject( error );
			}

			resolve();
		});
	}

	module.exports = NodeAuth;
})();
