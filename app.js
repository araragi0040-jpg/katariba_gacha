const NEWS_API_URL = "https://script.google.com/macros/s/AKfycbw7YwgTW-iau9Ep6tkJYeyMfuS3QugXueWF292eFDECxv_3VDphY837DLTxxkZIkfoSxg/exec";

const gachaParams = new URLSearchParams(window.location.search);
const gachaTicket = gachaParams.get("ticket");

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

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("API response is not JSON:", text);
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      message: "APIの返答を読み取れませんでした。"
    };
  }

  return data;
}

function renderNewsPoints(pointsValue) {
  const points = Number(pointsValue || 0);
  const safePoints = Number.isFinite(points) && points >= 0 ? Math.floor(points) : 0;

  const el =
    document.getElementById("newsPoints") ||
    document.getElementById("gachaPoints") ||
    document.getElementById("pointCount");

  if (el) {
    el.textContent = `${safePoints}pt`;
  }
}

async function loadNewsPointsForGacha() {
  if (!gachaTicket) {
    renderNewsPoints(0);
    return;
  }

  const data = await callNewsApiFromGacha("getGachaStatus", {
    ticket: gachaTicket
  });

  if (!data.ok) {
    console.warn("getGachaStatus failed:", data);
    return;
  }

  renderNewsPoints(data.remainingPoints ?? data.points ?? 0);
}

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
      renderNewsPoints(data.remainingPoints ?? 0);
      alert("ptが不足しています。ニュースサイトでptを貯めてから引いてください。");
    } else if (data.code === "TICKET_EXPIRED") {
      alert("接続時間が切れました。ニュースサイトから入り直してください。");
    } else {
      alert(data.message || "ガチャを引けませんでした。");
    }

    return {
      ok: false
    };
  }

  renderNewsPoints(data.remainingPoints ?? data.remainingPt ?? data.points ?? 0);
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  loadNewsPointsForGacha().catch(console.error);
});

const NEWS_API_URL = "https://script.google.com/macros/s/AKfycbw7YwgTW-iau9Ep6tkJYeyMfuS3QugXueWF292eFDECxv_3VDphY837DLTxxkZIkfoSxg/exec";

const gachaTicket = new URLSearchParams(window.location.search).get("ticket");

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

function renderNewsPoints(pointsValue) {
  const points = Number(pointsValue || 0);
  const safePoints = Number.isFinite(points) && points >= 0 ? Math.floor(points) : 0;

  const el = document.getElementById("newsPoints");
  if (!el) {
    console.warn("#newsPoints が見つかりません。");
    return;
  }

  el.textContent = `${safePoints}pt`;
}

async function loadNewsPointsForGacha() {
  if (!gachaTicket) {
    console.warn("ticket がありません。ニュースサイトから入り直してください。");
    return;
  }

  const data = await callNewsApiFromGacha("getGachaStatus", {
    ticket: gachaTicket
  });

  if (!data.ok) {
    console.warn("getGachaStatus failed:", data);
    return;
  }

  renderNewsPoints(data.remainingPoints ?? data.points ?? 0);
}

function initGachaPointView() {
  loadNewsPointsForGacha().catch(err => {
    console.error("pt表示の取得に失敗しました:", err);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGachaPointView);
} else {
  initGachaPointView();
}
