[![Build Status](https://travis-ci.org/DmitryBogomolov/monorepo-deps-checker.svg?branch=master)](https://travis-ci.org/DmitryBogomolov/monorepo-deps-checker)

# monorepo-deps-checker

Checks dependencies in packages

# Usage

Install

```bash
npm i monorepo-deps-checker
```

Call

```javascript
const check = require('monorepo-deps-checker');

await check('path-to-project', resolvePackagesConflicts, resolveModulesConflicts);

function resolvePackagesConflicts(conflicts) {
    conflicts.forEach(({
        packageName, section, moduleName, currentVersion, actualVersion, resolve,
    }) => {
        resolve();
    });
}

function resolveModulesConflicts(conflicts) {
    conflicts.forEach(({
        moduleName, items, resolve,
    }) => {
        items.forEach(({
            version, packages,
        }) => {
            packages.forEach(({
                packageName, version,
            }) => {

            });
        });

        const choice = Math.round(Math.random() * (items.length - 1) - 0.5);
        function filter({ packageName, section, moduleName }) {
            return true;
        }
        resolve(choice, filter);
    });
}
```
