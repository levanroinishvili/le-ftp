var fs	= require('fs');
var ftp	= require('ftp');

class sFile {
	constructor(localRoot, remoteRoot, relativePath, modTime) {
		this.localRoot	= localRoot;
		this.remoteRoot	= remoteRoot;
		this.name		= relativePath;
		this.modTime	= modTime;
	}
}

class leFtp {
	constructor(config) {
		this.keepWatch = true;
		this.schedule = null;
		//this.localRoot	= config.localRootDir.replace(/\\/g,'/') ;
		//this.remoteRoot	= config.remoteRootDir;//(config.remoteRootDir.startsWith('/')?'':'/') + config.remoteRootDir ;
		if ( config.watchList ) this.watchList = config.watchList;
		else if ( config.localRootDir && config.remoteRootDir ) this.watchList=[{localRootDir:config.localRootDir, remoteRootDir:config.remoteRootDir}];
		else throw("No folders specified to watch");
		if (config.localRootDir || config.remoteRootDir) {
			console.log(
				"Warning: Configuration parameters localRootDir and remoteRootDir are depricated. Use instead an array:\n" +
				" [ { localRootDir:'', remoteRootDir:'' } , { localRootDir:'', remoteRootDir:'' } ]");
		}
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
		this.Ftp.on('greeting',msg=>{console.log("FTP server found.");});
		this.Ftp.on('ready',()=>{console.log(`Connected to FTP server.`);});
		this.Ftp.on('error',err=>{console.log(err.code);throw err;});
		this.Ftp.connect({
			host	: config.host,
			port	: config.port,
			user	: config.user,
			password: config.password,
			secure	: false,
		});

		if ( config.onStartUploadAll ) {
			this.allFiles = [];
			this.compareFiles(); // Uploads everything as it compares against empty list
		} else  {
			this.getSnapshot().then(struct=>{
				this.allFiles = struct;
				if (this.keepWatch) this.schedule = setTimeout(this.compareFiles.bind(this),this.frequency);
			});

		}

	}

	stop() {
		this.keepWatch = false;
		if ( this.schedule ) clearTimeout(this.schedule);
		this.Ftp.end();
	}

	getSnapshot() {
		const walk = (localRoot, remoteRoot, path='',structure=[]) => {
			return new Promise((resolve,reject)=>{
				let dirFullPath = localRoot.concat( (localRoot.endsWith('/')||path==''?'':'/'),path);
				fs.readdir(dirFullPath, (err,files)=>{
					if (err) console.log(`Error reading directory: ${dirFullPath}`);
					else {
						let fileToProcess = files.length;
						files.forEach(f=>{
							const filefullpath	= `${dirFullPath}${dirFullPath.endsWith('/')?'':'/'}${f}` ;
							const fileRelPath	= `${path}${path==''?'':'/'}${f}` ;
							fs.stat(filefullpath,(err,fstats)=>{
								if ( err ) console.log(`${filefullpath} : Error ${err.code}`);
								else if (fstats.isDirectory() ) walk(localRoot, remoteRoot, fileRelPath, structure).then(ignore=>{if (!--fileToProcess) resolve(structure); });
								else if (fstats.isFile() ) {
									if (this.extRegEx.test(f)) structure.push(new sFile(localRoot, remoteRoot, fileRelPath, fstats.mtime.getTime()));
									if (!--fileToProcess) resolve(structure);
								}
							});
						});
					}
				});
			});
		};

		// return new Promise( (resolve,reject)=>{
		// 	walk(this.localRoot,this.remoteRoot)
		// 		.then(str=>{resolve(str)})
		// 		.catch(err => { reject(err); });
		// });

		const loadDir = (i,allDirMap=[]) => {
			return new Promise( (resolve,reject) => {
				walk(this.watchList[i].localRootDir, this.watchList[i].remoteRootDir,'',[])
					.then( s=>{
						allDirMap = allDirMap.concat(s);
						if (i+1<this.watchList.length) loadDir(i+1,allDirMap).then(adm => {resolve(adm);}).catch(err=>{reject(err);});
						else resolve(allDirMap);
					})
					.catch( err => { reject(err); });
			});

		};

		return new Promise( (resolve,reject) => {
			loadDir(0)
			.then(completeTree=>{
				resolve(completeTree);
			})
			.catch(err=>{reject(err);});
		})

	}

	compareFiles() {
		//var d=new Date(); var dh=d.getHours(); var dm=d.getMinutes(); var ds=(dh<10?'0'+dh:dh)+':'+(dm<10?'0'+dm:dm); console.log(`${ds} : Checking`);

		this.getSnapshot()
			.then((str)=>{
				str.forEach(f=>{
					let i = this.allFiles.map(af=>af.localRoot+'/'+af.name).indexOf(f.localRoot+'/'+f.name);
					// console.log(`Looking for ${f.name}, found i=${i} [${this.allFiles[i].name} (${this.allFiles[i].modTime})]`);
					if (i==-1) this.uploadFile(f);
					else {
						if ( f.modTime > this.allFiles[i].modTime ) this.uploadFile(f);
						this.allFiles.splice(i,1);
					}
				});
				this.allFiles.forEach(f=>{this.deleteFile(f);});
				this.allFiles = str;
				if (this.keepWatch) this.schedule = setTimeout(this.compareFiles.bind(this),this.frequency);
			}).catch(err=>{console.log(err)});
	}

	uploadFile(file) {
		if ( !file || !file.name ) return ;
		var localFileNameFull = file.localRoot + (file.localRoot==''?'':'/') + file.name ;
		localFileNameFull = localFileNameFull.replace(/\//g,'\\');
		var dirFileBoundary = file.name.lastIndexOf('/');
		var localDirRelative = file.name.substr(0,dirFileBoundary);
		var fileNameOnly = file.name.substr(dirFileBoundary+1);
		var remoteDirPath = file.remoteRoot + (file.remoteRoot==''?'':'/') + localDirRelative;
		var remoteFileNameFull = file.remoteRoot + (file.remoteRoot==''?'':'/') + file.name;
		//console.log(`Upload: ${remoteDirPath}   --  ${fileNameOnly}`);
		//console.log(`Upload: ${localFileNameFull}   -->  ${remoteFileNameFull}`);

		this.Ftp.put(localFileNameFull,remoteFileNameFull,err=>{
			if ( err ) {
				if ( err.code == 553 ) {
					// Destination folder may not exist. Create and retry
					console.log("Will create remote directory " + remoteDirPath);

					this.Ftp.mkdir(remoteDirPath,true,err2=>{
						if ( err2 ) throw err2;
						// Destination folder created on remote. Now upload
						this.Ftp.put(localFileNameFull,remoteFileNameFull,err3=>{
							if ( err3 ) throw err3;
							else console.log(`Uploaded ${file.name}`);
						});
					});
				} else throw err; // Some error, other than "destination directory does not exist"
			} else console.log(`Uploaded ${file.name}`);
		});
	}
	deleteFile(file) {
		var remoteFileNameFull = file.remoteRoot + (file.remoteRoot==''?'':'/') + file.name;
		//console.log(`Will delete ${remoteFileNameFull}`);
		this.Ftp.delete(remoteFileNameFull, err=>{
			if ( err ) console.log(`Cannot delete from remote file ${remoteFileNameFull}`);
			else console.log(`Deleted remote file ${remoteFileNameFull}`);
		});
	}
}

module.exports = leFtp;