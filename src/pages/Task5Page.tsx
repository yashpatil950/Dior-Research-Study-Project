import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK5_QUESTIONS } from "../lib/task-data";

export const Task5Page = () => (
  <QuestionnaireTaskPage
    taskId={5}
    label="Form b"
    description={<p>A short questionnaire about your current state and habits.</p>}
    questions={TASK5_QUESTIONS}
    defaultDurationS={300}
    nextRoute="/task/6"
    nextRouteLabel="Task 6 (Email classification)"
  />
);
