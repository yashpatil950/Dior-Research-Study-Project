import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK4_QUESTIONS } from "../lib/task-data";

export const FormEntry1Page = () => (
  <QuestionnaireTaskPage
    taskKey="form_entry_1"
    description={<p>Background questionnaire (demographics, habits, and current state).</p>}
    questions={TASK4_QUESTIONS}
    defaultDurationS={420}
  />
);
