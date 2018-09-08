/* Lib for storing & editing the data
*
*
*/

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

let lib ={};

//base directory of .data folder
lib.basedir =path.join(__dirname, '../.data/');

// function to write data
lib.create = (dir, file, data, callback) =>{
	fs.open(lib.basedir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
		if(!err && fileDescriptor) {
			const stringData = JSON.stringify(data);
			fs.writeFile(fileDescriptor, stringData, (err) => {
				if(!err){
					fs.close(fileDescriptor, (err) => {
						if(!err){
							callback(false);
						}
					});
				}else{
					callback('Error writing to a new file');
				}
			});
		}else{
			callback("could not open the file,it may already exists");
		}
	});
}

// To read data from a file
lib.read = (dir, file, callback) => {
	fs.readFile(lib.basedir + dir + '/' + file + '.json', 'utf8', (err, data) => {
		if(!err && data){
			const parsedJSON = helpers.parseToJSONObject(data);
			callback(err, parsedJSON);
		}else{
			callback(err, data);
		}
	});
}

// To update data from a file
lib.update = (dir, file, data, callback) => {
	fs.open(lib.basedir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
		if(!err && fileDescriptor) {
			const stringData = JSON.stringify(data);
			// truncate the file
			fs.truncate(fileDescriptor, (err) =>{
				if(!err){
					// Write to the file
					fs.writeFile(fileDescriptor, stringData, (err) => {
						if(!err){
							fs.close(fileDescriptor, (err) => {
								if(!err){
									callback(false);
								}
							});
						}else{
							callback('Error writing to a existing file');
						}
					});
				}else{
					callback('Error truncating the file');
				}
			})
		}else{
			callback("could not open the file for updating");
		}
	});
}

// To delete a file
lib.delete = (dir, file, callback) => {
	fs.unlink(lib.basedir + dir + '/' + file + '.json', (err) => {
		if(!err){
			callback(false);
		}else{
			callback("error deleting the file");
		}
	});
}


//Export lib module
module.exports = lib;

