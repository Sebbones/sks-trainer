import allQuestions from './assets/questions.json';
import { Areas, Task, WithAreas } from './types';

export const settings = {
  apiBase: import.meta.VITE_API
};

export const ALL_QUESTIONS = Object.entries(allQuestions).reduce(
  (areas, [area, { tasks }]) => {
    areas[area as Areas] = tasks.map((t) => ({
      nr: t.nr,
      question: t.question,
      answer: t.answer
    }));

    return areas;
  },
  {} as WithAreas<Task[]>
);

export function getAreaQuestions(area: Areas) {
  const areaQuestions = ALL_QUESTIONS[area];
  return areaQuestions;
}

export { allQuestions as question };
