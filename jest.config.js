module.exports = {
    testEnvironment: 'node', // Default test environment for Node.js
    testMatch: ['**/public/__test__/*.test.js'], // Match all test files in the specified directory
    projects: [
        {
            displayName: 'node',
            testEnvironment: 'node',
            testMatch: ['**/public/__test__/app.test.js'], // Use Node environment for app.test.js
        },
        {
            displayName: 'jsdom',
            testEnvironment: 'jsdom',
            testMatch: ['**/public/__test__/main.test.js'], // Use jsdom environment for main.test.js
        },
    ],
};