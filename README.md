![Fastify Boilerplate Logo](doc/images/fastify_logo.png)

[![Biome](https://img.shields.io/badge/Biome-60a5fa?logo=biome&logoColor=fff)](https://biomejs.dev/) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![MIT License](https://img.shields.io/github/license/marcoturi/fastify-boilerplate)](https://github.com/marcoturi/fastify-boilerplate/blob/main/LICENSE) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marcoturi/fastify-boilerplate/codeql-analysis.yml) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/marcoturi/fastify-boilerplate/release.yml)

This meticulously crafted boilerplate serves as a solid foundation for building production-ready Fastify applications. While designed specifically for Fastify, the underlying principles and best practices aim to be adaptable to different frameworks and languages. These principles include clean architecture, domain-driven design, CQRS, vertical slice architecture, and dependency injection.

## ⚡ Features

- Native TypeScript: Runs TypeScript directly via [Node.js >= 24](https://nodejs.org/en/blog/release/v24.0.0) native type stripping — no build step, no transpiler, no `tsc --build`
- Framework: [Fastify 5](https://github.com/fastify/fastify) with [Awilix](https://github.com/jeffijoe/awilix) for the dependency injection and [Pino](https://github.com/pinojs/pino) for logging
- Plugins: [@fastify/helmet](https://github.com/fastify/fastify-helmet) for security headers, [@fastify/swagger](https://github.com/fastify/fastify-swagger) for Swagger documentation, [@fastify/under-pressure](https://github.com/fastify/under-pressure) for automatic handling of "Service Unavailable", [@fastify/awilix](https://github.com/fastify/fastify-awilix) for dependency injection, [typebox](https://github.com/sinclairzx81/typebox) for JSON schema and TS generation and validation
- DB: [Postgres](https://github.com/porsager/postgres) as client + [DBMate](https://github.com/amacneil/dbmate) for seeds and migrations
- Graphql: [Mercurius](https://github.com/mercurius-js/mercurius)
- Docker: Production-ready multi-stage [Dockerfile](Dockerfile) with Alpine, non-root user, health checks, and [Docker Compose](docker-compose.yml) for local development
- Telemetry: Vendor-agnostic [OpenTelemetry](https://opentelemetry.io/) with auto-instrumentation, disabled by default, ready for any OTLP-compatible backend
- Format and Style: [Biome](https://biomejs.dev/) for linting and formatting
- Dependencies validation: [depcruise](https://github.com/sverweij/dependency-cruiser)
- Release flow: [Husky](https://github.com/typicode/husky) + [Commitlint](https://commitlint.js.org/) + [Semantic-release](https://github.com/semantic-release/semantic-release)
- Tests: E2E tests with [Cucumber](https://cucumber.io/docs/installation/javascript/), and unit and integration tests with node:test
- AI-Ready: [AGENTS.md](AGENTS.md) provides architecture rules, coding conventions, and step-by-step guides for AI coding assistants (Cursor, Claude Code, GitHub Copilot, and others)

## 👉 Table of Contents

- [Getting Started](#start)
- [Principles](#principles)
- [Useful resources](#resources)
- [Client types generation](#client-types)

## <a name="start"></a>✨ Getting Started

```bash
npx degit marcoturi/fastify-boilerplate my-app
cd my-app

pnpm install
```

### Common Commands

- `pnpm start` - start a development server.
- `pnpm start:prod` - start prod server.
- `pnpm test` - run unit and integration tests.
- `pnpm test:coverage` - run unit and integration tests with coverage.
- `pnpm test:unit` - run only unit tests.
- `pnpm test:e2e` - run E2E tests.
- `pnpm type:check` - check for typescript errors.
- `pnpm deps:validate` - check for dependencies problems (i.e. use route code inside a repository).
- `pnpm outdated` - update dependencies interactively.
- `pnpm format` - format all files with Biome.
- `pnpm lint` - runs Biome linter.
- `pnpm create:env` - creates and .env file by copying .env.example.
- `pnpm db:create-migration` - creates a new db migration.
- `pnpm db:migrate` - start db migrations.
- `pnpm db:create-seed` - creates a new db seed.
- `pnpm db:seed` - start db seeds.

### Docker

Run the full stack (app + Postgres) with Docker Compose:

```bash
pnpm create:env   # create .env from .env.example (if not done already)
docker compose up  # builds the app image and starts all services
```

Or build and run the image standalone:

```bash
docker build -t fastify-boilerplate .
docker run -p 3000:3000 --env-file .env -e HOST=0.0.0.0 fastify-boilerplate
```

The Dockerfile follows production best practices:

- **Multi-stage build** — dependencies are installed in an isolated stage for optimal layer caching
- **Node 24 Alpine** — small image footprint (~280 MB), leveraging native TypeScript execution (no build step)
- **Non-root user** — the app runs as an unprivileged `fastify` user (uid 1001)
- **dumb-init** — proper PID 1 signal forwarding for graceful shutdown
- **HEALTHCHECK** — built-in Docker health check against the `/health` endpoint

## <a name="principles"></a>🧱 Principles

![Fastify Boilerplate](doc/images/fastify-boilerplate.png)
<sup>Diagram adapted from [here](https://github.com/Sairyss/domain-driven-hexagon)</sup>

### Project Principles

- Adaptable Complexity: The structure should be flexible (scalable through adding or removing layers) to handle varying application complexities.
- Future-Proofing: Technology and design choices should ensure the project's long-term health. This includes: clear separation of framework and application code and utilizing well-established, widely used packages/tools with minimal dependencies.
- Functional Programming Emphasis: Prioritize functional programming patterns and composition over object-oriented approaches (OOP) and inheritance for potentially improved maintainability.
- Microservices-Ready Architecture: Leveraging techniques like vertical slice architecture, path aliases, and CQRS (Command Query Responsibility Segregation) for communication. This promotes modularity and separation of concerns, facilitating potential future extraction and creation of microservices.

### Code Principles

- Framework Agnostic: Using vanilla Node.js, express, fastify? Your core business logic does not care about that either. Therefore, we will minimize fastify dependencies inside modules folder.
- Client Interface Agnostic: The core business logic does not care if you are using a CLI, a REST API, or even gRPC. Command/Query handlers will serve every protocol needs.
- Database Agnostic: Your core business logic does not care if you are using Postgres, MongoDB, or CouchDB for that matter. Database code, problems and errors should be tackled only in repositories.
- The dependencies between software components should always point inward towards the core of the application. In other words, the innermost layers of the system should not depend on the outer layers. The flow of the code will be Route → Handler → Domain (optional) → Repository.

This project is based on some of the following principles/styles:

- [Domain-Driven Design (DDD)](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Hexagonal (Ports and Adapters) Architecture](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Onion Architecture](https://herbertograca.com/2017/09/21/onion-architecture/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Vertical slice architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [The Common Closure Principle (CCP)](https://en.wikipedia.org/wiki/Common_closure_principle)

### Modules

- Each module's name should reflect an important concept from the Domain and have its own folder (see [vertical slice architecture](https://www.jimmybogard.com/vertical-slice-architecture/)).
- It's easier to work on things that change together if those things are gathered relatively close to each other (see [The Common Closure Principle (CCP)](https://en.wikipedia.org/wiki/Common_closure_principle)).
- Every module is independent (i.e. no direct imports) and has interactions between modules minimal. You want to be able to easily extract a module into a separate microservice if needed.

How do I keep modules clean and decoupled between each one?

- One module shouldn't call other module directly (for example by importing an entity from module A to module B). You should create public interfaces to do so (for example, create a query that returns some data from feature A to anyone who calls it, so module B can query it).
- In case of fire and forget logic (like sending an email after some operation), you can use events to communicate between modules.
- If two modules are too "chatty", maybe they should be merged into a single module

### Module Components

Each layer should handle its own distinct functionality. Ideally, these components should adhere to the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle), meaning they have a single, well-defined purpose:

**Route:**
The process starts with a request (HTTP, GRPC, Graphql) sent to the route. You can find the routes in the `src/modules/feature/{commands|queries}` folder.
Routes handle HTTP request/response, request validation, and response formatting based on the type of protocol implied. They should not contain any business logic.

> **Note:** All REST routes are automatically prefixed with `/api` (e.g. `/api/v1/users`). This prefix is configured via `@fastify/autoload` in `src/server/index.ts`.

Example file: [find-users.route.ts](src/modules/user/queries/find-users/find-users.route.ts)

**Command/Query Handler:**
The Command or Query Handler, or an application Service handles the received request. It executes the necessary business logic by leveraging Domain Services. It also interacts with the infrastructure layer through well-defined interfaces (ports). Commands are state-changing operations and Queries are data-retrieval operations. They do not contain domain-specific business logic. One handler per use case it's generally a good practice (e.g., CreateUser, UpdateUser, etc.).

Note: instead of using handler you can also use an application service to handle commands/queries/events.

Using this pattern has several advantages:

- You can implement middlewares in between the route and the handler. This way you can achieve things like authorization, rate limiting, caching, profiling, etc. It's easy to granular apply these middlewares to specific commands/queries by using simple regex i.e. by looking at `users/*` if you want to hit every command in the user module or `users/create` for specific ones. Example file: [middlewares.ts](src/shared/cqrs/middlewares.ts)
- Reduce coupling between modules. Instead of explicitly defining dependencies between modules you can use commands/queries. At the moment you want to extract a module into a separate microservice you can just implement the GRPC request logic in the handler, and you are good to go.

Example file: [find-users.handler.ts](src/modules/user/queries/find-users/find-users.handler.ts)

**Domain Service:**
Contains the core business logic. For example, how to compose a new entity, calculate its own properties and how to change them. In this specific project there are no entities/aggregates classes (see [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)) and data is generally composed by objects/arrays/primitives therefore domain services are the responsible for handling the surrounding business. The domain should represent (in code) what the business is or does (in real life).

Example file: [user.domain.ts](src/modules/user/domain/user.domain.ts)

**Repository:**
Adapts data to its internal format, retrieves or persists data from/to a database as needed. Repositories decouple the infrastructure or technology used to access databases from the other layers (i.e. for example handler/domains should not know if the data is stored in a SQL or NoSQL database). They should not contain business logic.

Example file: [user.repository.ts](src/modules/user/database/user.repository.ts)

General recommendation: The optimal project structure balances complexity with maintainability. Carefully consider the project's anticipated size and intricacy. Utilize as many layers and building blocks as necessary to ensure efficient development, while avoiding unnecessary complexity.

## <a name="folder"></a>🗄️ Folder Structure and Code Organization

The vertical slice architecture is the recommended structure. Each feature encapsulates commands, queries, repositories, etc.

```
.
├── db/
│   ├── migrations
│   └── seeds
├── tests
└── src/
    ├── config
    ├── modules/
    │   └── feature/
    │       ├── commands/
    │       │   └── command-example/
    │       │       ├── command.handler.ts        → Route command handler/service
    │       │       ├── command.route.ts          → Fastify http route
    │       │       ├── command.graphql-schema.ts → Graphql schema
    │       │       ├── command.resolver.ts       → Graphql resolver
    │       │       └── command.schema.ts         → Schemas for request and response validation
    │       ├── database/
    │       │   ├── feature.repository.port.ts    → Fastify repository port
    │       │   └── feature.repository.ts         → Feature repository
    │       ├── domain/
    │       │   ├── feature.domain.ts             → Domain services
    │       │   ├── feature.errors.ts             → Domain-specific errors
    │       │   └── feature.types.ts              → Domain-specific types
    │       ├── dtos/
    │       │   ├── feature.graphql-schema.ts     → Common Graphql schema
    │       │   └── feature.response.dto.ts       → Common DTO definition used across feature commands/queries
    │       ├── queries/
    │       │   └── query-example/
    │       │       ├── query.handler.ts          → Route command handler/service
    │       │       ├── query.graphql-schema.ts   → Graphql schema
    │       │       ├── query.resolver.ts         → Graphql resolver
    │       │       ├── query.route.ts            → Fastify http route
    │       │       └── query.schema.ts           → Schemas for request and response validation
    │       ├── index.ts                          → Module entrypoint, dependencies definitions, command/query base definition
    │       └── feature.mapper.ts                 → Mapper util to map entities between layers (controller, domain, repositories)
    ├── server/
    │   └── plugins                               → Fastify plugins
    └── shared/
        ├── utils                                 → Generic functions that don't belong to any specific feature
        └── db                                    → DB configuration and helpers
```

## <a name="resources"></a>Useful resources

This boilerplate draws inspiration from [Domain-Driven Hexagon](https://github.com/Sairyss/domain-driven-hexagon), but prioritizes functional programming paradigms over traditional Java-style backend practices. Also, while acknowledging the value of Domain-Driven Design (DDD), this project aims for a more approachable structure with a lower knowledge barrier for onboarding new team members. Despite these adjustments, the core principles of Domain-Driven Hexagon remain a valuable resource. I highly recommend exploring it for further knowledge acquisition.

### Frontend

[react-redux boilerplate](https://github.com/marcoturi/react-redux-boilerplate): A meticulously crafted, extensible, and robust architecture for constructing production-grade React applications.

### Telemetry (OpenTelemetry)

This project ships with a vendor-agnostic [OpenTelemetry](https://opentelemetry.io/) setup in [`src/instrumentation.ts`](src/instrumentation.ts). It is loaded before the application via the `--import` flag and uses the standard [OTLP](https://opentelemetry.io/docs/specs/otlp/) protocol, so it works with any backend — Grafana, Datadog, Honeycomb, Jaeger, and others — without code changes.

**How it works:**

- **HTTP + Fastify** — [`src/instrumentation.ts`](src/instrumentation.ts) registers the [ESM loader hook](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/esm-support.md) and initialises the `NodeSDK` with `instrumentation-http` and [`@fastify/otel`](https://github.com/fastify/otel) (Fastify's official OTel plugin). Every inbound request gets a trace span with route, method, status code, and full lifecycle hook instrumentation (`onRequest`, `preHandler`, `onSend`, etc.).
- **CQRS** — A tracing middleware in [`src/shared/cqrs/otel-middleware.ts`](src/shared/cqrs/otel-middleware.ts) wraps every command, query, and event execution in an OTel span. Spans include the action type, bus kind, and correlation ID.
- **Disabled by default** (`OTEL_SDK_DISABLED=true` in `.env.example`). When disabled, the SDK is not loaded and `@opentelemetry/api` returns noop implementations — zero overhead.
- To enable, set the standard OTel environment variables:

```bash
OTEL_SDK_DISABLED=false
OTEL_SERVICE_NAME=fastify-boilerplate
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318   # your collector
```

All configuration is done through [standard OTel environment variables](https://opentelemetry.io/docs/languages/sdk-configuration/general/) — no vendor-specific code required.

### Why Biome over ESLint + Prettier?

This project uses [Biome](https://biomejs.dev/) as a single tool for both linting and formatting, replacing the traditional ESLint + Prettier combination. Here's why:

- **Reduced dependency overhead:** The ESLint ecosystem relies on a large number of plugins and configurations (`@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`, `eslint-plugin-import`, etc.) that are often maintained by different authors with different release cadences. Keeping these packages up to date and compatible with each other is a constant maintenance burden, and breaking changes across the plugin ecosystem are not uncommon.
- **Single unified tool:** Biome provides linting, formatting, and import sorting out of the box with zero plugins needed. One dependency, one configuration file, one tool to learn.
- **Performance:** Biome is written in Rust, making it orders of magnitude faster than ESLint and Prettier combined. This matters in CI pipelines, pre-commit hooks, and large codebases.
- **Maturity and stability:** Biome has matured significantly and now covers the vast majority of rules that ESLint + typescript-eslint provide, while offering a more cohesive and consistent experience. It is actively maintained with a clear roadmap and growing community adoption.

In short, Biome simplifies the toolchain, removes the fragility of juggling multiple ESLint plugins that may lag behind on updates, and delivers a faster and more reliable developer experience.

### Load testing

Load testing is a powerful tool to mitigate performance risks by verifying an API's ability to manage anticipated traffic. By simulating real-world user interactions with an API under development, businesses can pinpoint potential bottlenecks before they impact production environments. These bottlenecks might otherwise go unnoticed during development due to the absence of production-level loads.
Example tools:

- [k6](https://github.com/grafana/k6) (example file [create-user.k6.ts](tests/user/create-user/create-user.k6.ts))
- [Artillery](https://www.npmjs.com/package/artillery)

## <a name="client-types"></a>Client types generation

To generate client types for your API based on you schemas, you can use the following command:

```bash
// Be sure to have the server running
npx openapi-typescript http://127.0.0.1:3000/api-docs/json -o ./client.schema.d.ts
```

With a little effort you can add this process in the pipeline and have a package published with each version of the backend.
Same concept apply for graphql schemas using [graphql-code-generator](https://the-guild.dev/graphql/codegen).

## AI-assisted development

This project ships with an [`AGENTS.md`](AGENTS.md) file that serves as a comprehensive guide for AI coding assistants. It documents the project's architecture, CQRS patterns, coding conventions, and common pitfalls so that tools like [Cursor](https://cursor.com/), [Claude Code](https://docs.anthropic.com/en/docs/claude-code), and [GitHub Copilot](https://github.com/features/copilot) can understand the codebase and generate code that follows the established patterns.

When using an AI assistant to work on this project, the tool will automatically pick up `AGENTS.md` and apply the project's conventions without requiring manual prompting.

## Contributing

Contributions are always welcome! If you have any ideas, suggestions, fixes, feel free to contribute. You can do that by going through the following steps:

1. Clone this repo
2. Create a branch: `git checkout -b your-feature`
3. Make some changes
4. Test your changes
5. Push your branch and open a Pull Request

## License

[MIT](https://choosealicense.com/licenses/mit/)
