export type DoodlePoint = {
  x: number;
  y: number;
};

export type DoodleStroke = {
  points: DoodlePoint[];
};

export type DoodleData = {
  strokes: DoodleStroke[];
};

export type HabitProject = {
  id: string;
  name: string;
  icon?: string;
  doodle: DoodleData;
  color: string;
  createdAt: string;
};

export type CheckInMap = Record<string, Record<string, boolean>>;

export type PersistedState = {
  projects: HabitProject[];
  checkIns: CheckInMap;
  selectedProjectId: string;
};
