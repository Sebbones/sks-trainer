export type WithAreas<T> = {
  nav: T;
  legal: T;
  weather: T;
  crew_1: T;
  crew_2: T;
};

export type Areas = keyof WithAreas<null>;

export interface Question {
  id: number;
  nr: string;
  question: string;
  answer: string;
}

export interface QuestionState {
  questionId: number;
  streak: number;
}
