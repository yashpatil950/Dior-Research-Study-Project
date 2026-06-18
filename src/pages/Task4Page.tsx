import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK4_QUESTIONS } from "../lib/task-data";

export const Task4Page = () => (
  <QuestionnaireTaskPage
    taskId={4}
    label="Form a"
    description={<p>Background questionnaire (demographics, habits, and current state).</p>}
    questions={TASK4_QUESTIONS}
    defaultDurationS={420}
    nextRoute="/task/5"
    nextRouteLabel="Task 5 (Form b)"
  />
);
