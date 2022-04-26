[![CI](https://github.com/DmitryBogomolov/monorepo-deps-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitryBogomolov/monorepo-deps-checker/actions/workflows/ci.yml)

# monorepo-deps-checker

Checks dependencies in packages

## Install

```bash
npm i monorepo-deps-checker
```

## Description

Package exports single function

```js
const check = require('monorepo-deps-checker');
```

Function is async and has 3 arguments.
It loads all **package.json** files, collects conflicts, waits for callbacks, updates changed **package.json**.

```js
await check(pathToProject, resolvePackagesConflicts, resolveModulesConflicts);
```

Function arguments

Name | Type | Description
-|-|-
`pathToProject` | string | path to monorepo project
`resolvePackagesConflicts` | async (conflicts: [PackageConflict](#PackageConflict)[]) => void | async callback that is called to resolve conflicts between versions of monorepo packages
`resolveModulesConflicts` | async (conflicts: [ModuleConflict](#ModuleConflict)[]) => void | async callback that is called to resolve conflicts between versions in external packages

### Section

`dependencies | devDependencies | peerDependencies`

### PackageConflict

Field | Type | Description
-|-|-
packageName | string | name of package where conflict happens
section | [Section](#Section) | section where conflict happens
moduleName | string | name of module (neighbor package) that caused the conflict
version | string | version of that module
targetVersion | string | actual version (set in its *package.json*) of that module
resolve | () => void | function that resolves the conflict

If `resolve` is called module's `version` will be replaced with `targetVersion`. Othewise module will retain its current `version`.

Given **TestPackageA** with version **0.1.2** and **TestPackageB** having **TestPackageA(0.1.3)** in **dependencies** a conflict will look like this.

```js
{
    packageName: 'TestPackageB',
    section: 'dependencies',
    moduleName: 'TestPackageA',
    version: '0.1.3',
    targetVersion: '0.1.2',
    resolve,
}
```

### ModuleConflict

Field | Type | Description
-|-|-
moduleName | string | name of module that caused the conflict
items | [ModuleConflictItem](#ModuleConflictItem)[] | list of conflict details
resolve | (choice: number, filter?: [FilterFunc](#FilterFunc)) => void | function that resolves the conflict

If `resolve` is called module's `version` will be set to a selected one. Otherwise module will retain its current `version`.

Function must be called with a `choice` argument (index within `items` list). Version of the chosen item will be applied to all related packages.
Optional `filter` argument can be provided - it will skip version changing for certain packages.

Given package **TestPackageA** with **some-module(0.1)**, **TestPackageB** with **some-module(0.2)**, **TestPackageC** with **some-module(0.3)**, **TestPackageD** with **some-module(0.1)** a confict will look like this.

```js
{
    moduleName: 'some-module',
    items: [
        {
            version: '0.1',
            packages: [
                { packageName: 'TestPackageA', section: 'dependencies' },
                { packageName: 'TestPackageD', section: 'dependencies' },
            ],
        },
        {
            version: '0.2',
            packages: [
                { packageName: 'TestPackageB', section: 'dependencies' },
            ],
        },
        {
            version: '0.3',
            packages: [
                { packageName: 'TestPackageC', section: 'dependencies' },
            ],
        },
    ],
    resolve,
}
```

After calling `resolve(1)` **some-module** version in **TestPackageA**, **TestPackageC**, **TestPackageD** will be set to **0.2**.

With the following filter

```js
function filter(arg) {
    return arg.packageName !== 'TestPackageA';
}
```

only **TestPackageC** and **TestPackageD** will be affected.

### ModuleConflictItem

Field | Type | Description
-|-|-
version | string | module version
packages | [ItemPackage](#ItemPackage)[] | list of packages containing module with that version

### ItemPackage

Field | Type | Description
-|-|-
packageName | string | package name
section | [Section](#Section) | section

### FilterFunc

Function that tells if module version in a certain package should be changed.

(arg: [FilterPackage](#FilterPackage)) => bool

### FilterPackage

Name | Type | Description
-|-|-
packageName | string | package name
section | [Section](#section) | section
moduleName | string | module name
version | string | module version
targetVersion | string | selected module version

## Call

```js
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

        const choice = Math.floor(Math.random() * items.length);
        function filter({ packageName, section, moduleName, version, targetVersion }) {
            return true;
        }
        resolve(choice, filter);
    });
}
```

Async

```js
function resolvePackagesConflicts(conflicts) {
    await Promise.all(conflicts.map(async (conflict) => {
        // Some async activity here.
        resolve();
    }));
}

function resolveModulesConflicts(conflicts) {
    await Promise.all(conflicts.map(async (conflict) => {
        // Some async activity here.
        resolve(choice, filter);
    }));
}
```

## Examples

- [simple](./examples/simple.js)
  ```bash
  node ./examples/simple.js <path-to-project>
  ```

- [interactive](./examples/interactive.js)
  ```bash
  node ./examples/interactive.js <path-to-project>
  ```
