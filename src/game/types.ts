export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  team: 0 | 1;
  isGK: boolean;
  color: string;
  kitColor: string;
  hasBall: boolean;
  kickCooldown: number;
  stamina: number;
  name: string;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  spin: number;
}

export interface GameState {
  players: Player[];
  ball: Ball;
  score: [number, number];
  time: number;
  phase: "kickoff" | "playing" | "goal" | "halftime" | "fulltime";
  goalCooldown: number;
  possession: number;
  lastScorer: string;
  cameraX: number;
}

export interface Controls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  sprint: boolean;
}

export const FIELD = {
  width: 1000,
  height: 600,
  goalWidth: 12,
  goalHeight: 130,
  centerX: 500,
  centerY: 300,
  leftGoalX: 30,
  rightGoalX: 958,
  topY: 50,
  bottomY: 550,
  penaltyAreaW: 140,
  penaltyAreaH: 220,
};
