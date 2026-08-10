export interface GuideStep {
  id: number; // auto-assigned from array index (1-based)
  phase: string;
  title: string;
  tasks: string[];
  conditions?: string[];
  warnings?: string[];
  tips?: string[];
  rewards?: string[];
}

export interface GuideStepRaw {
  phase: string;
  title: string;
  tasks: string[];
  conditions?: string[];
  warnings?: string[];
  tips?: string[];
  rewards?: string[];
}
