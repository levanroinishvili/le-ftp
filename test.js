LEftp = require('le-ftp');

var x = new LEftp({
	"host"		: '',
	"port"		: 21,
	"user"		: '',
	"password"	: '',

	"localRootDir"	: "C:/my/local/dir",
	"remoteRootDir"	: 'public_html/remote/dir',
	"frequency"		: 1,	// Number of seconds between each scan
	"ext"			: ['.css','.js','.html','txt','jpg']
});