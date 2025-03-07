/**
 * Copyright (c) 2015 Lukas Reschke <lukas@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

describe('OC.SetupChecks tests', function() {
	var suite = this;
	var protocolStub;

	beforeEach( function(){
		protocolStub = sinon.stub(OC, 'getProtocol');
		suite.server = sinon.fakeServer.create();
	});

	afterEach( function(){
		suite.server.restore();
		protocolStub.restore();
	});

	describe('checkWebDAV', function() {
		it('should fail with another response status code than 201 or 207', function(done) {
			var async = OC.SetupChecks.checkWebDAV();

			suite.server.requests[0].respond(200);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your web server is not yet properly set up to allow file synchronization, because the WebDAV interface seems to be broken.',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				}]);
				done();
			});
		});

		it('should return no error with a response status code of 207', function(done) {
			var async = OC.SetupChecks.checkWebDAV();

			suite.server.requests[0].respond(207);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return no error with a response status code of 401', function(done) {
			var async = OC.SetupChecks.checkWebDAV();

			suite.server.requests[0].respond(401);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});
	});

	describe('checkWellKnownUrl', function() {
		it('should fail with another response status code than the expected one', function(done) {
			var async = OC.SetupChecks.checkWellKnownUrl('PROPFIND', '/.well-known/caldav', 'http://example.org/PLACEHOLDER', true, 207);

			suite.server.requests[0].respond(200);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your web server is not properly set up to resolve "/.well-known/caldav". Further information can be found in the <a target="_blank" rel="noreferrer noopener" class="external" href="http://example.org/admin-setup-well-known-URL">documentation ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return no error with the expected response status code', function(done) {
			var async = OC.SetupChecks.checkWellKnownUrl('PROPFIND', '/.well-known/caldav', 'http://example.org/PLACEHOLDER', true, 207);

			suite.server.requests[0].respond(207);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return no error with the default expected response status code', function(done) {
			var async = OC.SetupChecks.checkWellKnownUrl('PROPFIND', '/.well-known/caldav', 'http://example.org/PLACEHOLDER', true);

			suite.server.requests[0].respond(207);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return no error when no check should be run', function(done) {
			var async = OC.SetupChecks.checkWellKnownUrl('PROPFIND', '/.well-known/caldav', 'http://example.org/PLACEHOLDER', false);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});
	});

	describe('checkProviderUrl', function() {
		it('should fail with another response status code than the expected one', function(done) {
			var async = OC.SetupChecks.checkProviderUrl('/ocm-provider/', 'http://example.org/PLACEHOLDER', true);

			suite.server.requests[0].respond(302);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your web server is not properly set up to resolve "/ocm-provider/". This is most likely related to a web server configuration that was not updated to deliver this folder directly. Please compare your configuration against the shipped rewrite rules in ".htaccess" for Apache or the provided one in the documentation for Nginx at it\'s <a target="_blank" rel="noreferrer noopener" class="external" href="http://example.org/admin-nginx">documentation page ↗</a>. On Nginx those are typically the lines starting with "location ~" that need an update.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return no error with the expected response status code', function(done) {
			var async = OC.SetupChecks.checkProviderUrl('/ocm-provider/', 'http://example.org/PLACEHOLDER', true);

			suite.server.requests[0].respond(200);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return no error when no check should be run', function(done) {
			var async = OC.SetupChecks.checkProviderUrl('/ocm-provider/', 'http://example.org/PLACEHOLDER', false);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});
	});

	describe('checkWOFF2Loading', function() {
		it('should fail with another response status code than the expected one', function(done) {
			var async = OC.SetupChecks.checkWOFF2Loading(OC.filePath('core', '', 'fonts/NotoSans-Regular-latin.woff2'), 'http://example.org/PLACEHOLDER');

			suite.server.requests[0].respond(302);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your web server is not properly set up to deliver .woff2 files. This is typically an issue with the Nginx configuration. For Nextcloud 15 it needs an adjustement to also deliver .woff2 files. Compare your Nginx configuration to the recommended configuration in our <a target="_blank" rel="noreferrer noopener" class="external" href="http://example.org/admin-nginx">documentation ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return no error with the expected response status code', function(done) {
			var async = OC.SetupChecks.checkWOFF2Loading(OC.filePath('core', '', 'fonts/NotoSans-Regular-latin.woff2'), 'http://example.org/PLACEHOLDER');

			suite.server.requests[0].respond(200);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});
	});

	describe('checkDataProtected', function() {

		oc_dataURL = "data";

		it('should return an error if data directory is not protected', function(done) {
			var async = OC.SetupChecks.checkDataProtected();

			suite.server.requests[0].respond(200, {'Content-Type': 'text/plain'}, '');

			async.done(function( data, s, x ){
				expect(data).toEqual([
					{
						msg: 'Your data directory and files are probably accessible from the internet. The .htaccess file is not working. It is strongly recommended that you configure your web server so that the data directory is no longer accessible, or move the data directory outside the web server document root.',
						type: OC.SetupChecks.MESSAGE_TYPE_ERROR
					}]);
				done();
			});
		});

		it('should not return an error if data directory is protected', function(done) {
			var async = OC.SetupChecks.checkDataProtected();

			suite.server.requests[0].respond(403);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return an error if data directory is a boolean', function(done) {

			oc_dataURL = false;

			var async = OC.SetupChecks.checkDataProtected();

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});
	});

	describe('checkSetup', function() {
		it('should return an error if server has no internet connection', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: true,
					memcacheDocs: 'https://docs.nextcloud.com/server/go.php?to=admin-performance',
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([
					{
						msg: 'This server has no working internet connection: Multiple endpoints could not be reached. This means that some of the features like mounting external storage, notifications about updates or installation of third-party apps will not work. Accessing files remotely and sending of notification emails might not work, either. Establish a connection from this server to the internet to enjoy all features.',
						type: OC.SetupChecks.MESSAGE_TYPE_WARNING
					}, {
						msg: 'No memory cache has been configured. To enhance performance, please configure a memcache, if available. Further information can be found in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.nextcloud.com/server/go.php?to=admin-performance">documentation ↗</a>.',
						type: OC.SetupChecks.MESSAGE_TYPE_INFO
					}]);
				done();
			});
		});

		it('should return an error if server has no internet connection and data directory is not protected', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: true,
					memcacheDocs: 'https://docs.nextcloud.com/server/go.php?to=admin-performance',
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([
					{
						msg: 'This server has no working internet connection: Multiple endpoints could not be reached. This means that some of the features like mounting external storage, notifications about updates or installation of third-party apps will not work. Accessing files remotely and sending of notification emails might not work, either. Establish a connection from this server to the internet to enjoy all features.',
						type: OC.SetupChecks.MESSAGE_TYPE_WARNING
					},
					{
						msg: 'No memory cache has been configured. To enhance performance, please configure a memcache, if available. Further information can be found in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.nextcloud.com/server/go.php?to=admin-performance">documentation ↗</a>.',
						type: OC.SetupChecks.MESSAGE_TYPE_INFO
					}]);
				done();
			});
		});

		it('should return an error if server has no internet connection and data directory is not protected and memcache is available', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: true,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([
				{
					msg: 'This server has no working internet connection: Multiple endpoints could not be reached. This means that some of the features like mounting external storage, notifications about updates or installation of third-party apps will not work. Accessing files remotely and sending of notification emails might not work, either. Establish a connection from this server to the internet to enjoy all features.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}
				]);
				done();
			});
		});

		it('should return an error if /dev/urandom is not accessible', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: false,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'No suitable source for randomness found by PHP which is highly discouraged for security reasons. Further information can be found in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.nextcloud.com/myDocs.html">documentation ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				}]);
				done();
			});
		});

		it('should return an error if the wrong memcache PHP module is installed', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: false,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Memcached is configured as distributed cache, but the wrong PHP module "memcache" is installed. \\OC\\Memcache\\Memcached only supports "memcached" and not "memcache". See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://code.google.com/p/memcached/wiki/PHPClientComparison">memcached wiki about both modules ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return an info if the mail server config was not set or verified, yet', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: false,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'You have not set or verified your email server configuration, yet. Please head over to the <a href="http://localhost/index.php/settings/admin">Basic settings</a> in order to set them. Afterwards, use the "Send email" button below the form to verify your settings.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return a warning if there are app directories with wrong permissions', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [
						'/some/path'
					],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Some app directories are owned by a different user than the web server one. This may be the case if apps have been installed manually. Check the permissions of the following app directories:<ul><li>/some/path</li></ul>',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return an error if the forwarded for headers are not working', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: false,
					reverseProxyDocs: 'https://docs.nextcloud.com/foo/bar.html',
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The reverse proxy header configuration is incorrect, or you are accessing Nextcloud from a trusted proxy. If not, this is a security issue and can allow an attacker to spoof their IP address as visible to the Nextcloud. Further information can be found in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.nextcloud.com/foo/bar.html">documentation ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return an error if set_time_limit is unavailable', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					reverseProxyDocs: 'https://docs.nextcloud.com/foo/bar.html',
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: false,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The PHP function "set_time_limit" is not available. This could result in scripts being halted mid-execution, breaking your installation. Enabling this function is strongly recommended.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return a warning if the memory limit is below the recommended value', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					reverseProxyDocs: 'https://docs.nextcloud.com/foo/bar.html',
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: false,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The PHP memory limit is below the recommended value of 512MB.',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				}]);
				done();
			});
		});

		it('should return an error if the response has no statuscode 200', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				500,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({data: {serverHasInternetConnectionProblems: true}})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Error occurred while checking server setup',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				}]);
				done();
			});
		});

		it('should return an error if the php version is no longer supported', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					phpSupported: {eol: true, version: '5.4.0'},
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'You are currently running PHP 5.4.0. Upgrade your PHP version to take advantage of <a target="_blank" rel="noreferrer noopener" class="external" href="https://secure.php.net/supported-versions.php">performance and security updates provided by the PHP Group ↗</a> as soon as your distribution supports it.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return an info if server has no proper opcache', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: ['recommendation1', 'recommendation2'],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
						msg: 'The PHP OPcache module is not properly configured. See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-php-opcache">documentation ↗</a> for more information.<ul><li>recommendation1</li><li>recommendation2</li></ul>',
						type: OC.SetupChecks.MESSAGE_TYPE_INFO
					}]);
				done();
			});
		});

		it('should return an info if server has no FreeType support', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json'
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: false,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your PHP does not have FreeType support, resulting in breakage of profile pictures and the settings interface.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return an error if the php version is no longer supported', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: true,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'MySQL is used as database but does not support 4-byte characters. To be able to handle 4-byte characters (like emojis) without issues in filenames or comments for example it is recommended to enable the 4-byte support in MySQL. For further details read <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-mysql-utf8mb4">the documentation page about this ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

    // THe following test is invalid as the code in core/js/setupchecks.js is calling
    // window.location.protocol which always return http during tests
    // if there is a way to trick window.location.protocol during test, then we could re-activate it
    /*
		it('should return an error if the protocol is https but the server generates http links', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyDocs: 'https://docs.nextcloud.com/foo/bar.html',
					reverseProxyGeneratedURL: 'http://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'You are accessing your instance over a secure connection, however your instance is generating insecure URLs. This most likely means that you are behind a reverse proxy and the overwrite config variables are not set correctly. Please read <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.nextcloud.com/foo/bar.html">the documentation page about this ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});
    */
		it('should not return an error if the protocol is http and the server generates http links', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyDocs: 'https://docs.nextcloud.com/foo/bar.html',
					reverseProxyGeneratedURL: 'http://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		it('should return an error if there is not enough free space in the temp directory', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: false,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'This instance uses an S3 based object store as primary storage. The uploaded files are stored temporarily on the server and thus it is recommended to have 50 GB of free space available in the temp directory of PHP. Check the logs for full details about the path and the available space. To improve this please change the temporary directory in the php.ini or make more space available in that path.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		
		it('should return an error if imagick is not enabled', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: false,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The PHP module "imagick" is not enabled although the theming app is. For favicon generation to work correctly, you need to install and enable this module.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		
		it('should return an error if gmp or bcmath are not enabled', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: false,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The PHP modules "gmp" and/or "bcmath" are not enabled. If you use WebAuthn passwordless authentication, these modules are required.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return an error for 32bit instances', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: false,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'It seems like you are running a 32bit PHP version. Nextcloud needs 64bit to run well. Please upgrade your OS and PHP to 64bit! For further details read <a href="https://docs.example.org/admin-system-requirements" class="external" rel="noreferrer noopener">the documentation page about this ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});

		it('should return an info if there is no default phone region', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: false,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: true,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Your installation has no default phone region set. This is required to validate phone numbers in the profile settings without a country code. To allow numbers without a country code, please add "default_phone_region" with the respective <a target="_blank" rel="noreferrer noopener" class="external" href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements">ISO 3166-1 code ↗</a> of the region to your config file.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}]);
				done();
			});
		});

		it('should return an info if the temporary directory is either non-existent or non-writable', function(done) {
			var async = OC.SetupChecks.checkSetup();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
				},
				JSON.stringify({
					hasFileinfoInstalled: true,
					isGetenvServerWorking: true,
					isReadOnlyConfig: false,
					wasEmailTestSuccessful: true,
					hasWorkingFileLocking: true,
					hasValidTransactionIsolationLevel: true,
					suggestedOverwriteCliURL: '',
					isRandomnessSecure: true,
					securityDocs: 'https://docs.nextcloud.com/myDocs.html',
					isFairUseOfFreePushService: true,
					serverHasInternetConnectionProblems: false,
					isMemcacheConfigured: true,
					forwardedForHeadersWorking: true,
					isCorrectMemcachedPHPModuleInstalled: true,
					hasPassedCodeIntegrityCheck: true,
					OpcacheSetupRecommendations: [],
					isSettimelimitAvailable: true,
					hasFreeTypeSupport: true,
					missingIndexes: [],
					missingPrimaryKeys: [],
					missingColumns: [],
					cronErrors: [],
					cronInfo: {
						diffInSeconds: 0
					},
					isMemoryLimitSufficient: true,
					appDirsWithDifferentOwner: [],
					isImagickEnabled: true,
					areWebauthnExtensionsEnabled: true,
					is64bit: true,
					recommendedPHPModules: [],
					pendingBigIntConversionColumns: [],
					isMysqlUsedWithoutUTF8MB4: false,
					isDefaultPhoneRegionSet: true,
					isEnoughTempSpaceAvailableIfS3PrimaryStorageIsUsed: true,
					reverseProxyGeneratedURL: 'https://server',
					temporaryDirectoryWritable: false,
				})
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'The temporary directory of this instance points to an either non-existing or non-writable directory.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}]);
				done();
			});
		});
	});

	describe('checkGeneric', function() {
		it('should return an error if the response has no statuscode 200', function(done) {
			var async = OC.SetupChecks.checkGeneric();

			suite.server.requests[0].respond(
				500,
				{
					'Content-Type': 'application/json'
				}
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([{
					msg: 'Error occurred while checking server setup',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				},{
					msg: 'Error occurred while checking server setup',
					type: OC.SetupChecks.MESSAGE_TYPE_ERROR
				}]);
				done();
			});
		});

		it('should return all errors if all headers are missing', function(done) {
			protocolStub.returns('https');
			var async = OC.SetupChecks.checkGeneric();

			suite.server.requests[0].respond(
				200,
				{
					'Content-Type': 'application/json',
					'Strict-Transport-Security': 'max-age=15768000'
				},
				'{}'
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([
				{
					msg: 'The "X-Content-Type-Options" HTTP header is not set to "nosniff". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "X-Robots-Tag" HTTP header is not set to "none". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "X-Frame-Options" HTTP header is not set to "SAMEORIGIN". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "X-Permitted-Cross-Domain-Policies" HTTP header is not set to "none". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "X-XSS-Protection" HTTP header doesn\'t contain "1; mode=block". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "Referrer-Policy" HTTP header is not set to "no-referrer", "no-referrer-when-downgrade", "strict-origin", "strict-origin-when-cross-origin" or "same-origin". This can leak referer information. See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://www.w3.org/TR/referrer-policy/">W3C Recommendation ↗</a>.',
					type: OC.SetupChecks.MESSAGE_TYPE_INFO
				}
				]);
				done();
			});
		});

		it('should return only some errors if just some headers are missing', function(done) {
			protocolStub.returns('https');
			var async = OC.SetupChecks.checkGeneric();

			suite.server.requests[0].respond(
				200,
				{
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'Strict-Transport-Security': 'max-age=15768000;preload',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				}
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([
				{
					msg: 'The "X-Content-Type-Options" HTTP header is not set to "nosniff". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING
				}, {
					msg: 'The "X-XSS-Protection" HTTP header doesn\'t contain "1; mode=block". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
					type: OC.SetupChecks.MESSAGE_TYPE_WARNING,
				}
				]);
				done();
			});
		});

		it('should return none errors if all headers are there', function(done) {
			protocolStub.returns('https');
			var async = OC.SetupChecks.checkGeneric();

			suite.server.requests[0].respond(
				200,
				{
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'Strict-Transport-Security': 'max-age=15768000',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer'
				}
			);

			async.done(function( data, s, x ){
				expect(data).toEqual([]);
				done();
			});
		});

		describe('check X-XSS-Protection header', function() {
			it('should return no message if X-XSS-Protection is set to 1; mode=block; report=https://example.com', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block; report=https://example.com',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return no message if X-XSS-Protection is set to 1; mode=block', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return a message if X-XSS-Protection is set to 1', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([
						{
							msg: 'The "X-XSS-Protection" HTTP header doesn\'t contain "1; mode=block". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
							type: OC.SetupChecks.MESSAGE_TYPE_WARNING
						}
					]);
					done();
				});
			});

			it('should return a message if X-XSS-Protection is set to 0', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '0',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([
						{
							msg: 'The "X-XSS-Protection" HTTP header doesn\'t contain "1; mode=block". This is a potential security or privacy risk, as it is recommended to adjust this setting accordingly.',
							type: OC.SetupChecks.MESSAGE_TYPE_WARNING
						}
					]);
					done();
				});
			});
		});

		describe('check Referrer-Policy header', function() {
			it('should return no message if Referrer-Policy is set to no-referrer', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return no message if Referrer-Policy is set to no-referrer-when-downgrade', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'no-referrer-when-downgrade',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return no message if Referrer-Policy is set to strict-origin', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'strict-origin',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return no message if Referrer-Policy is set to strict-origin-when-cross-origin', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'strict-origin-when-cross-origin',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return no message if Referrer-Policy is set to same-origin', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'same-origin',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([]);
					done();
				});
			});

			it('should return a message if Referrer-Policy is set to origin', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'origin',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([
						{
							msg: 'The "Referrer-Policy" HTTP header is not set to "no-referrer", "no-referrer-when-downgrade", "strict-origin", "strict-origin-when-cross-origin" or "same-origin". This can leak referer information. See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://www.w3.org/TR/referrer-policy/">W3C Recommendation ↗</a>.',
							type: OC.SetupChecks.MESSAGE_TYPE_INFO
						}
					]);
					done();
				});
			});

			it('should return a message if Referrer-Policy is set to origin-when-cross-origin', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'origin-when-cross-origin',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([
						{
							msg: 'The "Referrer-Policy" HTTP header is not set to "no-referrer", "no-referrer-when-downgrade", "strict-origin", "strict-origin-when-cross-origin" or "same-origin". This can leak referer information. See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://www.w3.org/TR/referrer-policy/">W3C Recommendation ↗</a>.',
							type: OC.SetupChecks.MESSAGE_TYPE_INFO
						}
					]);
					done();
				});
			});

			it('should return a message if Referrer-Policy is set to unsafe-url', function(done) {
				protocolStub.returns('https');
				var result = OC.SetupChecks.checkGeneric();

				suite.server.requests[0].respond(200, {
					'Strict-Transport-Security': 'max-age=15768000',
					'X-XSS-Protection': '1; mode=block',
					'X-Content-Type-Options': 'nosniff',
					'X-Robots-Tag': 'none',
					'X-Frame-Options': 'SAMEORIGIN',
					'X-Permitted-Cross-Domain-Policies': 'none',
					'Referrer-Policy': 'unsafe-url',
				});

				result.done(function( data, s, x ){
					expect(data).toEqual([
						{
							msg: 'The "Referrer-Policy" HTTP header is not set to "no-referrer", "no-referrer-when-downgrade", "strict-origin", "strict-origin-when-cross-origin" or "same-origin". This can leak referer information. See the <a target="_blank" rel="noreferrer noopener" class="external" href="https://www.w3.org/TR/referrer-policy/">W3C Recommendation ↗</a>.',
							type: OC.SetupChecks.MESSAGE_TYPE_INFO
						}
					]);
					done();
				});
			});
		});
	});

	it('should return a SSL warning if HTTPS is not used', function(done) {
		protocolStub.returns('http');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200,
			{
				'X-XSS-Protection': '1; mode=block',
				'X-Content-Type-Options': 'nosniff',
				'X-Robots-Tag': 'none',
				'X-Frame-Options': 'SAMEORIGIN',
				'X-Permitted-Cross-Domain-Policies': 'none',
				'Referrer-Policy': 'no-referrer',
			}
		);

		async.done(function( data, s, x ){
			expect(data).toEqual([{
				msg: 'Accessing site insecurely via HTTP. You are strongly advised to set up your server to require HTTPS instead, as described in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-security">security tips ↗</a>.',
				type: OC.SetupChecks.MESSAGE_TYPE_WARNING
			}]);
			done();
		});
	});

	it('should return an error if the response has no statuscode 200', function(done) {
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(
			500,
			{
				'Content-Type': 'application/json'
			},
			JSON.stringify({data: {serverHasInternetConnectionProblems: true}})
		);
		async.done(function( data, s, x ){
			expect(data).toEqual([{
				msg: 'Error occurred while checking server setup',
				type: OC.SetupChecks.MESSAGE_TYPE_ERROR
			}, {
				msg: 'Error occurred while checking server setup',
				type: OC.SetupChecks.MESSAGE_TYPE_ERROR
			}]);
			done();
		});
	});

	it('should return a SSL warning if SSL used without Strict-Transport-Security-Header', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200,
			{
				'X-XSS-Protection': '1; mode=block',
				'X-Content-Type-Options': 'nosniff',
				'X-Robots-Tag': 'none',
				'X-Frame-Options': 'SAMEORIGIN',
				'X-Permitted-Cross-Domain-Policies': 'none',
				'Referrer-Policy': 'no-referrer',
			}
		);

		async.done(function( data, s, x ){
			expect(data).toEqual([{
				msg: 'The "Strict-Transport-Security" HTTP header is not set to at least "15552000" seconds. For enhanced security, it is recommended to enable HSTS as described in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-security">security tips ↗</a>.',
				type: OC.SetupChecks.MESSAGE_TYPE_WARNING
			}]);
			done();
		});
	});

	it('should return a SSL warning if SSL used with to small Strict-Transport-Security-Header', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200,
			{
				'Strict-Transport-Security': 'max-age=15551999',
				'X-XSS-Protection': '1; mode=block',
				'X-Content-Type-Options': 'nosniff',
				'X-Robots-Tag': 'none',
				'X-Frame-Options': 'SAMEORIGIN',
				'X-Permitted-Cross-Domain-Policies': 'none',
				'Referrer-Policy': 'no-referrer',
			}
		);

		async.done(function( data, s, x ){
			expect(data).toEqual([{
				msg: 'The "Strict-Transport-Security" HTTP header is not set to at least "15552000" seconds. For enhanced security, it is recommended to enable HSTS as described in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-security">security tips ↗</a>.',
				type: OC.SetupChecks.MESSAGE_TYPE_WARNING
			}]);
			done();
		});
	});

	it('should return a SSL warning if SSL used with to a bogus Strict-Transport-Security-Header', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200,
			{
				'Strict-Transport-Security': 'iAmABogusHeader342',
				'X-XSS-Protection': '1; mode=block',
				'X-Content-Type-Options': 'nosniff',
				'X-Robots-Tag': 'none',
				'X-Frame-Options': 'SAMEORIGIN',
				'X-Permitted-Cross-Domain-Policies': 'none',
				'Referrer-Policy': 'no-referrer',
			}
		);

		async.done(function( data, s, x ){
			expect(data).toEqual([{
				msg: 'The "Strict-Transport-Security" HTTP header is not set to at least "15552000" seconds. For enhanced security, it is recommended to enable HSTS as described in the <a target="_blank" rel="noreferrer noopener" class="external" href="https://docs.example.org/admin-security">security tips ↗</a>.',
				type: OC.SetupChecks.MESSAGE_TYPE_WARNING
			}]);
			done();
		});
	});

	it('should return no SSL warning if SSL used with to exact the minimum Strict-Transport-Security-Header', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200, {
			'Strict-Transport-Security': 'max-age=15768000',
			'X-XSS-Protection': '1; mode=block',
			'X-Content-Type-Options': 'nosniff',
			'X-Robots-Tag': 'none',
			'X-Frame-Options': 'SAMEORIGIN',
			'X-Permitted-Cross-Domain-Policies': 'none',
			'Referrer-Policy': 'no-referrer',
		});

		async.done(function( data, s, x ){
			expect(data).toEqual([]);
			done();
		});
	});

	it('should return no SSL warning if SSL used with to more than the minimum Strict-Transport-Security-Header', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200, {
			'Strict-Transport-Security': 'max-age=99999999',
			'X-XSS-Protection': '1; mode=block',
			'X-Content-Type-Options': 'nosniff',
			'X-Robots-Tag': 'none',
			'X-Frame-Options': 'SAMEORIGIN',
			'X-Permitted-Cross-Domain-Policies': 'none',
			'Referrer-Policy': 'no-referrer',
		});

		async.done(function( data, s, x ){
			expect(data).toEqual([]);
			done();
		});
	});

	it('should return no SSL warning if SSL used with to more than the minimum Strict-Transport-Security-Header and includeSubDomains parameter', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200, {
			'Strict-Transport-Security': 'max-age=99999999; includeSubDomains',
			'X-XSS-Protection': '1; mode=block',
			'X-Content-Type-Options': 'nosniff',
			'X-Robots-Tag': 'none',
			'X-Frame-Options': 'SAMEORIGIN',
			'X-Permitted-Cross-Domain-Policies': 'none',
			'Referrer-Policy': 'no-referrer',
		});

		async.done(function( data, s, x ){
			expect(data).toEqual([]);
			done();
		});
	});

	it('should return no SSL warning if SSL used with to more than the minimum Strict-Transport-Security-Header and includeSubDomains and preload parameter', function(done) {
		protocolStub.returns('https');
		var async = OC.SetupChecks.checkGeneric();

		suite.server.requests[0].respond(200, {
			'Strict-Transport-Security': 'max-age=99999999; preload; includeSubDomains',
			'X-XSS-Protection': '1; mode=block',
			'X-Content-Type-Options': 'nosniff',
			'X-Robots-Tag': 'none',
			'X-Frame-Options': 'SAMEORIGIN',
			'X-Permitted-Cross-Domain-Policies': 'none',
			'Referrer-Policy': 'no-referrer',
		});

		async.done(function( data, s, x ){
			expect(data).toEqual([]);
			done();
		});
	});
});
