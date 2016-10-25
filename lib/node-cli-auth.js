( function(){

	var Promise = require('bluebird');
	var fs = require('fs');
	var path = require('path');
	var _ = require('lodash');

	exports.authFileName = ".node-cli-auth";
	exports.authDataKey = "auth";

	function _authFilePath(){
		var USER_HOME_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE || "";
		return path.join( USER_HOME_PATH, exports.authFileName )
	}

	exports.authStrategy = function( name, secret ){
		return Promise.resolve( { name: name });
	};

	exports.login = function( name, secret ){
		exports.authStrategy( name, secret )
		.then( function( authData ){
			return _setAuthData( authData );
		});
	};


	exports.isAuthenticated = function(){
		return _getAuthData();
	};

	exports.logout = function(){
		return _setAuthData( false );
	};

	exports.whoami = function(){
		return _getAuthData()
		.then( function( authData ){
			return _.get( authData, 'name' );
		});
	};

	/** File Access Functions **/


	function _getAuthData(){
		return _loadAuthFileData( _authFilePath() )
		.then( function( authFileData ){
			return _.get( authFileData, exports.authDataKey );
		});
	}

	function _setAuthData( authData ){
		return _loadAuthFileData( _authFilePath() )
		.then( function( authFileData ){
			authFileData = authFileData || {};
			authFileData[ exports.authDataKey ] = authData;
			return _storeAuthFileData( _authFilePath(), authFileData );
		});
	}

	function _loadAuthFileData( authFilePath ){
		return new Promise( function( resolve, reject ){
			var jsonData = null;

			try{
				jsonData = fs.readFileSync( authFilePath, { encoding: "utf8" } );
			}catch( error ){
				if( error && error.code === 'ENOENT' ){
					return resolve({});
				} else {
					console.error( "Failed to read auth data from file: ", authFilePath );
					return reject( error );
				}
			}

			var authFileData = null;

			try{
				authFileData = JSON.parse( jsonData );
			}catch( error ){
				console.error( "Failed to parse auth file data" );
				return reject( error );
			}

			resolve( authFileData );
		});
	}


	function _storeAuthFileData( authFilePath, authFileData ){
		return new Promise( function( resolve, reject ){
			var jsonData = null;
			try{
				jsonData = JSON.stringify( authFileData, null, 2 );
			}catch( error ){
				console.error("Failed to stringify auth file data");
				return reject( error );
			}

			try{
				fs.writeFileSync( authFilePath, jsonData, { encoding: "utf8" });
			}catch( error ){
				console.error("Failed to write auth data to file: ", authFilePath );
				return reject( error );
			}

			resolve();
		});
	}
})();
