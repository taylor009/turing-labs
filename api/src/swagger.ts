import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TuringLabs API',
      version: '1.0.0',
      description: 'API for TuringLabs Proposal Management System',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-domain.com' 
          : 'http://localhost:8080',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token obtained from authentication',
        },
      },
      schemas: {
        Proposal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productName: { type: 'string' },
            currentCost: { type: 'number' },
            category: { type: 'string' },
            formulation: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] 
            },
            businessObjectives: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            priorityObjectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] }
                }
              }
            },
            constraints: { 
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            acceptableChanges: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            notAcceptableChanges: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            feasibilityLimits: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            createdBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            creator: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['ADMIN', 'PRODUCT_MANAGER', 'STAKEHOLDER'] }
              }
            }
          },
          required: ['productName', 'currentCost', 'category', 'formulation', 'businessObjectives']
        },
        CreateProposal: {
          type: 'object',
          properties: {
            productName: { type: 'string', minLength: 3, maxLength: 100 },
            currentCost: { type: 'number', minimum: 0 },
            category: { type: 'string', minLength: 1, maxLength: 100 },
            formulation: { type: 'string', minLength: 1, maxLength: 2000 },
            businessObjectives: { 
              type: 'array', 
              items: { type: 'string' },
              minItems: 1
            },
            priorityObjectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] }
                },
                required: ['objective', 'priority']
              }
            },
            constraints: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            acceptableChanges: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            notAcceptableChanges: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            feasibilityLimits: { 
              type: 'array', 
              items: { type: 'string' } 
            }
          },
          required: ['productName', 'currentCost', 'category', 'formulation', 'businessObjectives']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  code: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJSDoc(options);
console.log('📋 Generated Swagger specs:', Object.keys(specs));
console.log('📋 API paths found:', Object.keys(specs.paths || {}));

export function setupSwagger(app: Application): void {
  console.log('🔧 Setting up Swagger documentation...');
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TuringLabs API Documentation',
  }));

  // Serve raw OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    console.log('📄 Serving OpenAPI spec');
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('✅ Swagger documentation setup complete');
  console.log('📖 API docs available at: http://localhost:8080/api-docs');
  console.log('📄 OpenAPI spec available at: http://localhost:8080/api-docs.json');
}