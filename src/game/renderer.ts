import { GameState, FIELD, Player, Ball } from "./types";

export function renderFrame(ctx: CanvasRenderingContext2D, state: GameState, controls: { kick: boolean }, W: number, H: number): void {
  const scaleX = W / FIELD.width;
  const scaleY = H / FIELD.height;

  ctx.save();
  ctx.scale(scaleX, scaleY);

  drawField(ctx);
  drawBall(ctx, state.ball);
  for (const p of state.players) drawPlayer(ctx, p);

  ctx.restore();
}

function drawField(ctx: CanvasRenderingContext2D): void {
  const grass1 = "#2d7a27";
  const grass2 = "#267022";
  const lineCol = "rgba(255,255,255,0.9)";
  const lw = 2.5;

  ctx.fillStyle = grass2;
  ctx.fillRect(FIELD.leftGoalX, FIELD.topY, FIELD.width - FIELD.leftGoalX * 2, FIELD.bottomY - FIELD.topY);

  const stripeW = 80;
  for (let x = FIELD.leftGoalX; x < FIELD.rightGoalX + FIELD.goalWidth; x += stripeW * 2) {
    ctx.fillStyle = grass1;
    ctx.fillRect(x, FIELD.topY, stripeW, FIELD.bottomY - FIELD.topY);
  }

  ctx.strokeStyle = lineCol;
  ctx.lineWidth = lw;
  ctx.strokeRect(FIELD.leftGoalX + 30, FIELD.topY, FIELD.rightGoalX - FIELD.leftGoalX - 30, FIELD.bottomY - FIELD.topY);

  ctx.beginPath();
  ctx.moveTo(FIELD.centerX, FIELD.topY);
  ctx.lineTo(FIELD.centerX, FIELD.bottomY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(FIELD.centerX, FIELD.centerY, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(FIELD.centerX, FIELD.centerY, 4, 0, Math.PI * 2);
  ctx.fillStyle = lineCol;
  ctx.fill();

  const pW = FIELD.penaltyAreaW;
  const pH = FIELD.penaltyAreaH;
  const pyTop = FIELD.centerY - pH / 2;

  ctx.strokeStyle = lineCol;
  ctx.strokeRect(FIELD.leftGoalX + 30, pyTop, pW, pH);
  ctx.strokeRect(FIELD.rightGoalX - pW + FIELD.goalWidth, pyTop, pW, pH);

  const goalTop = FIELD.centerY - FIELD.goalHeight / 2;
  const goalH = FIELD.goalHeight;
  const gW = FIELD.goalWidth + 20;

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(FIELD.leftGoalX - 20, goalTop, gW, goalH);
  ctx.fillRect(FIELD.rightGoalX, goalTop, gW, goalH);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.leftGoalX - 20, goalTop, gW, goalH);
  ctx.strokeRect(FIELD.rightGoalX, goalTop, gW, goalH);

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  const netSpacing = 12;
  for (let gy = goalTop; gy <= goalTop + goalH; gy += netSpacing) {
    ctx.beginPath();
    ctx.moveTo(FIELD.leftGoalX - 20, gy);
    ctx.lineTo(FIELD.leftGoalX, gy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(FIELD.rightGoalX, gy);
    ctx.lineTo(FIELD.rightGoalX + gW, gy);
    ctx.stroke();
  }
  for (let gx = FIELD.leftGoalX - 20; gx <= FIELD.leftGoalX; gx += netSpacing) {
    ctx.beginPath();
    ctx.moveTo(gx, goalTop);
    ctx.lineTo(gx, goalTop + goalH);
    ctx.stroke();
  }
  for (let gx = FIELD.rightGoalX; gx <= FIELD.rightGoalX + gW; gx += netSpacing) {
    ctx.beginPath();
    ctx.moveTo(gx, goalTop);
    ctx.lineTo(gx, goalTop + goalH);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(FIELD.leftGoalX + 110, FIELD.centerY, 5, 0, Math.PI * 2);
  ctx.fillStyle = lineCol;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(FIELD.rightGoalX - 80, FIELD.centerY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
  const { pos, radius, color, kitColor, isGK, team } = p;

  ctx.save();
  ctx.translate(pos.x, pos.y);

  const shadow = ctx.createRadialGradient(2, 4, 1, 2, 4, radius);
  shadow.addColorStop(0, "rgba(0,0,0,0.35)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(2, 5, radius * 1.1, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, radius);
  bodyGrad.addColorStop(0, lighten(kitColor, 30));
  bodyGrad.addColorStop(0.7, kitColor);
  bodyGrad.addColorStop(1, darken(kitColor, 20));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  if (isGK) {
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -radius * 0.15, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  const headGrad = ctx.createRadialGradient(-2, -radius * 0.15 - 2, 1, 0, -radius * 0.15, radius * 0.55);
  headGrad.addColorStop(0, "rgba(255,220,180,0.5)");
  headGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(0, -radius * 0.15, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  if (p.hasBall) {
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  const { pos, radius, spin } = ball;

  ctx.save();
  ctx.translate(pos.x, pos.y);

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(3, 6, radius * 1.1, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const ballGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.05, 0, 0, radius);
  ballGrad.addColorStop(0, "#ffffff");
  ballGrad.addColorStop(0.35, "#f0f0f0");
  ballGrad.addColorStop(1, "#cccccc");
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(spin);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 0.8;

  const pentagons = [
    [0, 0],
    [radius * 0.6, -radius * 0.3],
    [-radius * 0.6, -radius * 0.3],
    [radius * 0.3, radius * 0.55],
    [-radius * 0.3, radius * 0.55],
  ];
  for (const [px, py] of pentagons) {
    ctx.fillStyle = (Math.abs(px) + Math.abs(py)) < 0.1 ? "#111" : "#333";
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function lighten(hex: string, amount: number): string {
  return adjustColor(hex, amount);
}
function darken(hex: string, amount: number): string {
  return adjustColor(hex, -amount);
}
function adjustColor(hex: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
