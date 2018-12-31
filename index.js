const check = require('./check');

async function main() {
    try {
        const dir = process.argv[2];
        await check(dir);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
