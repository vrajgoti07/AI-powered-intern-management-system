import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Intern Management API',
      version: '1.0.0',
      description: 'API documentation for the AI-Powered Intern Management System',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Scan routes folder for swagger annotations. Supports ts in dev and compiled js in production.
  apis: ['./src/routes/*.ts', './dist/routes/*.js', './backend/src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
