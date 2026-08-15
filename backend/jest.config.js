process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts']
};

