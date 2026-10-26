/**
 * Member document upload (P1). The file goes up as the raw request body
 * (no base64), so files up to 15 MB fit; the server checks the real type from
 * the bytes and stores it in a private bucket. Downloads stay on
 * `memberApi.documentUrl(id)` (cookie-authenticated, audited).
 */

import { clientApi } from "@/lib/status";
import { memberApi, type MemberDocument } from "./api";

export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;

/** `accept` for the file input: PDF, JPG, PNG, HEIC, Word (.docx). */
export const DOCUMENT_ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  ".heic",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".docx",
].join(",");

const MOCK = process.env.NEXT_PUBLIC_W4_MOCK === "1";

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function uploadMemberDocument(
  file: File,
  meta: { matterId?: string; category: string },
): Promise<MemberDocument> {
  if (MOCK) {
    return memberApi.upload({
      ...meta,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      dataBase64: await readBase64(file),
    });
  }
  return clientApi.post<MemberDocument>("/api/client-status/me/documents", file, {
    query: { matterId: meta.matterId, category: meta.category, fileName: file.name },
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
}
