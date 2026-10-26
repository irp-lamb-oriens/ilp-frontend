/** Words that make an AI reply "legal": it then carries "your team will confirm". */
const LEGAL = /\b(law|legal|lawyer|attorney|court|tax|taxes|hacienda|file|filing|deadline|residen\w*|dimex|visa|permit|marchamo|corporation|s\.?a\.?|s\.?r\.?l\.?|company|contract|deed|title|property|registry|registro|inherit\w*|will|estate|immigration|migraci\w+|ccss|caja|fine|penalt\w*|obligat\w*|required?|must|liable|rights?)\b/i;

export function isLegalTopic(text: string): boolean {
  return LEGAL.test(text);
}
