# Testing Framework

Linkdr uses Jest for both backend and frontend testing.

## Configuration
- **Config File**: `jest.config.js`
- **Setup**: `jest.setup.ts` (imports `@testing-library/jest-dom`)
- **Environment**: 
  - `dom` (JSDOM) derived environment for `src/components` tests (default).
  - `node` environment explicitly set for backend logic tests (e.g., `tests/candidate-search.test.ts`).

## Test Suites

### Backend Tests (`tests/*.test.ts`)
Focus on the logic in `src/lib/`.
- **Verification**: Tests the LLM verification logic (mocked).
- **Search**: Tests vector search ranking and SQL generation.
- **Parsing**: Tests query parser resilience to missing API keys.
- **Mocking**: `OPENAI_API_KEY` and `DATABASE_URL` are mocked in `jest.env.js` and individual tests to prevent external calls.

### Component Tests (`tests/components/*.test.tsx`)
Focus on the React UI in `src/app/`.
- **Library**: `@testing-library/react`
- **Scope**: Interaction tests (filling forms, clicking buttons, submitting).
- **Mocking**: API calls (`fetch`) are mocked to return canned responses. `act(...)` warnings are handled by awaiting state-updating promises.

## Running Tests
- `npm test`: Runs all tests.
- `npm run test:watch`: Runs in interactive watch mode.
