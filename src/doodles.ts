import { DoodleData, DoodlePoint } from './types';

const stroke = (...points: Array<[number, number]>): { points: DoodlePoint[] } => ({
  points: points.map(([x, y]) => ({ x, y })),
});

const DOODLES: Record<string, DoodleData> = {
  dumbbell: {
    strokes: [
      stroke([0.2, 0.3], [0.2, 0.7]),
      stroke([0.32, 0.22], [0.32, 0.78]),
      stroke([0.32, 0.5], [0.68, 0.5]),
      stroke([0.68, 0.22], [0.68, 0.78]),
      stroke([0.8, 0.3], [0.8, 0.7]),
    ],
  },
  'book-open-page-variant-outline': {
    strokes: [
      stroke([0.14, 0.24], [0.3, 0.2], [0.47, 0.32], [0.47, 0.76], [0.3, 0.65], [0.14, 0.68], [0.14, 0.24]),
      stroke([0.86, 0.24], [0.7, 0.2], [0.53, 0.32], [0.53, 0.76], [0.7, 0.65], [0.86, 0.68], [0.86, 0.24]),
    ],
  },
  meditation: {
    strokes: [
      stroke([0.5, 0.18], [0.5, 0.19]),
      stroke([0.5, 0.32], [0.48, 0.52]),
      stroke([0.48, 0.42], [0.3, 0.52], [0.18, 0.48]),
      stroke([0.48, 0.42], [0.68, 0.52], [0.82, 0.48]),
      stroke([0.48, 0.52], [0.32, 0.68], [0.14, 0.68], [0.34, 0.78], [0.5, 0.68]),
      stroke([0.5, 0.68], [0.66, 0.78], [0.86, 0.68], [0.68, 0.68], [0.48, 0.52]),
    ],
  },
  run: {
    strokes: [
      stroke([0.58, 0.16], [0.58, 0.17]),
      stroke([0.52, 0.3], [0.42, 0.48], [0.58, 0.58]),
      stroke([0.45, 0.4], [0.28, 0.35]),
      stroke([0.5, 0.42], [0.7, 0.34]),
      stroke([0.58, 0.58], [0.76, 0.76]),
      stroke([0.58, 0.58], [0.4, 0.76], [0.22, 0.72]),
    ],
  },
  'cup-water': {
    strokes: [
      stroke([0.22, 0.24], [0.78, 0.24], [0.7, 0.78], [0.3, 0.78], [0.22, 0.24]),
      stroke([0.32, 0.5], [0.42, 0.45], [0.52, 0.52], [0.64, 0.46], [0.72, 0.5]),
    ],
  },
  'music-note': {
    strokes: [
      stroke([0.42, 0.25], [0.7, 0.2], [0.7, 0.64]),
      stroke([0.42, 0.25], [0.42, 0.7]),
      stroke([0.42, 0.7], [0.34, 0.78], [0.22, 0.76], [0.2, 0.68], [0.3, 0.62], [0.42, 0.64]),
      stroke([0.7, 0.64], [0.62, 0.72], [0.5, 0.7], [0.48, 0.62], [0.58, 0.56], [0.7, 0.58]),
    ],
  },
  'pencil-outline': {
    strokes: [
      stroke([0.2, 0.72], [0.28, 0.5], [0.68, 0.18], [0.82, 0.32], [0.42, 0.66], [0.2, 0.72]),
      stroke([0.28, 0.5], [0.42, 0.66]),
      stroke([0.64, 0.22], [0.78, 0.36]),
    ],
  },
  'weather-night': {
    strokes: [
      stroke([0.62, 0.18], [0.42, 0.24], [0.3, 0.42], [0.32, 0.62], [0.48, 0.76], [0.68, 0.74], [0.8, 0.6], [0.62, 0.64], [0.48, 0.56], [0.44, 0.4], [0.5, 0.26], [0.62, 0.18]),
      stroke([0.72, 0.2], [0.74, 0.26], [0.8, 0.28], [0.74, 0.3], [0.72, 0.36], [0.7, 0.3], [0.64, 0.28], [0.7, 0.26], [0.72, 0.2]),
    ],
  },
};

const FALLBACK = {
  strokes: [
    stroke([0.2, 0.58], [0.3, 0.36], [0.46, 0.68], [0.62, 0.3], [0.8, 0.56]),
  ],
};

export const EMPTY_DOODLE: DoodleData = { strokes: [] };

export function cloneDoodle(doodle: DoodleData): DoodleData {
  return {
    strokes: doodle.strokes.map((item) => ({
      points: item.points.map((point) => ({ ...point })),
    })),
  };
}

export function getLegacyDoodle(icon?: string): DoodleData {
  return cloneDoodle((icon && DOODLES[icon]) || FALLBACK);
}
