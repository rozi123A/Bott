import { Ball, Player, Vec2, FIELD } from "./types";

export function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function updateBall(ball: Ball, dt: number): void {
  const FRICTION = 0.985;
  const SPIN_FRICTION = 0.97;

  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;
  ball.vel.x *= FRICTION;
  ball.vel.y *= FRICTION;
  ball.spin *= SPIN_FRICTION;

  const goalTop = FIELD.centerY - FIELD.goalHeight / 2;
  const goalBot = FIELD.centerY + FIELD.goalHeight / 2;

  if (ball.pos.y - ball.radius < FIELD.topY) {
    ball.pos.y = FIELD.topY + ball.radius;
    ball.vel.y = Math.abs(ball.vel.y) * 0.6;
  }
  if (ball.pos.y + ball.radius > FIELD.bottomY) {
    ball.pos.y = FIELD.bottomY - ball.radius;
    ball.vel.y = -Math.abs(ball.vel.y) * 0.6;
  }
  if (ball.pos.x - ball.radius < FIELD.leftGoalX + FIELD.goalWidth) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBot) {
    } else {
      ball.pos.x = FIELD.leftGoalX + FIELD.goalWidth + ball.radius;
      ball.vel.x = Math.abs(ball.vel.x) * 0.6;
    }
  }
  if (ball.pos.x + ball.radius > FIELD.rightGoalX) {
    if (ball.pos.y > goalTop && ball.pos.y < goalBot) {
    } else {
      ball.pos.x = FIELD.rightGoalX - ball.radius;
      ball.vel.x = -Math.abs(ball.vel.x) * 0.6;
    }
  }

  if (ball.pos.x - ball.radius < FIELD.leftGoalX) {
    ball.pos.x = FIELD.leftGoalX + ball.radius;
    ball.vel.x = Math.abs(ball.vel.x) * 0.4;
  }
  if (ball.pos.x + ball.radius > FIELD.rightGoalX + FIELD.goalWidth) {
    ball.pos.x = FIELD.rightGoalX + FIELD.goalWidth - ball.radius;
    ball.vel.x = -Math.abs(ball.vel.x) * 0.4;
  }
}

export function updatePlayer(p: Player, dt: number): void {
  const FRICTION = 0.82;
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;
  p.vel.x *= FRICTION;
  p.vel.y *= FRICTION;

  p.pos.x = clamp(p.pos.x, FIELD.leftGoalX + p.radius, FIELD.rightGoalX + FIELD.goalWidth - p.radius);
  p.pos.y = clamp(p.pos.y, FIELD.topY + p.radius, FIELD.bottomY - p.radius);

  if (p.kickCooldown > 0) p.kickCooldown -= dt;
  if (p.stamina < 100) p.stamina = Math.min(100, p.stamina + dt * 8);
}

export function resolvePlayerBallCollision(player: Player, ball: Ball): boolean {
  const d = dist(player.pos, ball.pos);
  const minDist = player.radius + ball.radius;
  if (d < minDist && d > 0) {
    const nx = (ball.pos.x - player.pos.x) / d;
    const ny = (ball.pos.y - player.pos.y) / d;
    const overlap = minDist - d;
    ball.pos.x += nx * overlap;
    ball.pos.y += ny * overlap;
    const relVx = ball.vel.x - player.vel.x;
    const relVy = ball.vel.y - player.vel.y;
    const dot = relVx * nx + relVy * ny;
    if (dot < 0) {
      const restitution = 0.6;
      ball.vel.x -= (1 + restitution) * dot * nx;
      ball.vel.y -= (1 + restitution) * dot * ny;
      ball.vel.x += player.vel.x * 0.4;
      ball.vel.y += player.vel.y * 0.4;
    }
    return true;
  }
  return false;
}

export function resolvePlayerPlayerCollision(a: Player, b: Player): void {
  const d = dist(a.pos, b.pos);
  const minDist = a.radius + b.radius;
  if (d < minDist && d > 0) {
    const nx = (b.pos.x - a.pos.x) / d;
    const ny = (b.pos.y - a.pos.y) / d;
    const overlap = (minDist - d) / 2;
    a.pos.x -= nx * overlap;
    a.pos.y -= ny * overlap;
    b.pos.x += nx * overlap;
    b.pos.y += ny * overlap;
    const relVx = b.vel.x - a.vel.x;
    const relVy = b.vel.y - a.vel.y;
    const dot = relVx * nx + relVy * ny;
    if (dot < 0) {
      a.vel.x += dot * nx * 0.5;
      a.vel.y += dot * ny * 0.5;
      b.vel.x -= dot * nx * 0.5;
      b.vel.y -= dot * ny * 0.5;
    }
  }
}

export function checkGoal(ball: Ball): 0 | 1 | null {
  const goalTop = FIELD.centerY - FIELD.goalHeight / 2;
  const goalBot = FIELD.centerY + FIELD.goalHeight / 2;
  if (ball.pos.x - ball.radius < FIELD.leftGoalX && ball.pos.y > goalTop && ball.pos.y < goalBot) return 1;
  if (ball.pos.x + ball.radius > FIELD.rightGoalX + FIELD.goalWidth && ball.pos.y > goalTop && ball.pos.y < goalBot) return 0;
  return null;
}
