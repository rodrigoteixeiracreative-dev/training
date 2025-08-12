import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  const [ageBand, setAgeBand] = useState(() => localStorage.getItem("ageBand") || "10-12");
  const [screen, setScreen] = useState(() => (localStorage.getItem("guardianConsent") === "1" ? "home" : "consent"));
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [streak, setStreak] = useState(() => loadStreak());
  const [completedToday, setCompletedToday] = useState(() => isCompletedToday());

  const totalExercises = 10;
  const totalSeconds = 60 * totalExercises;
  const totalDone = exerciseIndex * 60 + (60 - secondsLeft);

  const todaysPlan = useMemo(() => buildTodaysPlan(ageBand, totalExercises), [ageBand]);
  const current = todaysPlan[exerciseIndex];

  useEffect(() => {
    if (!isRunning || screen !== "session") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        if (exerciseIndex < totalExercises - 1) {
          setExerciseIndex((i) => i + 1);
          return 60;
        } else {
          setIsRunning(false);
          setScreen("finish");
          markCompletedToday();
          setCompletedToday(true);
          setStreak(incrementStreak());
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, screen, exerciseIndex]);

  useEffect(() => {
    localStorage.setItem("ageBand", ageBand);
  }, [ageBand]);

  const startSession = () => {
    setExerciseIndex(0);
    setSecondsLeft(60);
    setScreen("session");
    setIsRunning(true);
  };

  const togglePause = () => setIsRunning((r) => !r);
  const skip = () => {
    if (exerciseIndex < totalExercises - 1) {
      setExerciseIndex((i) => i + 1);
      setSecondsLeft(60);
    } else {
      setIsRunning(false);
      setScreen("finish");
      markCompletedToday();
      setCompletedToday(true);
      setStreak(incrementStreak());
    }
  };
  const reset = () => { setIsRunning(false); setExerciseIndex(0); setSecondsLeft(60); };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Header streak={streak} completedToday={completedToday} onInfo={() => setScreen("info")} />

        {screen === "consent" && (
          <Consent onAccept={() => { localStorage.setItem("guardianConsent", "1"); setScreen("home"); }} onDecline={() => alert('Uso não autorizado.')} />
        )}

        {screen === "home" && (
          <Home ageBand={ageBand} setAgeBand={setAgeBand} todaysPlan={todaysPlan} onStart={startSession} />
        )}

        {screen === "session" && (
          <Session
            current={current}
            exerciseIndex={exerciseIndex}
            totalExercises={totalExercises}
            secondsLeft={secondsLeft}
            totalDone={totalDone}
            totalSeconds={totalSeconds}
            isRunning={isRunning}
            onPause={togglePause}
            onSkip={skip}
            onReset={reset}
          />
        )}

        {screen === "finish" && (<Finish onHome={() => setScreen("home")} onReplay={startSession} />)}
        {screen === "info" && (<Info onClose={() => setScreen("home")} />)}
        <Footer />
      </div>
    </div>
  );
}

function Consent({ onAccept, onDecline }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
      <h2 className="text-2xl font-bold text-blue-700">Autorização do Responsável</h2>
      <p className="mt-3 text-sm text-gray-700">
        Este aplicativo incentiva crianças e adolescentes de 10 a 15 anos a praticarem 10 minutos de exercícios por dia.
      </p>
      <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
        <li>Exercícios de baixo impacto e curta duração.</li>
        <li>Recomenda-se supervisão do responsável durante as atividades.</li>
        <li>Em caso de desconforto ou condição médica pré-existente, suspenda o uso e procure orientação profissional.</li>
      </ul>
      <p className="mt-2 text-sm text-gray-700">
        Ao clicar em <strong>Concordo</strong>, o responsável declara estar ciente e de acordo com a participação do menor.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onDecline} className="py-2 rounded-xl bg-white border border-yellow-300 font-semibold">Não concordo</button>
        <button onClick={onAccept} className="py-2 rounded-xl bg-blue-600 text-white font-semibold">Concordo</button>
      </div>
    </div>
  );
}

function Header({ streak, completedToday, onInfo }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-blue-700">Sirius Training</h1>
        <p className="text-sm text-yellow-600">10 minutos por dia para crescer saudável</p>
      </div>
      <button onClick={onInfo} className="text-xs px-3 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200">Sobre</button>
    </div>
  );
}

function Home({ ageBand, setAgeBand, todaysPlan, onStart }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString();
  return (
    <div className="bg-white border border-yellow-200 rounded-2xl p-4 shadow-sm">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Faixa etária</label>
        <div className="grid grid-cols-3 gap-2">
          {["10-12", "12-13", "14-15"].map((band) => (
            <button key={band} onClick={() => setAgeBand(band)} className={`px-3 py-2 rounded-xl border text-sm ${ageBand === band ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200"}`}>
              {band}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Plano de hoje <span className="text-gray-400">({dateStr})</span></h2>
        <ul className="space-y-2 text-sm">
          {todaysPlan.map((ex, i) => (
            <li key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
              <span className="font-medium">{i + 1}. {ex.name}</span>
              <span className="text-gray-500">1:00</span>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onStart} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[.99]">Começar 10 minutos</button>
      <p className="text-xs text-gray-500 mt-3">Dica: faça em um espaço seguro, com água por perto. Pare se sentir dor.</p>
    </div>
  );
}

function Session({ current, exerciseIndex, totalExercises, secondsLeft, totalDone, totalSeconds, isRunning, onPause, onSkip, onReset }) {
  const pct = Math.min(100, Math.round((totalDone / totalSeconds) * 100));
  const pctExercise = Math.round(((60 - secondsLeft) / 60) * 100);
  return (
    <div className="bg-white border border-yellow-200 rounded-2xl p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Exercício {exerciseIndex + 1} de {totalExercises}</p>
          <h2 className="text-xl font-bold">{current?.name}</h2>
        </div>
        <button onClick={onReset} className="text-xs px-3 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200">Reiniciar</button>
      </div>
      <RingTimer secondsLeft={secondsLeft} pct={pctExercise} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={onPause} className="py-2 rounded-xl bg-blue-600 text-white font-semibold">{isRunning ? "Pausar" : "Retomar"}</button>
        <button onClick={onSkip} className="py-2 rounded-xl bg-white border border-yellow-300 font-semibold">Pular</button>
        <a href={current?.video} target="_blank" className="py-2 rounded-xl bg-white border border-gray-200 text-center font-semibold">Ver demo</a>
      </div>
      <div className="mt-6">
        <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-600" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500">Progresso total: {pct}%</p>
      </div>
    </div>
  );
}

function RingTimer({ secondsLeft, pct }) {
  const radius = 80;
  const stroke = 10;
  const norm = 2 * Math.PI * radius;
  const offset = norm - (pct / 100) * norm;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="200" height="200" className="drop-shadow-sm">
        <circle cx="100" cy="100" r={radius} stroke="#facc15" strokeWidth={stroke} fill="none" />
        <circle cx="100" cy="100" r={radius} stroke="#2563eb" strokeWidth={stroke} fill="none" strokeDasharray={norm} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 100 100)" />
        <text x="100" y="105" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0f172a">{secondsLeft}</text>
      </svg>
      <p className="text-sm text-gray-600 -mt-2">segundos</p>
    </div>
  );
}

function Finish({ onHome, onReplay }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm text-center">
      <h2 className="text-2xl font-black">Mandou bem! 🎉</h2>
      <p className="text-gray-700 mt-2">Você concluiu os 10 minutos de hoje. Continue a sequência diária!</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onReplay} className="py-3 rounded-2xl bg-blue-600 text-white font-semibold">Repetir</button>
        <button onClick={onHome} className="py-3 rounded-2xl bg-white border border-gray-200 font-semibold">Voltar</button>
      </div>
    </div>
  );
}

function Info({ onClose }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <h2 className="text-xl font-bold">Sobre</h2>
      <p className="text-sm text-gray-700 mt-2">
        O Sirius Training propõe 10 exercícios de 1 minuto, pensados para crianças e adolescentes. Não requer equipamentos e
        funciona offline. Consulte um responsável/educador físico em caso de dúvidas.
      </p>
      <ul className="list-disc ml-6 text-sm text-gray-700 mt-3 space-y-1">
        <li>Ajuste a faixa etária para variações seguras.</li>
        <li>Toque em “Ver demo” para ver uma referência do movimento.</li>
        <li>Sequência diária é marcada automaticamente.</li>
      </ul>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Ok</button>
      </div>
    </div>
  );
}

function Footer() {
  const todayKey = todayKeyStr();
  const done = localStorage.getItem("done:" + todayKey) === "1";
  const streak = loadStreak();
  return (
    <div className="mt-4 text-center text-xs text-gray-500">
      {done ? (
        <p>✅ Treino de hoje concluído • Sequência: <span className="font-semibold">{streak} dias</span></p>
      ) : (
        <p>⌛ 10 min por dia. Pequenos hábitos criam grandes mudanças.</p>
      )}
    </div>
  );
}

// Helpers
function buildTodaysPlan(ageBand, total) {
  const pool = getExercisePool(ageBand);
  const seed = Number(todayKeyStr().replaceAll("-", ""));
  const rng = mulberry32(seed);
  const chosen = [];
  const used = new Set();
  while (chosen.length < total && used.size < pool.length) {
    const idx = Math.floor(rng() * pool.length);
    if (used.has(idx)) continue;
    used.add(idx);
    chosen.push(pool[idx]);
  }
  while (chosen.length < total) chosen.push(pool[chosen.length % pool.length]);
  return chosen;
}

function getExercisePool(ageBand) {
  const demos = {
    jumpingJacks: "https://www.youtube.com/watch?v=c4DAnQ6DtF8",
    highKnees: "https://www.youtube.com/watch?v=OAJ_J3EZkdY",
    bodySquat: "https://www.youtube.com/watch?v=aclHkVaku9U",
    armCircles: "https://www.youtube.com/watch?v=1G8pZUbHhEw",
    mountainClimber: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    plankKnees: "https://www.youtube.com/watch?v=s7L2PVdrb_8",
    sideSteps: "https://www.youtube.com/watch?v=SSvthKQ6lMA",
    marchInPlace: "https://www.youtube.com/watch?v=2vZz7B3nS3I",
    gluteBridge: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    wallPushup: "https://www.youtube.com/watch?v=bvJZr6-6bcU",
    toeTouches: "https://www.youtube.com/watch?v=QyQw8sU8KxQ",
    skaters: "https://www.youtube.com/watch?v=0yDPg2p1QCI",
  };
  const base = [
    { name: "Polichinelos", video: demos.jumpingJacks },
    { name: "Correr parado (joelhos altos)", video: demos.highKnees },
    { name: "Agachamento ao ar livre", video: demos.bodySquat },
    { name: "Círculos de braço", video: demos.armCircles },
    { name: "Escalador (leve)", video: demos.mountainClimber },
    { name: "Prancha com joelhos", video: demos.plankKnees },
    { name: "Passos laterais", video: demos.sideSteps },
    { name: "Marcha no lugar", video: demos.marchInPlace },
    { name: "Elevação de quadril", video: demos.gluteBridge },
    { name: "Flexão na parede", video: demos.wallPushup },
    { name: "Toque nos pés (em pé)", video: demos.toeTouches },
    { name: "Patinadores (leve)", video: demos.skaters },
  ];
  if (ageBand === "10-12") return base.map(x => x);
  if (ageBand === "12-13") return base.map(x => ({ ...x, name: x.name.replace("leve", "moderado") }));
  if (ageBand === "14-15") return base.map(x => ({ ...x, name: x.name.replace("leve", "moderado") }));
  return base;
}

function todayKeyStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function markCompletedToday() { localStorage.setItem("done:" + todayKeyStr(), "1"); }
function isCompletedToday() { return localStorage.getItem("done:" + todayKeyStr()) === "1"; }
function loadStreak() { const raw = localStorage.getItem("streak") || "0"; return Number(raw); }
function incrementStreak() { const s = loadStreak() + 1; localStorage.setItem("streak", String(s)); return s; }
function mulberry32(a) { return function () { let t = (a += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
