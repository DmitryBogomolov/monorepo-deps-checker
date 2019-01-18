const check = require('./check');

function resolvePackagesConflicts(conflicts) {
    conflicts.forEach(({ packageName, section, moduleName, currentVersion, actualVersion}) => {
        console.log(
            `PACKAGE VERSION MISMATCH: ${packageName}::${section} ${moduleName}:${currentVersion}`
        );
    });
}

async function main() {
    try {
        const repoDir = process.argv[2];
        await check(repoDir, resolvePackagesConflicts);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
