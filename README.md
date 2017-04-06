# le-ftp
### Watch local directory (and its sub-directories) for changes and uploads changed files via ftp - node.js

This is not fully tested and should not be used in any critical applications.

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
	"ext"		: ['.css','.js','.html','txt','jpg'],
    "onStartUploadAll"  : true  // On start, upload all files (that match the "watch criteria").
});
```
4. Edit the settings you just pasted (see [Configuration Parameters](#configuration-parameters) below)
5. From command line in the directory where `le-ftp` resides, run `node le-ftp`
6. Current files (that match your criteria) will be uploaded and program will keep running
7. To stop watching
  1. from command line, use `[Ctrl]+[c]`
  2. from script, call `.stop()` method on the `le-ftp` object. So, in the above example it would be `x.stop()`
  3. If you want to modify the `testftp.js` so that watching is stopped after, say, 100seconds, add the following code to `testftp.js`:
```javascript
// Schedule to stop watching in 100 seconds (100,000 milliseconds)
setTimeout(
    function() {x.stop();} ,
    100 * 1000                    // Schedule stop after 100 seconds (100,000 milliseconds)
);
```

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

## ***Important*** if you receive ECONNREFUSED error
- On some networks the `node.js ftp` module cannot connect and returns ECONNREFUSED error
- This is not an issue with `le-ftp` itself, but `node.js ftp` module, on which `le-ftp` depends
- This issue could be resolved by setting `keep alive` option to `false` inside `node.js ftp` module
  - editing file `node_modules/ftp/lib/connections.js`
  - Open the file and go to line 106, which says
  - `socket.setKeepAlive(true);`
  - Change `true` to `false`, so that it now says
  - `socket.setKeepAlive(false);`