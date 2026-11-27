import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { join, resolve, extname, sep } from "node:path";
import { build, root } from "./build.mjs";

await build();
const output = join(root, "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
const server = createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  try {
    const url = new URL(req.url, "http://localhost");
    const path = resolve(output, "." + decodeURIComponent(url.pathname));
    if (path !== output && !path.startsWith(output + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    let file = path;
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
        res.end();
        return;
      }
      file = join(file, "index.html");
    }
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      req.method === "HEAD"
        ? undefined
        : await readFile(join(output, "404.html")),
    );
  }
});
server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Go Careers preview: http://localhost:${port}`),
);
const watchers = [];
if (process.argv.includes("--watch")) {
  let timer,
    running = false,
    pending = false;
  async function rebuild() {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      const result = await build();
      console.log(`Rebuilt ${result.active} jobs. Refresh your browser.`);
    } catch (error) {
      console.error(`Build failed: ${error.message}`);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        await rebuild();
      }
    }
  }
  for (const directory of ["data", "data/job-runs", "site"])
    watchers.push(
      watch(join(root, directory), () => {
        clearTimeout(timer);
        timer = setTimeout(rebuild, 150);
      }),
    );
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    watchers.forEach((w) => w.close());
    server.close(() => process.exit(0));
  });
