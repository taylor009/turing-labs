# TuringLabs Project Proposal Management System

A full-stack application for managing product reformulation proposals with stakeholder approval workflows. Built with Next.js, Express.js, Prisma, and Supabase.

## Project Structure

```
turinglabs/
├── api/                    # Backend API (Express.js + Prisma)
├── ui/                     # Frontend UI (Next.js)
├── scripts/               # Database seeding scripts
├── project-proposal/      # Project documentation
└── README.md             # This file
```

## Prerequisites

- **Node.js**: Version 18+ 
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **Supabase Account**: For authentication and database
- **SendGrid Account**: For email notifications (optional)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd turinglabs
   
   # Install API dependencies
   cd api && pnpm install && cd ..
   
   # Install UI dependencies  
   cd ui && pnpm install && cd ..
   ```

2. **Set up environment variables** (see detailed sections below)

3. **Start both services:**
   ```bash
   # Terminal 1 - Start API server
   cd api && pnpm dev
   
   # Terminal 2 - Start UI server
   cd ui && pnpm dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/api-docs

## Backend API Setup

### 1. Environment Configuration

Copy the environment template and configure your values:

```bash
cd api
cp .env.example .env
```

Update `.env` with your configurations:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Database Configuration
# Get these from Supabase Dashboard → Settings → Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# JWT Configuration (optional - uses Supabase auth)
JWT_SECRET=your-jwt-secret-for-fallback
JWT_EXPIRES_IN=7d

# SendGrid Configuration (optional)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=TuringLabs

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000
```

### 2. Database Setup

The application uses Supabase PostgreSQL with Prisma ORM:

```bash
cd api

# Generate Prisma client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Optional: Seed database with sample data
pnpm db:seed
```

### 3. Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build           # Build for production
pnpm start           # Start production server

# Database
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run database migrations
pnpm db:push         # Push schema changes to database
pnpm db:studio       # Open Prisma Studio (database GUI)
pnpm db:seed         # Seed database with sample data
pnpm db:reset        # Reset database (⚠️ destructive)

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm typecheck       # Run TypeScript type checking
```

### 4. API Features

- **Authentication**: Supabase-based JWT authentication
- **User Management**: Automatic user sync between Supabase and Prisma
- **Proposals**: CRUD operations with status management
- **Stakeholder Management**: Invite and manage proposal stakeholders
- **Approval Workflows**: Multi-step approval processes
- **Email Notifications**: SendGrid integration for notifications
- **API Documentation**: Swagger/OpenAPI docs at `/api-docs`
- **Error Handling**: Comprehensive error handling and logging

## Frontend UI Setup

### 1. Environment Configuration

The UI uses Next.js and connects to both the API and Supabase:

```bash
cd ui
# Create .env.local (Next.js convention)
touch .env.local
```

Add to `.env.local`:

```bash
# Supabase Configuration (for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. Available Scripts

```bash
# Development
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm start           # Start production server

# Testing
pnpm test            # Run unit tests (Jest)
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate test coverage report

# End-to-End Testing
pnpm test:e2e        # Run E2E tests (Playwright)
pnpm test:e2e:ui     # Run E2E tests with UI
pnpm test:e2e:debug  # Debug E2E tests
pnpm test:e2e:headed # Run E2E tests with browser visible

# Code Quality
pnpm lint            # Run Next.js linting
```

### 3. UI Features

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Supabase Auth with custom auth provider
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks with context
- **Testing**: Jest + React Testing Library + Playwright E2E
- **Dark Mode**: Built-in theme switching
- **Responsive Design**: Mobile-first responsive design

### 4. Key Components

- **Auth System**: Login, signup, protected routes
- **Proposal Management**: Create, edit, view proposals  
- **Stakeholder System**: Invite and manage stakeholders
- **Approval Workflows**: Track and manage approvals
- **Dashboard**: Overview of proposals and activities

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

### 2. Get Database Credentials

1. In Supabase Dashboard, go to Settings → Database
2. Copy the connection string details:
   - Host, Database name, Username, Password
   - Use these to construct your `DATABASE_URL` and `DIRECT_URL`

### 3. Authentication Setup

Supabase Auth is pre-configured. The application supports:
- Email/password authentication
- Automatic user profile creation
- Session management
- Password recovery

## Architecture Overview

### Backend (API)
- **Express.js**: REST API server
- **Prisma**: Database ORM and schema management
- **Supabase**: Authentication provider
- **PostgreSQL**: Database (via Supabase)
- **Zod**: Request validation
- **Winston**: Logging
- **Swagger**: API documentation

### Frontend (UI)
- **Next.js**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components
- **Supabase Client**: Authentication
- **React Hook Form**: Form management
- **Zod**: Form validation

### Data Flow
1. User authenticates via Supabase Auth
2. Frontend gets JWT token from Supabase
3. Frontend sends requests to API with Bearer token
4. API validates token with Supabase and syncs user to Prisma DB
5. API processes business logic and returns data
6. Frontend displays data using React components

## Development Workflow

### 1. Making Changes

```bash
# 1. Start both servers in development mode
cd api && pnpm dev &
cd ui && pnpm dev &

# 2. Make your changes

# 3. Run tests
cd api && pnpm typecheck && pnpm lint
cd ui && pnpm test && pnpm lint

# 4. Test E2E workflows
cd ui && pnpm test:e2e
```

### 2. Database Changes

```bash
cd api

# 1. Modify prisma/schema.prisma
# 2. Push changes to database
pnpm db:push

# 3. Generate new Prisma client
pnpm db:generate

# 4. Restart API server to pick up changes
```

### 3. Adding New Features

1. **API Changes**: 
   - Add routes in `src/routes/`
   - Add controllers in `src/controllers/`
   - Add schemas in `src/schemas/`
   - Update Swagger documentation

2. **UI Changes**:
   - Add components in `components/`
   - Add pages in `app/`
   - Add API calls in `lib/api.ts`
   - Add tests in `__tests__/`

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check your DATABASE_URL in api/.env
# Verify database password is correct (not anon key)
cd api && npx prisma db pull
```

**2. Authentication Not Working**
```bash
# Verify Supabase keys in both api/.env and ui/.env.local
# Check that SUPABASE_URL and keys match your project
```

**3. CORS Errors**
```bash
# Verify FRONTEND_URL in api/.env matches your UI URL
# Default should be http://localhost:3000
```

**4. Port Conflicts**
```bash
# API runs on :8080, UI runs on :3000
# Change PORT in api/.env if needed
```

**5. Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
cd ui && rm -rf .next
```

### Debug Mode

**API Debugging:**
```bash
cd api
LOG_LEVEL=debug pnpm dev
```

**UI Debugging:**
```bash
cd ui  
NEXT_PUBLIC_DEBUG=true pnpm dev
```

### Logs and Monitoring

- **API Logs**: Console output with Winston formatting
- **UI Logs**: Browser console and Next.js logs
- **Database**: Use `pnpm db:studio` for GUI access
- **API Docs**: Visit http://localhost:8080/api-docs

## Production Deployment

### Environment Variables

Update production environment variables:
- Use production Supabase project
- Use production database URLs
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use strong JWT secrets
- Set up production email service

### Build Commands

```bash
# Build API
cd api && pnpm build

# Build UI  
cd ui && pnpm build

# Start production servers
cd api && pnpm start
cd ui && pnpm start
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Run linting and type checking
5. Test E2E workflows before submitting

## Model Context Protocol (MCP) Servers

This project is configured with several MCP servers that enhance Claude's capabilities when working with the codebase. These servers are defined in `.mcp.json` and provide specialized tools for development and analysis.

### Configured MCP Servers

#### 1. **Task Master AI** (`task-master-ai`)
**Purpose**: Advanced task planning and project management  
**Features**:
- AI-powered task breakdown and estimation
- Project planning and dependency management
- Code analysis and refactoring suggestions
- Integration with multiple AI providers (Anthropic, OpenAI, Google)

**Environment Variables Required**:
- `ANTHROPIC_API_KEY`: For Claude integration
- `OPENAI_API_KEY`: For GPT model access  
- `GOOGLE_API_KEY`: For Gemini model access

#### 2. **Memory Server** (`@modelcontextprotocol/server-memory`)
**Purpose**: Persistent memory and context management  
**Features**:
- Store and retrieve conversation context
- Maintain project-specific knowledge
- Remember decisions and patterns across sessions
- No additional configuration required

#### 3. **Exa Search** (`exa-mcp-server`) 
**Purpose**: Advanced web search and research capabilities  
**Features**:
- Semantic web search for technical documentation
- Code example discovery
- Best practices research
- Real-time information retrieval

**Environment Variables Required**:
- `EXA_API_KEY`: API key for Exa search service

#### 4. **Context7** (`@upstash/context7-mcp`)
**Purpose**: Vector database and semantic search  
**Features**:
- Semantic similarity search across codebase
- Context-aware code suggestions
- Pattern recognition and matching
- No additional configuration required

#### 5. **Supabase** (`@supabase/mcp-server-supabase`)
**Purpose**: Direct Supabase database integration  
**Features**:
- Read-only access to Supabase database
- Schema introspection and analysis
- Data querying and exploration
- Database optimization suggestions

**Configuration**:
- **Project Reference**: `njvpeanwvnchyrogfpcm`
- **Access Mode**: Read-only (safe for production)
- **Environment Variables Required**:
  - `SUPABASE_ACCESS_TOKEN`: Service token for database access

#### 6. **Playwright** (`@playwright/mcp`)
**Purpose**: End-to-end testing and browser automation  
**Features**:
- E2E test generation and execution
- Browser-based debugging
- Visual regression testing
- Cross-browser compatibility testing
- No additional configuration required

### MCP Benefits for Development

**Enhanced Code Understanding**:
- **Memory Server**: Remembers project context and decisions
- **Context7**: Finds similar code patterns and suggests improvements
- **Supabase**: Direct database schema awareness

**Improved Research & Discovery**:
- **Exa**: Finds relevant documentation and examples
- **Task Master**: Provides AI-powered development insights
- **Context7**: Semantic code search capabilities

**Better Testing & Quality**:
- **Playwright**: Automated E2E test generation
- **Task Master**: Code quality analysis and suggestions
- **Supabase**: Database query optimization

### MCP Configuration Files

The MCP configuration is stored in `.mcp.json` at the project root. This file defines:
- Server commands and arguments
- Environment variables for each server
- Service-specific configurations

### Using MCPs in Development

When using Claude Code with this project, these MCPs automatically enhance Claude's capabilities:

1. **Database Queries**: Claude can directly inspect your Supabase schema
2. **Code Search**: Semantic search finds relevant code patterns
3. **Task Planning**: AI-powered project planning and estimation
4. **Research**: Advanced web search for documentation and examples
5. **Testing**: Automated E2E test generation and execution
6. **Memory**: Context persistence across development sessions

### Security Considerations

- **Read-Only Access**: Supabase MCP is configured as read-only
- **API Key Management**: Sensitive keys are stored in environment variables
- **Access Tokens**: Use service-specific tokens with minimal required permissions

### Troubleshooting MCPs

**MCP Server Not Loading**:
```bash
# Check if MCP packages are available
npx -y @modelcontextprotocol/server-memory --version

# Verify environment variables are set
echo $SUPABASE_ACCESS_TOKEN
```

**API Key Issues**:
- Verify all required API keys are valid and have proper permissions
- Check rate limits for external services (Exa, OpenAI, etc.)
- Ensure Supabase access token has read permissions

**Performance Issues**:
- MCPs run as separate processes and may use additional memory
- Consider disabling unused MCPs in `.mcp.json` if needed
- Monitor API usage for external services

## Support

For setup issues or questions:
1. Check this README
2. Review the troubleshooting section
3. Check existing issues in the repository
4. Look at the API documentation at `/api-docs`
5. Consult MCP-specific documentation for integration issues

---

**Tech Stack Summary:**
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js, Prisma, TypeScript  
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth
- Testing: Jest, Playwright
- MCPs: Task Master AI, Memory, Exa, Context7, Supabase, Playwright
- Deployment: Node.js compatible platforms