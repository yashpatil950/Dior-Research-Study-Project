/**
 * Schema-driven questionnaire renderer.
 *
 * One component handles all the form-style tasks (1, 2, 3, 4 and the AES
 * Text variant). The page passes in a list of questions and the current
 * response map; this component renders them and reports changes upward.
 *
 * Supported question types map directly to the Google Forms inputs in
 * the source PDFs (radio, dropdown, multi-checkbox, 1-5 scale, date).
 */

import React from "react";

export type AnswerValue = string | string[] | number | null;

export type Question =
  | { id: string; type: "radio"; prompt: string; options: string[] }
  | { id: string; type: "dropdown"; prompt: string; options: string[]; placeholder?: string }
  | { id: string; type: "multi"; prompt: string; options: string[] }
  | { id: string; type: "scale"; prompt: string; min: number; max: number; minLabel: string; maxLabel: string }
  | { id: string; type: "date"; prompt: string }
  | { id: string; type: "text"; prompt: string; placeholder?: string };

export type Answers = Record<string, AnswerValue>;

export const countAnswered = (questions: Question[], answers: Answers): number => {
  let n = 0;
  for (const q of questions) {
    const v = answers[q.id];
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    n++;
  }
  return n;
};

export const Questionnaire = ({
  questions,
  answers,
  onChange,
  disabled = false,
}: {
  questions: Question[];
  answers: Answers;
  onChange: (id: string, value: AnswerValue) => void;
  disabled?: boolean;
}) => {
  return (
    <div>
      {questions.map((q, i) => (
        <div key={q.id} className="questionnaire-item">
          <div className="questionnaire-prompt">
            <span className="qnum">{i + 1}.</span> {q.prompt}
          </div>
          <div className="questionnaire-input">
            <QuestionInput q={q} value={answers[q.id] ?? null} onChange={(v) => onChange(q.id, v)} disabled={disabled} />
          </div>
        </div>
      ))}
    </div>
  );
};

const QuestionInput = ({
  q,
  value,
  onChange,
  disabled,
}: {
  q: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  disabled: boolean;
}) => {
  if (q.type === "radio") {
    return (
      <div className="opts-vertical">
        {q.options.map((opt) => (
          <label key={opt} className="opt-row">
            <input
              type="radio"
              name={q.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              disabled={disabled}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === "dropdown") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="qdropdown"
      >
        <option value="">{q.placeholder ?? "Choose…"}</option>
        {q.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  if (q.type === "multi") {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="opts-vertical">
        {q.options.map((opt) => {
          const checked = arr.includes(opt);
          return (
            <label key={opt} className="opt-row">
              <input
                type="checkbox"
                value={opt}
                checked={checked}
                onChange={(e) => {
                  const next = e.target.checked
                    ? Array.from(new Set([...arr, opt]))
                    : arr.filter((x) => x !== opt);
                  onChange(next);
                }}
                disabled={disabled}
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (q.type === "scale") {
    const cells: React.ReactNode[] = [];
    for (let n = q.min; n <= q.max; n++) {
      const checked = value === n;
      cells.push(
        <label key={n} className="scale-cell">
          <span className="scale-num">{n}</span>
          <input
            type="radio"
            name={q.id}
            checked={checked}
            onChange={() => onChange(n)}
            disabled={disabled}
          />
        </label>,
      );
    }
    return (
      <div className="scale-row">
        <span className="scale-end">{q.minLabel}</span>
        {cells}
        <span className="scale-end">{q.maxLabel}</span>
      </div>
    );
  }
  if (q.type === "date") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="qdate"
      />
    );
  }
  if (q.type === "text") {
    return (
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={q.placeholder}
        disabled={disabled}
        className="qtext"
      />
    );
  }
  return null;
};

/** Serialize each answer to a single Excel-friendly cell (joins arrays with " | "). */
export const answerToCell = (a: AnswerValue): string | number => {
  if (a === null || a === undefined) return "";
  if (Array.isArray(a)) return a.join(" | ");
  return a;
};
