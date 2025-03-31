import allQuestions from './assets/questions.json';
import { Areas, Question, WithAreas } from './types';

export const settings = {
  apiBase: import.meta.VITE_API
};

export const ALL_QUESTIONS = Object.entries(allQuestions).reduce(
  (areas, [area, questions]) => {
    areas[area as Areas] = questions.map((q) => ({
      id: q[0] as number,
      nr: q[1] as string,
      question: q[2] as string,
      answer: q[3] as string
    }));

    return areas;
  },
  {} as WithAreas<Question[]>
);

export function getAreaQuestions(area: Areas) {
  const areaQuestions = ALL_QUESTIONS[area];
  return areaQuestions;
}

export { allQuestions as question };
