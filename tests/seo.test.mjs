// Run: npm test. SEO (2026-10-29): the sitemap lists every public page and no
// portal, robots.txt blocks the portals without blocking public pages, every
// public page has a unique title and description within limits, the JSON-LD
// is valid with the required fields and no reviews or ratings, FAQPage data
// comes from the same arrays the page shows, and each page has one h1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("./tsResolve.mjs", import.meta.url);

const site = await import("../src/lib/seo/site.ts");
const crawl = await import("../src/lib/seo/crawl.ts");
const ld = await import("../src/lib/seo/jsonLd.ts");
const { COUNTRY_SEO, COUNTRY_ORDER } = await import("../src/components/countries/countrySeo.ts");
const { FAQ } = await import("../src/components/landing/content.ts");
const { LAWYER_FAQ } = await import("../src/components/lawyers/content.ts");
const { CSM_FAQ } = await import("../src/components/customerSuccess/content.ts");
const { RULES } = await import("../scripts/copyLint.mjs");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "src/app");
const src = (p) => readFileSync(path.join(ROOT, "src", p), "utf8");

/** Every route with a page.tsx, as a URL path. */
function appRoutes(dir = APP, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...appRoutes(full, `${base}/${name}`));
    else if (name === "page.tsx") out.push({ route: base || "/", file: full });
  }
  return out;
}

const isPrivate = (p) => site.PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));
const isRedirect = (file) => /\bredirect\(/.test(readFileSync(file, "utf8")) && !/<main/.test(readFileSync(file, "utf8"));
const publicPaths = site.PUBLIC_ROUTES.map((r) => r.path);

/** Google's robots.txt matching: longest matching rule wins; "$" anchors the end. */
function blocked(p, rules) {
  const match = (rule) => {
    const anchored = rule.endsWith("$");
    const body = anchored ? rule.slice(0, -1) : rule;
    return anchored ? p === body : p.startsWith(body);
  };
  const hits = rules.filter(match);
  return hits.length > 0 && hits.some((r) => r.length >= 1);
}

test("seo: every public page in the app has an SEO entry, and no entry points at a missing page", () => {
  const routes = appRoutes();
  for (const { route, file } of routes) {
    if (isPrivate(route) || route.includes("[") || isRedirect(file) || route in site.NOINDEX_PUBLIC) continue;
    assert.ok(publicPaths.includes(route), `${route} needs an entry in lib/seo/site.ts`);
  }
  const all = routes.map((r) => r.route);
  for (const p of publicPaths) assert.ok(all.includes(p), `${p} has no page.tsx`);
});

test("seo: sitemap lists every public route on the canonical host and no private page", () => {
  const urls = crawl.sitemapEntries().map((e) => e.url);
  assert.equal(urls.length, publicPaths.length);
  for (const p of publicPaths) assert.ok(urls.includes(site.absoluteUrl(p)), p);
  for (const u of urls) {
    assert.ok(u.startsWith("https://internationallegalpartner.com"), u);
    const p = new URL(u).pathname;
    assert.ok(!isPrivate(p), `private page in sitemap: ${p}`);
    assert.ok(!(p in site.NOINDEX_PUBLIC), `noindex page in sitemap: ${p}`);
  }
  for (const e of crawl.sitemapEntries()) assert.ok(e.priority > 0 && e.priority <= 1);
});

test("seo: robots.txt blocks portals, /api and /ui but no public page", () => {
  const r = crawl.robotsData();
  assert.equal(r.sitemap, "https://internationallegalpartner.com/sitemap.xml");
  const rules = r.rules[0].disallow;
  for (const p of ["/dashboard", "/dashboard/members", "/lawyer", "/lawyer/board", "/status", "/status/abc", "/csm", "/csm/kpis", "/app", "/app/book", "/ui", "/api", "/api/blog/x", "/alerts", "/join/welcome", "/templates"]) {
    assert.ok(blocked(p, rules), `${p} should be disallowed`);
  }
  for (const p of publicPaths) assert.ok(!blocked(p, rules), `${p} must stay crawlable`);
  assert.ok(!blocked("/check?country=CR".split("?")[0], rules));
});

test("seo: portals and utility pages set noindex", () => {
  for (const f of ["app/dashboard/layout.tsx", "app/lawyer/layout.tsx", "app/status/layout.tsx", "app/csm/layout.tsx", "app/ui/page.tsx", "app/alerts/layout.tsx", "app/templates/layout.tsx", "app/join/welcome/layout.tsx"]) {
    assert.match(src(f), /robots: (NOINDEX|\{ index: false)/, f);
  }
});

test("seo: titles and descriptions are unique, within limits and pass the copy lint", () => {
  const titles = new Set();
  const descs = new Set();
  for (const r of site.PUBLIC_ROUTES) {
    assert.ok(r.title.length <= 60, `${r.path} title is ${r.title.length} chars`);
    assert.ok(r.description.length >= 70 && r.description.length <= 155, `${r.path} description is ${r.description.length} chars`);
    assert.ok(!titles.has(r.title), `duplicate title ${r.title}`);
    assert.ok(!descs.has(r.description), `duplicate description on ${r.path}`);
    titles.add(r.title);
    descs.add(r.description);
    for (const text of [r.title, r.description]) {
      for (const rule of RULES) assert.ok(!rule.re.test(text), `${r.path}: copy rule ${rule.rule} (${rule.name}): ${text}`);
    }
    assert.ok(!/\b(our|ILP'?s?) (legal advice|law firm)\b/i.test(r.description), `${r.path} must not present ILP as a law firm`);
  }
});

test("seo: each public page uses its SEO entry for metadata", () => {
  const where = { "/check": "app/check/layout.tsx", "/join": "app/join/layout.tsx" };
  for (const p of publicPaths) {
    const f = where[p] ?? (p === "/" ? "app/page.tsx" : `app${p}/page.tsx`);
    assert.ok(src(f).includes(`pageMetadata("${p}"`), `${f} should call pageMetadata("${p}")`);
    const own = existsSync(path.join(APP, p === "/" ? "" : p.slice(1), "opengraph-image.tsx"));
    if (own) assert.ok(src(f).includes("ownOgImage: true"), `${f} has its own share image`);
  }
});

test("seo: JSON-LD is valid JSON with the required fields and no reviews or ratings", () => {
  const blocks = [
    ld.organizationLd(),
    ld.websiteLd(),
    ld.membershipLd(),
    ld.membershipLd("Costa Rica"),
    ld.faqLd(FAQ),
    ld.breadcrumbLd([["Costa Rica", "/costa-rica"]]),
  ];
  const text = ld.serializeLd(blocks);
  assert.ok(!text.includes("<"), "no raw < in the script body");
  const parsed = JSON.parse(text);
  for (const b of parsed) {
    assert.equal(b["@context"], "https://schema.org");
    assert.ok(b["@type"]);
  }
  assert.ok(!/"(Review|Rating|AggregateRating|aggregateRating|review)"/.test(text), "no Review or Rating types");
  assert.ok(!/SearchAction|sameAs/.test(text), "no SearchAction or sameAs until they are real");

  const [org, website, service] = parsed;
  assert.equal(org["@type"], "Organization");
  assert.ok(org.name && org.url && org.logo?.url);
  assert.match(org.description, /not a law firm/);
  assert.equal(website["@type"], "WebSite");
  assert.ok(website.url && website.name);
  assert.equal(service["@type"], "Service");
  assert.notEqual(service["@type"], "LegalService");
  assert.match(service.description, /not a law firm/);
  assert.equal(service.offers.price, "79.99");
  assert.equal(service.offers.priceCurrency, "USD");
  assert.equal(service.areaServed.length, 6);
  assert.deepEqual(service.provider, { "@id": org["@id"] });

  const crumbs = parsed[5];
  assert.deepEqual(crumbs.itemListElement.map((i) => i.position), [1, 2]);
  assert.equal(crumbs.itemListElement[1].item, "https://internationallegalpartner.com/costa-rica");
});

test("seo: FAQPage data comes from the same arrays each page shows", () => {
  const faq = ld.faqLd(FAQ);
  assert.equal(faq.mainEntity.length, FAQ.length);
  faq.mainEntity.forEach((q, i) => {
    assert.equal(q.name, FAQ[i].q);
    assert.equal(q.acceptedAnswer.text, FAQ[i].a);
  });
  // Home: answers are in the HTML (hidden when closed, never removed).
  const proof = src("components/landing/ProofSections.tsx");
  assert.ok(proof.includes("FAQ.map("));
  assert.ok(!/\{open === i && \(/.test(proof), "closed answers must stay in the DOM");
  assert.match(proof, /hidden=\{open !== i\}/);
  assert.match(src("app/page.tsx"), /faqLd\(FAQ\)/);
  // Lawyers and customer success: <details> with every answer in the HTML.
  assert.match(src("components/lawyers/LawyersLanding.tsx"), /LAWYER_FAQ\.map\(/);
  assert.match(src("app/attorneys/page.tsx"), /faqLd\(LAWYER_FAQ\)/);
  assert.match(src("components/customerSuccess/CsmLanding.tsx"), /CSM_FAQ\.map\(/);
  assert.match(src("app/customer-success/page.tsx"), /faqLd\(CSM_FAQ\)/);
  // Pricing: the same FAQ constant renders and feeds the data.
  const pricing = src("app/pricing/page.tsx");
  assert.ok(pricing.includes("FAQ.map(") && pricing.includes("faqLd(FAQ)"));
  // Countries.
  const country = src("components/CountryPage.tsx");
  assert.ok(country.includes("seo.faq.map(") && country.includes("faqLd(seo.faq)"));
  assert.ok(LAWYER_FAQ.length > 0 && CSM_FAQ.length > 0);
});

test("seo: country content is complete, linked and free of stale or banned copy", () => {
  assert.equal(COUNTRY_ORDER.length, 6);
  const country = src("components/CountryPage.tsx");
  assert.match(country, /href=\{checkHref\}/);
  assert.match(country, /`\/check\?country=\$\{countryCode\}`/);
  assert.match(country, /href="\/join"/);
  assert.match(country, /COUNTRY_ORDER\.filter\(\(c\) => c !== seo\.code\)/);
  assert.ok(!/router\.push/.test(country), "calls to action are links, not buttons");
  for (const code of COUNTRY_ORDER) {
    const c = COUNTRY_SEO[code];
    assert.ok(publicPaths.includes(c.path), c.path);
    assert.ok(c.intro.length >= 2, `${code} intro`);
    assert.ok(c.faq.length >= 5, `${code} needs at least five questions`);
    for (const text of [...c.intro, ...c.faq.flatMap((f) => [f.q, f.a])]) {
      for (const rule of RULES) assert.ok(!rule.re.test(text), `${code}: copy rule ${rule.rule} (${rule.name}): ${text}`);
    }
  }
  const co = JSON.stringify(COUNTRY_SEO.CO);
  assert.ok(!/October 31|2026-10-31|traspaso/i.test(co), "no soon-to-expire Colombia deadline");
});

test("seo: one h1 per public page", () => {
  const h1s = (s) => (s.match(/<h1[\s>]|as="h1"/g) ?? []).length;
  // Pages whose markup is in the page file.
  for (const f of ["app/about/page.tsx", "app/how-it-works/page.tsx", "app/pricing/page.tsx", "app/templates/page.tsx"]) {
    assert.equal(h1s(src(f)), 1, f);
  }
  // Shared page bodies.
  for (const f of ["components/LegalPage.tsx", "components/CountryPage.tsx", "components/HeroCTA.tsx", "components/lawyers/LawyersStory.tsx", "components/customerSuccess/CsmStory.tsx"]) {
    assert.equal(h1s(src(f)), 1, f);
  }
  // Home sections after the hero never add another h1.
  const landing = path.join(ROOT, "src/components/landing");
  for (const name of readdirSync(landing).filter((n) => n.endsWith(".tsx"))) {
    assert.equal(h1s(readFileSync(path.join(landing, name), "utf8")), 0, `components/landing/${name}`);
  }
});

test("seo: site-wide metadata has a base URL, verification hooks and English", () => {
  const layout = src("app/layout.tsx");
  assert.match(layout, /metadataBase: new URL\(SITE_URL\)/);
  assert.match(layout, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /<html lang="en">/);
  assert.equal(site.SITE_URL, "https://internationallegalpartner.com");
});
