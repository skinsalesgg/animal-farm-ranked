import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { rankingsRoutes } from "./routes/rankings";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/rankings/:listId", rankingsRoutes);

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Animal Farm Ranked API listening on http://127.0.0.1:${port}`);
});
