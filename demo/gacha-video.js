(function(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.createGachaVideoPlayer = api.createGachaVideoPlayer;
    root.preloadGachaImages = api.preloadGachaImages;
  }
})(globalThis, function(root) {
  "use strict";
  const DEFAULT_VIDEO_SOURCES = {
    single: "./videos/katariba_gacha_1pull_v003.mp4",
    multi: "./videos/katariba_gacha_10pull_v001.mp4"
  };

  function createGachaVideoPlayer(options = {}) {
    const doc = options.document || root.document;
    const sources = { ...DEFAULT_VIDEO_SOURCES, ...options.sources };
    const schedule = options.setTimeout || root.setTimeout;
    const cancel = options.clearTimeout || root.clearTimeout;
    let active = null;

    function prepare(kind, title) {
      if (active) active.finish();
      const element = (tag, className, text) => {
        const node = doc.createElement(tag);
        node.className = className;
        if (text) node.textContent = text;
        return node;
      };
      const previousFocus = doc.activeElement;
      const overlay = element("div", "gacha-cinematic-overlay");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "gacha-cinematic-heading");
      const panel = element("div", "gacha-cinematic");
      const toolbar = element("div", "gacha-cinematic-toolbar");
      const heading = element("div", "gacha-cinematic-heading", title || "ガチャ抽選中");
      heading.id = "gacha-cinematic-heading";
      const skip = element("button", "gacha-cinematic-skip", "スキップ →");
      skip.type = "button";
      skip.hidden = true;
      const media = element("div", "gacha-cinematic-media");
      media.hidden = true;
      const video = element("video", "gacha-cinematic-video");
      video.src = sources[kind] || sources.single;
      video.preload = "auto";
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", "ガチャ演出動画");
      video.muted = false;
      video.volume = 1;
      const replay = element("button", "gacha-cinematic-play", "▶ 音声付きで再生");
      replay.type = "button";
      replay.hidden = true;
      const footer = element("div", "gacha-cinematic-footer");
      const status = element("div", "gacha-cinematic-status", "抽選結果を準備しています…");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      const sound = element("button", "gacha-cinematic-sound", "音声をオフ");
      sound.type = "button";
      sound.hidden = true;
      sound.setAttribute("aria-label", "音声をオフにする");
      toolbar.append(heading, skip);
      media.append(video, replay);
      footer.append(status, sound);
      panel.append(toolbar, media, footer);
      overlay.append(panel);
      doc.body.append(overlay);
      overlay.classList.add("is-preparing");
      overlay.tabIndex = -1;
      overlay.focus();

      let started = false;
      let settled = false;
      let disposed = false;
      let resolveDone;
      const done = new Promise(resolve => { resolveDone = resolve; });
      let timeout;
      const handlers = [];
      const listen = (node, type, handler) => {
        node.addEventListener(type, handler);
        handlers.push(() => node.removeEventListener(type, handler));
      };

      function settle(reason) {
        if (settled || disposed) return;
        settled = true;
        cancel(timeout);
        video.pause();
        replay.hidden = true;
        skip.hidden = true;
        sound.disabled = true;
        overlay.classList.add("is-waiting");
        status.textContent = "結果を表示します…";
        resolveDone(reason);
      }

      function finish() {
        if (disposed) return;
        settle("closed");
        disposed = true;
        cancel(timeout);
        handlers.forEach(remove => remove());
        video.pause();
        video.removeAttribute("src");
        video.load();
        overlay.remove();
        if (active === controller) active = null;
        if (previousFocus && previousFocus.isConnected && !previousFocus.disabled) previousFocus.focus();
      }

      function attemptPlayback() {
        if (disposed || settled) return;
        replay.hidden = true;
        video.muted = false;
        sound.textContent = "音声をオフ";
        sound.setAttribute("aria-label", "音声をオフにする");
        // Results are already saved; browsers may require the explicit replay button.
        try {
          Promise.resolve(video.play()).catch(error => {
            if (disposed || settled) return;
            if (error && error.name === "NotAllowedError") {
              replay.hidden = false;
              status.textContent = "音声付きで再生するには、再生ボタンを押してください。";
              replay.focus();
            } else settle("error");
          });
        } catch (_) { settle("error"); }
      }

      function start() {
        if (started || disposed || settled) return;
        started = true;
        overlay.classList.remove("is-preparing");
        media.hidden = false;
        skip.hidden = false;
        sound.hidden = false;
        status.textContent = "動画を読み込んでいます…";
        timeout = schedule(() => settle("timeout"), 45000);
        skip.focus();
        attemptPlayback();
      }
      const controller = { done, finish, start,
        skip: () => { if (started) settle("skipped"); },
        setStatus(text) { if (!started && !disposed) status.textContent = text; },
        setTitle(text) { heading.textContent = text; } };
      active = controller;
      listen(skip, "click", controller.skip);
      listen(replay, "click", attemptPlayback);
      listen(sound, "click", () => {
        video.muted = !video.muted;
        sound.textContent = video.muted ? "音声をオン" : "音声をオフ";
        sound.setAttribute("aria-label", video.muted ? "音声をオンにする" : "音声をオフにする");
      });
      listen(video, "ended", () => settle("ended"));
      listen(video, "error", () => settle("error"));
      listen(video, "playing", () => {
        if (!settled) status.textContent = "動画の終了後に結果を表示します。";
      });
      listen(video, "waiting", () => {
        if (!settled) status.textContent = "動画を読み込み中です。スキップもできます。";
      });
      listen(doc, "keydown", event => {
        if (event.key === "Escape") {
          event.preventDefault();
          controller.skip();
        } else if (event.key === "Tab") {
          const buttons = [skip, replay, sound].filter(button => !button.hidden && !button.disabled);
          if (!buttons.length) { event.preventDefault(); return; }
          const index = buttons.indexOf(doc.activeElement);
          if (index < 0 || (!event.shiftKey && index === buttons.length - 1) || (event.shiftKey && index === 0)) {
            event.preventDefault();
            buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
          }
        }
      });
      // A missing or stalled file must not leave a paid draw waiting indefinitely.
      return controller;
    }

    return { prepare,
      play(kind, title) { const controller = prepare(kind, title); controller.start(); return controller; },
      stop() { if (active) active.finish(); } };
  }

  // Warm just the selected result images while the server saves the draw.
  // Failed or slow images must not prevent a saved result from being shown.
  const imageLoads = new Map();
  function preloadGachaImages(urls, options = {}) {
    const ImageType = options.Image || root.Image;
    const schedule = options.setTimeout || root.setTimeout;
    const cancel = options.clearTimeout || root.clearTimeout;
    if (!ImageType) return Promise.resolve();
    return Promise.all([...new Set(urls.filter(Boolean))].map(url => {
      if (imageLoads.has(url)) return imageLoads.get(url);
      const loading = new Promise(resolve => {
        const img = new ImageType();
        let settled = false, timer;
        const finish = loaded => {
          if (settled) return;
          settled = true; cancel(timer); img.onload = null; img.onerror = null;
          resolve(loaded);
        };
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        timer = schedule(() => finish(false), options.timeoutMs ?? 2000);
        img.src = url;
      }).then(loaded => { if (!loaded) imageLoads.delete(url); });
      imageLoads.set(url, loading);
      return loading;
    }));
  }
  return { createGachaVideoPlayer, preloadGachaImages, DEFAULT_VIDEO_SOURCES };
});
