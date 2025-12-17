# Linkdr

A Next.js application scaffold designed for building applications with RAG (Retrieval-Augmented Generation) pipeline capabilities.

## Overview

This project is a production-ready Next.js application that serves as a foundation for building RAG-powered applications. It includes all the necessary configuration and best practices for modern web development.

## Features

- **Next.js 15** (App Router)
- **Glassmorphism UI** (Global CSS + Animations)
- **RAG Pipeline** (OpenAI Embeddings + pgvector)
- **Automated Verification** (LLM-based cross-validation)
- **Hybrid Search** (Semantic + SQL filtering)

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

Seed the database with recruiters, documents, and 60+ synthetic candidates that exercise overlapping skillsets for semantic search demos:

```bash
./scripts/db-seed.sh
```
```powershell
scripts\db-seed.bat
```

These helpers start the PostgreSQL container if needed, wait for it to accept connections, and then stream `db/seeds/seed.sql` followed by `db/seeds/candidates_small.sql`, which contains 60+ synthetic candidates for semantic differentiation demos.

### One-command setup

Want everything configured automatically? Run the setup helper and it will install Node dependencies, copy `.env` (if missing), boot the pgvector container, run migrations, and load the sample data:

```bash
./scripts/setup.sh
```
```powershell
scripts\setup.bat
```

After it finishes, edit `.env` with your own secrets and start the dev server with `npm run dev`.

Need to reset everything? Use the reset helper to bring the container down (dropping volumes) and re-run the full setup:

```bash
./scripts/db-reset.sh
```
```powershell
scripts\db-reset.bat
```

## API
The API is built on Next.js Route Handlers and includes comprehensive endpoints for candidate management, semantic search, and AI verification.
- [**Full API Documentation**](docs/API.md) - endpoints, schemas, and curl examples.

**Key Features**:
- **Semantic Search**: `/api/query` parses natural language into SQL filters + vector search.
- **Shortlisting**: `/api/query/shortlist` generates AI-reasoned shortlists.
- **Verification**: `/api/verification/process` runs background checks on candidate claims vs documents.

## Monitoring
- **Logging**: Set `LOG_WEBHOOK_URL` to post structured logs (duration, results, errors) to an external endpoint. Events print to stdout/stderr otherwise.
- **Testing**: Run `npm test` to verify query parsing, search logic, and UI components. See [Testing Guide](docs/Test.md).

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

## Documentation
Complete documentation is available in the `docs/` folder:
- [**RAG Pipeline**](docs/RAG.md): Embedding, hybrid search, and query parsing logic.
- [**API Reference**](docs/API.md): Endpoints for candidates, queries, and verification.
- [**Validation Logic**](docs/Validation.md): Automated verification using `gpt-5-mini`.
- [**Database**](docs/Database.md): Schema and pgvector setup.
- [**Testing**](docs/Test.md): Backend and component test guide.
- [**Frontend**](docs/Frontend.md): Glassmorphism design system and architecture.

## License

This project is licensed under the terms specified in the LICENSE file.

## Support

For questions or issues, please open an issue on the GitHub repository.
