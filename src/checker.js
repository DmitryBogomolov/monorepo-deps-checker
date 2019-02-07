const path = require('path');
const { loadPackages, savePackages } = require('./loader');
const inspectPackagesVersions = require('./packages-checker');
const inspectModulesVersions = require('./modules-checker');

function getPackagesDir(repoDir) {
    return path.resolve(path.join(repoDir || '.', 'packages'));
}

function applyChanges(packages, changes) {
    const cache = {};
    packages.forEach((content) => {
        cache[content.name] = content;
    });
    const packageNames = new Set();
    changes.forEach(({ packageName, section, moduleName, version }) => {
        packageNames.add(packageName);
        cache[packageName][section][moduleName] = version;
    });
    return packages.filter((content) => packageNames.has(content.name));
}

function check(repoDir, resolvePackagesVersions, resolveModulesVersions) {
    const packagesDir = getPackagesDir(repoDir);
    const packageToFile = {};
    return loadPackages(packagesDir, packageToFile).then((packages) => {
        const changes = [];
        if (resolvePackagesVersions) {
            inspectPackagesVersions(packages, changes, resolvePackagesVersions);
        }
        if (resolveModulesVersions) {
            inspectModulesVersions(packages, changes, resolveModulesVersions);
        }
        const changedPackages = applyChanges(packages, changes);
        return savePackages(changedPackages, packageToFile);
    });
}

module.exports = check;
