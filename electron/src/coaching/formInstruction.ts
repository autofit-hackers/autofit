export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly label?: string;
  readonly text?: string;
  readonly importance?: number;
  readonly evaluate: (rep: Rep) => number;
  readonly showGuideline?: (rep: Rep) => void;
};
