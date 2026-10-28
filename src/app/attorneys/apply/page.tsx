import { redirect } from "next/navigation";

/** The application form lives at /lawyers/apply; this keeps /attorneys/apply working. */
export default function AttorneysApplyRedirect() {
  redirect("/lawyers/apply");
}
