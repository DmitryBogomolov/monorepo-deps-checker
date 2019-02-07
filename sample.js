/* eslint-disable */

const check = require('.');

function resolvePackagesConflicts(conflicts) {
    conflicts.forEach(({
        packageName, section, moduleName, currentVersion, actualVersion, resolve
    }) => {
        console.log(
            `PACKAGE VERSION MISMATCH: ${packageName}::${section} ${moduleName} ${currentVersion} (${actualVersion})`
        );
        resolve();
    });
}

function resolveModulesConflicts(conflicts) {
    conflicts.forEach(({ moduleName, items, resolve }) => {
        console.log(`MODULE VERSIONS: ${moduleName}`);
        items.forEach(({ version, packages }) => {
            console.log(`  ${version} (${packages.length})`);
            packages.forEach(({ packageName, section }) => {
                console.log(`    ${packageName}::${section}`);
                resolve(0, ({ packageName, section, moduleName }) => {
                    return false;
                });
            });
        });
    });
}

async function main() {
    try {
        const repoDir = process.argv[2];
        await check(repoDir, resolvePackagesConflicts, resolveModulesConflicts);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
