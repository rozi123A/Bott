import { GameState, Player, Ball, FIELD } from "./types";

function makePlayer(
  id: number,
  team: 0 | 1,
  isGK: boolean,
  x: number,
  y: number,
  name: string
): Player {
  const team0Kit = ["#c0392b", "#e74c3c"];
  const team1Kit = ["#1a5276", "#2980b9"];
  const kitColor = team === 0 ? team0Kit[isGK ? 0 : 1] : team1Kit[isGK ? 0 : 1];
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius: 16,
    team,
    isGK,
    color: "#f5cba7",
    kitColor,
    hasBall: false,
    kickCooldown: 0,
    stamina: 100,
    name,
  };
}

export function createInitialState(): GameState {
  const cy = FIELD.centerY;
  const players: Player[] = [
    makePlayer(0, 0, false, FIELD.centerX - 10, cy, "أنت"),
    makePlayer(1, 0, false, FIELD.centerX - 120, cy - 80, "علي"),
    makePlayer(2, 0, false, FIELD.centerX - 120, cy + 80, "سعد"),
    makePlayer(3, 0, true, FIELD.leftGoalX + 55, cy, "حارس١"),
    makePlayer(4, 1, false, FIELD.centerX + 30, cy, "عدو"),
    makePlayer(5, 1, false, FIELD.centerX + 130, cy - 80, "عدو٢"),
    makePlayer(6, 1, false, FIELD.centerX + 130, cy + 80, "عدو٣"),
    makePlayer(7, 1, true, FIELD.rightGoalX - 25, cy, "حارس٢"),
  ];

  const ball: Ball = {
    pos: { x: FIELD.centerX, y: cy },
    vel: { x: 0, y: 0 },
    radius: 10,
    spin: 0,
  };

  return {
    players,
    ball,
    score: [0, 0],
    time: 90 * 60,
    phase: "kickoff",
    goalCooldown: 0,
    possession: -1,
    lastScorer: "",
    cameraX: 0,
  };
}

export function resetPositions(state: GameState, kickTeam: 0 | 1): void {
  const cy = FIELD.centerY;
  const positions: [number, number][] = [
    [FIELD.centerX - 10, cy],
    [FIELD.centerX - 120, cy - 80],
    [FIELD.centerX - 120, cy + 80],
    [FIELD.leftGoalX + 55, cy],
    [FIELD.centerX + 30, cy],
    [FIELD.centerX + 130, cy - 80],
    [FIELD.centerX + 130, cy + 80],
    [FIELD.rightGoalX - 25, cy],
  ];
  state.players.forEach((p, i) => {
    p.pos = { x: positions[i][0], y: positions[i][1] };
    p.vel = { x: 0, y: 0 };
    p.kickCooldown = 0;
  });
  state.ball.pos = { x: FIELD.centerX, y: cy };
  state.ball.vel = { x: 0, y: 0 };
  state.ball.spin = 0;
}
