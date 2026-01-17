import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Místa mluví API",
      version: "1.0.0",
      description: "API dokumentace pro Místa mluví",
    },
    tags: [
        {
            name: "Pins",
            description: "Endpoints for managing map pins"
        },
        {
            name: "Reported Pins",
            description: "Endpoints for reporting pins"
        }
    ]
  },
  apis: ["./src/api.js"], // cesta k souboru s endpointy
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiHandler = swaggerUi.setup(swaggerSpec);
