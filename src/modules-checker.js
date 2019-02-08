const { processPackages } = require('./util');

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

function inspectModulesVersions(packages, changes, resolve) {
    const modulesVersions = collectModulesVersions(packages);
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
                resolve: (choice, filter = defaultFilter) => {
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
    return resolve(conflicts);
}

module.exports = inspectModulesVersions;
