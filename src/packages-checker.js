const { processPackages } = require('./util');

function collectPackagesVersions(packages) {
    const versions = {};
    packages.forEach((content) => {
        versions[content.name] = content.version;
    });
    return versions;
}

function checkPackagesVersions(packagesVersions, conflicts, changes, packageName, section, deps) {
    Object.keys(deps).forEach((moduleName) => {
        const targetVersion = packagesVersions[moduleName];
        if (targetVersion && targetVersion !== deps[moduleName]) {
            conflicts.push({
                packageName,
                section,
                moduleName,
                version: deps[moduleName],
                targetVersion,
                resolve: () => {
                    changes.push({
                        packageName,
                        section,
                        moduleName,
                        version: targetVersion,
                    });
                },
            });
        }
    });
}

function inspectPackagesVersions(packages, changes, resolve) {
    const packagesVersions = collectPackagesVersions(packages);
    const conflicts = [];
    const check = (...args) => checkPackagesVersions(packagesVersions, conflicts, changes, ...args);
    processPackages(packages, check);
    resolve(conflicts);
}

module.exports = inspectPackagesVersions;
