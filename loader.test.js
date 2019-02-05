jest.mock('util', () => ({
    promisify: x => x,
}));
jest.mock('fs', () => ({
    readdir: null,
    readFile: null,
    writeFile: null,
}));

const { loadPackages, savePackages } = require('./loader');

describe('loadPackages', () => {
    it('test', () => {
        expect(true).toEqual(true);
    });
});

describe('savePackages', () => {

});
