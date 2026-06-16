// Rapid true/false statements for the "quick decision" mini-game (problem-solving).
export interface TFStatement {
  id: string;
  textAr: string;
  answer: boolean; // true = correct
}

export const decisionBank: TFStatement[] = [
  { id: 'd1', textAr: 'Defining the problem precisely before looking for a solution saves time later.', answer: true },
  { id: 'd2', textAr: 'It is always best to pick the fastest solution without considering its impact.', answer: false },
  { id: 'd3', textAr: 'The "Five Whys" method helps you get to the root cause.', answer: true },
  { id: 'd4', textAr: 'Ignoring the data and relying on intuition alone is a wise decision.', answer: false },
  { id: 'd5', textAr: 'Weighing impact against effort helps in setting priorities.', answer: true },
  { id: 'd6', textAr: 'Involving the team in solutions reduces the quality of the decision.', answer: false },
  { id: 'd7', textAr: 'Breaking a big problem into smaller parts makes it easier to solve.', answer: true },
  { id: 'd8', textAr: 'Testing only a single hypothesis is always better than several hypotheses.', answer: false },
  { id: 'd9', textAr: 'Documenting a decision and its reasons is useful when reviewing it in the future.', answer: true },
  { id: 'd10', textAr: 'Postponing hard decisions for no reason improves outcomes.', answer: false },
];

export const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);
