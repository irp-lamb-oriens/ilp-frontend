import { serializeLd, type JsonLdObject } from "@/lib/seo/jsonLd";

/**
 * Structured data in the server HTML. A JSON-LD block is data, not script,
 * so the nonce-based CSP (src/middleware.ts) does not apply to it.
 */
export default function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}
