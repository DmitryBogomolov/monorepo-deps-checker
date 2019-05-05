/* eslint-disable no-console */

const check = require('..');

function resolvePackagesConflicts(conflicts) {
    console.log('PACKAGE VERSION MISMATCHES');
    conflicts.forEach(({
        packageName, section, moduleName, version, targetVersion, /* resolve, */
    }) => {
        console.log(`* ${packageName}::${section} ${moduleName} ${version} -> ${targetVersion}`);
        // resolve();
    });
}

function resolveModulesConflicts(conflicts) {
    console.log('MODULE VERSION MISMATCHES');
    conflicts.forEach(({
        moduleName, items, /* resolve, */
    }) => {
        console.log(`* ${moduleName}`);
        items.forEach(({ version, packages }) => {
            console.log(`  ${version} (${packages.length})`);
            packages.forEach(({ packageName, section }) => {
                console.log(`    ${packageName}::${section}`);
            });
        });
        // resolve(0, (/*{ packageName, section, moduleName, version, targetVersion }*/) => true);
    });
}

const repoDir = process.argv[2];
check(repoDir, resolvePackagesConflicts, resolveModulesConflicts).catch((err) => {
    console.error(err);
    process.exit(1);
});
