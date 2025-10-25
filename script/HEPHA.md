# Hepha - Feature Generator CLI

> **Hepha** - Named after Hephaestus (Ἥφαιστος), the Greek god of blacksmiths, craftsmen, and builders who forged weapons and tools for the gods. Just as Hephaestus crafted with precision and artistry, Hepha forges well-structured feature modules for your application. 🔨⚡

A NestJS-inspired CLI tool to automate feature creation in the Fastify boilerplate project. This script generates commands, queries, DTOs, domains, and repositories following the vertical slice architecture and project structure principles.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [Generated Structure](#generated-structure)
- [Workflow](#workflow)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Overview

The Feature Generator automates the creation of feature modules with all necessary components:

- **Commands**: State-changing operations (CREATE, UPDATE, DELETE)
- **Queries**: Data-retrieval operations (GET, LIST)
- **DTOs**: Data Transfer Objects for request/response validation
- **Domain**: Business logic and entity definitions
- **Repository**: Database access layer with type-safe operations
- **Mapper**: Transformations between layers (domain, persistence, response)

The generator intelligently:

- ✅ Detects existing modules and components
- ✅ Skips files that already exist to avoid overwriting
- ✅ Creates only the requested components
- ✅ Follows the project's architectural patterns
- ✅ Generates type-safe TypeScript code

## Installation

No installation needed! The script is located in the `script/` directory and can be run directly with Node.js.

Make the script executable (optional):

```bash
chmod +x script/hepha.js
```

## Usage

### Basic Syntax

```bash
# Using Node.js directly
node script/hepha.js <module-name> [options]

# Or using the npm script
yarn hepha <module-name> [options]
```

### Quick Start

```bash
# Create a complete module with all components
yarn hepha product --all

# Create a module with specific commands
yarn hepha product --command=create-product --command=update-product

# Add a query to an existing module
yarn hepha user --query=find-by-email
```

## Options

| Option             | Alias       | Description                                          | Example             |
| ------------------ | ----------- | ---------------------------------------------------- | ------------------- |
| `--command=<name>` | `-c=<name>` | Create a command handler, route, and schema          | `-c=create-product` |
| `--query=<name>`   | `-q=<name>` | Create a query handler, route, and schema            | `-q=find-products`  |
| `--dto`            | `-d`        | Generate DTO files (response and paginated response) | `-d`                |
| `--domain`         | `-m`        | Generate domain files (types, service, errors)       | `-m` (m = model)    |
| `--repository`     | `-r`        | Generate repository files (port and implementation)  | `-r`                |
| `--all`            | `-a`        | Generate all components                              | `-a`                |
| `--help`           | `-h`        | Show help message                                    | `-h`                |

### Notes on Options

- You can specify multiple `--command` and `--query` options (or their short forms `-c` and `-q`)
- `--all` (or `-a`) flag automatically includes `--dto`, `--domain`, `--repository`, and generates default command/query
- Components are generated only if they don't already exist
- The generator uses kebab-case naming conventions (e.g., `create-product`, `find-products`)
- Short aliases can be mixed with long form options (e.g., `yarn hepha product -c=create --domain -q=find-all`)

### Short Aliases Quick Reference

```bash
# These are equivalent:
yarn hepha product --command=create --query=find --dto --domain --repository
yarn hepha product -c=create -q=find -d -m -r

# Multiple commands/queries:
yarn hepha order -c=create -c=update -q=find -q=find-by-id

# Mix and match:
yarn hepha user --command=create-user -q=find-users --dto -m
```

## Examples

### Example 1: Create a New Product Module (Complete)

```bash
yarn hepha product --all
```

This generates:

```
src/modules/product/
├── commands/
│   └── create-product/
│       ├── create-product.handler.ts
│       ├── create-product.route.ts
│       └── create-product.schema.ts
├── queries/
│   └── find-products/
│       ├── find-products.handler.ts
│       ├── find-products.route.ts
│       └── find-products.schema.ts
├── database/
│   ├── product.repository.port.ts
│   └── product.repository.ts
├── domain/
│   ├── product.types.ts
│   ├── product.domain.ts
│   └── product.errors.ts
├── dtos/
│   ├── product.response.dto.ts
│   └── product.paginated.response.dto.ts
├── product.mapper.ts
└── index.ts
```

### Example 2: Create Only Commands and Queries

```bash
yarn hepha order \
  --command=create-order \
  --command=update-order \
  --command=cancel-order \
  --query=find-orders \
  --query=find-order-by-id
```

### Example 3: Add Components to Existing Module

```bash
# Add a new query to the existing user module
yarn hepha user --query=find-users-by-country

# Add domain and repository to an incomplete module
yarn hepha product --domain --repository
```

### Example 4: Create an Analytics Module (Read-Only)

```bash
yarn hepha analytics \
  --query=get-user-stats \
  --query=get-revenue-report \
  --dto
```

### Example 5: Create CRUD Operations

```bash
yarn hepha category \
  --command=create-category \
  --command=update-category \
  --command=delete-category \
  --query=find-categories \
  --query=find-category-by-id \
  --all
```

### Example 6: Using Short Aliases

```bash
# Quick module creation with short aliases
yarn hepha payment -c=create-payment -c=cancel-payment -q=find-payments -d -m -r

# Minimal command with all components
yarn hepha invoice -a

# Mix long and short form
yarn hepha notification --command=send-notification -q=get-history -d
```

## Generated Structure

### Command Structure

Each command generates three files:

**Handler (`<command-name>.handler.ts`)**

- Command action creator
- Event action creator
- Business logic orchestration
- Integration with command bus

**Route (`<command-name>.route.ts`)**

- Fastify route definition
- HTTP method and URL
- Schema validation
- Response formatting

**Schema (`<command-name>.schema.ts`)**

- TypeBox schema definitions
- Request DTO type
- Validation rules

### Query Structure

Similar to commands but for read operations:

**Handler (`<query-name>.handler.ts`)**

- Query action creator
- Data retrieval logic
- Pagination support

**Route (`<query-name>.route.ts`)**

- Fastify route definition
- Query parameter validation
- Response mapping

**Schema (`<query-name>.schema.ts`)**

- Query parameter schema
- Extends pagination schema

### Domain Structure

**Types (`<module>.types.ts`)**

- Entity interfaces
- Creation property interfaces
- Domain-specific types

**Domain Service (`<module>.domain.ts`)**

- Business logic functions
- Entity creation
- Domain rules

**Errors (`<module>.errors.ts`)**

- Domain-specific exceptions
- Error codes
- Error messages

### Repository Structure

**Port (`<module>.repository.port.ts`)**

- Repository interface
- Custom method signatures
- Extends base repository

**Implementation (`<module>.repository.ts`)**

- Database schema
- Repository implementation
- Custom queries

### DTO Structure

**Response DTO (`<module>.response.dto.ts`)**

- Response schema definition
- Single entity response

**Paginated Response DTO (`<module>.paginated.response.dto.ts`)**

- Paginated response schema
- List response format

### Mapper

**Mapper (`<module>.mapper.ts`)**

- `toDomain()`: Database model → Domain entity
- `toResponse()`: Domain entity → Response DTO
- `toPersistence()`: Domain entity → Database model
- Schema validation

### Module Index

**Index (`index.ts`)**

- TypeScript global dependencies declaration
- Action creator factory
- Module exports

## Workflow

### 1. Generate the Module

```bash
yarn hepha blog-post --all
```

### 2. Review Generated Files

Check the `src/modules/blog-post/` directory and review all generated files.

### 3. Update TODO Comments

The generator adds TODO comments for required customizations:

```typescript
// In domain/blog-post.types.ts
export interface CreateBlogPostProps {
  // TODO: Add your properties here
  name: string;
}
```

Update these with your actual business requirements.

### 4. Create Database Migration

```bash
yarn db:create-migration create_blog_posts_table
```

Edit the migration file in `db/migrations/`:

```sql
-- migrate:up
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- migrate:down
DROP TABLE blog_posts;
```

Run the migration:

```bash
yarn db:migrate
```

### 5. Register Dependencies

Update your DI container configuration to register the new module dependencies:

```typescript
// In your container configuration
import blogPostMapper from '@/modules/blog-post/blog-post.mapper';
import blogPostRepository from '@/modules/blog-post/database/blog-post.repository';
import blogPostDomain from '@/modules/blog-post/domain/blog-post.domain';

// Register dependencies
container.register({
  blogPostDomain: asFunction(blogPostDomain).singleton(),
  blogPostRepository: asFunction(blogPostRepository).singleton(),
  blogPostMapper: asFunction(blogPostMapper).singleton(),
});
```

### 6. Register Routes

Register the generated routes in your Fastify server:

```typescript
// Import routes
import createBlogPost from '@/modules/blog-post/commands/create-blog-post/create-blog-post.route';
import findBlogPosts from '@/modules/blog-post/queries/find-blog-posts/find-blog-posts.route';

// Register routes
fastify.register(createBlogPost);
fastify.register(findBlogPosts);
```

### 7. Register Handlers

Initialize command and query handlers:

```typescript
import makeCreateBlogPost from '@/modules/blog-post/commands/create-blog-post/create-blog-post.handler';
import makeFindBlogPosts from '@/modules/blog-post/queries/find-blog-posts/find-blog-posts.handler';

// Initialize handlers
const createBlogPostHandler = makeCreateBlogPost(container.cradle);
createBlogPostHandler.init();

const findBlogPostsHandler = makeFindBlogPosts(container.cradle);
findBlogPostsHandler.init();
```

### 8. Test Your Feature

```bash
# Start the development server
yarn start

# Test the endpoints
curl -X POST http://localhost:3000/v1/blog-posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Post", "content": "Hello World"}'

curl http://localhost:3000/v1/blog-posts
```

## Advanced Usage

### Naming Conventions

The generator automatically handles naming conventions:

- **kebab-case**: File names and command/query names (`create-blog-post`)
- **PascalCase**: Classes and types (`CreateBlogPost`, `BlogPostEntity`)
- **camelCase**: Variables and function names (`createBlogPost`, `blogPostDomain`)

### Module Naming

Choose clear, business-domain-aligned names:

✅ **Good**:

- `product`
- `order`
- `blog-post`
- `user-profile`

❌ **Avoid**:

- `api`
- `service`
- `manager`
- `helper`

### Command vs Query

**Use Commands for**:

- Creating resources (`create-user`)
- Updating resources (`update-product`)
- Deleting resources (`delete-order`)
- State changes (`publish-post`, `cancel-subscription`)

**Use Queries for**:

- Retrieving single resources (`find-user-by-id`)
- Listing resources (`find-products`)
- Analytics and reports (`get-sales-report`)
- Searching (`search-posts`)

### Incremental Generation

Build features incrementally:

```bash
# Step 1: Start with domain
yarn hepha invoice --domain

# Step 2: Add repository
yarn hepha invoice --repository --dto

# Step 3: Add commands
yarn hepha invoice --command=create-invoice --command=send-invoice

# Step 4: Add queries
yarn hepha invoice --query=find-invoices
```

## Troubleshooting

### Common Issues

**1. "Module already exists" warnings**

This is expected behavior. The generator skips existing files to avoid overwriting your changes.

**2. TypeScript errors after generation**

Run type checking to see specific errors:

```bash
yarn type-check
```

Common fixes:

- Update TODO comments with actual types
- Import missing dependencies
- Register dependencies in DI container

**3. Routes not working**

Ensure you:

- Registered routes in Fastify server
- Registered handlers in command/query bus
- Started the server after making changes

**4. Database errors**

Verify:

- Migration files are created and run
- Table names match repository configuration
- Database connection is configured

### Getting Help

If you encounter issues:

1. Check the generated TODO comments
2. Review the existing `user` module as a reference
3. Consult the [README.md](../README.md) for architecture principles
4. Check TypeScript errors: `yarn type-check`
5. Review Fastify logs for runtime errors

## Best Practices

### 1. Follow Domain-Driven Design

Name your modules after business concepts, not technical patterns:

- ✅ `order`, `payment`, `shipment`
- ❌ `order-service`, `payment-api`

### 2. Keep Commands and Queries Focused

Each command/query should have a single responsibility:

- ✅ `create-order`, `cancel-order`, `update-order-status`
- ❌ `manage-order`, `handle-order-operations`

### 3. Update Generated Code

The generator provides templates. Always update:

- Entity properties in `domain/*.types.ts`
- Business logic in `domain/*.domain.ts`
- Database queries in `database/*.repository.ts`
- Validation schemas in `commands/*/` and `queries/*/`

### 4. Write Tests

After generation, create tests:

- Unit tests for domain logic (`domain/*.spec.ts`)
- Integration tests for repositories
- E2E tests for routes

### 5. Version Control

Commit generated files immediately with a clear message:

```bash
git add src/modules/product
git commit -m "feat: generate product module scaffold"
```

Then customize and commit changes separately:

```bash
git add src/modules/product
git commit -m "feat: implement product creation logic"
```

## Script Maintenance

The Hepha generator script is located at:

```
script/hepha.js
```

To extend the generator:

1. Add new template functions
2. Update the `generateFeature()` function
3. Add new command-line options
4. Test with a sample module

### Why "Hepha"?

Hepha is named after **Hephaestus** (Ἥφαιστος), the Greek god of:

- **Blacksmithing and Metalworking** - Crafting with precision
- **Artisans and Craftsmen** - Creating with skill and care
- **Builders and Architects** - Constructing with purpose

Just as Hephaestus forged legendary weapons and tools for the gods with his divine craftsmanship, Hepha forges well-architected feature modules for your application, following best practices and architectural patterns.

## Related Documentation

- [Project README](../README.md) - Architecture and principles
- [Domain-Driven Hexagon](https://github.com/Sairyss/domain-driven-hexagon) - Inspiration
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) - Architecture pattern
- [Fastify Documentation](https://www.fastify.io/) - Framework docs

## Contributing

To improve the generator:

1. Test your changes with various scenarios
2. Update this documentation
3. Follow the existing code style
4. Add comments for complex logic

---

**Happy coding! 🚀**
