import { Player, Ball, Vec2, FIELD, GameState } from "./types";
import { dist, normalize, clamp } from "./physics";

function seekTarget(player: Player, target: Vec2, speed: number): void {
  const dx = target.x - player.pos.x;
  const dy = target.y - player.pos.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > 2) {
    player.vel.x += (dx / d) * speed;
    player.vel.y += (dy / d) * speed;
    const maxSpeed = speed * 5;
    const curSpeed = Math.sqrt(player.vel.x ** 2 + player.vel.y ** 2);
    if (curSpeed > maxSpeed) {
      player.vel.x = (player.vel.x / curSpeed) * maxSpeed;
      player.vel.y = (player.vel.y / curSpeed) * maxSpeed;
    }
  }
}

export function updateAI(player: Player, ball: Ball, state: GameState, dt: number): void {
  const isTeam0 = player.team === 0;
  const ownGoalX = isTeam0 ? FIELD.leftGoalX + 40 : FIELD.rightGoalX - 20;
  const oppGoalX = isTeam0 ? FIELD.rightGoalX + FIELD.goalWidth / 2 : FIELD.leftGoalX + FIELD.goalWidth / 2;
  const ballDist = dist(player.pos, ball.pos);

  if (player.isGK) {
    const homeX = isTeam0 ? FIELD.leftGoalX + 55 : FIELD.rightGoalX - 25;
    const targetY = clamp(ball.pos.y, FIELD.centerY - FIELD.goalHeight / 2 + 15, FIELD.centerY + FIELD.goalHeight / 2 - 15);
    if (ballDist < 180) {
      seekTarget(player, ball.pos, 5.5);
    } else {
      seekTarget(player, { x: homeX, y: targetY }, 4);
    }

    if (ballDist < player.radius + ball.radius + 5 && player.kickCooldown <= 0) {
      const dir = normalize({ x: oppGoalX - player.pos.x, y: FIELD.centerY - player.pos.y });
      ball.vel.x = dir.x * 320 + (Math.random() - 0.5) * 60;
      ball.vel.y = dir.y * 320 + (Math.random() - 0.5) * 60;
      player.kickCooldown = 0.8;
    }
    return;
  }

  const teammates = state.players.filter(p => p.team === player.team && p !== player && !p.isGK);
  const isClosestToBall = teammates.every(t => dist(t.pos, ball.pos) >= ballDist);

  const ballMovingTowardGoal = isTeam0
    ? ball.vel.x < -30
    : ball.vel.x > 30;

  if (isClosestToBall) {
    const interceptX = ball.pos.x + ball.vel.x * 0.15;
    const interceptY = ball.pos.y + ball.vel.y * 0.15;
    seekTarget(player, { x: interceptX, y: interceptY }, 5.2);

    if (ballDist < player.radius + ball.radius + 4 && player.kickCooldown <= 0) {
      const rx = (Math.random() - 0.5) * 80;
      const ry = (Math.random() - 0.5) * 120;
      const targetX = oppGoalX + rx;
      const targetY = FIELD.centerY + ry;
      const dir = normalize({ x: targetX - player.pos.x, y: targetY - player.pos.y });
      const power = 280 + Math.random() * 80;
      ball.vel.x = dir.x * power;
      ball.vel.y = dir.y * power;
      player.kickCooldown = 0.5 + Math.random() * 0.3;
    }
  } else {
    const supportX = isTeam0
      ? clamp(ball.pos.x - 120, FIELD.leftGoalX + 80, FIELD.centerX - 20)
      : clamp(ball.pos.x + 120, FIELD.centerX + 20, FIELD.rightGoalX - 80);
    const supportY = clamp(ball.pos.y + (Math.random() - 0.5) * 60, FIELD.topY + 30, FIELD.bottomY - 30);
    seekTarget(player, { x: supportX, y: supportY }, 3.8);
  }
}
