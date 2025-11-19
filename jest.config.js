module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@remix-run/(.*)': '<rootDir>/node_modules/@remix-run/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};