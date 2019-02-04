const path = require('path');
const { loadPackages, savePackages } = require('./loader');

function getPackagesDir(repoDir) {
    return path.resolve(path.join(repoDir || '.', 'packages'));
}

function collectPackagesVersions(packages) {
    const versions = {};
    packages.forEach((content) => {
        versions[content.name] = content.version;
    });
    return versions;
}

function processPackages(packages, action) {
    packages.forEach((content) => {
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

function inspectPackagesVersions(packages, packagesVersions, changes) {
    const conflicts = [];
    const check = (...args) => checkPackagesVersions(packagesVersions, conflicts, changes, ...args);
    processPackages(packages, check);
    return conflicts;
}

function inspectModulesVersions(modulesVersions, changes) {
    const conflicts = [];
    const defaultFilter = () => true;
    Object.keys(modulesVersions)
        // Select those with at least two different versions.
        .filter(moduleName => Object.keys(modulesVersions[moduleName]).length > 1)
        .forEach((moduleName) => {
            const versions = modulesVersions[moduleName];
            const items = Object.keys(versions)
                .map(version => ({ version, packages: versions[version] }))
                .sort((a, b) => b.packages.length - a.packages.length);
            conflicts.push({
                moduleName,
                items,
                resolve: (choice, filter = defaultFilterpa) => {
                    const index = choice >= 0 && choice < items.length ? Number(choice) : 0;
                    const targetVersion = items[index].version;
                    items.forEach(({ packages, version }) => {
                        if (targetVersion === version) {
                            return;
                        }
                        packages.forEach(({ packageName, section }) => {
                            const isChanged = filter({
                                packageName,
                                section,
                                moduleName,
                                version,
                                targetVersion,
                            });
                            if (isChanged) {
                                changes.push({
                                    packageName,
                                    section,
                                    moduleName,
                                    version: targetVersion,
                                });
                            }
                        });
                    });
                },
            });
        });
    return conflicts;
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

async function check(repoDir, resolvePackagesVersions, resolveModulesVersions) {
    const packagesDir = getPackagesDir(repoDir);
    const packageToFile = {};
    const packages = await loadPackages(packagesDir, packageToFile);
    const packagesVersions = collectPackagesVersions(packages);
    const changes = [];
    const packagesConflicts = inspectPackagesVersions(packages, packagesVersions, changes);
    resolvePackagesVersions(packagesConflicts);
    const modulesVersions = collectModulesVersions(packages);
    const modulesConflicts = inspectModulesVersions(modulesVersions, changes);
    resolveModulesVersions(modulesConflicts);
    const changedPackages = applyChanges(packages, changes);
    await savePackages(changedPackages, packageToFile);
}

module.exports = check;
