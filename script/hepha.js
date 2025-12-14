#!/usr/bin/env node

/**
 * Feature Generator CLI
 * 
 * A NestJS-like CLI tool to automate feature creation in the Fastify boilerplate.
 * Generates commands, queries, DTOs, domains, and repositories following the project structure.
 * 
 * Usage:
 *   node script/generate-feature.js <module-name> [options]
 * 
 * Example:
 *   node script/generate-feature.js product --command=create --query=find-all --dto --domain --repository
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const moduleName = args[0];
  const options = {
    commands: [],
    queries: [],
    dto: false,
    domain: false,
    repository: false,
    all: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg.startsWith('--command=') || arg.startsWith('-c=')) {
      const value = arg.split('=')[1];
      options.commands.push(value);
    } else if (arg.startsWith('--query=') || arg.startsWith('-q=')) {
      const value = arg.split('=')[1];
      options.queries.push(value);
    } else if (arg === '--dto' || arg === '-d') {
      options.dto = true;
    } else if (arg === '--domain' || arg === '-m') {
      options.domain = true;
    } else if (arg === '--repository' || arg === '-r') {
      options.repository = true;
    }
  }

  return { moduleName, options };
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Hepha - Feature Generator                   ║
║      Named after Hephaestus, the god of craftsmen 🔨         ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  yarn hepha <module-name> [options]
  node script/hepha.js <module-name> [options]

Options:
  --command=<name>, -c=<name>    Create a command (e.g., -c=create-product)
  --query=<name>, -q=<name>      Create a query (e.g., -q=find-products)
  --dto, -d                      Generate DTO files
  --domain, -m                   Generate domain files (m = model)
  --repository, -r               Generate repository files
  --all, -a                      Generate all components
  --help, -h                     Show this help message

Examples:
  # Create a new module with a command
  yarn hepha product -c=create-product

  # Create a module with everything
  yarn hepha product --all

  # Create specific components (using short aliases)
  yarn hepha product -c=create -c=update -q=find-all -d -m -r

  # Add a query to existing module
  yarn hepha user -q=find-by-email

  # Mix long and short form
  yarn hepha order --command=create-order -q=find-orders --dto
  `);
}

// Convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Convert kebab-case to camelCase
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Check if directory exists
function directoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

// Create directory if it doesn't exist
function ensureDirectory(dirPath) {
  if (!directoryExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return true;
  }
  console.log(`ℹ Directory already exists: ${dirPath}`);
  return false;
}

// Write file if it doesn't exist
function writeFileIfNotExists(filePath, content) {
  if (fileExists(filePath)) {
    console.log(`⚠ File already exists, skipping: ${filePath}`);
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Created file: ${filePath}`);
  return true;
}

// Template generators
function generateCommandHandler(moduleName, commandName) {
  const pascalModule = toPascalCase(moduleName);
  const pascalCommand = toPascalCase(commandName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { ${pascalCommand}RequestDto } from './${commandName}.schema';
import { ${camelModule}ActionCreator } from '@/modules/${moduleName}';
import { ConflictException } from '@/shared/exceptions';

export type ${pascalCommand}CommandResult = Promise<string>;
export const ${toCamelCase(commandName)}Command =
  ${camelModule}ActionCreator<${pascalCommand}RequestDto>('${commandName}');
export const ${toCamelCase(commandName)}Event =
  ${camelModule}ActionCreator<${pascalCommand}RequestDto>('${commandName}');

export default function make${pascalCommand}({
  ${camelModule}Repository,
  ${camelModule}Domain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: ReturnType<typeof ${toCamelCase(commandName)}Command>): ${pascalCommand}CommandResult {
      // TODO: Implement your business logic here
      const ${camelModule} = ${camelModule}Domain.create${pascalModule}(payload);
      
      try {
        await ${camelModule}Repository.insert(${camelModule});
        eventBus.emit(${toCamelCase(commandName)}Event(${camelModule}));
        return ${camelModule}.id;
      } catch (error: any) {
        if (error instanceof ConflictException) {
          throw error;
        }
        throw error;
      }
    },
    init() {
      commandBus.register(${toCamelCase(commandName)}Command.type, this.handler);
    },
  };
}
`;
}

function generateCommandRoute(moduleName, commandName) {
  const pascalModule = toPascalCase(moduleName);
  const pascalCommand = toPascalCase(commandName);
  const camelCommand = toCamelCase(commandName);
  
  return `import {
  ${camelCommand}Command,
  ${pascalCommand}CommandResult,
} from '@/modules/${moduleName}/commands/${commandName}/${commandName}.handler';
import { ${camelCommand}RequestDtoSchema } from '@/modules/${moduleName}/commands/${commandName}/${commandName}.schema';
import { idDtoSchema } from '@/shared/api/id.response.dto';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export default async function ${camelCommand}(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/${moduleName}',
    schema: {
      description: '${pascalCommand}',
      body: ${camelCommand}RequestDtoSchema,
      response: {
        201: idDtoSchema,
      },
      tags: ['${moduleName}'],
    },
    handler: async (req, res) => {
      const id = await fastify.commandBus.execute<${pascalCommand}CommandResult>(
        ${camelCommand}Command(req.body),
      );
      return res.status(201).send({ id });
    },
  });
}
`;
}

function generateCommandSchema(commandName) {
  const pascalCommand = toPascalCase(commandName);
  
  return `import { Static, Type } from '@sinclair/typebox';

export const ${toCamelCase(commandName)}RequestDtoSchema = Type.Object({
  // TODO: Add your properties here
  name: Type.String({
    example: 'Example Name',
    description: 'Name field',
    maxLength: 255,
    minLength: 1,
  }),
});

export type ${pascalCommand}RequestDto = Static<typeof ${toCamelCase(commandName)}RequestDtoSchema>;
`;
}

function generateQueryHandler(moduleName, queryName) {
  const pascalModule = toPascalCase(moduleName);
  const pascalQuery = toPascalCase(queryName);
  const camelModule = toCamelCase(moduleName);
  const camelQuery = toCamelCase(queryName);
  
  return `import { ${pascalModule}Entity } from '../../domain/${moduleName}.types';
import { ${camelModule}ActionCreator } from '@/modules/${moduleName}';
import { ${pascalModule}Model } from '@/modules/${moduleName}/database/${moduleName}.repository';
import { Paginated, PaginatedQueryParams } from '@/shared/db/repository.port';
import { paginatedQueryBase } from '@/shared/ddd/query.base';

export type ${pascalQuery}QueryResult = Promise<Paginated<${pascalModule}Entity>>;
export const ${camelQuery}Query = ${camelModule}ActionCreator<
  Partial<PaginatedQueryParams>
>('${queryName}');

export default function make${pascalQuery}Query({
  db,
  queryBus,
  ${camelModule}Mapper,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: ReturnType<typeof ${camelQuery}Query>): ${pascalQuery}QueryResult {
      const query = paginatedQueryBase(payload);
      
      // TODO: Implement your query logic here
      const ${camelModule}s: { rows: ${pascalModule}Model[]; count: number }[] = await db\`
          SELECT
            (SELECT COUNT(*) FROM ${moduleName}s) as count,
            (SELECT json_agg(t.*) FROM
              (SELECT * FROM ${moduleName}s LIMIT \${query.limit} OFFSET \${query.offset})
            AS t) AS rows
          \`;
      
      return {
        data: ${camelModule}s[0].rows?.map((${camelModule}) => ${camelModule}Mapper.toDomain(${camelModule})) ?? [],
        count: ${camelModule}s[0].count,
        limit: query.limit,
        page: query.page,
      };
    },
    init() {
      queryBus.register(${camelQuery}Query.type, this.handler);
    },
  };
}
`;
}

function generateQueryRoute(moduleName, queryName) {
  const pascalModule = toPascalCase(moduleName);
  const pascalQuery = toPascalCase(queryName);
  const camelQuery = toCamelCase(queryName);
  
  return `import { ${camelQuery}Query, ${pascalQuery}QueryResult } from './${queryName}.handler';
import { ${camelQuery}RequestDtoSchema } from './${queryName}.schema';
import { ${toCamelCase(moduleName)}PaginatedResponseSchema } from '@/modules/${moduleName}/dtos/${moduleName}.paginated.response.dto';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export default async function ${camelQuery}(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/${moduleName}',
    schema: {
      description: '${pascalQuery}',
      querystring: ${camelQuery}RequestDtoSchema,
      response: {
        200: ${toCamelCase(moduleName)}PaginatedResponseSchema,
      },
      tags: ['${moduleName}'],
    },
    handler: async (req, res) => {
      const result = await fastify.queryBus.execute<${pascalQuery}QueryResult>(
        ${camelQuery}Query(req.query),
      );
      const response = {
        ...result,
        data: result.data?.map(
          fastify.diContainer.cradle.${toCamelCase(moduleName)}Mapper.toResponse,
        ),
      };
      return res.status(200).send(response);
    },
  });
}
`;
}

function generateQuerySchema(queryName) {
  const pascalQuery = toPascalCase(queryName);
  
  return `import { paginatedQueryRequestDtoSchema } from '@/shared/api/paginated-query.request.dto';
import { Static, Type } from '@sinclair/typebox';

export const ${toCamelCase(queryName)}RequestDtoSchema = Type.Composite([
  paginatedQueryRequestDtoSchema,
  Type.Object({
    // TODO: Add your query parameters here
  }),
]);

export type ${pascalQuery}RequestDto = Static<typeof ${toCamelCase(queryName)}RequestDtoSchema>;
`;
}

function generateDomainTypes(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  
  return `// Properties that are needed for a ${moduleName} creation
export interface Create${pascalModule}Props {
  // TODO: Add your properties here
  name: string;
}

export interface ${pascalModule}Entity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
`;
}

function generateDomainService(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import {
  Create${pascalModule}Props,
  ${pascalModule}Entity,
} from '@/modules/${moduleName}/domain/${moduleName}.types';
import { randomUUID } from 'node:crypto';

export default function ${camelModule}Domain() {
  return {
    create${pascalModule}: (create: Create${pascalModule}Props): ${pascalModule}Entity => {
      const now = new Date();

      return {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...create,
      };
    },
  };
}
`;
}

function generateDomainErrors(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  
  return `import { ConflictException, NotFoundException } from '@/shared/exceptions';

export class ${pascalModule}AlreadyExistsError extends ConflictException {
  static readonly message = '${pascalModule} already exists';

  constructor(cause?: Error, metadata?: unknown) {
    super(${pascalModule}AlreadyExistsError.message, cause, metadata);
  }
}

export class ${pascalModule}NotFoundError extends NotFoundException {
  constructor(message = '${pascalModule} not found') {
    super(message);
  }
}
`;
}

function generateRepositoryPort(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  
  return `import { ${pascalModule}Entity } from '@/modules/${moduleName}/domain/${moduleName}.types';
import { RepositoryPort } from '@/shared/db/repository.port';

export interface ${pascalModule}Repository
  extends RepositoryPort<${pascalModule}Entity> {
  // TODO: Add custom repository methods here
  findOneByName(name: string): Promise<${pascalModule}Entity | undefined>;
}
`;
}

function generateRepository(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { ${pascalModule}Repository } from '@/modules/${moduleName}/database/${moduleName}.repository.port';
import { ${pascalModule}Entity } from '@/modules/${moduleName}/domain/${moduleName}.types';
import { Static, Type } from '@sinclair/typebox';

export const ${camelModule}Schema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  // TODO: Add your schema properties here
});
export type ${pascalModule}Model = Static<typeof ${camelModule}Schema>;

export default function ${camelModule}Repository({
  db,
  ${camelModule}Mapper,
  repositoryBase,
}: Dependencies): ${pascalModule}Repository {
  const tableName = '${moduleName}s';
  return {
    ...repositoryBase({ tableName, mapper: ${camelModule}Mapper }),
    async findOneByName(name: string): Promise<${pascalModule}Entity | undefined> {
      const [${camelModule}]: [${pascalModule}Model?] =
        await db\`SELECT * FROM \${tableName} WHERE name = \${name} LIMIT 1\`;
      return ${camelModule} ? ${camelModule}Mapper.toDomain(${camelModule}) : undefined;
    },
  };
}
`;
}

function generateResponseDto(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { baseResponseDtoSchema } from '@/shared/api/response.base';
import { Static, Type } from '@sinclair/typebox';

export const ${camelModule}ResponseDtoSchema = Type.Composite([
  baseResponseDtoSchema,
  Type.Object({
    name: Type.String({
      example: 'Example Name',
      description: '${pascalModule} name',
    }),
    // TODO: Add your response properties here
  }),
]);

export type ${pascalModule}ResponseDto = Static<typeof ${camelModule}ResponseDtoSchema>;
`;
}

function generatePaginatedResponseDto(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { ${camelModule}ResponseDtoSchema } from '@/modules/${moduleName}/dtos/${moduleName}.response.dto';
import { paginatedResponseBaseSchema } from '@/shared/api/paginated.response.base';
import { Type } from '@sinclair/typebox';

export const ${camelModule}PaginatedResponseSchema = Type.Composite([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(${camelModule}ResponseDtoSchema),
  }),
]);
`;
}

function generateMapper(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { ${pascalModule}Model, ${camelModule}Schema } from '@/modules/${moduleName}/database/${moduleName}.repository';
import { ${pascalModule}Entity } from '@/modules/${moduleName}/domain/${moduleName}.types';
import { ${pascalModule}ResponseDto } from '@/modules/${moduleName}/dtos/${moduleName}.response.dto';
import { Mapper } from '@/shared/ddd/mapper.interface';
import { ArgumentInvalidException } from '@/shared/exceptions';
import { ajv } from '@/shared/utils/validator.util';

export default function ${camelModule}Mapper(): Mapper<
  ${pascalModule}Entity,
  ${pascalModule}Model,
  ${pascalModule}ResponseDto
> {
  const persistenceValidator = ajv.compile(${camelModule}Schema);
  return {
    toDomain(record: ${pascalModule}Model): ${pascalModule}Entity {
      return {
        id: record.id,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        name: record.name,
        // TODO: Add your domain mapping here
      };
    },
    toResponse(entity: ${pascalModule}Entity): ${pascalModule}ResponseDto {
      return {
        ...entity,
        updatedAt: entity.updatedAt.toISOString(),
        createdAt: entity.createdAt.toISOString(),
      };
    },
    toPersistence(${camelModule}: ${pascalModule}Entity): ${pascalModule}Model {
      const record: ${pascalModule}Model = {
        id: ${camelModule}.id,
        createdAt: ${camelModule}.createdAt.toISOString(),
        updatedAt: ${camelModule}.updatedAt.toISOString(),
        name: ${camelModule}.name,
        // TODO: Add your persistence mapping here
      };
      const validate = persistenceValidator(record);
      if (!validate) {
        throw new ArgumentInvalidException(
          JSON.stringify(persistenceValidator.errors),
          new Error('Mapper Validation error'),
          record,
        );
      }
      return record;
    },
  };
}
`;
}

function generateModuleIndex(moduleName) {
  const pascalModule = toPascalCase(moduleName);
  const camelModule = toCamelCase(moduleName);
  
  return `import { ${pascalModule}Model } from '@/modules/${moduleName}/database/${moduleName}.repository';
import { ${pascalModule}Repository } from '@/modules/${moduleName}/database/${moduleName}.repository.port';
import ${camelModule}Domain from '@/modules/${moduleName}/domain/${moduleName}.domain';
import { ${pascalModule}Entity } from '@/modules/${moduleName}/domain/${moduleName}.types';
import { ${pascalModule}ResponseDto } from '@/modules/${moduleName}/dtos/${moduleName}.response.dto';
import { actionCreatorFactory } from '@/shared/cqrs/action-creator';
import { Mapper } from '@/shared/ddd/mapper.interface';

declare global {
  export interface Dependencies {
    ${camelModule}Mapper: Mapper<${pascalModule}Entity, ${pascalModule}Model, ${pascalModule}ResponseDto>;
    ${camelModule}Repository: ${pascalModule}Repository;
    ${camelModule}Domain: ReturnType<typeof ${camelModule}Domain>;
  }
}

export const ${camelModule}ActionCreator = actionCreatorFactory('${moduleName}');
`;
}

// Main generation function
function generateFeature({ moduleName, options }) {
  const modulePath = path.join(process.cwd(), 'src', 'modules', moduleName);
  const moduleExists = directoryExists(modulePath);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Generating feature: ${moduleName.padEnd(42)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (moduleExists) {
    console.log(`ℹ Module "${moduleName}" already exists. Adding components...\n`);
  } else {
    console.log(`✨ Creating new module "${moduleName}"...\n`);
  }

  // Create base module structure
  ensureDirectory(modulePath);

  // Handle --all flag
  if (options.all) {
    options.dto = true;
    options.domain = true;
    options.repository = true;
    if (options.commands.length === 0) {
      options.commands.push(`create-${moduleName}`);
    }
    if (options.queries.length === 0) {
      options.queries.push(`find-${moduleName}s`);
    }
  }

  // Generate commands
  if (options.commands.length > 0) {
    console.log('\n📝 Generating Commands:');
    const commandsPath = path.join(modulePath, 'commands');
    ensureDirectory(commandsPath);

    options.commands.forEach(commandName => {
      const commandPath = path.join(commandsPath, commandName);
      ensureDirectory(commandPath);

      writeFileIfNotExists(
        path.join(commandPath, `${commandName}.handler.ts`),
        generateCommandHandler(moduleName, commandName)
      );
      writeFileIfNotExists(
        path.join(commandPath, `${commandName}.route.ts`),
        generateCommandRoute(moduleName, commandName)
      );
      writeFileIfNotExists(
        path.join(commandPath, `${commandName}.schema.ts`),
        generateCommandSchema(commandName)
      );
    });
  }

  // Generate queries
  if (options.queries.length > 0) {
    console.log('\n🔍 Generating Queries:');
    const queriesPath = path.join(modulePath, 'queries');
    ensureDirectory(queriesPath);

    options.queries.forEach(queryName => {
      const queryPath = path.join(queriesPath, queryName);
      ensureDirectory(queryPath);

      writeFileIfNotExists(
        path.join(queryPath, `${queryName}.handler.ts`),
        generateQueryHandler(moduleName, queryName)
      );
      writeFileIfNotExists(
        path.join(queryPath, `${queryName}.route.ts`),
        generateQueryRoute(moduleName, queryName)
      );
      writeFileIfNotExists(
        path.join(queryPath, `${queryName}.schema.ts`),
        generateQuerySchema(queryName)
      );
    });
  }

  // Generate domain
  if (options.domain) {
    console.log('\n🏗️  Generating Domain:');
    const domainPath = path.join(modulePath, 'domain');
    ensureDirectory(domainPath);

    writeFileIfNotExists(
      path.join(domainPath, `${moduleName}.types.ts`),
      generateDomainTypes(moduleName)
    );
    writeFileIfNotExists(
      path.join(domainPath, `${moduleName}.domain.ts`),
      generateDomainService(moduleName)
    );
    writeFileIfNotExists(
      path.join(domainPath, `${moduleName}.errors.ts`),
      generateDomainErrors(moduleName)
    );
  }

  // Generate repository
  if (options.repository) {
    console.log('\n💾 Generating Repository:');
    const databasePath = path.join(modulePath, 'database');
    ensureDirectory(databasePath);

    writeFileIfNotExists(
      path.join(databasePath, `${moduleName}.repository.port.ts`),
      generateRepositoryPort(moduleName)
    );
    writeFileIfNotExists(
      path.join(databasePath, `${moduleName}.repository.ts`),
      generateRepository(moduleName)
    );
  }

  // Generate DTOs
  if (options.dto) {
    console.log('\n📦 Generating DTOs:');
    const dtosPath = path.join(modulePath, 'dtos');
    ensureDirectory(dtosPath);

    writeFileIfNotExists(
      path.join(dtosPath, `${moduleName}.response.dto.ts`),
      generateResponseDto(moduleName)
    );
    writeFileIfNotExists(
      path.join(dtosPath, `${moduleName}.paginated.response.dto.ts`),
      generatePaginatedResponseDto(moduleName)
    );
  }

  // Generate mapper
  if (options.dto || options.repository || options.domain) {
    console.log('\n🗺️  Generating Mapper:');
    writeFileIfNotExists(
      path.join(modulePath, `${moduleName}.mapper.ts`),
      generateMapper(moduleName)
    );
  }

  // Generate module index
  console.log('\n📋 Generating Module Index:');
  writeFileIfNotExists(
    path.join(modulePath, 'index.ts'),
    generateModuleIndex(moduleName)
  );

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    ✨ Generation Complete! ✨                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('Next steps:');
  console.log(`  1. Review generated files in: src/modules/${moduleName}/`);
  console.log('  2. Update the TODO comments in generated files');
  console.log('  3. Create database migrations for your entities');
  console.log('  4. Register routes in your Fastify server');
  console.log('  5. Register dependencies in your DI container\n');
}

// Main execution
try {
  const { moduleName, options } = parseArgs();
  generateFeature({ moduleName, options });
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
