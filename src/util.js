const ITEMS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
];

function processPackages(packages, action) {
    packages.forEach((content) => {
        const packageName = content.name;
        ITEMS.forEach((part) => {
            if (content[part]) {
                action(packageName, part, content[part]);
            }
        });
    });
}

exports.processPackages = processPackages;
