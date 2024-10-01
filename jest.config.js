const path = require('path');

module.exports = {
    moduleDirectories: ['node_modules', path.join(__dirname, 'modules'), 'modules'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!(crawling|axios|jsdom|url-parse|chalk)/)'],
    testEnvironment: 'node',
};
