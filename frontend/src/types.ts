export type WithAreas<T> = {
  nav: T;
  legal: T;
  weather: T;
  crew_1: T;
  crew_2: T;
};

export type Areas = keyof WithAreas<null>;

export interface Task {
  nr: string;
  question: string;
  answer: string;
}

export interface TaskState {
  questionNr: string;
  streak: number;
}
