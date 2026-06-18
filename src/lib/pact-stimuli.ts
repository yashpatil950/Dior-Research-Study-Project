/** PACT planning stimuli + helpers, lifted from pact_task.html. */

export interface PlanningStim {
  file: string;
  correct: "LEFT" | "RIGHT";
  color: string;
  stripes: string;
}

export const PLANNING_STIM_DIR = "/PACT_planning_stimuli_48/";
export const INIT_STIM_FILE = "/PACT_initiation_stim/triangle_black_01.png";

export const PLANNING_STIMULI: PlanningStim[] = [
  { file: "L_green_horizontal_01_circle_horizontal.png",     correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_02_square_horizontal.png",     correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_03_triangle_horizontal.png",   correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_04_diamond_horizontal.png",    correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_05_hexagon_horizontal.png",    correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_07_star_horizontal.png",       correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_09_square_horizontal.png",     correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_green_horizontal_10_triangle_horizontal.png",   correct: "LEFT",  color: "green",  stripes: "horizontal" },
  { file: "L_irrel_horizontal_01_circle_horizontal_pink.png",correct: "LEFT",  color: "pink",   stripes: "horizontal" },
  { file: "L_irrel_horizontal_05_hexagon_horizontal_gray.png",correct: "LEFT", color: "gray",   stripes: "horizontal" },
  { file: "L_irrel_horizontal_06_pentagon_horizontal_pink.png",correct:"LEFT", color: "pink",   stripes: "horizontal" },
  { file: "L_irrel_horizontal_11_diamond_horizontal_pink.png",correct: "LEFT", color: "pink",   stripes: "horizontal" },
  { file: "R_green_vertical_02_hexagon_vertical.png",        correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_03_pentagon_vertical.png",       correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_04_star_vertical.png",           correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_07_triangle_vertical.png",       correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_08_diamond_vertical.png",        correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_09_hexagon_vertical.png",        correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_10_pentagon_vertical.png",       correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_green_vertical_12_circle_vertical.png",         correct: "RIGHT", color: "green",  stripes: "vertical" },
  { file: "R_irrel_vertical_01_diamond_vertical_pink.png",   correct: "RIGHT", color: "pink",   stripes: "vertical" },
  { file: "R_irrel_vertical_05_circle_vertical_gray.png",    correct: "RIGHT", color: "gray",   stripes: "vertical" },
  { file: "R_irrel_vertical_06_square_vertical_pink.png",    correct: "RIGHT", color: "pink",   stripes: "vertical" },
  { file: "R_irrel_vertical_11_star_vertical_pink.png",      correct: "RIGHT", color: "pink",   stripes: "vertical" },
  { file: "blue_concentric_01_circle.png",                   correct: "LEFT",  color: "blue",   stripes: "concentric" },
  { file: "blue_concentric_06_pentagon.png",                 correct: "LEFT",  color: "blue",   stripes: "concentric" },
  { file: "blue_concentric_08_circle.png",                   correct: "LEFT",  color: "blue",   stripes: "concentric" },
  { file: "blue_concentric_10_triangle.png",                 correct: "LEFT",  color: "blue",   stripes: "concentric" },
  { file: "orange_concentric_02_square.png",                 correct: "RIGHT", color: "orange", stripes: "concentric" },
  { file: "orange_concentric_04_diamond.png",                correct: "RIGHT", color: "orange", stripes: "concentric" },
  { file: "orange_concentric_07_star.png",                   correct: "RIGHT", color: "orange", stripes: "concentric" },
  { file: "orange_concentric_08_circle.png",                 correct: "RIGHT", color: "orange", stripes: "concentric" },
  { file: "orange_concentric_11_diamond.png",                correct: "RIGHT", color: "orange", stripes: "concentric" },
];

const shuffle = <T>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const buildPlanningStimList = (n: number): PlanningStim[] => {
  const deckSize = PLANNING_STIMULI.length;
  const out: PlanningStim[] = [];
  const fullCycles = Math.floor(n / deckSize);
  const remainder = n % deckSize;
  for (let c = 0; c < fullCycles; c++) {
    out.push(...shuffle(PLANNING_STIMULI));
  }
  if (remainder > 0) {
    out.push(...shuffle(PLANNING_STIMULI).slice(0, remainder));
  }
  return shuffle(out);
};
