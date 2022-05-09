const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function getDirItems(dir) {
    return readdir(dir).catch((err) => {
        if (err.code === 'ENOENT') {
            throw new Error(`directory '${dir}' does not exist`);
        }
        throw err;
    });
}

function processPackage(dir, name, packages, packageToFile, errors) {
    const pathToFile = path.join(dir, name, 'package.json');
    return readFile(pathToFile, 'utf8')
        .then((content) => {
            const pack = JSON.parse(content);
            packages.push(pack);
            packageToFile[pack.name] = pathToFile;
        })
        .catch((err) => {
            if (err.code !== 'ENOENT') {
                errors.push(err);
            }
        });
}

function loadPackages(dir, packageToFile) {
    const packages = [];
    const map = {};
    const errors = [];
    return getDirItems(dir)
        .then((items) => Promise.all(
            items.map((item) => processPackage(dir, item, packages, map, errors)),
        ))
        .then(() => {
            if (errors.length) {
                const err = new Error('some packages are not loaded');
                err.errors = errors;
                throw err;
            }
            Object.assign(packageToFile, map);
            return packages;
        });
}

function savePackage(pack, packageToFile, errors) {
    const content = JSON.stringify(pack, null, 2) + '\n';
    return writeFile(packageToFile[pack.name], content, 'utf8').catch((err) => {
        errors.push(err);
    });
}

function savePackages(packages, packageToFile) {
    const errors = [];
    return Promise.all(
        packages.map((pack) => savePackage(pack, packageToFile, errors)),
    ).then(() => {
        if (errors.length) {
            const err = new Error('some packages are not saved');
            err.errors = errors;
            throw err;
        }
    });
}

exports.loadPackages = loadPackages;
exports.savePackages = savePackages;
