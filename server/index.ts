import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createCorsOriginResolver } from "./cors";
import { rankingsRoutes } from "./routes/rankings";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: createCorsOriginResolver(),
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/rankings/:listId", rankingsRoutes);

const port = Number(process.env.PORT ?? 8787);
const hostname = process.env.HOST ?? "0.0.0.0";

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(
    `Animal Farm Ranked API listening on http://${info.address}:${info.port}`,
  );
});
