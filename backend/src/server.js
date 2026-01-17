import express from 'express';
import dotenv from 'dotenv';
import { apiKeyAuth } from './middlewares/apiKeyAuth.js'
import db from "./db.js"; //import runs db init migration - DO NOT DELETE!
import api from "./api.js";
import { swaggerUiMiddleware, swaggerUiHandler } from "./swagger.js";

//load .env to process.env
dotenv.config(); 
const isDev = process.env.IS_DEV == "true"; //IS DEVELOPMENT

const app = express();

//JSON parser
app.use(express.json()); //parse json from request to req.body (req.body.name)

// dokumentace 
if(isDev){
    app.use("/docs", swaggerUiMiddleware, swaggerUiHandler);
}


//Endpoints
app.get('/ready', (_req, res) => res.status(200).send('READY'));


//API AUTH - REQUIRE API KEY
app.use(apiKeyAuth);

// API endpoints 
app.use("/api", api);


app.get('/test_api', (_req, res) => res.status(200).send('api response'));


// 404 not found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});


// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal error' });
});


//------------------------------------------------------------------------------------------------
//SERVER START LISTENING
//------------------------------------------------------------------------------------------------
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server listening on localhost:${PORT}`);
});
