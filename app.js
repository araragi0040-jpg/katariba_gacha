// ======================================
// ニュースサイト連動設定
// ======================================

const NEWS_API_URL = "https://script.google.com/macros/s/AKfycbzyL-rkQTcM_GijeBRHFZT3vfsv58xkQIZFAI6PPPC8IFQ50OB62DJrriiWjOLMyZAE/exec";

const gachaParams = new URLSearchParams(window.location.search);
const gachaTicket = gachaParams.get("ticket");

let latestNewsPoints = null;
let isDrawingGacha = false;

// ======================================
// 共通API呼び出し
// ======================================

async function callNewsApiFromGacha(action, payload = {}) {
  const res = await fetch(NEWS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  });

  const text = await res.text();
  console.log("GACHA API RESPONSE:", action, text);

  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("API response parse error:", err, text);
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      message: "APIの返答を読み取れませんでした。"
    };
  }
}

// ======================================
// pt表示
// ======================================

function findPointElement() {
  return (
    document.getElementById("newsPoints") ||
    document.getElementById("gachaPoints") ||
    document.getElementById("pointCount")
  );
}

function renderNewsPoints(pointsValue) {
  const points = Number(pointsValue || 0);
  const safePoints = Number.isFinite(points) && points >= 0 ? Math.floor(points) : 0;

  latestNewsPoints = safePoints;

  const el = findPointElement();

  if (!el) {
    console.warn("pt表示用の要素が見つかりません。id='newsPoints' をHTMLに追加してください。");
    return;
  }

  el.textContent = `${safePoints}pt`;
}

async function loadNewsPointsForGacha() {
  if (!gachaTicket) {
    console.warn("ticket がありません。ニュースサイトから入り直してください。");
    renderNewsPoints(0);
    return;
  }

  const data = await callNewsApiFromGacha("getGachaStatus", {
    ticket: gachaTicket
  });

  if (!data.ok) {
    console.warn("getGachaStatus failed:", data);

    const el = findPointElement();
    if (el) el.textContent = "--pt";

    return;
  }

  renderNewsPoints(data.remainingPoints ?? data.points ?? 0);
}

// ======================================
// pt消費
// ======================================

async function consumePointBeforeGacha() {
  if (!gachaTicket) {
    alert("ニュースサイトから入り直してください。");
    return {
      ok: false
    };
  }

  const data = await callNewsApiFromGacha("useGachaPoint", {
    ticket: gachaTicket
  });

  if (!data.ok) {
    console.warn("useGachaPoint failed:", data);

    if (data.code === "NOT_ENOUGH_POINTS") {
      renderNewsPoints(data.remainingPoints ?? data.remainingPt ?? data.points ?? 0);
      alert("ptが不足しています。ニュースサイトでptを貯めてから引いてください。");
    } else if (data.code === "TICKET_EXPIRED") {
      alert("接続時間が切れました。ニュースサイトから入り直してください。");
    } else if (data.code === "INVALID_TICKET") {
      alert("ガチャチケットが無効です。ニュースサイトから入り直してください。");
    } else {
      alert(data.message || "ガチャを引けませんでした。");
    }

    return {
      ok: false
    };
  }

  renderNewsPoints(data.remainingPoints ?? data.remainingPt ?? data.points ?? 0);

  return {
    ok: true,
    ...data
  };
}

// ======================================
// 既存のローカルガチャ処理を呼ぶ
// ======================================

function runLocalGachaAfterPointConsumed() {
  /*
    ここが既存のローカルガチャ処理との接続部分です。

    既存のガチャ関数名が分かっている場合は、
    下の候補のどれかに合わせるか、
    最後の fallbackDrawGacha() を既存処理に置き換えてください。
  */

  if (typeof window.drawGacha === "function") {
    window.drawGacha();
    return;
  }

  if (typeof window.startGacha === "function") {
    window.startGacha();
    return;
  }

  if (typeof window.runGacha === "function") {
    window.runGacha();
    return;
  }

  if (typeof window.handleDraw === "function") {
    window.handleDraw();
    return;
  }

  // 既存関数が見つからない場合の簡易フォールバック
  fallbackDrawGacha();
}

// ======================================
// 簡易フォールバックガチャ
// 既存ガチャ処理がある場合は使われません
// ======================================

function fallbackDrawGacha() {
  const results = [
    {
      id: "talk_001",
      name: "今日のひとことガチャ",
      rarity: "N",
      text: "最近ちょっと嬉しかったことは？"
    },
    {
      id: "talk_002",
      name: "深掘りトークガチャ",
      rarity: "R",
      text: "今の自分に一番必要な言葉は？"
    },
    {
      id: "talk_003",
      name: "本音トークガチャ",
      rarity: "SR",
      text: "本当は誰に何を伝えたい？"
    }
  ];

  const result = results[Math.floor(Math.random() * results.length)];

  saveGachaHistory(result);
  renderFallbackResult(result);
}

function saveGachaHistory(result) {
  const key = "katariba_gacha_history";
  const current = JSON.parse(localStorage.getItem(key) || "[]");

  current.unshift({
    ...result,
    drawnAt: new Date().toISOString()
  });

  localStorage.setItem(key, JSON.stringify(current));
}

function renderFallbackResult(result) {
  const resultEl =
    document.getElementById("gachaResult") ||
    document.getElementById("result") ||
    document.getElementById("resultBox");

  if (!resultEl) {
    alert(`${result.rarity}：${result.name}\n${result.text}`);
    return;
  }

  resultEl.innerHTML = `
    <div class="gacha-result-card">
      <div class="gacha-result-rarity">${escapeHtmlForGacha(result.rarity)}</div>
      <div class="gacha-result-name">${escapeHtmlForGacha(result.name)}</div>
      <div class="gacha-result-text">${escapeHtmlForGacha(result.text)}</div>
    </div>
  `;
}

function escapeHtmlForGacha(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ======================================
// ガチャボタン処理
// ======================================

function findGachaButton() {
  return (
    document.getElementById("gachaButton") ||
    document.getElementById("drawButton") ||
    document.getElementById("btnGacha") ||
    document.getElementById("btnDraw") ||
    document.querySelector("[data-gacha-button]")
  );
}

async function handleGachaButtonClick(e) {
  if (e) e.preventDefault();

  if (isDrawingGacha) return;

  const btn = findGachaButton();
  const oldText = btn ? btn.textContent : "";

  try {
    isDrawingGacha = true;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "pt確認中...";
    }

    const pointResult = await consumePointBeforeGacha();

    if (!pointResult.ok) {
      return;
    }

    if (btn) {
      btn.textContent = "抽選中...";
    }

    runLocalGachaAfterPointConsumed();

  } catch (err) {
    console.error("ガチャ処理中のエラー:", err);
    alert("ガチャ処理中にエラーが発生しました。");

  } finally {
    isDrawingGacha = false;

    if (btn) {
      btn.disabled = false;
      btn.textContent = oldText || "ガチャを引く";
    }
  }
}

// ======================================
// 初期化
// ======================================

function initGachaNewsIntegration() {
  loadNewsPointsForGacha().catch(err => {
    console.error("pt表示の取得に失敗しました:", err);
  });

  const btn = findGachaButton();

  if (!btn) {
    console.warn("ガチャボタンが見つかりません。id='gachaButton' をHTMLに追加してください。");
    return;
  }

  btn.addEventListener("click", handleGachaButtonClick);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGachaNewsIntegration);
} else {
  initGachaNewsIntegration();
}
