import { QuestionnaireTaskPage } from "./QuestionnaireTaskPage";
import { TASK1_QUESTIONS, TASK1_STORY } from "../lib/task-data";

const StoryCard = () => (
  <div className="story-card">
    <h3>{TASK1_STORY.title}</h3>
    <p>{TASK1_STORY.intro}</p>
    <ul>{TASK1_STORY.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
  </div>
);

export const TravelCardAPage = () => (
  <QuestionnaireTaskPage
    taskKey="travel_card_a"
    description={<p>You'll see a short scenario followed by a form. Answer using the story card details.</p>}
    storyCard={<StoryCard />}
    questions={TASK1_QUESTIONS}
    defaultDurationS={300}
  />
);
