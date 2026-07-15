// Local development database — an embedded Postgres (pglite) exposed on a
// real TCP port speaking the Postgres wire protocol, so the exact same
// `postgres` driver used in production can connect to it. Data persists to
// .pgdata-dev/ between runs. This is dev-only; production uses a real
// Postgres host (Vercel Postgres / Neon) via DATABASE_URL.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = Number(process.env.DEV_DB_PORT ?? 55432);

const db = await PGlite.create({ dataDir: "./.pgdata-dev" });
// maxConnections defaults to 1 — too low for Next dev/build, which can hold
// a connection open per warm route or static-generation worker (`next
// build` alone can fan out to 7+ workers, each with its own postgres.js
// pool of up to 5). The library's own QueryQueueManager already serializes
// actual query execution safely across connections, so raising this is
// just about not rejecting sockets.
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 50 });
await server.start();

console.log(`[dev-db] Postgres (pglite) listening on 127.0.0.1:${PORT}`);
console.log(`[dev-db] DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`);

process.on("SIGINT", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
