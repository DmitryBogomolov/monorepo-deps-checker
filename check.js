const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

async function loadProjects(workspace) {
    const items = await readdir(workspace);
    const projects = await Promise.all(items.map(async item => {
        const pathToFile = path.join(workspace, item, 'package.json');
        try {
            const content = await readFile(pathToFile, 'utf8');
            return { pathToFile, content: JSON.parse(content) };
        } catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
    }));
    return projects.filter(x => x);
}

function collectPackagesVersions(packages) {
    const versions = {};
    packages.forEach(({ content }) => {
        versions[content.name] = content.version;
    });
    return versions;
}

function walkDeps(content, action) {
    if (content.dependencies) {
        action(content.name, 'dependencies', content.dependencies);
    }
    if (content.devDependencies) {
        action(content.name, 'devDependencies', content.devDependencies);
    }
    if (content.peerDependencies) {
        action(content.name, 'peerDependencies', content.peerDependencies);
    }
}

function collectDependencies(modulesVersions, packageName, section, deps) {
    Object.keys(deps).forEach((name) => {
        const version = deps[name];
        const moduleBag = (modulesVersions[name] = modulesVersions[name] || {});
        const versionBag = (moduleBag[version] = moduleBag[version] || []);
        versionBag.push({ package: packageName, section });
    });
}

function collectModulesVersions(packages) {
    const modulesVersions = {};
    const collect = (...args) => collectDependencies(modulesVersions, ...args);
    packages.forEach(({ content }) => {
        walkDeps(content, collect);
    });
    return modulesVersions;
}

function checkPackagesVersions(packagesVersions, packageName, section, deps) {
    Object.keys(deps).forEach((name) => {
        const targetVersion = packagesVersions[name];
        if (targetVersion && targetVersion !== deps[name]) {
            console.log(`PACKAGE VERSION MISMATCH: ${packageName}::${section} ${name}:${deps[name]}`);
        }
    });
}

function inspectPackagesVersions(packages, packagesVersions) {
    const check = (...args) => checkPackagesVersions(packagesVersions, ...args);
    packages.forEach(({ content }) => {
        walkDeps(content, check);
    });
}

function inspectModulesVersions(modulesVersions) {
    Object.keys(modulesVersions)
        .filter(name => Object.keys(modulesVersions[name]).length > 1)
        .forEach((name) => {
            const versions = modulesVersions[name];
            const list = Object.keys(versions)
                .map(version => ({ version, items: versions[version]}));
            list.sort((a, b) => b.items.length - a.items.length)
            console.log(`MODULE VERSIONS: ${name}`);
            list.forEach(({ version, items }) => {
                console.log(`  ${version} (${items.length})`);
                items.forEach(({ package, section }) => {
                    console.log(`    ${package}::${section}`);
                });
            });
        });
}

async function check(workspace) {
    const projects = await loadProjects(workspace);
    const packagesVersions = collectPackagesVersions(projects);
    inspectPackagesVersions(projects, packagesVersions);
    const modulesVersions = collectModulesVersions(projects);
    inspectModulesVersions(modulesVersions);
}

module.exports = check;
