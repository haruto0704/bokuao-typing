// メンバーの表示名・読み・画像ファイル名はここで編集できます。
// 画像は assets フォルダに置いてください。ファイル名は「表示名.jpg」形式です。
// 読み・ローマ字はゲーム用の仮設定を含むため、必要に応じて調整してください。
const members = [
  { name: "伊藤 ゆず", roman: "ITO YUZU", image: "伊藤ゆず.jpg" },
  { name: "塩釜 菜那", roman: "SIOGAMA NANA", image: "塩釜菜那.jpg" },
  { name: "長谷川 稀未", roman: "HASEGAWA HITOMI", image: "長谷川稀未.jpg" },
  { name: "青木 宙帆", roman: "AOKI YUHO", image: "青木宙帆.jpg" },
  { name: "西森 杏弥", roman: "NISIMORI AYA", image: "西森杏弥.jpg" },
  { name: "持永 真奈", roman: "MOTINAGA MANA", image: "持永真奈.jpg" },
  { name: "山口 結杏", roman: "YAMAGUTI YUAN", image: "山口結杏.jpg" },
  { name: "宮腰 友里亜", roman: "MIYAKOSI YURIA", image: "宮腰友里亜.jpg" },
  { name: "早﨑 すずき", roman: "HAYASAKI SUZUKI", image: "早﨑すずき.jpg" },
  { name: "須永 心海", roman: "SUNAGA MIUNA", image: "須永心海.jpg" },
  { name: "柳堀 花怜", roman: "YANAGIHORI KAREN", image: "柳堀花怜.jpg" },
  { name: "今井 優希", roman: "IMAI YUKI", image: "今井優希.jpg" },
  { name: "吉本 此那", roman: "YOSIMOTO KOKONA", image: "吉本此那.jpg" },
  { name: "萩原 心花", roman: "HAGIWARA KOKOKA", image: "萩原心花.jpg" },
  { name: "安納 蒼衣", roman: "ANNO AOI", image: "安納蒼衣.jpg" },
  { name: "金澤 亜美", roman: "KANAZAWA AMI", image: "金澤亜美.jpg" },
  { name: "八木 仁愛", roman: "YAGI TOA", image: "八木仁愛.jpg" },
  { name: "秋田 莉杏", roman: "AKITA RIAN", image: "秋田莉杏.jpg" },
  { name: "岩本 理瑚", roman: "IWAMOTO RIKO", image: "岩本理瑚.jpg" },
  { name: "杉浦 英恋", roman: "SUGIURA EREN", image: "杉浦英恋.jpg" },
  { name: "工藤 唯愛", roman: "KUDO YUA", image: "工藤唯愛.jpg" },
  { name: "木下 藍", roman: "KINOSITA AI", image: "木下藍.jpg" },
  { name: "八重樫 美伊咲", roman: "YAEGASI MIISA", image: "八重樫美伊咲.jpg" }
];

const $ = (id) => document.getElementById(id);
const startScreen = $("start-screen"), gameScreen = $("game-screen"), resultScreen = $("result-screen");
let remaining = 60, score = 0, correct = 0, mistakes = 0, combo = 0, maxCombo = 0;
let timerId = null, active = false, current = null, queue = [], queueIndex = 0, lastMemberName = "";
let lastMistakeAt = 0, totalTypedChars = 0, startedAt = 0;

function shuffledMembers() {
  const arr = [...members];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // シャッフル後、同じメンバーが連続した場合は隣と交換
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].name === arr[i - 1].name) {
      const j = (i + 1) % arr.length;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}
function nextFromQueue() {
  if (queueIndex >= queue.length) {
    queue = shuffledMembers();
    if (queue[0]?.name === lastMemberName && queue.length > 1) [queue[0], queue[1]] = [queue[1], queue[0]];
    queueIndex = 0;
  }
  current = queue[queueIndex++];
  lastMemberName = current.name;
  $("member-name").textContent = current.name;
  $("roman-hint").textContent = current.roman;
  $("member-photo").src = "assets/" + encodeURIComponent(current.image);
  $("member-photo").alt = current.name;
  $("member-photo").style.display = "block";
  $("photo-fallback").style.display = "none";
  $("typing-input").value = "";
  $("input-wrap").classList.remove("good", "bad");
  $("input-status").textContent = "入力してね";
  $("progress-bar").style.width = "0%";
  $("feedback").textContent = "正確に入力しよう！";
}
function updateStats() {
  $("time").textContent = remaining;
  $("score").textContent = score;
  $("correct").textContent = correct;
  $("mistakes").textContent = mistakes;
  $("accuracy").textContent = totalTypedChars ? Math.round(Math.max(0, 1 - mistakes / totalTypedChars) * 100) : 100;
  $("combo").textContent = combo + " COMBO";
  $("max-combo").textContent = maxCombo;
  $("wpm").textContent = Math.round(correct * 60 / Math.max(1, 60 - remaining));
  $("time-bar").style.width = (remaining / 60 * 100) + "%";
}
function startGame() {
  clearInterval(timerId);
  remaining = 60; score = 0; correct = 0; mistakes = 0; combo = 0; maxCombo = 0;
  totalTypedChars = 0; lastMistakeAt = 0; lastMemberName = ""; queue = shuffledMembers(); queueIndex = 0; active = true;
  startScreen.classList.add("hidden"); resultScreen.classList.add("hidden"); gameScreen.classList.remove("hidden");
  startedAt = Date.now();
  nextFromQueue(); updateStats();
  $("typing-input").disabled = false;
  $("typing-input").focus();
  timerId = setInterval(() => {
    if (!active) return;
    remaining = Math.max(0, 60 - Math.floor((Date.now() - startedAt) / 1000));
    updateStats();
    if (remaining <= 0) finishGame();
  }, 100);
}
function handleInput() {
  if (!active || !current) return;
  const input = $("typing-input");
  const value = input.value.toUpperCase().replace(/\s+/g, " ").trimStart();
  const target = current.roman.toUpperCase();
  totalTypedChars++;
  if (target.startsWith(value.trim())) {
    $("input-wrap").classList.remove("bad");
    $("input-status").textContent = value.trim() ? "いい感じ！" : "入力してね";
    $("progress-bar").style.width = Math.min(100, value.trim().length / target.length * 100) + "%";
    if (value.trim() === target) {
      correct++; combo++; maxCombo = Math.max(maxCombo, combo);
      score += 100 + Math.min(combo - 1, 20) * 10;
      $("input-wrap").classList.add("good");
      $("feedback").textContent = "正解！ナイス入力 ✨";
      updateStats();
      // 次の問題へ進む前に短い視覚フィードバック
      setTimeout(() => { if (active) { nextFromQueue(); $("typing-input").focus(); } }, 120);
    }
  } else {
    mistakes++; combo = 0; score = Math.max(0, score - 5);
    $("input-wrap").classList.remove("good"); $("input-wrap").classList.add("bad");
    $("input-status").textContent = "もう一度！";
    $("feedback").textContent = "おしい！落ち着いて入力しよう";
    updateStats();
  }
}
function finishGame() {
  if (!active) return;
  active = false; clearInterval(timerId); timerId = null;
  $("typing-input").disabled = true;
  const attempts = correct + mistakes;
  const accuracy = attempts ? Math.round(correct / attempts * 100) : 100;
  const wpm = Math.round(correct * 60 / Math.max(1, 60 - remaining));
  const rank = score >= 1800 ? "S" : score >= 1200 ? "A" : score >= 700 ? "B" : "C";
  $("final-score").textContent = score;
  $("final-correct").textContent = correct;
  $("final-mistakes").textContent = mistakes;
  $("final-accuracy").textContent = accuracy + "%";
  $("final-combo").textContent = maxCombo;
  $("final-wpm").textContent = wpm + " WPM";
  $("rank").textContent = rank;
  gameScreen.classList.add("hidden"); resultScreen.classList.remove("hidden");
}
$("start-button").addEventListener("click", startGame);
$("restart-button").addEventListener("click", startGame);
$("quit-button").addEventListener("click", finishGame);
$("typing-input").addEventListener("input", handleInput);
$("typing-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") event.preventDefault();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active) $("typing-input").blur();
});
