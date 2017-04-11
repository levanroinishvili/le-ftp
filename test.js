// Load module le-ftp.js
//		Use './le-ftp' if the module is in the same folder as this script
//		Otherwise, use the correct path, taking into consideration how node.js module resolution
//		For more information, see File Modules on nodejs documentation. https://nodejs.org/api/modules.html#modules_file_modules

LEftp = require('le-ftp');

var x = new LEftp({
	"host"		: '',
	"port"		: 21,
	"user"		: '',
	"password"	: '',

	"watchList"	:	[
						{
							"localRootDir"	: "C:/my/local/folder1",
							"remoteRootDir"	: 'public_html/remote/dir1'
						},
						{
							"localRootDir"	: "C:/my/local/folder2",
							"remoteRootDir"	: 'public_html/remote/dir2'
						}
					],
	// The following two parameters are depricated. Use watchList array instead
	// "localRootDir"		: "C:/my/local/folder",		// Depricated, use watchList array instead
	// "remoteRootDir"		: 'public_html/remote/dir',	// Depricated, use watchList array instead

	"frequency"			: 1,	// Number of seconds between each scan
	"ext"				: ['.css','.js','.html','txt','jpg'],
	"onStartUploadAll"	: true	// On start, upload all files (that match the "watch criteria").
});


// Schedule to stop watching in 5 seconds (5000 milliseconds)
setTimeout(
	function() {x.stop();} ,
	5 * 1000					// Schedule stop after 5 seconds (5,000 milliseconds)
);