/* eslint-disable no-console */

const readline = require('readline');
const check = require('..');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>> ',
});

function resolvePackagesConflicts(conflicts) {
    rl.write('PACKAGE VERSION MISMATCHES\n');
    return conflicts.reduce((acc, {
        packageName, section, moduleName, version, targetVersion, resolve: resolveConflict,
    }) => {
        return acc.then(() => new Promise((resolve) => {
            const msg = `* ${packageName}::${section} ${moduleName} ${version} -> ${targetVersion} (y/n) `;
            rl.question(msg, (answer) => {
                if (answer.trim().toLowerCase() === 'y') {
                    rl.write(' + resolved\n');
                    resolveConflict();
                }
                resolve();
            });
            rl.prompt();
        }));
    }, Promise.resolve());
}

function resolveModulesConflicts(conflicts) {
    rl.write('MODULE VERSION MISMATCHES\n');
    return conflicts.reduce((acc, {
        moduleName, items, resolve: resolveConflict,
    }) => {
        return acc.then(() => new Promise((resolve) => {
            rl.write(`* ${moduleName}\n`);
            items.forEach(({ version, packages }, i) => {
                rl.write(`  ${i + 1}: ${version} (${packages.length})\n`);
                packages.forEach(({ packageName, section }) => {
                    rl.write(`    ${packageName}::${section}\n`);
                });
            });
            rl.question(`  (1..${items.length}) `, (answer) => {
                const choice = Number(answer) - 1;
                if (choice >= 0) {
                    rl.write(' + resolved\n');
                    resolveConflict(choice);
                }
                resolve();
            });
            rl.prompt();
        }));
    }, Promise.resolve());
}

const repoDir = process.argv[2];
check(repoDir, resolvePackagesConflicts, resolveModulesConflicts)
    .then(() => {
        rl.close();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
