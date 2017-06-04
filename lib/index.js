"use strict";
require('./prototype');

const
    fs = require('fs'),
    path = require('path'),
    mimeTypes = require('mime-types'),
    args = require('minimist')(process.argv.slice(2)),
    appConfig = require('./appConfig');

if(args._.length !== 0) {
    console.log("Invalid parameters detected.");
} else {
    if(args.dir) {
        appConfig.dirs.push(args.dir);
    }
    if(args.revert) {
        appConfig.revert = true;
    }
}

if(appConfig.dirs.length === 0) {
    console.log("n-bucketize --dir /path/to/dir to bucketize.");
    console.log("n-bucketize --dir /path/to/dir --revert to unbucketize. ");
    return -1;
}

var bucketize = function () {
    for (let directory of appConfig.dirs) {
        fs.readdir(directory, function (err, filesArr) {
            if (err) throw err;
            console.log("Bucketizing: " + directory);
            filesArr = filesArr.diff(appConfig.exclude);

            let filesWithValidExtensionArr = filesArr.filter(function (file) {
                return mimeTypes.lookup(file);
            });

            var mimeTypesSet = new Set();
            filesWithValidExtensionArr.forEach(function (file) {
                mimeTypesSet.add(mimeTypes.lookup(file));
            });

            mimeTypesSet.forEach(function (mimeType) {

                let folderName = mimeTypes.extension(mimeType);
                let folderPath = path.join(directory, folderName);

                //console.log(folderPath);

                fs.stat(folderPath, function (err, stats) {
                    if (err && err.errno === -2) { // directory not found
                        fs.mkdir(folderPath, function (err) {
                            if (err) throw err;
                            console.log("New Bucket: ", folderPath);
                            let filesToMove = filesWithValidExtensionArr.filter(function (file) {
                                return mimeTypes.lookup(file) === mimeType;
                            });
                            filesToMove.forEach(function (file) {
                                let oldPath = path.join(directory, file);
                                let newPath = path.join(folderPath, file);
                                fs.rename(oldPath, newPath, function (err) {
                                    if (err) throw err;
                                })
                            });
                        });
                    } else { // directory found
                        if (stats.isDirectory()) {
                            console.log("Bucket: ", folderPath);
                            let filesToMove = filesWithValidExtensionArr.filter(function (file) {
                                return mimeTypes.lookup(file) === mimeType;
                            });
                            filesToMove.splice(filesToMove.indexOf(mimeTypes.extension(mimeType)), 1);
                            filesToMove.forEach(function (file) {
                                let oldPath = path.join(directory, file);
                                let newPath = path.join(folderPath, file);
                                fs.rename(oldPath, newPath, function (err) {
                                    if (err) throw err;
                                })
                            });
                        }
                    }
                });
            });
        })
    }
};

var unbucketize = function () {
    for (let directory of appConfig.dirs) {
        fs.readdir(directory, function (err, folderArr) {
            if (err) throw err;
            console.log("Unbucketizing: " + directory);
            folderArr = folderArr.filter(function (file) {
                let extension = mimeTypes.extension(mimeTypes.lookup(file));
                return file === extension;
            });
            folderArr = folderArr.diff(appConfig.exclude);
            folderArr.forEach(function (folder) {
                let folderPath = path.join(directory, folder);
                fs.readdir(folderPath, function (err, files) {
                    if (err) throw err;
                    files.forEach(function (file) {
                        let oldPath = path.join(folderPath, file);
                        let newPath = path.join(directory, file);
                        fs.rename(oldPath, newPath, function (err) {
                            if (err) throw err;
                            files.splice(files.indexOf(file), 1);
                            if (files.length === 0) {
                                fs.rmdir(folderPath, function (err) {
                                    if (err) throw err;
                                })
                            }
                        });
                    });
                });
            });
        })
    }
};


if(appConfig.revert && appConfig.revert === true) {
    unbucketize();
} else {
    bucketize();
}