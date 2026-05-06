import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, "0.0.0.0", () => {
  // Intentionally no sensitive runtime data in logs.
  process.stdout.write(`Taskflow API running on port ${env.PORT}\n`);
});
