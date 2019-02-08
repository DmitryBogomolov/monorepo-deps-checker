const inspect = require('./packages-checker');

describe('packages checker', () => {
    it('collect conflicts', () => {
        const packages = [
            {
                name: 'p1',
                version: 'v1',
            },
            {
                name: 'p2',
                version: 'v1',
                dependencies: {
                    'p1': 'v1',
                    'p4': 'v1',
                },
            },
            {
                name: 'p3',
                version: 'v2',
                devDependencies: {
                    'p1': 'v2',
                    'p2': 'v1',
                },
            },
            {
                name: 'p4',
                version: 'v2',
                peerDependencies: {
                    'p2': 'v2',
                    'p3': 'v3',
                },
            }
        ];
        const changes = [];
        const mock = jest.fn();

        inspect(packages, changes, mock);

        expect(mock).toBeCalledWith([
            {
                packageName: 'p2',
                section: 'dependencies',
                moduleName: 'p4',
                version: 'v1',
                targetVersion: 'v2',
                resolve: expect.any(Function),
            },
            {
                packageName: 'p3',
                section: 'devDependencies',
                moduleName: 'p1',
                version: 'v2',
                targetVersion: 'v1',
                resolve: expect.any(Function),
            },
            {
                packageName: 'p4',
                section: 'peerDependencies',
                moduleName: 'p2',
                version: 'v2',
                targetVersion: 'v1',
                resolve: expect.any(Function),
            },
            {
                packageName: 'p4',
                section: 'peerDependencies',
                moduleName: 'p3',
                version: 'v3',
                targetVersion: 'v2',
                resolve: expect.any(Function),
            },
        ]);
        expect(changes).toEqual([]);
    });

    it('resolve changes', () => {
        const packages = [
            {
                name: 'p1',
                version: 'v1',
            },
            {
                name: 'p2',
                version: 'v1',
                dependencies: {
                    'p1': 'v2',
                },
            },
            {
                name: 'p3',
                version: 'v2',
                devDependencies: {
                    'p1': 'v3',
                },
            },
        ];
        const changes = [];
        const mock = jest.fn();

        inspect(packages, changes, mock);
        const conflicts = mock.mock.calls[0][0];
        conflicts[1].resolve();
        conflicts[0].resolve();

        expect(changes).toEqual([
            {
                packageName: 'p3',
                section: 'devDependencies',
                moduleName: 'p1',
                version: 'v1',
            },
            {
                packageName: 'p2',
                section: 'dependencies',
                moduleName: 'p1',
                version: 'v1',
            },
        ]);
    });

    it('resolve async', () => {
        const mock = () => new Promise((resolve) => {
            setTimeout(() => {
                resolve('test-result');
            }, 25);
        });

        return inspect([], [], mock).then((ret) => {
            expect(ret).toEqual('test-result');
        });
    });
});
