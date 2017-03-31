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

var fs = require('fs');
var ftpClient = require('ftp');

class wfile {
	constructor(name,lastMod) {
		this.name = name;
		this.lastMod = lastMod;
	}
}

// Remove trailing '/' from remoteRoodDir
while (ftpConfig.remoteRootDir.substr(-1,1)=='/')
	ftpConfig.remoteRootDir = ftpConfig.remoteRootDir.substr(0,ftpConfig.remoteRootDir.length-1);

// Create RegExp for filtering out file extensions
ext = ftpConfig.ext;
var c1;
if (typeof ext == 'undefined' ) {
	extRegEx = '.*';
} else if ( typeof ext == 'string' ) {
	while ( (c1=ext.substr(0,1)||true) && (c1=='.' || c1==' ') ) ext=ext.substr(1);
	if ( ext == '' ) extRegEx = ext.concat('.*');
	else extRegEx = '\\.' . concat(ext,'$');
} else if ( Array.isArray(ext) ) {
	extRegEx = ext.reduce(function(regex,e){
		while ( (c1=e.substr(0,1)||true) && (c1=='.' || c1==' ') ) e=e.substr(1);
		if ( regex=='' ) return e;
		else return regex.concat('|',e);
	});
	while ( (c1=extRegEx.substr(0,1)||true) && (c1=='.' || c1==' ') ) extRegEx=extRegEx.substr(1);
	extRegEx = '\\.('.concat(extRegEx,')$');
} else extRegEx = '.*';
extRegEx = new RegExp(extRegEx,'i');

function dirfiles(path='') {
	var fullPath = ftpConfig.localRootDir + ((ftpConfig.localRootDir=='' || path=='')?'':'/') + path;
	var dfiles = [];

	try{
		files = fs.readdirSync(fullPath);
	} catch(err) {
		console.log("Cannot read path: " + fullPath);
		return [];
	}
 
    files.forEach(function(file){
    	var filepath = path + (path==''?'':'/') + file;
    	var filepathfull = ftpConfig.localRootDir + ((ftpConfig.localRootDir=='' || filepath=='')?'':'/') + filepath;
    	var stat = fs.statSync(filepathfull);
     	if (stat.isFile() && extRegEx.test(file) ) {
    		dfiles.push( new wfile(filepath,stat['mtime'].getTime()) );
    	} else if (stat.isDirectory() ) {
			dfiles = dfiles.concat(dirfiles(filepath));
    	}
    });

	return dfiles;
}

var ftpLink = new ftpClient();
ftpLink.on('error',err=>{
	console.log(err);
	console.log("Re-connecting");
	ftpLink.connect(ftpConfig);
});
ftpLink.connect(ftpConfig);

var allFiles = [];
compareFileState();

function compareFileState() {
	var newFiles = dirfiles();
	newFiles.forEach(f=>{
		var isNewFile = true;
		for (var i=0; i<allFiles.length; i++) {
			if (allFiles[i].name==f.name) {
				isNewFile = false;
				if (allFiles[i].lastMod<f.lastMod) uploadFile(f.name);
				allFiles.splice(i,1);
				break;
			}
		}
		if ( isNewFile ) uploadFile(f.name);
	});
	allFiles.forEach(f=>{removeRemoteFile(f.name);});

	allFiles = newFiles;

	setTimeout(compareFileState,1000*ftpConfig.timeoutSeconds);
}

function uploadFile(filename) {
	var fullfilename = ftpConfig.localRootDir + (ftpConfig.localRootDir==''?'':'/') + filename ;
	console.log("Will upload ["+filename+"] to [" + (ftpConfig.remoteRootDir + '/' + filename).replace(/\s/g,'_') + "]");
	var dirFileBoundary = filename.lastIndexOf('/');
	var d = filename.substr(0,dirFileBoundary);
	var f = filename.substr(dirFileBoundary+1);
	d = ftpConfig.remoteRootDir + '/' + d;
	ftpLink.lastMod(d,(err,date)=>{
		if ( err ) {
			ftpLink.mkdir(d.replace(/\s/g,'_'),true,err2=>{
				if ( err2 ) console.log(err2);
				else ftpLink.put(fullfilename, (ftpConfig.remoteRootDir + '/' + filename).replace(/\s/g,'_') , err=>{if(err) console.log(err); else console.log("Uploaded " + filename); });
			});
		} else ftpLink.put(fullfilename, (ftpConfig.remoteRootDir + '/' + filename).replace(/\s/g,'_') , err=>{if(err) console.log(err); else console.log("Uploaded " + filename); });
	});
}

function removeRemoteFile(filename) {
	console.log("\n\nWill remove from remote ["+filename+"]\n\n");
}

console.log("\n\nAll files:");console.log(allFiles);
