const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

async function getDirItems(dir) {
    try {
        const items = await readdir(dir);
        return items;
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`directory '${dir}' does not exist`);
        }
        throw err;
    }
}

async function processPackage(dir, name, packages, errors) {
    const pathToFile = path.join(dir, name, 'package.json');
    try {
        const content = await readFile(pathToFile, 'utf8');
        packages.push({ pathToFile, content: JSON.parse(content) });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return;
        }
        errors.push(err);
    }
}

async function loadPackages(dir) {
    const items = await getDirItems(dir);
    const packages = [];
    const errors = [];
    const raw = await Promise.all(items.map(item => processPackage(dir, item, packages, errors)));
    if (errors.length) {
        const err = new Error('some packages are not processed');
        err.errors = errors;
        throw err;
    }
    return packages;
}

module.exports = loadPackages;
