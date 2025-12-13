# Lyrathon

A Next.js application scaffold designed for building applications with RAG (Retrieval-Augmented Generation) pipeline capabilities.

## Overview

This project is a production-ready Next.js application that serves as a foundation for building RAG-powered applications. It includes all the necessary configuration and best practices for modern web development.

## Features

- **Next.js 15** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **ESLint** for code quality and consistency
- **Optimized** for RAG pipeline integration
- **Server Components** for improved performance
- **API Routes** ready for backend integration

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.17 or later
- **npm** or **yarn** or **pnpm**
- **Docker** and **Docker Compose** (for the PostgreSQL database)

## Database

PostgreSQL powers the candidate/recruiter data model. To run it locally:

1. Copy the sample environment file and adjust as needed:
   ```bash
   cp .env.example .env
   ```
2. Start PostgreSQL (includes the pgvector extension):
   ```bash
   docker compose up -d postgres
   ```
   _Tip: the helper scripts below will automatically start (or install) the container and wait for readiness if you skip this step._
3. Apply the schema (run after the container is healthy):
   ```bash
   ./scripts/db-migrate.sh
   ```
   ```powershell
   scripts\db-migrate.bat
   ```

`DATABASE_URL` in `.env` follows the standard `postgresql://user:password@host:port/db` format and can be reused by ORMs or Prisma later. When you need a clean slate, stop services with `docker compose down` (add `-v` to drop volumes).

### Sample data

Seed the database with a few candidates, recruiters, and documents:

```bash
./scripts/db-seed.sh
```
```powershell
scripts\db-seed.bat
```

These helpers start the PostgreSQL container if needed, wait for it to accept connections, and then stream `db/seeds/seed.sql`, which you can extend with additional demo records as needed.

### One-command setup

Want everything configured automatically? Run the setup helper and it will install Node dependencies, copy `.env` (if missing), boot the pgvector container, run migrations, and load the sample data:

```bash
./scripts/setup.sh
```
```powershell
scripts\setup.bat
```

After it finishes, edit `.env` with your own secrets and start the dev server with `npm run dev`.

## API

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL` / `OPENAI_EMBEDDING_MODEL`) in `.env` to enable LLM-powered query parsing and embeddings. The default embedding model is `text-embedding-3-small` (1536 dimensions) to stay within pgvector’s 2000-dimension index limit. Key endpoints:

### `/api/candidates`

Filtered candidate search over PostgreSQL. `searchTerm` is required (used for keywords), while every other field is optional and treated as a preference rather than a hard requirement. Send a POST request with JSON filters:

```bash
curl -X POST http://localhost:3000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "frontend",
    "location": "canada",
    "visaRequired": true,
    "minExperience": 5,
    "maxSalary": 180000,
    "availabilityBefore": "2025-03-01",
    "limit": 20
  }'
```

The route applies the keyword match as the only hard filter, then boosts candidates who align with the optional hints (location aliases, visa readiness, experience, compensation, availability) before returning results.

### `/api/query`

Turns natural-language recruiter prompts into structured filters via OpenAI before executing the search:

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Need senior React engineer in Canada, must be eligible for TN visa, salary under 170k",
    "limit": 10
  }'
```

Response includes the inferred filters plus the shortlisted candidates. If `OPENAI_API_KEY` is not configured, the endpoint falls back to keyword-only matching.

### `/api/candidates/register`

Intake endpoint for candidate submissions. POST candidate details (name, email, skills, etc.) to persist the record and trigger embedding generation immediately:

```bash
curl -X POST http://localhost:3000/api/candidates/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kai Patel",
    "email": "kai@example.com",
    "current_position": "Senior Backend Engineer",
    "location": "Toronto, CA",
    "skills_text": "Go, AWS, PostgreSQL, GraphQL, distributed systems",
    "projects_text": "Lead payments platform rewrite for 5M users."
  }'
```

Successful ingestion will create/update embeddings in `candidate_embeddings`, keeping the vector index synchronized with SQL changes.

## Retrieval Flow

1. **Candidate intake** (`/api/candidates/register`): form submissions hit this endpoint, which stores the row in PostgreSQL and generates embeddings through OpenAI into the `candidate_embeddings` table (powered by `pgvector`).
2. **Recruiter query** (`/api/query`): natural-language prompts are parsed by an LLM into structured filters, run against SQL for deterministic requirements (visa, availability, etc.), and re-ranked semantically via vector similarity before returning a shortlist.
3. **Future steps**: layer on hybrid BM25+vector search, re-ranking, and shortlist generation as described in `RAG.md`.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/petmav/lyrathon.git
cd lyrathon
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

## Available Scripts

The following npm scripts are available for different development tasks:

### Development

```bash
npm run dev
```

Starts the development server on [http://localhost:3000](http://localhost:3000). The page auto-updates as you edit files.

- Hot Module Replacement (HMR) enabled
- Error overlay for quick debugging
- Fast Refresh for instant feedback

### Build

```bash
npm run build
```

Creates an optimized production build of the application:
- Compiles TypeScript to JavaScript
- Minifies code for better performance
- Generates static pages where possible
- Optimizes images and assets

### Production Start

```bash
npm start
```

Starts the production server (requires `npm run build` first). Use this to test the production build locally before deployment.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality and adherence to coding standards. This includes:
- Next.js specific linting rules
- React best practices
- TypeScript type checking integration

### Testing

```bash
npm run test
```

Runs the test suite using Jest (to be configured).

```bash
npm run test:watch
```

Runs tests in watch mode for active development.

```bash
npm run test:coverage
```

Generates a test coverage report.

## Project Structure

```
lyrathon/
├── src/
│   ├── app/              # App Router pages and layouts
│   │   ├── layout.tsx    # Root layout component
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable React components
│   └── lib/              # Utility functions and helpers
├── public/               # Static assets (images, fonts, etc.)
├── .eslintrc.json        # ESLint configuration
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies and scripts
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Your Changes**
   - Edit files in `src/app/` for pages
   - Create reusable components in `src/components/`
   - Add utilities in `src/lib/`

3. **Lint Your Code**
   ```bash
   npm run lint
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Test Production Build**
   ```bash
   npm start
   ```

## RAG Pipeline Integration

This application is designed to integrate with RAG (Retrieval-Augmented Generation) pipelines. Future implementations will include:

- **Vector Database Integration**: For efficient document storage and retrieval
- **Embedding Generation**: Converting documents to vector embeddings
- **Semantic Search**: Finding relevant context for user queries
- **LLM Integration**: Generating responses based on retrieved context
- **API Endpoints**: Server-side routes for RAG operations

### Recommended Architecture

```
Client → Next.js API Routes → RAG Pipeline → Vector DB
                            ↓
                        LLM Service
```

## Environment Variables

Create a `.env.local` file in the root directory for environment-specific variables:

```env
# API Keys (examples for future RAG integration)
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment

# Application Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Never commit `.env.local` or `.env` files to version control.

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Add environment variables in the Vercel dashboard
5. Deploy!

### Other Platforms

This Next.js application can be deployed to:
- **AWS** (EC2, ECS, Lambda)
- **Google Cloud** (Cloud Run, App Engine)
- **Azure** (App Service)
- **Docker** containers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Best Practices

- **Type Safety**: Always use TypeScript types and interfaces
- **Component Structure**: Keep components small and focused
- **Server Components**: Use React Server Components by default, Client Components only when needed
- **Error Handling**: Implement proper error boundaries and error pages
- **Performance**: Optimize images, use lazy loading, and code splitting
- **Security**: Validate all inputs, sanitize data, use environment variables for secrets

## Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 npm run dev
```

**Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**TypeScript errors**
```bash
# Regenerate TypeScript types
npm run build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [RAG Concepts](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## License

This project is licensed under the terms specified in the LICENSE file.

## Support

For questions or issues, please open an issue on the GitHub repository.
