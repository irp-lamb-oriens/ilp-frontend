/**
 * Legal area → legal matter tree. The backend stores two independent enum
 * fields (legalArea, legalMatter), but the matter options are children of the
 * area, so the UI renders them as a two-level tree: pick a parent area, then
 * pick one of its matter leaves.
 */

export interface LegalMatterNode {
  id: string;
  label: string;
}

export interface LegalAreaNode {
  id: string;
  label: string;
  description: string;
  children: LegalMatterNode[];
}

export const LEGAL_AREA_TREE: LegalAreaNode[] = [
  {
    id: "immigration",
    label: "Immigration",
    description: "Residency, visas, and permits",
    children: [{ id: "residency_visa", label: "Residency visa" }],
  },
  {
    id: "corporate",
    label: "Corporate",
    description: "Companies and structuring",
    children: [{ id: "business", label: "Business" }],
  },
  {
    id: "real_estate",
    label: "Real estate",
    description: "Property and transactions",
    children: [{ id: "property", label: "Property" }],
  },
  {
    id: "notary",
    label: "Notary",
    description: "Certifications and estates",
    children: [{ id: "family_estate", label: "Family estate" }],
  },
  {
    id: "other",
    label: "Other",
    description: "Anything else",
    children: [{ id: "other", label: "Other" }],
  },
];

export const AREA_LABELS: Record<string, string> = Object.fromEntries(
  LEGAL_AREA_TREE.map((a) => [a.id, a.label]),
);

export const MATTER_LABELS: Record<string, string> = Object.fromEntries(
  LEGAL_AREA_TREE.flatMap((a) => a.children.map((c) => [c.id, c.label])),
);

export function areaNode(id: string): LegalAreaNode | undefined {
  return LEGAL_AREA_TREE.find((a) => a.id === id);
}

export function areaLabel(id: string): string {
  return AREA_LABELS[id] ?? id;
}

export function matterLabel(id: string): string {
  return MATTER_LABELS[id] ?? id;
}