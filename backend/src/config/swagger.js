const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API',
      version: '1.0.0',
      description: 'Veritabanı ve anomali tespiti servisi API dokümantasyonu',
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsDoc(options);
