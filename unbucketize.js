"use strict";
require('./prototype');

const
    fs = require('fs'),
    path = require('path'),
    mimeTypes = require('mime-types'),
    spawn = require('child_process').spawn,
    appConfig = require('./appConfig');

var scanDirectories = function () {
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

scanDirectories();