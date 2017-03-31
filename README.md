# le-ftp
Watches local directory (and its sub-directories) for changes and uploads changed files via ftp - node.js

This is not fully tested and should not be used in any critical applications.

### Usage
1. Make sure you have `node.js` installed
2. Edit configuration for `le-ftp` (See [Configuration](#configuration) below)
3. From command line in the directory where `le-ftp` resides, run `node le-ftp`
4. To stop watching, use `[Ctrl]+[c]`

### Configuration
1. Open `le-ftp.js` in a text editor
2. At the beginning of the script, find the following code:
```javascript
var ftpConfig = {
	host: '',
	port: 21,
	remoteRootDir: '',
	localRootDir: '',
	user: '',
	password: '',
	ext: ['.css','.js','.html','txt'],
	timeoutSeconds: 3
};
```
3. Edit configuration parameters (see [Configuration Parameters](#configuration-parameters) below)
3. Save and close `le-ftp.js`


### Configuration Parameters
- `host: 'myftpserver.domain.com'` - address of the ftp server
-	`port: 21`  - ftp server port
- `remoteRootDir: ''` - Remote root directory: Local files will be copied to this directory
- `localRootDir: ''` - Local root directory: Local directory to watch
- `user: ''` - Ftp username
- `password: ''` - Ftp password
- `ext: ['css','js','html','txt']` - if you want to only include files with certain extensions,
  list the extensions here as an array of strings: ['css','js','html'] No need to include '.',
  so '.css' and 'css' will both work.
- `timeoutSeconds: 3` - number of seconds between each check. Use decimals (e.g. .1) to check
  local folder with intervals smaller than 1 second.
