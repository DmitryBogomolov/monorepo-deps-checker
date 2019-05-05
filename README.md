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
        packageName, section, moduleName, version, targetVersion, resolve,
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
                packageName, section,
            }) => {

            });
        });

        const choice = Math.round(Math.random() * items.length - 0.5);
        function filter({ packageName, section, moduleName }) {
            return true;
        }
        resolve(choice, filter);
    });
}
```

Async

```javascript
function resolvePackagesConflicts(conflicts) {
    await Promise.all(conflicts.map(async (conflict) => {
        // ...
        resolve();
    }));
}

function resolveModulesConflicts(conflicts) {
    await Promise.all(conflicts.map(async (conflict) => {
        // ...
        resolve(choice, filter);
    }));
}
```

Example

- [simple](./examples/simple.js)
  ```bash
  node ./examples/simple.js <path-to-project>
  ```

- [interactive](./examples/interactive.js)
  ```bash
  node ./examples/interactive.js <path-to-project>
  ```
