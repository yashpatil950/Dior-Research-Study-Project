/**
 * Apathy Evaluation Scale (AES-S) — shared question text and scoring.
 *
 * Used by both the Avatar variant (video prompts) and the Text variant.
 * Items, reversed-item set, and the apathy threshold mirror the original
 * AES Avatar Index.html so the resulting scores are identical.
 */

export const AES_QUESTIONS: string[] = [
  "I am interested in things.",
  "I get things done during the day.",
  "Getting started on my own is important to me.",
  "I am interested in having new experiences.",
  "I am interested in learning new things.",
  "I put little effort into anything.",
  "I approach life with intensity.",
  "Seeing a job through to the end is important to me.",
  "I spend time doing things that interest me.",
  "Someone has to tell me what to do each day.",
  "I am less concerned about my problems than I should be.",
  "I have friends.",
  "Getting together with friends is important to me.",
  "When something good happens, I get excited.",
  "I have an accurate understanding of my problems.",
  "Getting things done during the day is important to me.",
  "I have initiative.",
  "I have motivation.",
];

export const AES_CHOICES = [
  { label: "NOT AT ALL", rawScore: 1 },
  { label: "SLIGHTLY", rawScore: 2 },
  { label: "SOMEWHAT", rawScore: 3 },
  { label: "A LOT", rawScore: 4 },
] as const;

/** Item numbers (1-based) that get reversed (5 - raw). Items 6, 10, 11 are NOT reversed. */
export const AES_REVERSED_ITEMS = new Set([1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18]);

export const AES_APATHY_THRESHOLD = 42;

export const aesIsReversed = (oneBasedItemNumber: number): boolean =>
  AES_REVERSED_ITEMS.has(oneBasedItemNumber);

export const aesFinalScore = (oneBasedItemNumber: number, rawScore: number): number =>
  aesIsReversed(oneBasedItemNumber) ? 5 - rawScore : rawScore;

export interface AesResponse {
  itemNumber: number;
  choiceIndex: number;
  choiceLabel: string;
  rawScore: number;
  finalScore: number;
  scoringType: "Reversed (5 - raw)" | "Raw as-is";
  ts_iso: string;
}

export const buildAesResponse = (
  itemNumber: number,
  choiceIndex: number,
): AesResponse => {
  const c = AES_CHOICES[choiceIndex];
  const finalScore = aesFinalScore(itemNumber, c.rawScore);
  return {
    itemNumber,
    choiceIndex,
    choiceLabel: c.label,
    rawScore: c.rawScore,
    finalScore,
    scoringType: aesIsReversed(itemNumber) ? "Reversed (5 - raw)" : "Raw as-is",
    ts_iso: new Date().toISOString(),
  };
};

export const aesTotalScore = (responses: Array<AesResponse | null>): number =>
  responses.reduce((sum, r) => sum + (r ? r.finalScore : 0), 0);

export const aesInterpretation = (
  totalScore: number,
  nAnswered: number,
): "Apathy" | "No Apathy" | "Incomplete" => {
  if (nAnswered < AES_QUESTIONS.length) return "Incomplete";
  return totalScore >= AES_APATHY_THRESHOLD ? "Apathy" : "No Apathy";
};
