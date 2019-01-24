const path = require('path');
const loadPackages = require('./loader');

function getPackagesDir(repoDir) {
    return path.resolve(path.join(repoDir || '.', 'packages'));
}

function collectPackagesVersions(packages) {
    const versions = {};
    packages.forEach(({ content }) => {
        versions[content.name] = content.version;
    });
    return versions;
}

function processPackages(packages, action) {
    packages.forEach(({ content }) => {
        const packageName = content.name;
        if (content.dependencies) {
            action(packageName, 'dependencies', content.dependencies);
        }
        if (content.devDependencies) {
            action(packageName, 'devDependencies', content.devDependencies);
        }
        if (content.peerDependencies) {
            action(packageName, 'peerDependencies', content.peerDependencies);
        }
    });
}

function collectPackageModules(modulesVersions, packageName, section, deps) {
    Object.keys(deps).forEach((moduleName) => {
        const version = deps[moduleName];
        const moduleBag = (modulesVersions[moduleName] = modulesVersions[moduleName] || {});
        const versionBag = (moduleBag[version] = moduleBag[version] || []);
        versionBag.push({ packageName, section });
    });
}

function collectModulesVersions(packages) {
    const modulesVersions = {};
    const collect = (...args) => collectPackageModules(modulesVersions, ...args);
    processPackages(packages, collect);
    return modulesVersions;
}

function checkPackagesVersions(packagesVersions, conflicts, packageName, section, deps) {
    Object.keys(deps).forEach((moduleName) => {
        const targetVersion = packagesVersions[moduleName];
        if (targetVersion && targetVersion !== deps[moduleName]) {
            conflicts.push({
                packageName,
                section,
                moduleName,
                currentVersion: deps[moduleName],
                actualVersion: targetVersion,
            });
        }
    });
}

function inspectPackagesVersions(packages, packagesVersions) {
    const conflicts = [];
    const check = (...args) => checkPackagesVersions(packagesVersions, conflicts, ...args);
    processPackages(packages, check);
    return conflicts;
}

function inspectModulesVersions(modulesVersions) {
    const conflicts = [];
    Object.keys(modulesVersions)
        // Select those with at least two different versions.
        .filter(moduleName => Object.keys(modulesVersions[moduleName]).length > 1)
        .forEach((moduleName) => {
            const versions = modulesVersions[moduleName];
            conflicts.push({
                moduleName,
                items: Object.keys(versions)
                    .map(version => ({ version, packages: versions[version] }))
                    .sort((a, b) => b.packages.length - a.packages.length)
            });
        });
    return conflicts;
}

async function check(repoDir, resolvePackagesVersions, resolveModulesVersions) {
    const packagesDir = getPackagesDir(repoDir);
    const packages = await loadPackages(packagesDir);
    const packagesVersions = collectPackagesVersions(packages);
    const packagesConflicts = inspectPackagesVersions(packages, packagesVersions);
    resolvePackagesVersions(packagesConflicts);
    const modulesVersions = collectModulesVersions(packages);
    const modulesConflicts = inspectModulesVersions(modulesVersions);
    resolveModulesVersions(modulesConflicts);
}

module.exports = check;
