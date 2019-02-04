const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

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

async function processPackage(dir, name, packages, packageToFile, errors) {
    const pathToFile = path.join(dir, name, 'package.json');
    try {
        const content = await readFile(pathToFile, 'utf8');
        const pack = JSON.parse(content);
        packages.push(pack);
        packageToFile[pack.name] = pathToFile;
    } catch (err) {
        if (err.code !== 'ENOENT') {
            errors.push(err);
        }
    }
}

async function loadPackages(dir, packageToFile) {
    const items = await getDirItems(dir);
    const packages = [];
    const errors = [];
    await Promise.all(
        items.map(item => processPackage(dir, item, packages, packageToFile, errors))
    );
    if (errors.length) {
        const err = new Error('some packages are not processed');
        err.errors = errors;
        throw err;
    }
    return packages;
}

async function savePackage(pack, packageToFile, errors) {
    try {
        await writeFile(packageToFile[pack.name], JSON.stringify(pack, null, 2) + '\n', 'utf8');
    } catch (err) {
        errors.push(err);
    }
}

async function savePackages(packages, packageToFile) {
    const errors = [];
    await Promise.all(
        packages.map(pack => savePackage(pack, packageToFile, errors))
    );
    if (errors.length) {
        const err = new Error('some packages are not saved');
        err.errors = errors;
        throw err;
    }
}

exports.loadPackages = loadPackages;
exports.savePackages = savePackages;
