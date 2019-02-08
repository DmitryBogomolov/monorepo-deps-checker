const inspect = require('./modules-checker');

describe('modules checker', () => {
    it('collect conflicts', () => {
        const packages = [
            {
                name: 'p1',
                dependencies: {
                    'm1': 'v1',
                    'm2': 'v1',
                },
            },
            {
                name: 'p2',
                devDependencies: {
                    'm1': 'v1',
                    'm2': 'v2',
                    'm3': 'v2',
                },
            },
            {
                name: 'p3',
                dependencies: {
                    'm3': 'v3',
                },
                devDependencies: {
                    'm2': 'v1',
                    'm3': 'v3',
                },
            },
        ];
        const changes = [];
        const mock = jest.fn();

        inspect(packages, changes, mock);

        expect(mock).toBeCalledWith([
            {
                moduleName: 'm2',
                resolve: expect.any(Function),
                items: [
                    {
                        version: 'v1',
                        packages: [
                            {
                                packageName: 'p1',
                                section: 'dependencies',
                            },
                            {
                                packageName: 'p3',
                                section: 'devDependencies',
                            },
                        ],
                    },
                    {
                        version: 'v2',
                        packages: [
                            {
                                packageName: 'p2',
                                section: 'devDependencies',
                            },
                        ],
                    },
                ],
            },
            {
                moduleName: 'm3',
                resolve: expect.any(Function),
                items: [
                    {
                        version: 'v3',
                        packages: [
                            {
                                packageName: 'p3',
                                section: 'dependencies',
                            },
                            {
                                packageName: 'p3',
                                section: 'devDependencies',
                            },
                        ],
                    },
                    {
                        version: 'v2',
                        packages: [
                            {
                                packageName: 'p2',
                                section: 'devDependencies',
                            },
                        ],
                    },
                ],
            },
        ]);
        expect(changes).toEqual([]);
    });

    it('resolve changes to a default choice', () => {
        const packages = [
            {
                name: 'p1',
                dependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p2',
                peerDependencies: {
                    'm1': 'v2',
                },
                devDependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p3',
                dependencies: {
                    'm1': 'v1',
                },
                devDependencies: {
                    'm1': 'v3',
                },
            },
        ];
        const changes = [];
        const mock = jest.fn();

        inspect(packages, changes, mock);
        const conflicts = mock.mock.calls[0][0];
        conflicts[0].resolve();

        expect(changes).toEqual([
            {
                packageName: 'p2',
                section: 'peerDependencies',
                moduleName: 'm1',
                version: 'v1',
            },
            {
                packageName: 'p3',
                section: 'devDependencies',
                moduleName: 'm1',
                version: 'v1',
            },
        ]);
    });

    it('resolve changes', () => {
        const packages = [
            {
                name: 'p1',
                dependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p2',
                peerDependencies: {
                    'm1': 'v2',
                },
                devDependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p3',
                dependencies: {
                    'm1': 'v1',
                },
                devDependencies: {
                    'm1': 'v3',
                },
            },
        ];
        const changes = [];
        const mock = jest.fn();

        inspect(packages, changes, mock);
        const conflicts = mock.mock.calls[0][0];
        conflicts[0].resolve(2);

        expect(changes).toEqual([
            {
                packageName: 'p1',
                section: 'dependencies',
                moduleName: 'm1',
                version: 'v3',
            },
            {
                packageName: 'p2',
                section: 'devDependencies',
                moduleName: 'm1',
                version: 'v3',
            },
            {
                packageName: 'p3',
                section: 'dependencies',
                moduleName: 'm1',
                version: 'v3',
            },
            {
                packageName: 'p2',
                section: 'peerDependencies',
                moduleName: 'm1',
                version: 'v3',
            },
        ]);
    });

    it('resolve changes with filter', () => {
        const packages = [
            {
                name: 'p1',
                dependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p2',
                peerDependencies: {
                    'm1': 'v2',
                },
                devDependencies: {
                    'm1': 'v1',
                },
            },
            {
                name: 'p3',
                dependencies: {
                    'm1': 'v1',
                },
                devDependencies: {
                    'm1': 'v3',
                },
            },
        ];
        const changes = [];
        const mock = jest.fn();

        const filter = jest.fn();
        filter.mockReturnValueOnce(true);
        filter.mockReturnValueOnce(false);
        filter.mockReturnValueOnce(false);
        filter.mockReturnValueOnce(true);

        inspect(packages, changes, mock);
        const conflicts = mock.mock.calls[0][0];
        conflicts[0].resolve(2, filter);

        expect(changes).toEqual([
            {
                packageName: 'p1',
                section: 'dependencies',
                moduleName: 'm1',
                version: 'v3',
            },
            {
                packageName: 'p2',
                section: 'peerDependencies',
                moduleName: 'm1',
                version: 'v3',
            },
        ]);
        expect(filter.mock.calls).toEqual([
            [{
                packageName: 'p1',
                section: 'dependencies',
                moduleName: 'm1',
                version: 'v1',
                targetVersion: 'v3',
            }],
            [{
                packageName: 'p2',
                section: 'devDependencies',
                moduleName: 'm1',
                version: 'v1',
                targetVersion: 'v3',
            }],
            [{
                packageName: 'p3',
                section: 'dependencies',
                moduleName: 'm1',
                version: 'v1',
                targetVersion: 'v3',
            }],
            [{
                packageName: 'p2',
                section: 'peerDependencies',
                moduleName: 'm1',
                version: 'v2',
                targetVersion: 'v3',
            }],
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
