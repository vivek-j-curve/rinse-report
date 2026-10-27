import { STEPS, type Answers, type Step } from "./steps";

/** Returns only the steps that are visible for the current answers */
export function getVisibleSteps(answers: Answers, isSAR: boolean): Step[] {
  return STEPS.filter((s) => !s.skipIf?.(answers, isSAR));
}

/** Returns the index (in STEPS) of the next non-skipped step after the current one */
export function getNextStepIndex(
  currentIndex: number,
  answers: Answers,
  isSAR: boolean
): number | null {
  for (let i = currentIndex + 1; i < STEPS.length; i++) {
    if (!STEPS[i].skipIf?.(answers, isSAR)) return i;
  }
  return null;
}

/** Returns the step index (in STEPS) from a step id */
export function stepIndexById(id: string): number {
  return STEPS.findIndex((s) => s.id === id);
}

/** Progress as 0–100 percentage */
export function getProgress(
  historyIndices: number[],
  answers: Answers,
  isSAR: boolean
): { percent: number; current: number; total: number } {
  const visible = getVisibleSteps(answers, isSAR);
  const total = visible.length;
  const current = historyIndices.length;
  return { percent: total === 0 ? 0 : Math.round((current / total) * 100), current, total };
}

/** Validate a single step - returns field keys with errors */
export function validateStep(
  step: Step,
  answers: Answers
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of step.fields) {
    if (!field.required) continue;
    const val = answers[field.key];
    const empty =
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0);
    if (empty) {
      errors[field.key] = "This field is required.";
    }
  }
  return errors;
}

/** Determine the report_type stored in questionnaire_responses */
export function getReportType(answers: Answers, isSAR: boolean): string {
  if (isSAR || answers.report_type === "SAR") return "SAR";
  return (answers.report_type as string) || "STR";
}
