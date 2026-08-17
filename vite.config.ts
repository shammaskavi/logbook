import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Serves the `api/` serverless functions during `npm run dev`.
 *
 * Vite serves the frontend only, so without this `/api/*` 404s locally and the
 * slip-scanning flow can only be tested against a deployed build. The shim
 * mirrors the request/response shape the functions get on Vercel, so the same
 * handler code runs in both places.
 *
 * Dev only (`apply: "serve"`) — production requests are handled by Vercel.
 */
function devApiRoutes(env: Record<string, string>): Plugin {
  return {
    name: "dev-api-routes",
    apply: "serve",
    configureServer(server) {
      // The functions read `process.env`; Vite only loads .env files into
      // `import.meta.env` for the client bundle, so bridge them across.
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url?.startsWith("/api/")) return next();

        const modulePath = `/${url.replace(/^\//, "")}.ts`;

        try {
          const module = await server.ssrLoadModule(modulePath);
          const handler = module.default;

          if (typeof handler !== "function") {
            res.statusCode = 500;
            res.end(`No default export in ${modulePath}`);
            return;
          }

          const body = await new Promise<string>((resolve, reject) => {
            let raw = "";
            req.on("data", (chunk) => (raw += chunk));
            req.on("end", () => resolve(raw));
            req.on("error", reject);
          });

          const response = {
            status(code: number) {
              res.statusCode = code;
              return response;
            },
            json(payload: unknown) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            },
          };

          await handler({ method: req.method, headers: req.headers, body }, response);
        } catch (error) {
          // Surface the real reason rather than a bare 500 — this is a dev tool.
          console.error(`[dev-api] ${url} failed:`, error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Dev API route failed",
            })
          );
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      devApiRoutes(env),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
