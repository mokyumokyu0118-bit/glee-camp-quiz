"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Users, Play, Square, Trophy, CheckCircle2, XCircle, LogOut, ArrowRight, UserCheck, PieChart, FastForward } from "lucide-react";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// --------------------------------------------------
// Firebaseの設定
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBuLEQ03cfTWSPllBeBHSb4UCPkqVkrVqU",
  authDomain: "glee-camp-quiz.firebaseapp.com",
  databaseURL: "https://glee-camp-quiz-default-rtdb.firebaseio.com",
  projectId: "glee-camp-quiz",
  storageBucket: "glee-camp-quiz.firebasestorage.app",
  messagingSenderId: "630870274211",
  appId: "1:630870274211:web:57fdc08668252e85c18f16",
  measurementId: "G-3FWDQSD6F9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 1. マスターデータ設定（名簿・問題）
// ==========================================

const PARTS = ["Top", "Second", "Baritone", "Bass"] as const;
type Part = typeof PARTS[number];

const PRE_REGISTERED_MEMBERS: { id: string; name: string; part: Part; grade: number }[] = [
  { id: "t1", name: "佐野大器", part: "Top", grade: 4 }, { id: "t2", name: "石川泰輝", part: "Top", grade: 3 },
  { id: "t3", name: "岡田拓士", part: "Top", grade: 3 }, { id: "t4", name: "土井隆世", part: "Top", grade: 3 },
  { id: "t5", name: "八木真斗", part: "Top", grade: 3 }, { id: "t6", name: "吉村弥", part: "Top", grade: 3 },
  { id: "t7", name: "天海聡太", part: "Top", grade: 1 }, { id: "t8", name: "五月女右京", part: "Top", grade: 1 },
  { id: "t9", name: "原口諒平", part: "Top", grade: 1 }, { id: "t10", name: "石井瑛士", part: "Top", grade: 1 },
  { id: "t11", name: "武内颯輝", part: "Top", grade: 1 }, { id: "t12", name: "谷川陸翔", part: "Top", grade: 1 },
  { id: "s1", name: "小川毅", part: "Second", grade: 4 }, { id: "s2", name: "川口零生", part: "Second", grade: 4 },
  { id: "s3", name: "林和尊", part: "Second", grade: 4 }, { id: "s4", name: "柿葉大地", part: "Second", grade: 2 },
  { id: "s5", name: "中井規矩士", part: "Second", grade: 2 }, { id: "s6", name: "大國裕貴", part: "Second", grade: 1 },
  { id: "s7", name: "北島光", part: "Second", grade: 1 }, { id: "s8", name: "佐藤大成", part: "Second", grade: 1 },
  { id: "br1", name: "田中司真", part: "Baritone", grade: 4 }, { id: "br2", name: "西森晄志", part: "Baritone", grade: 4 },
  { id: "br3", name: "中山東熊", part: "Baritone", grade: 4 }, { id: "br4", name: "伊藤陽生", part: "Baritone", grade: 3 },
  { id: "br5", name: "田中大山", part: "Baritone", grade: 3 }, { id: "br6", name: "山崎瑛大", part: "Baritone", grade: 3 },
  { id: "br7", name: "今田健登", part: "Baritone", grade: 2 }, { id: "br8", name: "太田元", part: "Baritone", grade: 1 },
  { id: "br9", name: "大嶽朋起", part: "Baritone", grade: 1 }, { id: "br10", name: "尾形朋紘", part: "Baritone", grade: 1 },
  { id: "bs1", name: "佐藤晃", part: "Bass", grade: 4 }, { id: "bs2", name: "石川夢樹", part: "Bass", grade: 3 },
  { id: "bs3", name: "一色遊", part: "Bass", grade: 3 }, { id: "bs4", name: "清水脩悟", part: "Bass", grade: 3 },
  { id: "bs5", name: "林春太郎", part: "Bass", grade: 3 }, { id: "bs6", name: "糸川英治", part: "Bass", grade: 2 },
  { id: "bs7", name: "安久啓悟", part: "Bass", grade: 1 }, { id: "bs8", name: "宇原央燿", part: "Bass", grade: 1 }, { id: "bs9", name: "田尻雄莉", part: "Bass", grade: 3 }
];

// 【追加】イントロクイズの型を追加
type QuestionType = "tarekomi" | "photo" | "intro";
type Question = {
  id: string;
  type: QuestionType;
  title: string;
  text: string;
  imageUrl?: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  // --- タレコミクイズ ---
  { id: "q1", type: "tarekomi", title: "タレコミクイズ 1", text: "【石川泰輝】\n女の子を鞭で叩いたり、蝋を垂らしたりするSMプレイが好き", options: ["本当", "嘘"] },
  { id: "q2", type: "tarekomi", title: "タレコミクイズ 2", text: "【中山東熊】\n高校同期のメサイア指揮者アシスタントのことが好きだった", options: ["本当", "嘘"] },
  { id: "q3", type: "tarekomi", title: "タレコミクイズ 3", text: "【田中司真】\n後輩複数名に自分のうどんや特急券の代金を支払わせたことがある", options: ["本当", "嘘"] },
  { id: "q4", type: "tarekomi", title: "タレコミクイズ 4", text: "【林和尊】\n好きなポケモンはサーナイト。多分抜いたことある", options: ["本当", "嘘"] },
  { id: "q5", type: "tarekomi", title: "タレコミクイズ 5", text: "【北島光】\n脇腹が弱点。積極的に狙いに行こう", options: ["本当", "嘘"] },
  { id: "q6", type: "tarekomi", title: "タレコミクイズ 6", text: "【糸川英治】\n酔っ払うと人のホクロを触るフェチが開放されるえいじくん。先日、京都ユースの練習後の懇親会にて、ついに伊東先生の額のホクロに接触する実績を解除した。", options: ["本当", "嘘"] },
  { id: "q7", type: "tarekomi", title: "タレコミクイズ 7", text: "【田中司真】\n現在の彼女を除いて2人にモテていたことがある", options: ["本当", "嘘"] },
  { id: "q9", type: "tarekomi", title: "タレコミクイズ 8", text: "【清水脩悟】\n声が小さすぎてMCを首になったことがある", options: ["本当", "嘘"] },
  { id: "q10", type: "tarekomi", title: "タレコミクイズ 9", text: "【西森晄志】\n毎年共通テストを受けている", options: ["本当", "嘘"] },
  { id: "q11", type: "tarekomi", title: "タレコミクイズ 10", text: "【田中司真】\nセックス中に腰痛で動けなくなったことがある", options: ["本当", "嘘"] },
  { id: "q12", type: "tarekomi", title: "タレコミクイズ 11", text: "【土井隆世】\n浪人時に、1人で海に行き、黙々と泳ぐ日を設けていた。", options: ["本当", "嘘"] },
  { id: "q13", type: "tarekomi", title: "タレコミクイズ 12", text: "【石川泰輝】\n彼女に5000円借りたまま未だ返していない。", options: ["本当", "嘘"] },
  { id: "q14", type: "tarekomi", title: "タレコミクイズ 13", text: "【岡田拓士】\n子供の頃メビウスの輪をドーナツと間違い食べていた。", options: ["本当", "嘘"] },
  { id: "q15", type: "tarekomi", title: "タレコミクイズ 14", text: "【小川毅】\n母は、ママさんコーラスのお調子者である。", options: ["本当", "嘘"] },
  { id: "q16", type: "tarekomi", title: "タレコミクイズ 15", text: "【柿葉大地】\n書店員のバイトをしている。", options: ["本当", "嘘"] },
  { id: "q17", type: "tarekomi", title: "タレコミクイズ 16", text: "【佐藤大成】\n家で買っている亀の名前はパン", options: ["本当", "嘘"] },
  { id: "q18", type: "tarekomi", title: "タレコミクイズ 17", text: "【田中司真】\n「仕事」と呼ぶとカッコいいと感じるので、「仕事」を頼むとやってくれる。", options: ["本当", "嘘"] },
  { id: "q19", type: "tarekomi", title: "タレコミクイズ 18", text: "【山崎瑛大】\nバトリンは墨汁を炭酸で割って飲んだことがある", options: ["本当", "嘘"] },
  { id: "q20", type: "tarekomi", title: "タレコミクイズ 19", text: "【西森晄志】\nエクセルの関数を使えない。", options: ["本当", "嘘"] },
  { id: "q21", type: "tarekomi", title: "タレコミクイズ 20", text: "【石川夢樹】\n生まれてくる時には髪の毛が生えており、既にセンター分けになっていた。", options: ["本当", "嘘"] },
  { id: "q22", type: "tarekomi", title: "タレコミクイズ 21", text: "【清水脩悟】\nバイト先には外国人ばかりで、その人たちは日本語が喋れないが、そこにうまく溶け込んでいる。", options: ["本当", "嘘"] },
  { id: "q23", type: "tarekomi", title: "タレコミクイズ 22", text: "【安久啓悟】\n自室に虫が現れた際、秒殺する。", options: ["本当", "嘘"] },
  { id: "q24", type: "tarekomi", title: "タレコミクイズ 23", text: "【石川泰輝】\nタバコを一人で吸ってる大人な女性が好きらしい", options: ["本当", "嘘"] },
  { id: "q25", type: "tarekomi", title: "タレコミクイズ 24", text: "【山崎瑛大】\nサイゼリヤで吐いて出禁になりかけた", options: ["本当", "嘘"] },
  { id: "q26", type: "tarekomi", title: "タレコミクイズ 25", text: "【伊藤陽生】\nバ先で一人でホール対応させられた上JKに怒られた", options: ["本当", "嘘"] },
  { id: "q27", type: "tarekomi", title: "タレコミクイズ 26", text: "【田中大山】\n出生地はアメリカ", options: ["本当", "嘘"] },
  { id: "q28", type: "tarekomi", title: "タレコミクイズ 27", text: "【田尻雄莉】\n田尻は寿司職人の1day仕事体験に参加したことがある", options: ["本当", "嘘"] },
  { id: "q29", type: "tarekomi", title: "タレコミクイズ 28", text: "【柿葉大地】\n家に共産党宣言が飾られている", options: ["本当", "嘘"] },
  { id: "q30", type: "tarekomi", title: "タレコミクイズ 29", text: "【川口零生】\nタバコは好きな人に憧れて吸い始めた", options: ["本当", "嘘"] },
  { id: "q31", type: "tarekomi", title: "タレコミクイズ 30", text: "【清水脩悟】\n高校サッカーでのポジションはボランチ", options: ["本当", "嘘"] },
  { id: "q32", type: "tarekomi", title: "タレコミクイズ 31", text: "【谷川陸翔】\n出身の高校は燃えて1回消えかけた", options: ["本当", "嘘"] },
  { id: "q33", type: "tarekomi", title: "タレコミクイズ 32", text: "【佐野大器】\n実家は輪島塗で生計を立てている", options: ["本当", "嘘"] },
  { id: "q34", type: "tarekomi", title: "タレコミクイズ 33", text: "【中山東熊】\n練習をサボって何度も旅行に行っている", options: ["本当", "嘘"] },
  { id: "q35", type: "tarekomi", title: "タレコミクイズ 34", text: "【伊藤陽生】\n伊藤は心のノートを小学校の近くのため池に落としたことがある", options: ["本当", "嘘"] },
  { id: "q36", type: "tarekomi", title: "タレコミクイズ 35", text: "【佐藤晃】\n期末テスト当日に遅刻してしまったが、脅威の健脚で出町柳から新町キャンパスまで15分で駆け抜けて何とか間に合ったことがある。", options: ["本当", "嘘"] },
  { id: "q37", type: "tarekomi", title: "タレコミクイズ 36", text: "【田中司真】\n2年前のサイゼリヤでの忘年会の二次会で貸した1000円を早く返してください", options: ["本当", "嘘"] },
  { id: "q38", type: "tarekomi", title: "タレコミクイズ 37", text: "【西森晄志】\nYoutubeの有名曲のMVに出たことがある", options: ["本当", "嘘"] },
  { id: "q39", type: "tarekomi", title: "タレコミクイズ 38", text: "【川口零生】\n女の子と2人でアマークに入ったところを目撃されている", options: ["本当", "嘘"] },
  { id: "q40", type: "tarekomi", title: "タレコミクイズ 39", text: "【田中司真】\n好きな体位はバック", options: ["本当", "嘘"] },
  { id: "q41", type: "tarekomi", title: "タレコミクイズ 40", text: "【西森晄志】\n居酒屋バイトで泣いた", options: ["本当", "嘘"] },
  { id: "q42", type: "tarekomi", title: "タレコミクイズ 41", text: "【一色遊】\nなぜかよく京田辺のあまのじゃくで出くわす", options: ["本当", "嘘"] },
  { id: "q43", type: "tarekomi", title: "タレコミクイズ 42", text: "【今田健登】\nいまけんは69という数字を見て性的というよりも数学的に興奮する", options: ["本当", "嘘"] },
  
  // --- 写真当てクイズ ---
  {
    id: "p1",
    type: "photo",
    title: "子供の頃の写真当てクイズ ①",
    text: "この可愛い写真は、一体誰の幼少期でしょう？",
    imageUrl: "https://placehold.co/600x400/e2e8f0/475569?text=Photo+1",
    options: [], 
  },
  
  // --- イントロクイズ (15問) ---
  { id: "i1", type: "intro", title: "イントロクイズ 1", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i2", type: "intro", title: "イントロクイズ 2", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i3", type: "intro", title: "イントロクイズ 3", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i4", type: "intro", title: "イントロクイズ 4", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i5", type: "intro", title: "イントロクイズ 5", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i6", type: "intro", title: "イントロクイズ 6", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i7", type: "intro", title: "イントロクイズ 7", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i8", type: "intro", title: "イントロクイズ 8", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i9", type: "intro", title: "イントロクイズ 9", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i10", type: "intro", title: "イントロクイズ 10", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i11", type: "intro", title: "イントロクイズ 11", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i12", type: "intro", title: "イントロクイズ 12", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i13", type: "intro", title: "イントロクイズ 13", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i14", type: "intro", title: "イントロクイズ 14", text: "この曲のタイトルは何でしょう？", options: [] },
  { id: "i15", type: "intro", title: "イントロクイズ 15", text: "この曲のタイトルは何でしょう？", options: [] },
];

const PART_COLORS: Record<Part, string> = {
  Top: "bg-pink-500",
  Second: "bg-orange-500",
  Baritone: "bg-green-600",
  Bass: "bg-blue-600",
};

// ==========================================
// 2. 状態管理（Firebase同期エンジン）
// ==========================================

type GameState = {
  status: "waiting" | "question_active" | "buzzed" | "voting_closed" | "result_revealed" | "leaderboard";
  currentQuestionIndex: number;
  correctAnswer: string | null;
  answers: Record<string, string>;
  scores: Record<string, number>;
  buzzerWinner: string | null; // 【追加】早押し勝者
  lockedOut: string[];         // 【追加】お手つきした人
};

const INITIAL_STATE: GameState = {
  status: "waiting",
  currentQuestionIndex: 0,
  correctAnswer: null,
  answers: {},
  scores: {},
  buzzerWinner: null,
  lockedOut: [],
};

function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    const stateRef = ref(db, 'gameState');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setState({
          ...data,
          answers: data.answers || {},
          scores: data.scores || {},
          buzzerWinner: data.buzzerWinner || null,
          lockedOut: data.lockedOut || [],
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const updateState = (updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      const next = updater(prev);
      set(ref(db, 'gameState'), next);
      return next;
    });
  };

  const resetGame = () => {
    set(ref(db, 'gameState'), INITIAL_STATE);
    setState(INITIAL_STATE);
  };

  return { state, updateState, resetGame };
}

// ==========================================
// 3. UIコンポーネント: ロール選択
// ==========================================

export default function GleeCampQuizApp() {
  const [role, setRole] = useState<"screen" | "host" | "participant" | null>(null);

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Glee Camp Quiz 2026
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <button onClick={() => setRole("screen")} className="flex flex-col items-center p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700 hover:border-blue-500 group">
            <Square className="w-16 h-16 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">スクリーン用</h2>
          </button>
          <button onClick={() => setRole("host")} className="flex flex-col items-center p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500 group">
            <Play className="w-16 h-16 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">司会・ホスト用</h2>
          </button>
          <button onClick={() => setRole("participant")} className="flex flex-col items-center p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700 hover:border-green-500 group">
            <Users className="w-16 h-16 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">参加者用 (スマホ)</h2>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {role === "screen" && <ScreenMode />}
      {role === "host" && <HostMode />}
      {role === "participant" && <ParticipantMode />}
    </div>
  );
}

// ==========================================
// 4. UIコンポーネント: 参加者モード (スマホ)
// ==========================================

function ParticipantMode() {
  const { state, updateState } = useGameState();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; part: Part } | null>(null);

  const [selectedPart, setSelectedPart] = useState<Part | "">("");
  const [selectedGrade, setSelectedGrade] = useState<number | "">("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const filteredMembers = useMemo(() => {
    return PRE_REGISTERED_MEMBERS.filter(
      (m) => (selectedPart ? m.part === selectedPart : true) && (selectedGrade ? m.grade === Number(selectedGrade) : true)
    );
  }, [selectedPart, selectedGrade]);

  const handleLogin = () => {
    const member = PRE_REGISTERED_MEMBERS.find((m) => m.id === selectedMemberId);
    if (member) setCurrentUser(member);
  };

  const handleAnswer = (option: string) => {
    if (!currentUser || state.status !== "question_active") return;
    updateState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentUser.id]: option },
    }));
  };

  // 【追加】早押しボタンの処理
  const handleBuzz = () => {
    if (!currentUser || state.status !== "question_active" || state.lockedOut?.includes(currentUser.id)) return;
    updateState((prev) => {
      if (prev.status === "question_active") {
        return { ...prev, status: "buzzed", buzzerWinner: currentUser.id };
      }
      return prev;
    });
  };

  const partScores = useMemo(() => {
    const scores: Record<Part, number> = { Top: 0, Second: 0, Baritone: 0, Bass: 0 };
    Object.entries(state.scores || {}).forEach(([memberId, score]) => {
      const member = PRE_REGISTERED_MEMBERS.find((m) => m.id === memberId);
      if (member) scores[member.part] += score;
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]) as [Part, number][];
  }, [state.scores]);

  const voteStats = useMemo(() => {
    const answers = Object.values(state.answers || {});
    const total = answers.length;
    const trueVotes = answers.filter(a => a === "本当").length;
    const falseVotes = answers.filter(a => a === "嘘").length;
    return {
      total,
      trueVotes,
      falseVotes,
      truePercent: total > 0 ? Math.round((trueVotes / total) * 100) : 0,
      falsePercent: total > 0 ? Math.round((falseVotes / total) * 100) : 0,
    };
  }, [state.answers]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">参加者ログイン</h1>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">パートを選択</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedPart} onChange={(e) => { setSelectedPart(e.target.value as Part); setSelectedMemberId(""); }}>
                <option value="">-- 選択 --</option>
                {PARTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">学年を選択</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedGrade} onChange={(e) => { setSelectedGrade(Number(e.target.value)); setSelectedMemberId(""); }}>
                <option value="">-- 選択 --</option>
                {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g}年</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">名前を選択</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} disabled={!selectedPart || !selectedGrade}>
                <option value="">-- 名前 --</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleLogin} disabled={!selectedMemberId} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50">
              参加する
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = QUESTIONS[state.currentQuestionIndex] || QUESTIONS[0];
  const myAnswer = state.answers?.[currentUser.id];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-12">
      <div className={`${PART_COLORS[currentUser.part]} text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50`}>
        <div className="font-bold text-lg">{currentUser.name}</div>
        <div className="text-sm bg-white/20 px-3 py-1 rounded-full">{currentUser.part}</div>
      </div>

      <div className="flex-1 p-4 flex flex-col max-w-lg mx-auto w-full mt-4">
        {state.status === "waiting" && (
          <div className="text-center text-slate-500 animate-pulse mt-12">
            <Square className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold">ホストの開始を待っています...</p>
          </div>
        )}

        {state.status === "question_active" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center text-slate-800 bg-white p-4 rounded-xl shadow-sm">{currentQ.title}</h2>
            
            {currentQ.type === "intro" ? (
              // 【追加】イントロクイズ用の早押しボタンUI
              <div className="space-y-6 flex flex-col items-center justify-center mt-8">
                <p className="text-center text-sm font-bold text-slate-500">音楽が流れたらボタンを押してください！</p>
                <button
                  onClick={handleBuzz}
                  disabled={state.lockedOut?.includes(currentUser.id)}
                  className={`w-64 h-64 rounded-full text-5xl font-black text-white transition-all transform flex items-center justify-center ${
                    state.lockedOut?.includes(currentUser.id)
                      ? "bg-slate-400 shadow-none scale-95 opacity-50"
                      : "bg-red-600 shadow-[0_15px_0_rgb(153,27,27)] hover:bg-red-500 active:shadow-[0_0px_0_rgb(153,27,27)] active:translate-y-4"
                  }`}
                >
                  {state.lockedOut?.includes(currentUser.id) ? "❌" : "PUSH!"}
                </button>
                {state.lockedOut?.includes(currentUser.id) && (
                  <p className="text-red-500 font-bold mt-4">お手つきにより解答権を失いました</p>
                )}
              </div>
            ) : (
              // タレコミ & 写真 UI
              <>
                {currentQ.type === "tarekomi" && (
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">{currentQ.text}</p>
                  </div>
                )}
                {currentQ.type === "photo" && currentQ.imageUrl && (
                  <img src={currentQ.imageUrl} alt="クイズ画像" className="w-full h-48 object-cover rounded-xl shadow border-2 border-white" />
                )}
                {currentQ.type === "tarekomi" ? (
                  <div className="grid grid-cols-1 gap-4">
                    {currentQ.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className={`p-6 rounded-2xl text-2xl font-bold border-4 transition-all ${
                          myAnswer === opt 
                            ? "bg-indigo-600 text-white border-indigo-600 scale-105" 
                            : "bg-white text-slate-700 border-transparent shadow hover:border-indigo-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-sm font-bold text-slate-500 mb-2">誰の写真か選んでください</p>
                    {PARTS.map(part => {
                      const partMembers = PRE_REGISTERED_MEMBERS
                        .filter(m => m.part === part)
                        .sort((a, b) => b.grade - a.grade);
                        
                      return (
                        <div key={part} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                          <h3 className={`text-xs font-bold mb-2 px-2 py-1 inline-block rounded text-white ${PART_COLORS[part]}`}>
                            {part}
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {partMembers.map(m => (
                              <button
                                key={m.id}
                                onClick={() => handleAnswer(m.name)}
                                className={`p-2 text-sm rounded-lg border-2 text-left flex items-center transition-all ${
                                  myAnswer === m.name 
                                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-md" 
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1.5 ${myAnswer === m.name ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"}`}>{m.grade}年</span>
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 【追加】早押し誰かが押したときのUI */}
        {state.status === "buzzed" && (
          <div className="text-center space-y-4 mt-12">
            {state.buzzerWinner === currentUser.id ? (
              <div className="bg-yellow-100 border-4 border-yellow-400 p-8 rounded-3xl shadow-lg inline-block w-full animate-pulse">
                <h2 className="text-3xl font-black text-red-600">あなたの解答権です！</h2>
                <p className="text-slate-700 mt-4 font-bold">大きな声で答えてください！</p>
              </div>
            ) : (
              <div className="bg-slate-200 p-8 rounded-3xl shadow-inner inline-block w-full">
                <h2 className="text-2xl font-bold text-slate-600">
                  {PRE_REGISTERED_MEMBERS.find(m => m.id === state.buzzerWinner)?.name} さんが解答中...
                </h2>
              </div>
            )}
          </div>
        )}

        {state.status === "voting_closed" && (
          <div className="text-center space-y-4 mt-12">
            <div className="bg-white p-8 rounded-3xl shadow-lg inline-block w-full">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">投票完了！</h2>
              {currentQ.type !== "intro" && (
                <p className="text-slate-500 mt-2">
                  あなたの回答: <span className="font-bold text-indigo-600">{myAnswer || "未回答"}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {state.status === "result_revealed" && (
          <div className="text-center space-y-4 mt-12">
            {currentQ.type === "intro" ? (
              <div className="p-8 rounded-3xl shadow-lg inline-block w-full bg-blue-50 border-2 border-blue-300">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-black text-blue-700">正解発表！</h2>
                <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="text-sm text-slate-500">正解の曲は</p>
                  <p className="text-xl font-bold text-slate-800">{state.correctAnswer}</p>
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-3xl shadow-lg inline-block w-full ${myAnswer === state.correctAnswer ? "bg-green-100 border-2 border-green-400" : "bg-red-50 border-2 border-red-300"}`}>
                {myAnswer === state.correctAnswer ? (
                  <>
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black text-green-700">正解！</h2>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-red-600">残念...</h2>
                  </>
                )}
                <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="text-sm text-slate-500">正解は</p>
                  <p className="text-xl font-bold text-slate-800">{state.correctAnswer}</p>
                </div>
                {currentQ.type === "tarekomi" && (
                  <div className="mt-6 pt-6 border-t border-black/10">
                    <p className="text-sm text-slate-500 font-bold mb-3 flex items-center justify-center gap-1">
                      <PieChart className="w-4 h-4" /> みんなの予想
                    </p>
                    <div className="flex gap-3 text-sm font-bold">
                      <div className={`flex-1 p-3 rounded-xl border ${voteStats.trueVotes > voteStats.falseVotes ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        <span className="text-slate-500 block text-xs">本当</span>
                        <span className="text-indigo-600 text-2xl">{voteStats.truePercent}%</span>
                        <span className="text-slate-400 text-xs ml-1">({voteStats.trueVotes}人)</span>
                      </div>
                      <div className={`flex-1 p-3 rounded-xl border ${voteStats.falseVotes > voteStats.trueVotes ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200'}`}>
                        <span className="text-slate-500 block text-xs">嘘</span>
                        <span className="text-pink-600 text-2xl">{voteStats.falsePercent}%</span>
                        <span className="text-slate-400 text-xs ml-1">({voteStats.falseVotes}人)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {state.status === "leaderboard" && (
          <div className="w-full space-y-6 mt-4">
            <div className="text-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-slate-800 mb-4">🏆 パート対抗 ランキング</h2>
              <div className="space-y-2">
                {partScores.map(([part, score], i) => (
                  <div key={part} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-slate-400 text-sm">{i+1}位</span> {part}
                    </span>
                    <span className="text-lg font-black text-indigo-600">{score}pt</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${PART_COLORS[currentUser.part]}`} />
                {currentUser.part} パート内 個人成績
              </h2>
              <div className="space-y-1">
                {PRE_REGISTERED_MEMBERS
                  .filter(m => m.part === currentUser.part)
                  .map(m => ({ ...m, score: state.scores[m.id] || 0 }))
                  .sort((a, b) => b.score - a.score)
                  .map((m, i) => (
                    <div key={m.id} className={`flex justify-between items-center p-3 rounded-lg ${m.id === currentUser.id ? "bg-indigo-50 border border-indigo-200" : "border-b border-slate-50"}`}>
                      <span className="font-medium text-slate-700 flex items-center gap-2">
                        <span className="text-slate-400 text-sm w-4">{i+1}.</span> 
                        {m.name} {m.id === currentUser.id && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full ml-1">You</span>}
                      </span>
                      <span className="font-bold text-slate-800">{m.score}pt</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. UIコンポーネント: ホストモード (PC/タブレット推奨)
// ==========================================

function HostMode() {
  const { state, updateState, resetGame } = useGameState();
  const [photoAnswerInput, setPhotoAnswerInput] = useState(""); // 写真当て＆イントロの正解曲名入力用
  
  const currentQ = QUESTIONS[state.currentQuestionIndex] || QUESTIONS[0];
  const totalAnswers = Object.keys(state.answers || {}).length;

  const nextQuestion = () => {
    updateState((prev) => ({ ...prev, status: "waiting", currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, QUESTIONS.length - 1), correctAnswer: null, answers: {}, buzzerWinner: null, lockedOut: [] }));
  };

  const startVoting = () => updateState((prev) => ({ ...prev, status: "question_active", answers: {}, correctAnswer: null, buzzerWinner: null, lockedOut: [] }));
  const closeVoting = () => updateState((prev) => ({ ...prev, status: "voting_closed" }));
  const showLeaderboard = () => updateState((prev) => ({ ...prev, status: "leaderboard" }));

  // 【追加】セクションジャンプ機能
  const jumpTo = (idx: number) => {
    if (idx !== -1) {
      updateState(prev => ({
        ...prev, currentQuestionIndex: idx, status: "waiting", answers: {}, correctAnswer: null, buzzerWinner: null, lockedOut: []
      }));
    }
  };

  // イントロクイズ用の正解判定
  const revealIntroResult = (isCorrect: boolean) => {
    updateState((prev) => {
      if (isCorrect && prev.buzzerWinner) {
        const newScores = { ...prev.scores };
        newScores[prev.buzzerWinner] = (newScores[prev.buzzerWinner] || 0) + 10;
        return { ...prev, status: "result_revealed", correctAnswer: "正解！", scores: newScores };
      } else {
        const newLockedOut = [...(prev.lockedOut || []), prev.buzzerWinner as string];
        return { ...prev, status: "question_active", buzzerWinner: null, lockedOut: newLockedOut };
      }
    });
  };

  const revealResult = (correctAnswer: string) => {
    updateState((prev) => {
      const newScores = { ...prev.scores };
      Object.entries(prev.answers || {}).forEach(([memberId, ans]) => {
        if (ans === correctAnswer) newScores[memberId] = (newScores[memberId] || 0) + 10;
      });
      return { ...prev, status: "result_revealed", correctAnswer, scores: newScores };
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2"><Play className="w-6 h-6" /> ホストコントロールパネル</h1>
          <button onClick={resetGame} className="text-sm text-red-400 hover:text-red-300">全データリセット</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-bold text-sm">問題 ( {state.currentQuestionIndex + 1} / {QUESTIONS.length} )</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${state.status === "question_active" ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-300"}`}>
                  Status: {state.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{currentQ.title}</h2>
              <p className="text-slate-300 whitespace-pre-wrap bg-slate-900 p-4 rounded-xl">{currentQ.text}</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4">アクション</h3>
              <div className="flex flex-wrap gap-4">
                {state.status === "waiting" && (
                  <button onClick={startVoting} className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg">出題 ＆ 投票スタート</button>
                )}
                
                {state.status === "question_active" && currentQ.type !== "intro" && (
                  <button onClick={closeVoting} className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg">投票を締め切る</button>
                )}

                {/* 【追加】イントロクイズ用のホストUI */}
                {state.status === "question_active" && currentQ.type === "intro" && (
                  <div className="w-full flex gap-4">
                    <div className="flex-1 py-4 bg-blue-900/50 rounded-xl font-bold text-lg text-center text-blue-300 border border-blue-500/30">
                      早押し待機中...
                    </div>
                    <button onClick={() => updateState(prev => ({...prev, status: "voting_closed"}))} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm">
                      誰も分からない (正解発表へ)
                    </button>
                  </div>
                )}

                {state.status === "buzzed" && (
                  <div className="w-full bg-yellow-900/30 p-6 rounded-xl border-2 border-yellow-500">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      🎤 解答者: {PRE_REGISTERED_MEMBERS.find(m => m.id === state.buzzerWinner)?.name}
                    </h3>
                    <div className="flex gap-4">
                      <button onClick={() => revealIntroResult(true)} className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg">正解！ (+10pt)</button>
                      <button onClick={() => revealIntroResult(false)} className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg">不正解 (解答権復活)</button>
                    </div>
                  </div>
                )}

                {state.status === "voting_closed" && (
                  <div className="w-full bg-blue-900/30 p-4 rounded-xl border border-blue-500/30">
                    <p className="text-blue-300 text-sm mb-3">🎤 正しい回答を選択して確定させてください</p>
                    
                    {currentQ.type === "tarekomi" && (
                      <div className="flex gap-4">
                        {currentQ.options.map(opt => (
                          <button key={opt} onClick={() => revealResult(opt)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">
                            正解：{opt}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {currentQ.type === "photo" && (
                      <div className="flex gap-3">
                        <select 
                          className="flex-1 p-3 rounded-lg bg-slate-800 border border-slate-600 text-white outline-none"
                          value={photoAnswerInput}
                          onChange={(e) => setPhotoAnswerInput(e.target.value)}
                        >
                          <option value="">-- 正解のメンバーを選択 --</option>
                          {PRE_REGISTERED_MEMBERS.map(m => (
                            <option key={m.id} value={m.name}>{m.part} {m.grade}年: {m.name}</option>
                          ))}
                        </select>
                        <button 
                          disabled={!photoAnswerInput}
                          onClick={() => revealResult(photoAnswerInput)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold disabled:opacity-50"
                        >
                          正解を確定
                        </button>
                      </div>
                    )}

                    {currentQ.type === "intro" && (
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="正解の曲名を入力（スクリーンに出ます）"
                          className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600 text-white outline-none"
                          value={photoAnswerInput}
                          onChange={(e) => setPhotoAnswerInput(e.target.value)}
                        />
                        <button 
                          disabled={!photoAnswerInput}
                          onClick={() => updateState(prev => ({...prev, status: "result_revealed", correctAnswer: photoAnswerInput}))}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold disabled:opacity-50"
                        >
                          正解をスクリーンに表示
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {state.status === "result_revealed" && (
                  <>
                    <button onClick={showLeaderboard} className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold text-lg">ランキング表示</button>
                    {state.currentQuestionIndex < QUESTIONS.length - 1 && (
                      <button onClick={nextQuestion} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                        次の問題へ <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}

                {state.status === "leaderboard" && (
                  <div className="w-full flex gap-4">
                    {state.currentQuestionIndex < QUESTIONS.length - 1 ? (
                      <button onClick={nextQuestion} className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                        次の問題へ進む <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="flex-1 py-4 bg-slate-700 text-slate-300 rounded-xl font-bold text-lg flex items-center justify-center">
                        すべての問題が終了しました！お疲れ様でした🎉
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 【追加】時間調整用セクションジャンプボタン */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-300 flex items-center gap-2">
                <FastForward className="w-5 h-5" /> 時間調整スキップ
              </h3>
              <p className="text-xs text-slate-400 mb-3">※進行が押した時に、次の企画へ強制移動します</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => jumpTo(QUESTIONS.findIndex(q => q.type === "tarekomi"))} className="py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm">
                  1. タレコミクイズの最初へ
                </button>
                <button onClick={() => jumpTo(QUESTIONS.findIndex(q => q.type === "photo"))} className="py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm">
                  2. 子供の写真当ての最初へ
                </button>
                <button onClick={() => jumpTo(QUESTIONS.findIndex(q => q.type === "intro"))} className="py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm">
                  3. イントロクイズの最初へ
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-300">投票状況</h3>
              <div className="text-5xl font-black text-center text-white mb-2">
                {totalAnswers} <span className="text-lg text-slate-400 font-normal">人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. UIコンポーネント: スクリーンモード (プロジェクター用)
// ==========================================

function ScreenMode() {
  const { state } = useGameState();
  const currentQ = QUESTIONS[state.currentQuestionIndex] || QUESTIONS[0];

  const partScores = useMemo(() => {
    const scores: Record<Part, number> = { Top: 0, Second: 0, Baritone: 0, Bass: 0 };
    Object.entries(state.scores || {}).forEach(([memberId, score]) => {
      const member = PRE_REGISTERED_MEMBERS.find((m) => m.id === memberId);
      if (member) scores[member.part] += score;
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]) as [Part, number][];
  }, [state.scores]);

  return (
    <div className="h-screen w-full bg-slate-900 text-white overflow-hidden flex flex-col items-center justify-center relative font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-6xl px-8 flex flex-col items-center">
        {state.status === "waiting" && (
          <div className="text-center animate-pulse">
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Glee Camp Quiz
            </h1>
            <p className="text-3xl text-slate-400">スマホからログインして待機してください...</p>
          </div>
        )}

        {(state.status === "question_active" || state.status === "voting_closed" || state.status === "result_revealed") && (
          <div className="w-full">
            <div className="text-center mb-12">
              <span className="px-6 py-2 bg-blue-600/30 text-blue-300 rounded-full text-xl font-bold tracking-widest uppercase border border-blue-500/30">
                Question {state.currentQuestionIndex + 1}
              </span>
              <h1 className="text-5xl md:text-6xl font-bold mt-8 mb-6 leading-tight">{currentQ.title}</h1>
              <p className="text-3xl text-slate-300 whitespace-pre-wrap bg-slate-800/50 p-8 rounded-3xl border border-slate-700 inline-block text-left min-w-[60%]">
                {currentQ.text}
              </p>
            </div>

            {/* 【追加】イントロクイズ用スクリーンUI */}
            {state.status === "question_active" && currentQ.type === "intro" && (
              <div className="text-6xl font-black text-center text-blue-400 animate-pulse mt-16 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]">
                🎵 音楽スタート！ 早押しボタンを押してください 🎵
              </div>
            )}

            {currentQ.type === "photo" && currentQ.imageUrl && (
              <div className="flex justify-center mb-12">
                <img src={currentQ.imageUrl} alt="クイズ画像" className="max-h-[300px] rounded-2xl shadow-2xl border-4 border-slate-700" />
              </div>
            )}

            {currentQ.type === "tarekomi" && (
              <div className="flex flex-wrap justify-center gap-6 mt-12">
                {currentQ.options.map((opt) => {
                  const isCorrect = state.status === "result_revealed" && state.correctAnswer === opt;
                  const isWrong = state.status === "result_revealed" && state.correctAnswer !== opt;
                  return (
                    <div key={opt} className={`px-10 py-6 rounded-2xl text-4xl font-bold transition-all duration-500 ${state.status === "question_active" ? "bg-slate-800 border-2 border-slate-600 shadow-xl" : ""} ${state.status === "voting_closed" ? "bg-slate-800 border-2 border-slate-600 opacity-50" : ""} ${isCorrect ? "bg-green-500 text-white scale-110 shadow-[0_0_50px_rgba(34,197,94,0.5)] border-4 border-green-300" : ""} ${isWrong ? "bg-slate-800 opacity-20 scale-95" : ""}`}>
                      {opt}
                    </div>
                  );
                })}
              </div>
            )}

            {(currentQ.type === "photo" || currentQ.type === "intro") && state.status === "result_revealed" && (
               <div className="flex flex-col items-center mt-12 animate-bounce">
                 <p className="text-2xl text-yellow-400 font-bold mb-2">正解は...</p>
                 <div className="px-12 py-6 bg-green-500 text-white rounded-3xl text-5xl font-black shadow-[0_0_50px_rgba(34,197,94,0.5)] border-4 border-green-300">
                   {state.correctAnswer}
                 </div>
               </div>
            )}

            <div className="absolute bottom-12 left-0 w-full flex justify-center">
              {state.status === "question_active" && currentQ.type !== "intro" && (
                <div className="bg-blue-600 px-8 py-4 rounded-full text-2xl font-bold animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                  回答受付中... ( 現在 {Object.keys(state.answers || {}).length} 人 )
                </div>
              )}
              {state.status === "voting_closed" && (
                <div className="bg-red-600 px-8 py-4 rounded-full text-2xl font-bold shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                  投票終了！ 本人に聞いてみましょう...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 【追加】早押しに誰かが反応したときのド派手な演出 */}
        {state.status === "buzzed" && (
          <div className="flex flex-col items-center justify-center mt-16 animate-bounce w-full">
            <p className="text-3xl text-yellow-400 font-bold mb-4 drop-shadow-lg">解答権獲得！</p>
            <div className="px-16 py-8 bg-red-600 text-white rounded-[50px] text-7xl font-black shadow-[0_0_80px_rgba(220,38,38,0.8)] border-8 border-yellow-400">
              {PRE_REGISTERED_MEMBERS.find(m => m.id === state.buzzerWinner)?.part} : {PRE_REGISTERED_MEMBERS.find(m => m.id === state.buzzerWinner)?.name}
            </div>
          </div>
        )}

        {state.status === "leaderboard" && (
          <div className="w-full max-w-4xl">
            <h1 className="text-5xl font-black text-center mb-12 flex items-center justify-center gap-4 text-yellow-400">
              <Trophy className="w-16 h-16" /> パート別 ランキング <Trophy className="w-16 h-16" />
            </h1>
            <div className="space-y-6">
              {partScores.map(([part, score], index) => (
                <div key={part} className={`flex items-center justify-between p-6 rounded-2xl bg-slate-800 border-l-8 ${PART_COLORS[part].replace('bg-', 'border-')} transform transition-all duration-700 hover:scale-105`} style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black text-slate-500 w-12 text-center">{index + 1}</span>
                    <span className="text-4xl font-bold">{part}</span>
                  </div>
                  <div className="text-5xl font-black text-white bg-slate-900 px-6 py-3 rounded-xl">
                    {score} <span className="text-2xl text-slate-400">pt</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 mt-12 text-xl animate-pulse">個人の成績は手元のスマホをチェック！</p>
          </div>
        )}
      </div>
    </div>
  );
}