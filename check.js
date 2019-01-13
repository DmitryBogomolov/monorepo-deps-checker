const path = require('path');
const loadPackages = require('./loader');

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
        versionBag.push({ package: packageName, section });
    });
}

function collectModulesVersions(packages) {
    const modulesVersions = {};
    const collect = (...args) => collectPackageModules(modulesVersions, ...args);
    processPackages(packages, collect);
    return modulesVersions;
}

function checkPackagesVersions(packagesVersions, packageName, section, deps) {
    Object.keys(deps).forEach((moduleName) => {
        const targetVersion = packagesVersions[moduleName];
        if (targetVersion && targetVersion !== deps[moduleName]) {
            console.log(`PACKAGE VERSION MISMATCH: ${packageName}::${section} ${moduleName}:${deps[moduleName]}`);
        }
    });
}

function inspectPackagesVersions(packages, packagesVersions) {
    const check = (...args) => checkPackagesVersions(packagesVersions, ...args);
    processPackages(packages, check);
}

function inspectModulesVersions(modulesVersions) {
    Object.keys(modulesVersions)
        // Select those with at least two different versions.
        .filter(moduleName => Object.keys(modulesVersions[moduleName]).length > 1)
        .forEach((moduleName) => {
            const versions = modulesVersions[moduleName];
            const list = Object.keys(versions)
                .map(version => ({ version, items: versions[version] }));
            list.sort((a, b) => b.items.length - a.items.length)
            console.log(`MODULE VERSIONS: ${moduleName}`);
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
    const packages = await loadPackages(dir);
    const packagesVersions = collectPackagesVersions(packages);
    inspectPackagesVersions(packages, packagesVersions);
    const modulesVersions = collectModulesVersions(packages);
    inspectModulesVersions(modulesVersions);
}

module.exports = check;
