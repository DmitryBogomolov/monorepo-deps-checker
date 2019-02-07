const path = require('path');

const loadPackages = jest.fn();
const savePackages = jest.fn();
const inspectPackagesVersions = jest.fn();
const inspectModulesVersions = jest.fn();

jest.mock('./loader', () => ({
    loadPackages,
    savePackages,
}));
jest.mock('./packages-checker', () => inspectPackagesVersions);
jest.mock('./modules-checker', () => inspectModulesVersions);

const check = require('./check');

describe('check', () => {
    let packages;

    afterEach(jest.resetAllMocks);

    beforeEach(() => {
        packages = Array.from({ length: 4 }).map((_, i) => ({
            name: `p${i + 1}`,
            dependencies: {},
            devDependencies: {},
            peerDependencies: {},
        }));
        loadPackages.mockResolvedValue(packages);
        savePackages.mockResolvedValue();
    });

    it('process packages', () => {
        inspectPackagesVersions.mockImplementation((_, changes) => {
            changes.push({
                packageName: 'p1',
                section: 'dependencies',
                moduleName: 'mod1',
                version: 'v1',
            });
        });
        inspectModulesVersions.mockImplementation((_, changes) => {
            changes.push({
                packageName: 'p2',
                section: 'devDependencies',
                moduleName: 'mod2',
                version: 'v2',
            });
        });

        return check('test-dir', 'resolve-packages', 'resolve-modules').then(() => {
            expect(loadPackages).toBeCalledWith(path.resolve('test-dir/packages'), {});
            expect(savePackages).toBeCalledWith([packages[0], packages[1]], {});
            expect(inspectPackagesVersions)
                .toBeCalledWith(packages, expect.anything(), 'resolve-packages');
            expect(inspectModulesVersions)
                .toBeCalledWith(packages, expect.anything(), 'resolve-modules');
        });
    });

    it('apply changes', () => {
        inspectPackagesVersions.mockImplementation((_, changes) => {
            changes.push({
                packageName: 'p1',
                section: 'dependencies',
                moduleName: 'mod1',
                version: 'v1',
            }, {
                packageName: 'p2',
                section: 'peerDependencies',
                moduleName: 'mod3',
                version: 'v3',
            });
        });
        inspectModulesVersions.mockImplementation((_, changes) => {
            changes.push({
                packageName: 'p2',
                section: 'devDependencies',
                moduleName: 'mod2',
                version: 'v2',
            }, {
                packageName: 'p4',
                section: 'dependencies',
                moduleName: 'mod4',
                version: 'v4',
            });
        });

        return check('test-dir', 'resolve-packages', 'resolve-modules').then(() => {
            expect(packages[0].dependencies).toEqual({ 'mod1': 'v1' });
            expect(packages[1].devDependencies).toEqual({ 'mod2': 'v2' });
            expect(packages[1].peerDependencies).toEqual({ 'mod3': 'v3' });
            expect(packages[3].dependencies).toEqual({ 'mod4': 'v4' });
        });
    });

    it('skip packages', () => {
        return check('test-dir', null, 'resolve-modules').then(() => {
            expect(inspectPackagesVersions).not.toBeCalled;
        });
    });

    it('skip modules', () => {
        return check('test-dir', 'resolve-packages', null).then(() => {
            expect(inspectModulesVersions).not.toBeCalled;
        });
    });

    it('task current directory', () => {
        return check(null, 'resolve-packages', 'resolve-modules').then(() => {
            expect(loadPackages).toBeCalledWith(path.resolve('packages'), {});
        });
    });
});
