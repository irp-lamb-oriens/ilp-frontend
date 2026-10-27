// Resolve hook for node --test: lets tests import the app's TypeScript as the
// bundler does (extensionless relative imports, the "@/" alias). Node 22.18+
// strips the types itself. Registered from tests via module.register().
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

function candidates(base) {
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
}

function find(base) {
  for (const c of candidates(base)) {
    try {
      if (existsSync(c) && statSync(c).isFile()) return c;
    } catch {
      // keep looking
    }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = path.join(SRC, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base && !/\.(m?js|json|tsx?)$/.test(base)) {
    const hit = find(base);
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return next(specifier, context);
}
