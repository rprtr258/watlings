export type Lesson = {
  id: string;
  title: string;
  instructionsHtml: string;
  exerciseCode: string;
  solutionCode: string;
  testCode: string;
  hasWasm: boolean;
  hostCode?: string;
  hostSolutionCode?: string;
};

export type Chapter = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type LessonsData = {
  chapters: Chapter[];
};

export type TestResult = {
  name: string;
  passed: boolean;
  errors: string[];
};

export type ConsoleLine = {
  type: "log" | "warn" | "error" | "info";
  text: string;
};
