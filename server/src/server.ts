import http from "http";
import { createApp } from "./app";
import { config } from "./config/env";
import { initSockets } from "./sockets";

const app = createApp();
const httpServer = http.createServer(app);

initSockets(httpServer);

httpServer.listen(config.port, () => {
  console.log(`MediReach API listening on port ${config.port} [${config.nodeEnv}]`);
});
