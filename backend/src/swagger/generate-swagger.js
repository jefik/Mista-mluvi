import fs from "fs";
import { swaggerSpec } from "./swagger.js";

//GENERATE API DOCS TO JSON
fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));

console.log("swagger.json generated");
