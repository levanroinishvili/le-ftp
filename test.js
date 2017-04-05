LEftp = require('le-ftp');

var x = new LEftp({
	"host"		: '',
	"port"		: 21,
	"user"		: '',
	"password"	: '',

	"localRootDir"	: "C:\\Users\\Levan.Roinishvili\\Desktop\\landings",
	"remoteRootDir"	: 'public_html/dev.clubfinance.uk/angular',
	"frequency"		: 1,	// Number of seconds between each scan
	"ext"			: ['.css','.js','.html','txt','jpg']
});