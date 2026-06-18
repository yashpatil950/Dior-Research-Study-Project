import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK2_QUESTIONS, TASK2_STORY } from "../lib/task-data";

const StoryCard = () => (
  <div className="story-card">
    <h3>{TASK2_STORY.title}</h3>
    <p>{TASK2_STORY.intro}</p>
    <ul>{TASK2_STORY.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
  </div>
);

export const Task2Page = () => (
  <QuestionnaireTaskPage
    taskId={2}
    label="Invoice Approval"
    description={<p>Read the invoice details on the story card and fill in the approval form.</p>}
    storyCard={<StoryCard />}
    questions={TASK2_QUESTIONS}
    defaultDurationS={300}
    nextRoute="/task/3"
    nextRouteLabel="Task 3"
  />
);
