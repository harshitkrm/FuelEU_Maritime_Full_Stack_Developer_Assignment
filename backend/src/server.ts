import "dotenv/config";
import { buildDefaultHttpApp } from "./adapters/inbound/http/create-app.js";

/** Default 3001 to reduce clashes with other tools on 3000. Override with PORT in `.env`. */
const port = Number(process.env.PORT) || 3001;
const app = buildDefaultHttpApp();

app.listen(port, () => {
  console.log(`FuelEU API listening on http://localhost:${port}`);
});
