const path = require('path');
const loadProjects = require('./loader');

function getPackagesDir(repoDir, packagesDir) {
    return path.resolve(path.join(repoDir || '.', packagesDir || 'packages'));
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

async function check(repoDir, packagesDir) {
    const dir = getPackagesDir(repoDir, packagesDir);
    const projects = await loadProjects(dir);
    const packagesVersions = collectPackagesVersions(projects);
    inspectPackagesVersions(projects, packagesVersions);
    const modulesVersions = collectModulesVersions(projects);
    inspectModulesVersions(modulesVersions);
}

module.exports = check;
