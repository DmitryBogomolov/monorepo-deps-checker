const path = require('path');
const { loadPackages, savePackages } = require('./loader');
const inspectPackagesVersions = require('./packages-checker');
const inspectModulesVersions = require('./modules-checker');

function getPackagesDir(repoDir) {
    return path.resolve(path.join(repoDir || '.', 'packages'));
}

function inspect(inspectors, packages) {
    const changes = [];
    return inspectors.reduce(
        (acc, { inspect, resolve }) => acc.then(() => inspect(packages, changes, resolve)),
        Promise.resolve(),
    ).then(() => changes);
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
        const inspectors = [];
        if (resolvePackagesVersions) {
            inspectors.push({ inspect: inspectPackagesVersions, resolve: resolvePackagesVersions });
        }
        if (resolveModulesVersions) {
            inspectors.push({ inspect: inspectModulesVersions, resolve: resolveModulesVersions });
        }
        return inspect(inspectors, packages)
            .then(changes => applyChanges(packages, changes))
            .then(changedPackages => savePackages(changedPackages, packageToFile));
    });
}

module.exports = check;
