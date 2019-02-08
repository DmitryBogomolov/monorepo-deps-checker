/* eslint-disable no-console */

const readline = require('readline');
const check = require('..');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>> ',
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
        rl.prompt();
    });
}

function walk(list, callback) {
    return list.reduce((acc, item) => acc.then(() => callback(item)), Promise.resolve());
}

function resolvePackagesConflicts(conflicts) {
    rl.write('PACKAGE VERSION MISMATCHES\n');
    return walk(conflicts, ({
        packageName, section, moduleName, version, targetVersion, resolve,
    }) => {
        const msg = `* ${packageName}::${section} ${moduleName} ${version} -> ${targetVersion} (y/n) `;
        return ask(msg).then((answer) => {
            if (answer.trim().toLowerCase() === 'y') {
                rl.write(' + resolved\n');
                resolve();
            }
        });
    });
}

function resolveModulesConflicts(conflicts) {
    rl.write('MODULE VERSION MISMATCHES\n');
    return walk(conflicts, ({
        moduleName, items, resolve,
    }) => {
        rl.write(`* ${moduleName}\n`);
        items.forEach(({ version, packages }, i) => {
            rl.write(`  ${i + 1}: ${version} (${packages.length})\n`);
            packages.forEach(({ packageName, section }) => {
                rl.write(`    ${packageName}::${section}\n`);
            });
        });
        return ask(`  (1..${items.length}) `).then((answer) => {
            const choice = Number(answer) - 1;
            if (choice >= 0) {
                rl.write(' + resolved\n');
                resolve(choice);
            }
        });
    });
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
