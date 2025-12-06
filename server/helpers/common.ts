/**
 * Cleans markdown formatting from LLM response text
 * @param rawText - The raw text from LLM response
 * @returns Cleaned text with markdown formatting removed
 */
export function cleanMarkdownFormatting(rawText: string): string {
  return rawText
    .replace(/```json\s*/g, "") // Remove ```json
    .replace(/```\s*$/g, "") // Remove closing ```
    .trim(); // Remove extra whitespace
}
