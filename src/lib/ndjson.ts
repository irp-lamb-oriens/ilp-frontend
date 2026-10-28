/**
 * NDJSON reading for streamed lists (docs/workstreams/LISTS.md).
 *
 * The server writes one JSON object per line and flushes per batch, so a
 * network chunk can end in the middle of a line or carry many lines. The
 * parser keeps the unfinished tail until the next chunk completes it.
 */

export class NdjsonError extends Error {
  line: string;
  constructor(line: string) {
    super("The server sent a list line that could not be read.");
    this.name = "NdjsonError";
    this.line = line;
  }
}

export interface NdjsonParser {
  /** Feed decoded text; returns the objects of every line completed by it. */
  push(text: string): unknown[];
  /** End of stream: parses a last line that had no newline. */
  flush(): unknown[];
}

function parseLine(line: string): unknown[] {
  const t = line.trim();
  if (!t) return [];
  try {
    return [JSON.parse(t)];
  } catch {
    throw new NdjsonError(t.slice(0, 200));
  }
}

export function createNdjsonParser(): NdjsonParser {
  let buf = "";
  return {
    push(text) {
      buf += text;
      const out: unknown[] = [];
      let nl = buf.indexOf("\n");
      while (nl >= 0) {
        out.push(...parseLine(buf.slice(0, nl)));
        buf = buf.slice(nl + 1);
        nl = buf.indexOf("\n");
      }
      return out;
    },
    flush() {
      const rest = buf;
      buf = "";
      return parseLine(rest);
    },
  };
}

/**
 * Read a response body as NDJSON. Yields the objects of each network chunk
 * together, so a caller can render once per chunk instead of once per line.
 */
export async function* readNdjson(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<unknown[]> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createNdjsonParser();
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      const objs = parser.push(decoder.decode(value, { stream: true }));
      if (objs.length) yield objs;
    }
    const tail = [...parser.push(decoder.decode()), ...parser.flush()];
    if (tail.length) yield tail;
  } finally {
    // Stops the download when the caller stops early (new query, unmount).
    reader.cancel().catch(() => undefined);
  }
}
