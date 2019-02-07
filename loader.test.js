const readdir = jest.fn();
const readFile = jest.fn();
const writeFile = jest.fn();

jest.mock('util', () => ({
    promisify: x => x,
}));
jest.mock('fs', () => ({
    readdir,
    readFile,
    writeFile,
}));

const { loadPackages, savePackages } = require('./loader');

describe('loader', () => {
    describe('loadPackages', () => {
        afterEach(() => {
            readdir.mockReset();
            readFile.mockReset();
        });

        it('should handle non existing directory', () => {
            const err = new Error('test');
            err.code = 'ENOENT';
            readdir.mockRejectedValue(err);

            return loadPackages('test-dir')
                .then(() => {
                    throw 'IT SHOULD FAIL!';
                })
                .catch((err) => {
                    expect(err.message).toEqual('directory \'test-dir\' does not exist');
                });
        });

        it('should load packages', () => {
            readdir.mockResolvedValue(['item1', 'item2', 'item3', 'item4']);
            readFile.mockResolvedValueOnce('{ "name": "a", "item1": 1 }');
            readFile.mockResolvedValueOnce('{ "name": "b", "item2": 2 }');
            readFile.mockRejectedValueOnce({ code: 'ENOENT' });
            readFile.mockResolvedValueOnce('{ "name": "d", "item4": 4 }');

            const map = {};
            return loadPackages('test-dir', map).then((packages) => {
                expect(packages).toEqual([
                    { name: 'a', item1: 1 },
                    { name: 'b', item2: 2 },
                    { name: 'd', item4: 4 },
                ]);
                expect(map).toEqual({
                    'a': 'test-dir/item1/package.json',
                    'b': 'test-dir/item2/package.json',
                    'd': 'test-dir/item4/package.json',
                });
                expect(readdir).toBeCalledWith('test-dir');
                expect(readFile.mock.calls).toEqual([
                    ['test-dir/item1/package.json', 'utf8'],
                    ['test-dir/item2/package.json', 'utf8'],
                    ['test-dir/item3/package.json', 'utf8'],
                    ['test-dir/item4/package.json', 'utf8'],
                ]);
            });
        });

        it('should handle errors', () => {
            readdir.mockResolvedValue(['item1', 'item2', 'item3', 'item4']);
            readFile.mockRejectedValueOnce({ err: 'error1' });
            readFile.mockRejectedValueOnce({ code: 'ENOENT' });
            readFile.mockResolvedValueOnce('{ "name": "b", "item2": 2 }');
            readFile.mockRejectedValueOnce({ err: 'error4' });

            return loadPackages('test-dir', {})
                .then(() => {
                    throw 'IT SHOULD FAIL!';
                })
                .catch((err) => {
                    expect(err.message).toEqual('some packages are not loaded');
                    expect(err.errors).toEqual([
                        { err: 'error1' },
                        { err: 'error4' },
                    ]);
                });
        });
    });

    describe('savePackages', () => {
        afterEach(() => {
            writeFile.mockReset();
        });

        it('should save packages', () => {
            writeFile.mockResolvedValue();
            const packages = [
                { name: 'a', item1: 1 },
                { name: 'b', item1: 2 },
                { name: 'c', item1: 3 },
            ];
            const map = {
                'a': 'test-dir/item1/package.json',
                'b': 'test-dir/item2/package.json',
                'c': 'test-dir/item3/package.json',
            };

            return savePackages(packages, map).then(() => {
                expect(writeFile.mock.calls).toEqual([
                    ['test-dir/item1/package.json', JSON.stringify(packages[0], null, 2) + '\n', 'utf8'],
                    ['test-dir/item2/package.json', JSON.stringify(packages[1], null, 2) + '\n', 'utf8'],
                    ['test-dir/item3/package.json', JSON.stringify(packages[2], null, 2) + '\n', 'utf8'],
                ]);
            });
        });

        it('should handle errors', () => {
            writeFile.mockRejectedValueOnce({ err: 'error1' });
            writeFile.mockResolvedValueOnce();
            writeFile.mockRejectedValueOnce({ err: 'error3' });
            const packages = [
                { name: 'a', item1: 1 },
                { name: 'b', item1: 2 },
                { name: 'c', item1: 3 },
            ];
            const map = {
                'a': 'test-dir/item1/package.json',
                'b': 'test-dir/item2/package.json',
                'c': 'test-dir/item3/package.json',
            };

            return savePackages(packages, map)
                .then(() => {
                    throw 'IT SHOULD FAIL!';
                })
                .catch((err) => {
                    expect(err.message).toEqual('some packages are not saved');
                    expect(err.errors).toEqual([
                        { err: 'error1' },
                        { err: 'error3' },
                    ]);
                });
        });
    });
});
