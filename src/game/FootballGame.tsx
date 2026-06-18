import { useEffect, useRef, useState, useCallback } from "react";
import { GameState, Controls, FIELD, Player } from "./types";
import { createInitialState, resetPositions } from "./initState";
import {
  updateBall,
  updatePlayer,
  resolvePlayerBallCollision,
  resolvePlayerPlayerCollision,
  checkGoal,
  dist,
  normalize,
} from "./physics";
import { updateAI } from "./ai";
import { renderFrame } from "./renderer";

const CANVAS_W = 900;
const CANVAS_H = 540;
const GAME_DURATION = 3 * 60;

export default function FootballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const controlsRef = useRef<Controls>({
    up: false, down: false, left: false, right: false, kick: false, sprint: false,
  });
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [phase, setPhase] = useState<string>("kickoff");
  const [goalMsg, setGoalMsg] = useState("");
  const goalMsgTimer = useRef(0);

  const getPlayer = () => stateRef.current.players[0];

  const handleKey = useCallback((e: KeyboardEvent, down: boolean) => {
    const c = controlsRef.current;
    switch (e.code) {
      case "ArrowUp": case "KeyW": c.up = down; break;
      case "ArrowDown": case "KeyS": c.down = down; break;
      case "ArrowLeft": case "KeyA": c.left = down; break;
      case "ArrowRight": case "KeyD": c.right = down; break;
      case "Space": case "KeyX": c.kick = down; e.preventDefault(); break;
      case "ShiftLeft": case "ShiftRight": c.sprint = down; break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));
    return () => {
      window.removeEventListener("keydown", (e) => handleKey(e, true));
      window.removeEventListener("keyup", (e) => handleKey(e, false));
    };
  }, [handleKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const state = stateRef.current;
      const controls = controlsRef.current;

      if (state.phase === "playing" || state.phase === "kickoff") {
        // Update game timer
        if (state.phase === "playing") {
          state.time -= dt;
          if (state.time <= 0) {
            state.time = 0;
            state.phase = "fulltime";
            setPhase("fulltime");
          }
        }

        // Player 0 control
        const p0 = state.players[0];
        const sprintMult = controls.sprint && p0.stamina > 10 ? 1.7 : 1;
        const speed = 5.5 * sprintMult;
        if (controls.sprint && p0.stamina > 10) p0.stamina -= dt * 30;

        if (controls.up) p0.vel.y -= speed;
        if (controls.down) p0.vel.y += speed;
        if (controls.left) p0.vel.x -= speed;
        if (controls.right) p0.vel.x += speed;

        // Kick
        if (controls.kick && p0.kickCooldown <= 0) {
          const d = dist(p0.pos, state.ball.pos);
          if (d < p0.radius + state.ball.radius + 15) {
            const toGoal = normalize({ x: FIELD.rightGoalX - p0.pos.x, y: FIELD.centerY - p0.pos.y });
            const power = 320 + (sprintMult > 1 ? 60 : 0);
            state.ball.vel.x = toGoal.x * power + p0.vel.x * 1.5;
            state.ball.vel.y = toGoal.y * power + p0.vel.y * 1.5;
            state.ball.spin += (Math.random() - 0.5) * 0.3;
            p0.kickCooldown = 0.4;
            controls.kick = false;
          }
        }

        // Switch to playing on first input during kickoff
        if (state.phase === "kickoff") {
          if (controls.up || controls.down || controls.left || controls.right) {
            state.phase = "playing";
            state.time = GAME_DURATION;
            setPhase("playing");
          }
        }

        // Update all players
        for (const p of state.players) {
          if (p !== p0) updateAI(p, state.ball, state, dt);
          updatePlayer(p, dt);
        }

        updateBall(state.ball, dt);
        state.ball.spin += (state.ball.vel.x * 0.002);

        // Collisions
        for (const p of state.players) {
          resolvePlayerBallCollision(p, state.ball);
        }
        for (let i = 0; i < state.players.length; i++) {
          for (let j = i + 1; j < state.players.length; j++) {
            resolvePlayerPlayerCollision(state.players[i], state.players[j]);
          }
        }

        // Mark possession
        let closestDist = 999;
        let closestP: Player | null = null;
        for (const p of state.players) {
          const d = dist(p.pos, state.ball.pos);
          p.hasBall = false;
          if (d < closestDist) { closestDist = d; closestP = p; }
        }
        if (closestP && closestDist < closestP.radius + state.ball.radius + 12) {
          closestP.hasBall = true;
        }

        // Goal check
        const goal = checkGoal(state.ball);
        if (goal !== null && state.goalCooldown <= 0) {
          state.score[goal]++;
          state.phase = "goal";
          state.goalCooldown = 3;
          const scorer = goal === 0 ? "فريقك سجّل!" : "الخصم سجّل!";
          setGoalMsg(scorer);
          setScore([...state.score]);
          goalMsgTimer.current = 3;

          setTimeout(() => {
            resetPositions(state, goal === 0 ? 1 : 0);
            state.phase = "playing";
            setPhase("playing");
            setGoalMsg("");
          }, 3000);
        }

        if (state.goalCooldown > 0) state.goalCooldown -= dt;

        setTimeLeft(Math.max(0, Math.round(state.time)));
      }

      // Render
      renderFrame(ctx, state, controls, CANVAS_W, CANVAS_H);

      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleRestart = () => {
    stateRef.current = createInitialState();
    setScore([0, 0]);
    setTimeLeft(GAME_DURATION);
    setPhase("kickoff");
    setGoalMsg("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#e74c3c", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>فريقك</div>
          <div style={{ color: "#fff", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{score[0]}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            {phase === "kickoff" ? "انقر للبدء" : phase === "fulltime" ? "انتهت المباراة" : "الوقت"}
          </div>
          <div style={{
            color: "#FFD700",
            fontSize: 28,
            fontWeight: 800,
            background: "rgba(0,0,0,0.3)",
            borderRadius: 12,
            padding: "6px 20px",
            border: "1px solid rgba(255,215,0,0.3)",
          }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#2980b9", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>الخصم</div>
          <div style={{ color: "#fff", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{score[1]}</div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 3px rgba(255,255,255,0.1)",
          }}
        />

        {/* Overlays */}
        {phase === "kickoff" && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "rgba(0,0,0,0.55)", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>⚽</div>
            <div style={{ color: "#fff", fontSize: 30, fontWeight: 800 }}>لعبة كرة القدم</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>اضغط أي مفتاح للبدء</div>
            <div style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.5)",
              fontSize: 13, textAlign: "center", lineHeight: 2,
            }}>
              ←↑↓→ أو WASD للحركة &nbsp;|&nbsp; Space / X للتسديد<br />
              Shift للركض
            </div>
          </div>
        )}

        {goalMsg && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "rgba(0,0,0,0.6)", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 72, animation: "pulse 0.5s infinite alternate" }}>⚽</div>
            <div style={{ color: "#FFD700", fontSize: 42, fontWeight: 900, textShadow: "0 0 30px #FFD700" }}>
              هدف!
            </div>
            <div style={{ color: "#fff", fontSize: 22, marginTop: 8 }}>{goalMsg}</div>
          </div>
        )}

        {phase === "fulltime" && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "rgba(0,0,0,0.75)", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          }}>
            <div style={{ color: "#FFD700", fontSize: 38, fontWeight: 900 }}>انتهت المباراة!</div>
            <div style={{ color: "#fff", fontSize: 22 }}>
              {score[0] > score[1] ? "🏆 فريقك فاز!" : score[1] > score[0] ? "😔 الخصم فاز" : "🤝 تعادل!"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>
              {score[0]} - {score[1]}
            </div>
            <button
              onClick={handleRestart}
              style={{
                marginTop: 12, padding: "12px 36px", fontSize: 18, fontWeight: 700,
                background: "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "#fff", border: "none", borderRadius: 50, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(231,76,60,0.5)",
              }}
            >
              العب مجدداً ↺
            </button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div style={{
        marginTop: 16, display: "flex", gap: 24,
        color: "rgba(255,255,255,0.45)", fontSize: 13,
      }}>
        <span>🎮 ←↑↓→ / WASD حركة</span>
        <span>⚽ Space / X تسديد</span>
        <span>🏃 Shift ركض</span>
        {phase === "fulltime" && (
          <button
            onClick={handleRestart}
            style={{ background: "none", border: "none", color: "#FFD700", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            ↺ إعادة
          </button>
        )}
      </div>
    </div>
  );
}
