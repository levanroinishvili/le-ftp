var fs	= require('fs');
var ftp	= require('ftp');

class sFile {
	constructor(name,modTime) {
		this.name = name;
		this.modTime = modTime;
	}
}

class leFtp {
	constructor(config) {
		this.localRoot	= config.localRootDir.replace(/\\/g,'/') ;
		this.remoteRoot	= config.remoteRootDir;//(config.remoteRootDir.startsWith('/')?'':'/') + config.remoteRootDir ;
		this.frequency	= 1000*config.frequency;

		this.allFiles = [];

		// ------ BEGIN: Create RegExp for filtering out file extensions
		let ext = config.ext;
		var c1,extRegEx;
		if (typeof ext == 'undefined' ) {
			extRegEx = '';
		} else if ( typeof ext == 'string' ) {
			while ( (c1=ext.substr(0,1)||true) && (c1=='.' || c1==' ') ) ext=ext.substr(1);
			if ( ext == '' ) extRegEx = '';
			else extRegEx = '\\.' . concat(ext,'$');
		} else if ( Array.isArray(ext) ) {
			extRegEx = ext.reduce(function(regex,e){
				while ( (c1=e.substr(0,1)||true) && (c1=='.' || c1==' ') ) e=e.substr(1);
				if ( regex!='' && e!='') return regex.concat('|',e);
				else return regex.concat(e);
			},'');
			if (extRegEx!='') extRegEx = '\\.('.concat(extRegEx,')$');
		} else extRegEx = '';
		this.extRegEx = new RegExp(extRegEx,'i');
		// ------ E N D: Create RegExp for filtering out file extensions

		this.Ftp = new ftp();
		this.Ftp.on('greeting',msg=>{console.log(msg);});
		this.Ftp.on('ready',()=>{console.log(`Connected`);});
		this.Ftp.on('error',err=>{console.log(err);});
		this.Ftp.connect({
			host	: config.host,
			port	: config.port,
			user	: config.user,
			password: config.password,
			secure	: false,
		});

		this.compareFiles();


	}

	getSnapshot() {
		const walk = (path='' , structure=[]) => {
			return new Promise((resolve,reject)=>{
				let dirFullPath = this.localRoot.concat( (this.localRoot.endsWith('/')||path==''?'':'/'),path);
				fs.readdir(dirFullPath, (err,files)=>{
					if (err) console.log(`Error reading directory: ${dirFullPath}`);
					else {
						let fileToProcess = files.length;
						files.forEach(f=>{
							const filefullpath	= `${dirFullPath}${dirFullPath.endsWith('/')?'':'/'}${f}` ;
							const fileRelPath	= `${path}${path==''?'':'/'}${f}` ;
							fs.stat(filefullpath,(err,fstats)=>{
								if ( err ) console.log(`${filefullpath} : Error ${err.code}`);
								else if (fstats.isDirectory() ) walk(fileRelPath,structure).then(ignore=>{if (!--fileToProcess) resolve(structure); });
								else if (fstats.isFile() ) { if (this.extRegEx.test(f)) structure.push(new sFile(fileRelPath,fstats.mtime.getTime())); if (!--fileToProcess) resolve(structure); }
							});
						});
					}
				});
			});
		};

		return new Promise( (resolve,reject)=>{
			walk()
				.then(str=>{resolve(str)})
				.catch(err => { reject(err); });
		});
	}

	compareFiles() {
		this.getSnapshot()
			.then((str)=>{
				str.forEach(f=>{
					let i = this.allFiles.map(af=>af.name).indexOf(f.name);
					//console.log(`Looking for ${f.name}, found i=${i} [${this.allFiles[i].name} (${this.allFiles[i].modTime})]`);
					if (i==-1) this.uploadFile(f.name);
					else {
						if ( f.modTime > this.allFiles[i].modTime ) this.uploadFile(f.name);
						this.allFiles.splice(i,1);
					}
				});
				this.allFiles.forEach(f=>{this.deleteFile(f.name);});
				this.allFiles = str;
				setTimeout(this.compareFiles.bind(this),this.frequency);
			}).catch(err=>{console.log(err)});
	}
	uploadFile(fileName) {
		if ( fileName=='' ) return ;
		var localFileNameFull = this.localRoot + (this.localRoot==''?'':'/') + fileName ;
		localFileNameFull = localFileNameFull.replace(/\//g,'\\');
		var dirFileBoundary = fileName.lastIndexOf('/');
		var localDirRelative = fileName.substr(0,dirFileBoundary);
		var fileNameOnly = fileName.substr(dirFileBoundary+1);
		var remoteDirPath = this.remoteRoot + (this.remoteRoot==''?'':'/') + localDirRelative;
		var remoteFileNameFull = this.remoteRoot + (this.remoteRoot==''?'':'/') + fileName;
		//console.log(`Upload: ${remoteDirPath}   --  ${fileNameOnly}`);
		console.log(`Upload: ${localFileNameFull}   -->  ${remoteFileNameFull}`);
		this.Ftp.put(localFileNameFull,remoteFileNameFull,err=>{
			if ( err ) {
				console.log("p: Error code for " + localFileNameFull + " => " + remoteFileNameFull + " is " + err.code);
				console.log(err);
				console.log("\n");
				if ( err.code == 553 ) {
					// Destination folder may not exist. Create and retry
					console.log("Will create " + remoteDirPath + " and retry");

					this.Ftp.mkdir(remoteDirPath,true,err2=>{
						if ( err2 ) throw err2;
						// Destination folder created on remote. Now upload
						this.Ftp.put(localFileNameFull,remoteFileNameFull,err3=>{
							if ( err3 ) throw err3;
							else console.log(`Uploaded ${fileName}`);
						});
					});
				}
			} else console.log(`Uploaded ${fileName}`);
		});
	}
	deleteFile(fileName) {
		var remoteFileNameFull = this.remoteRoot + (this.remoteRoot==''?'':'/') + fileName;
		console.log(`Will delete ${remoteFileNameFull}`);
		this.Ftp.delete(remoteFileNameFull, err=>{
			if ( err ) console.log(`Cannot delete from remote file ${remoteFileNameFull}`);
		});
	}
}

module.exports = leFtp;