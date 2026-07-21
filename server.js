import database from "./database.js";
import { createApp } from "./src/app.js";
import { config } from "./src/config.js";

const app = createApp({ database });

app.listen(config.port, () => {
  console.log(`DibFood is running at http://localhost:${config.port}`);
});
