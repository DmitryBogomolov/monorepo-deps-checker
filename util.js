function processPackages(packages, action) {
    packages.forEach((content) => {
        const packageName = content.name;
        if (content.dependencies) {
            action(packageName, 'dependencies', content.dependencies);
        }
        if (content.devDependencies) {
            action(packageName, 'devDependencies', content.devDependencies);
        }
        if (content.peerDependencies) {
            action(packageName, 'peerDependencies', content.peerDependencies);
        }
    });
}

exports.processPackages = processPackages;
