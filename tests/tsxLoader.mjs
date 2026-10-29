// Load hook for node --test: lets a test render .tsx components with
// react-dom/server. Transpiles .tsx with the project's TypeScript (JSX to
// react/jsx-runtime) and turns a CSS module into a proxy whose class names are
// the keys. Register after tsResolve.mjs (it resolves "@/" and extensionless
// imports).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export async function load(url, context, next) {
  if (url.endsWith(".tsx")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  }
  if (/\.s?css$/.test(url)) {
    return {
      format: "module",
      source: 'export default new Proxy({}, { get: (_, k) => (typeof k === "string" ? k : undefined) });',
      shortCircuit: true,
    };
  }
  return next(url, context);
}
