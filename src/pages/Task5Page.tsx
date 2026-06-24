import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK5_QUESTIONS } from "../lib/task-data";

export const FormEntry2Page = () => (
  <QuestionnaireTaskPage
    taskKey="form_entry_2"
    description={<p>A short questionnaire about your current state and habits.</p>}
    questions={TASK5_QUESTIONS}
    defaultDurationS={300}
  />
);
