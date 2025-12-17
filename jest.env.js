// Set dummy environment variables to prevent early throws in modules
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
process.env.OPENAI_API_KEY = 'dummy-key';
