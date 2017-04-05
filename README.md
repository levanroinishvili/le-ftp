# le-ftp
###Watch local directory (and its sub-directories) for changes and uploads changed files via ftp - node.js

This is not fully tested and should not be used in any critical applications.

## ***Important***
- On some networks the node.js ftp module cannot connect and returns ECONNREFUSED error
- This could be resolved by editing file `node_modules/ftp/lib/connections.js`
- Open the file and go to line 106, which says
  - `socket.setKeepAlive(true);`
- Change `true` to `false`, so that it now says
  - `socket.setKeepAlive(false);`

### Usage
1. Make sure you have `node.js` installed
2. In the directory where `le-ftp` is installed, create file `testftp.js`
3. Copy and paste into the new file the following: 
```javascript
LEftp = require('le-ftp');

var x = new LEftp({
	"host"		: "",		// ftp host address, eg. my.server.com
	"port"		: 21,
	"user"		: '',		// Your ftp username
	"password"	: '',		// Your ftp password

	"localRootDir"	: "C:/user/levan/local_folder_to_watch",
	"remoteRootDir"	: "remote/destination/folder/to/watch",
	"frequency"	: 1,		// Number of seconds between each scan
	"ext"		: ['.css','.js','.html','txt','jpg']
});
```
4. Edit the settings you just pasted (see [Configuration Parameters](#configuration-parameters) below)
5. From command line in the directory where `le-ftp` resides, run `node le-ftp`
6. Current files (that match your criteria) will be uploaded and program will keep running
7. To stop watching, use `[Ctrl]+[c]`



### Configuration Parameters
- `host: 'myftpserver.domain.com'` - address of the ftp server
- `port: 21`  - ftp server port
- `remoteRootDir: ''` - Remote root directory: Local files will be copied to this directory
- `localRootDir: ''` - Local root directory: Local directory to watch
- `user: ''` - Ftp username
- `password: ''` - Ftp password
- `localRootDir	 : "C:/dir"` - Full path to local folder to be copied to the FTP server. Use Unix backslash "/"
- `remoteRootDir : 'public_html/dev.clubfinance.uk/angular',` Remote folder, starting from your FTP root
- `frequency: 1` - number of seconds between each scan. Decimals (e.g. `0.1`) are acceptable
- `ext: ['css','js','html','txt']` - if you want to only include files with certain extensions,
  list the extensions here as an array of strings: `['css','js','html']`. No need to prefix extensions with '.',
  so `.css` and `css` will both work.