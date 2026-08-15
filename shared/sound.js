/* ============================================================
 * 危机音景播放器 — 全站统一（沙漏纪元 / 人口纪事报）
 * 播放列表：D 空城钟声 → B 时间告急 → C 突发编辑室，顺序循环，
 * 首尾 3 秒交叉淡变衔接。默认开启（首次触碰屏幕即出声），音量 80%。
 * 用法：页面 <body data-sound="hourglass|ledger">，引入本脚本即可。
 * ============================================================ */
(function () {
  'use strict';
  var ch = document.body && document.body.dataset.sound;
  if (!ch) return;

  var PLAYLIST = [
    '../shared/audio/1_empty_cities.mp3',
    '../shared/audio/2_time_running_out.mp3',
    '../shared/audio/3_breaking_newsroom.mp3'
  ];
  var MAX_VOL = 0.8, XFADE = 3; /* 交叉淡变秒数 */

  var dark = ch === 'hourglass';
  var KEY = 'popsound_on';

  /* 样式 */
  var st = document.createElement('style');
  st.textContent =
    '#sndBtn{position:fixed;right:4vw;bottom:52px;z-index:60;width:42px;height:42px;border-radius:50%;cursor:pointer;' +
    'display:flex;align-items:center;justify-content:center;user-select:none;transition:all .35s;' +
    (dark
      ? 'border:1px solid rgba(246,243,239,.25);color:rgba(246,243,239,.55);background:rgba(20,18,16,.6);backdrop-filter:blur(6px);'
      : 'border:1px solid rgba(28,28,2,.35);color:rgba(28,28,2,.6);background:rgba(246,243,239,.7);backdrop-filter:blur(6px);') +
    'font:12px/1 "JetBrains Mono",monospace;letter-spacing:0}' +
    '#sndBtn:hover{transform:scale(1.08)}' +
    '#sndBtn.on{' + (dark ? 'border-color:#ff5a4d;color:#ff5a4d;' : 'border-color:#ff4141;color:#ff4141;') + '}' +
    '#sndBtn .eq{display:none;gap:2px;align-items:flex-end;height:12px}' +
    '#sndBtn.on .eq{display:flex}#sndBtn.on .off-ic{display:none}' +
    '#sndBtn .eq i{width:2px;background:currentColor;animation:eqA 1s ease-in-out infinite}' +
    '#sndBtn .eq i:nth-child(1){height:5px;animation-delay:0s}#sndBtn .eq i:nth-child(2){height:11px;animation-delay:.25s}#sndBtn .eq i:nth-child(3){height:7px;animation-delay:.5s}' +
    '@keyframes eqA{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}';
  document.head.appendChild(st);

  /* 按钮 */
  var btn = document.createElement('div');
  btn.id = 'sndBtn';
  btn.title = '环境音 · 开 / 关';
  btn.innerHTML = '<span class="off-ic">♪</span><span class="eq"><i></i><i></i><i></i></span>';
  document.body.appendChild(btn);

  /* 双播放器交叉淡变 */
  var decks = [new Audio(), new Audio()];
  decks.forEach(function (a) { a.preload = 'auto'; });
  var cur = 0, idx = 0, playing = false, raf = null;

  function vol(a, v) { a.volume = Math.max(0, Math.min(MAX_VOL, v)); }

  function tick() {
    if (!playing) return;
    var a = decks[cur];
    var remain = (a.duration || 0) - a.currentTime;
    if (remain > 0 && remain <= XFADE && !a._xf) {
      a._xf = true;
      var nxt = decks[1 - cur];
      idx = (idx + 1) % PLAYLIST.length;
      nxt.src = PLAYLIST[idx];
      nxt.currentTime = 0;
      vol(nxt, 0);
      nxt._xf = false;
      nxt.play().catch(function () {});
      nxt._fadeIn = true;
      decks[1 - cur] = nxt;
    }
    /* 手动淡入/淡出 */
    if (a._xf) {
      var n = decks[1 - cur];
      var p = 1 - Math.max(0, remain) / XFADE; /* 0→1 */
      vol(a, MAX_VOL * (1 - p));
      vol(n, MAX_VOL * p);
      if (remain <= 0.05 || a.ended) {
        a.pause(); a._xf = false;
        cur = 1 - cur;
      }
    } else if (a.volume < MAX_VOL) {
      vol(a, a.volume + 0.02); /* 启动淡入 */
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (playing) return;
    playing = true;
    btn.classList.add('on');
    var a = decks[cur];
    if (!a.src) { a.src = PLAYLIST[idx]; vol(a, 0); }
    a.loop = false;
    a.play().catch(function () {});
    cancelAnimationFrame(raf);
    tick();
  }
  function stop() {
    playing = false;
    btn.classList.remove('on');
    cancelAnimationFrame(raf);
    decks.forEach(function (a) { a.pause(); });
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var on = !playing;
    if (on) start(); else stop();
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) {}
  });

  /* 默认开启：浏览器禁止未经交互出声，首次点击/触摸/按键即开始 */
  var wantOn = true;
  try { wantOn = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  if (wantOn) {
    btn.classList.add('on');
    var resume = function () {
      start();
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
    };
    document.addEventListener('pointerdown', resume);
    document.addEventListener('keydown', resume);
    decks[0].src = PLAYLIST[0];
    decks[0].play().then(function () { start(); }).catch(function () {});
  }
})();
