"use strict";
require('./prototype');

const
    fs = require('fs'),
    path = require('path'),
    mimeTypes = require('mime-types'),
    appConfig = require('./appConfig');

if(appConfig.dirs.length === 0) {
    console.log("You need to configure bucketize. Please edit appConfig.js.");
}

var scanDirectories = function () {
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

scanDirectories();

