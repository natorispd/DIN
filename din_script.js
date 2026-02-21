// ============ STATE ============
let isRecording = false;
let recognition = null;
let fullTranscript = '';
let currentInterim = '';
let timerInterval = null;
let timerSeconds = 0;
let aizuchiTimeout = null;
let silenceTimer = null;
let autoSaveTimer = null;
let aizuchiSpoken = [];
let lastAizuchi = '';
let drawerOpen = false;
let lastSavedTranscript = '';

// ============ AIZUCHI SYSTEM ============
const AIZUCHI_POOL = [
  { text:'うんうん', w:10, phase:0, pitch:1.2, rate:0.85, vol:1.0 },
  { text:'うん', w:10, phase:0, pitch:1.2, rate:0.8, vol:0.9 },
  { text:'ふんふん', w:8, phase:0, pitch:1.2, rate:0.85, vol:0.9 },
  { text:'へぇ〜', w:8, phase:0, pitch:1.4, rate:0.7, vol:1.0 },
  { text:'あー', w:8, phase:0, pitch:1.1, rate:0.7, vol:0.8 },
  { text:'ほうほう', w:7, phase:0, pitch:1.2, rate:0.8, vol:0.9 },
  { text:'なるほどね〜', w:4, phase:1, pitch:1.3, rate:0.8, vol:1.0 },
  { text:'そっか〜', w:4, phase:1, pitch:1.1, rate:0.75, vol:0.9 },
  { text:'ふぅん', w:4, phase:1, pitch:1.3, rate:0.7, vol:0.9 },
  { text:'あ、そう', w:3, phase:1, pitch:1.3, rate:0.9, vol:1.0 },
  { text:'そぉなんだ', w:3, phase:1, pitch:1.3, rate:0.8, vol:1.0 },
  { text:'そうね', w:3, phase:1, pitch:1.2, rate:0.85, vol:0.9 },
  { text:'そだね〜', w:3, phase:1, pitch:1.2, rate:0.8, vol:0.9 },
  { text:'そうだね', w:3, phase:1, pitch:1.2, rate:0.85, vol:0.9 },
  { text:'そうね〜', w:3, phase:1, pitch:1.2, rate:0.75, vol:0.9 },
  { text:'おもしろい♪', w:2, phase:2, pitch:1.5, rate:1.0, vol:1.2 },
  { text:'すごい', w:2, phase:2, pitch:1.5, rate:1.05, vol:1.2 },
  { text:'すごいね', w:2, phase:2, pitch:1.5, rate:1.0, vol:1.2 },
  { text:'すてき', w:1, phase:2, pitch:1.4, rate:0.9, vol:1.1 },
  { text:'いいね〜', w:3, phase:2, pitch:1.4, rate:0.95, vol:1.1 },
  { text:'いいじゃん', w:2, phase:2, pitch:1.4, rate:1.0, vol:1.2 },
  { text:'たしかに', w:3, phase:1, pitch:1.2, rate:0.9, vol:1.0 },
  { text:'わかるわかる', w:1, phase:2, pitch:1.3, rate:1.0, vol:1.1 },
  { text:'あ〜ね', w:1, phase:2, pitch:1.3, rate:0.9, vol:1.0 },
  { text:'だよね〜', w:2, phase:2, pitch:1.3, rate:0.85, vol:1.0 },
];

const AIZUCHI_PROMPT = ['それから？', 'それで？', '他には？', 'もっと聞きたいな'];

const KEYWORD_REACTIONS = [
  { keywords:['すごい','すげー','やばい','やばっ'], reactions:[
    {text:'ほんとに？', pitch:1.5, rate:1.1, vol:1.2},
    {text:'えっすごい', pitch:1.5, rate:1.05, vol:1.2},
    {text:'まじで？', pitch:1.5, rate:1.1, vol:1.2}
  ]},
  { keywords:['面白','おもしろ','ウケる','うける'], reactions:[
    {text:'おもしろい♪', pitch:1.5, rate:1.0, vol:1.2},
    {text:'あはは', pitch:1.5, rate:1.1, vol:1.1},
    {text:'いいね〜', pitch:1.4, rate:0.95, vol:1.1}
  ]},
  { keywords:['問題','難し','むずか','困っ','つらい','きつい'], reactions:[
    {text:'そっか〜', pitch:1.1, rate:0.7, vol:0.9},
    {text:'うーん', pitch:1.0, rate:0.65, vol:0.8},
    {text:'なるほどね〜', pitch:1.2, rate:0.75, vol:0.9}
  ]},
  { keywords:['できた','思いつ','おもいつ','ひらめ','発見'], reactions:[
    {text:'すごいね', pitch:1.5, rate:1.0, vol:1.2},
    {text:'おー！', pitch:1.6, rate:1.1, vol:1.3},
    {text:'いいじゃん', pitch:1.4, rate:1.0, vol:1.2}
  ]},
  { keywords:['欲し','ほし','したい','やりたい'], reactions:[
    {text:'うんうん', pitch:1.2, rate:0.85, vol:1.0},
    {text:'いいね〜', pitch:1.4, rate:0.95, vol:1.1},
    {text:'そうだね', pitch:1.2, rate:0.85, vol:0.9}
  ]},
  { keywords:['でも','だけど','ただ','けど'], reactions:[
    {text:'うん', pitch:1.2, rate:0.8, vol:0.9},
    {text:'ふんふん', pitch:1.2, rate:0.85, vol:0.9},
    {text:'そっか〜', pitch:1.1, rate:0.75, vol:0.9}
  ]},
  { keywords:['だから','なので','つまり','要は'], reactions:[
    {text:'なるほどね〜', pitch:1.3, rate:0.8, vol:1.0},
    {text:'うんうん', pitch:1.2, rate:0.85, vol:1.0},
    {text:'ほうほう', pitch:1.2, rate:0.8, vol:0.9}
  ]},
  { keywords:['新し','あたらし','初めて','はじめて'], reactions:[
    {text:'へぇ〜', pitch:1.5, rate:0.75, vol:1.1},
    {text:'おもしろい♪', pitch:1.5, rate:1.0, vol:1.2},
    {text:'いいね〜', pitch:1.4, rate:0.95, vol:1.1}
  ]},
];

function getCurrentPhase() {
  const textLen = fullTranscript.length;
  let timePhase = timerSeconds >= 180 ? 2 : timerSeconds >= 60 ? 1 : 0;
  let textPhase = textLen >= 400 ? 2 : textLen >= 100 ? 1 : 0;
  return Math.max(timePhase, textPhase);
}

function weightedRandom(pool) {
  const totalW = pool.reduce((s, a) => s + a.w, 0);
  let r = Math.random() * totalW;
  for (const a of pool) { r -= a.w; if (r <= 0) return a; }
  return pool[0];
}

function extractNoun(text) {
  const recent = text.slice(-50);
  const kata = recent.match(/[ァ-ヶー]{3,}/g);
  if (kata && kata.length > 0) return kata[kata.length - 1] + '…';
  const kanji = recent.match(/[一-龥]{2,}/g);
  if (kanji && kanji.length > 0) return kanji[kanji.length - 1] + '…';
  return null;
}

function checkKeywordReaction(text) {
  const recent = text.slice(-60);
  for (const rule of KEYWORD_REACTIONS) {
    for (const kw of rule.keywords) {
      if (recent.includes(kw)) {
        return rule.reactions[Math.floor(Math.random() * rule.reactions.length)];
      }
    }
  }
  return null;
}

function pickAizuchi() {
  const text = fullTranscript + currentInterim;
  const phase = getCurrentPhase();

  if (text.length > 10 && Math.random() < 0.2) {
    const noun = extractNoun(text);
    if (noun && noun !== lastAizuchi) {
      lastAizuchi = noun;
      return { text:noun, pitch:1.2, rate:0.75, vol:0.9 };
    }
  }

  if (text.length > 10 && phase >= 1 && Math.random() < 0.3) {
    const reaction = checkKeywordReaction(text);
    if (reaction && reaction.text !== lastAizuchi) {
      lastAizuchi = reaction.text;
      return reaction;
    }
  }

  if (text.length > 10 && phase === 0 && Math.random() < 0.15) {
    const reaction = checkKeywordReaction(text);
    if (reaction && reaction.text !== lastAizuchi) {
      lastAizuchi = reaction.text;
      return { text:reaction.text, pitch:1.2, rate:0.8, vol:0.85 };
    }
  }

  const available = AIZUCHI_POOL.filter(a => a.phase <= phase);
  let pick, attempts = 0;
  do { pick = weightedRandom(available); attempts++; }
  while (pick.text === lastAizuchi && attempts < 5);
  lastAizuchi = pick.text;
  return pick;
}

// ============ TOUCH / SWIPE / MOUSE ============
let touchStartY = 0;
let touchStartTime = 0;

// タッチ（スマホ）
document.getElementById('mainScreen').addEventListener('touchstart', (e) => {
  if (drawerOpen) return;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
}, { passive:true });

document.getElementById('mainScreen').addEventListener('touchmove', (e) => {
  if (drawerOpen) return;
  // 録音中はテキストエリアをスクロール
  if (isRecording) {
    const dy = touchStartY - e.touches[0].clientY;
    const el = document.getElementById('textArea');
    el.scrollTop += dy * 0.5;
    touchStartY = e.touches[0].clientY;
  }
}, { passive:true });

document.getElementById('mainScreen').addEventListener('touchend', (e) => {
  if (drawerOpen) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  const dt = Date.now() - touchStartTime;

  // 録音中のスワイプはスクロール済みなので、タップのみ処理
  if (isRecording) {
    if (Math.abs(dy) < 20) toggleRecording();
    return;
  }

  // 非録音時：スワイプ上→ドロワー、タップ→録音開始
  if (dy > 50 && dt < 500) { openDrawer(); return; }
  if (Math.abs(dy) < 20) toggleRecording();
}, { passive:true });

// マウスクリック（PC）
document.getElementById('mainScreen').addEventListener('click', (e) => {
  if (drawerOpen) return;
  if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
  toggleRecording();
});

// マウスホイール（PC）
document.getElementById('mainScreen').addEventListener('wheel', (e) => {
  if (drawerOpen) return;
  // 録音中はテキストスクロール
  if (isRecording) {
    e.preventDefault();
    const el = document.getElementById('textArea');
    el.scrollBy(0, e.deltaY);
    return;
  }
  // 非録音時：上スクロールでドロワー
  if (e.deltaY < -30) { openDrawer(); }
}, { passive:false });

// ============ DRAWER ============
function openDrawer() {
  drawerOpen = true;
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('drawer').classList.add('show');
  renderList();
}

function closeDrawer() {
  drawerOpen = false;
  document.getElementById('drawerOverlay').classList.remove('show');
  document.getElementById('drawer').classList.remove('show');
}

function switchDrawerTab(name) {
  document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.drawer-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  event.target.classList.add('active');
  if (name === 'list') renderList();
}

// ============ SETTINGS ============
function loadSettings() {
  const s = JSON.parse(localStorage.getItem('igt_settings') || '{}');
  const volPct = Math.round((s.volume ?? 0.8) * 100);
  document.getElementById('voiceVolume').value = volPct;
  document.getElementById('volValue').textContent = volPct;
  document.getElementById('aizuchiInterval').value = s.interval ?? 0;
  document.getElementById('silenceTimeout').value = s.silence ?? 30;
  document.getElementById('autoSaveInterval').value = s.autoSave ?? 3;
  document.getElementById('endWords').value = s.endWords ?? 'おわり,以上,おしまい,終了,stop,ストップ';
  if (s.charName !== undefined) document.getElementById('charSelect').value = s.charName;
  else document.getElementById('charSelect').value = '__silent__';
  if (s.startPhrase) {
    const sel = document.getElementById('startPhrase');
    const opt = [...sel.options].find(o => o.value === s.startPhrase);
    if (opt) { sel.value = s.startPhrase; }
    else { document.getElementById('startPhraseCustom').value = s.startPhrase; }
  }
  if (s.endPhrase) {
    const sel = document.getElementById('endPhrase');
    const opt = [...sel.options].find(o => o.value === s.endPhrase);
    if (opt) { sel.value = s.endPhrase; }
    else { document.getElementById('endPhraseCustom').value = s.endPhrase; }
  }
  if (s.lang) setLang(s.lang);
  // フォントスケール
  const fs = s.fontScale ?? 2;
  const fsText = s.fontScaleText ?? 2;
  document.getElementById('fontScale').value = fs;
  document.getElementById('fontScaleText').value = fsText;
  document.getElementById('fsValue').textContent = fs.toFixed(1);
  document.getElementById('fsTextValue').textContent = fsText.toFixed(1);
  applyFontScale(fs, fsText);
}

function saveSettings() {
  const selectedSwatch = document.querySelector('.color-swatch.selected');
  const s = {
    volume: parseInt(document.getElementById('voiceVolume').value) / 100,
    interval: parseInt(document.getElementById('aizuchiInterval').value),
    silence: parseInt(document.getElementById('silenceTimeout').value),
    autoSave: parseInt(document.getElementById('autoSaveInterval').value),
    charName: document.getElementById('charSelect').value,
    startPhrase: document.getElementById('startPhraseCustom').value.trim() || document.getElementById('startPhrase').value,
    endPhrase: document.getElementById('endPhraseCustom').value.trim() || document.getElementById('endPhrase').value,
    accentColor: selectedSwatch ? selectedSwatch.dataset.color : '#f0c040',
    endWords: document.getElementById('endWords').value.trim(),
    fontScale: parseFloat(document.getElementById('fontScale').value),
    fontScaleText: parseFloat(document.getElementById('fontScaleText').value)
  };
  localStorage.setItem('igt_settings', JSON.stringify(s));
  alert('保存しました');
}

function getSettings() {
  return JSON.parse(localStorage.getItem('igt_settings') || '{}');
}

function resetSettings() {
  if (confirm('設定をリセットしますか？')) {
    localStorage.removeItem('igt_settings');
    location.reload();
  }
}

// ============ VOICE / CHARACTER ============
// キャラ別WAVマップ: { charName: { start:key, end:key, prompt:[keys], aizuchi:[keys] } }
let CHAR_MAP = {};

function buildCharMap() {
  if (!window.VOICE_DATA) return;
  const allKeys = Object.keys(window.VOICE_DATA);
  // キー形式: 番号_キャラ名_セリフ
  allKeys.forEach(k => {
    const m = k.match(/^\d+_(.+?)_(.+)$/);
    if (!m) return;
    const [, char, line] = m;
    if (!CHAR_MAP[char]) CHAR_MAP[char] = { start:null, end:null, prompt:[], aizuchi:[] };
    // 開始・終了は各キャラの1番目・2番目のキー
    if (!CHAR_MAP[char].start) { CHAR_MAP[char].start = k; return; }
    if (!CHAR_MAP[char].end) { CHAR_MAP[char].end = k; return; }
    // 「続きは」「それで」「どうなる」系はプロンプト
    if (/続き|それで|どげん|どない|どうなる/.test(line)) {
      CHAR_MAP[char].prompt.push(k);
    } else {
      CHAR_MAP[char].aizuchi.push(k);
    }
  });
}

function populateChars() {
  buildCharMap();
  const sel = document.getElementById('charSelect');
  sel.innerHTML = '<option value="" id="opt-none">なし（TTS）</option>'
    + '<option value="__silent__" id="opt-silent">無音（テキストのみ）</option>';
  Object.keys(CHAR_MAP).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  const s = getSettings();
  sel.value = (s.charName !== undefined) ? s.charName : '__silent__';
  // クレジット動的更新
  const charNames = Object.keys(CHAR_MAP);
  if (charNames.length > 0) {
    const el = document.getElementById('creditText');
    if (el) {
      el.innerHTML = `音声合成：<a href="https://voicevox.hiroshiba.jp/" target="_blank" style="color:var(--accent-dim);text-decoration:none;">VOICEVOX</a>／${charNames.join('／')}<br><a href="https://voicevox.hiroshiba.jp/term/" target="_blank" style="color:var(--text-dim);text-decoration:none;">VOICEVOX 利用規約</a>`;
    }
  }
}

// TTS音声の初期化（Android対応）
let ttsVoicesLoaded = false;
function loadTTSVoices() {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      ttsVoicesLoaded = true;
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        ttsVoicesLoaded = true;
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}

window.addEventListener('load', () => {
  populateChars();
  loadSettings();
  initColorPalette();
  loadTTSVoices(); // TTS音声を事前読み込み
  initModalSwipe(); // モーダル横スワイプ
});

// ============ RECORDING ============
function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

function startRecording() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('このブラウザは音声認識に対応していません');
    return;
  }

  isRecording = true;
  fullTranscript = '';
  currentInterim = '';
  aizuchiSpoken = [];
  lastAizuchi = '';
  timerSeconds = 0;
  lastSavedTranscript = '';

  document.getElementById('bgOrb').className = 'bg-orb recording';
  document.getElementById('timer').classList.add('show');
  document.getElementById('recLabel').classList.add('show');
  document.getElementById('centerIcon').textContent = '■';
  document.getElementById('centerIcon').classList.add('dim');
  document.getElementById('liveText').classList.add('show');
  document.getElementById('hint').classList.add('hide');
  document.getElementById('liveText').textContent = '';

  const startPhrase = getSettings().startPhrase || 'なぁに？';
  showAizuchi(startPhrase);
  speakAizuchi(startPhrase, { pitch:1.3, rate:0.75, vol:1.0 }, 'start');
  aizuchiSpoken.push({ text: startPhrase, isEcho: false });

  startTimer();
  startRecognition();
}

function stopRecording() {
  isRecording = false;

  stopTimer();
  if (recognition) {
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }
  clearTimeout(aizuchiTimeout);
  clearTimeout(silenceTimer);
  clearTimeout(autoSaveTimer);

  let cleaned = cleanTranscript(fullTranscript);
  cleaned = cleaned.trim();
  if (cleaned.length > 0 && cleaned !== lastSavedTranscript) {
    saveRecord(cleaned);
  }

  const endPhrase = getSettings().endPhrase || '記録しました';
  showAizuchi(endPhrase);
  speakAizuchi(endPhrase, { pitch:1.3, rate:0.8, vol:1.0 }, 'end');

  setTimeout(() => {
    document.getElementById('bgOrb').className = 'bg-orb idle';
    document.getElementById('timer').classList.remove('show');
    document.getElementById('recLabel').classList.remove('show');
    document.getElementById('centerIcon').textContent = '▶';
    document.getElementById('centerIcon').classList.remove('dim');
    document.getElementById('liveText').classList.remove('show');
    document.getElementById('hint').classList.remove('hide');
    document.getElementById('liveText').textContent = '';
  }, 2500);
}

function cleanTranscript(text) {
  let result = text;
  for (const entry of aizuchiSpoken) {
    if (entry.isEcho) continue; // オウム返しはユーザ発話なので消さない
    const q = entry.text;
    result = result.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ');
    const noP = q.replace(/[、。？！?!♪〜～…]/g, '');
    if (noP !== q && noP.length > 0) {
      result = result.replace(new RegExp(noP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ');
    }
  }
  result = result.replace(/[ \t]{2,}/g, ' ');
  // 空行を除去
  result = result.split('\n').filter(l => l.trim().length > 0).join('\n');
  return result;
}

// ============ SPEECH RECOGNITION ============
function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    resetSilenceTimer();
    resetAutoSaveTimer();
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final) {
      // 終了ワードチェック
      if (checkEndWord(final)) {
        // 終了ワード自体は記録から除外
        stopRecording();
        return;
      }
      fullTranscript += final + '\n';
      triggerAizuchi();
    }
    currentInterim = interim;
    updateLiveText();
  };

  recognition.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    console.error('Recognition error:', e.error);
  };

  recognition.onend = () => {
    if (isRecording) { try { recognition.start(); } catch(e) { console.error('Restart error:', e); } }
  };

  recognition.start();
  resetSilenceTimer();
  resetAutoSaveTimer();
}

let currentAccentColor = '#f0c040';

function updateLiveText() {
  const el = document.getElementById('liveText');
  const area = document.getElementById('textArea');
  const lines = (fullTranscript + currentInterim).split('\n').filter(l => l.trim());
  
  if (lines.length === 0) {
    el.innerHTML = '';
    return;
  }

  const total = lines.length;
  const fsText = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-text')) || 2;
  let html = '';
  for (let i = 0; i < total; i++) {
    const distFromEnd = total - 1 - i;
    const baseSize = Math.max(0.65, 1.15 - distFromEnd * 0.06);
    const size = baseSize * fsText;
    const lh = Math.max(1.2, 2.0 - distFromEnd * 0.08);
    const isLast = distFromEnd === 0;
    const weight = isLast ? 'font-weight:700;' : '';
    const color = isLast ? `color:${currentAccentColor};` : '';
    html += `<div class="tt-line" style="font-size:${size}rem;line-height:${lh};${weight}${color}">${escapeHtml(lines[i])}</div>`;
  }

  el.innerHTML = html;
  area.scrollTop = area.scrollHeight;
}

// スクロール時は表示位置基準で再計算
function applyTextGradient() {
  const area = document.getElementById('textArea');
  const divs = area.querySelectorAll('.tt-line');
  if (divs.length === 0) return;

  const areaRect = area.getBoundingClientRect();
  const areaBottom = areaRect.bottom;

  // 画面内で一番下にある行を見つける
  let bottomIdx = -1;
  let maxBottom = -Infinity;
  divs.forEach((d, i) => {
    const r = d.getBoundingClientRect();
    if (r.bottom <= areaBottom && r.bottom > maxBottom) {
      maxBottom = r.bottom;
      bottomIdx = i;
    }
  });

  const fsText = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-text')) || 2;
  divs.forEach((d, i) => {
    const distFromVisible = Math.max(0, bottomIdx - i);
    const baseSize = Math.max(0.65, 1.15 - distFromVisible * 0.06);
    const size = baseSize * fsText;
    const lh = Math.max(1.2, 2.0 - distFromVisible * 0.08);
    const isBottom = i === bottomIdx;

    d.style.fontSize = size + 'rem';
    d.style.lineHeight = lh;
    d.style.fontWeight = isBottom ? '700' : '400';
    d.style.color = isBottom ? currentAccentColor : '#e8e4df';
  });
}

document.getElementById('textArea').addEventListener('scroll', () => {
  requestAnimationFrame(applyTextGradient);
});

// ============ END WORD DETECTION ============
// 表記ゆれ対応マップ
const END_WORD_VARIANTS = {
  'おわり': ['おわり','終わり','終わった','おわった'],
  'おしまい': ['おしまい','お終い'],
  '終了': ['終了'],
  '以上': ['以上'],
  'stop': ['stop','Stop','STOP'],
  'ストップ': ['ストップ'],
};

function checkEndWord(text) {
  const s = getSettings();
  const words = (s.endWords || 'おわり,以上,おしまい,終了,stop,ストップ').split(',').map(w => w.trim()).filter(w => w);
  const cleaned = text.trim().toLowerCase();
  
  console.log('Checking end word:', cleaned); // デバッグ用
  
  for (const w of words) {
    const wl = w.toLowerCase();
    // 登録ワードそのもの（大文字小文字無視・前後一致）
    if (cleaned === wl || cleaned.endsWith(wl) || cleaned.includes(wl)) {
      console.log('End word matched:', w); // デバッグ用
      return true;
    }
    // 表記ゆれ展開
    const variants = END_WORD_VARIANTS[w] || [];
    for (const v of variants) {
      const vl = v.toLowerCase();
      if (cleaned === vl || cleaned.endsWith(vl) || cleaned.includes(vl)) {
        console.log('End word variant matched:', v); // デバッグ用
        return true;
      }
    }
  }
  return false;
}

// ============ SILENCE DETECTION ============
function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  const s = getSettings();
  const timeout = (s.silence || 30) * 1000;
  silenceTimer = setTimeout(() => {
    if (!isRecording) return;
    const prompt = AIZUCHI_PROMPT[Math.floor(Math.random() * AIZUCHI_PROMPT.length)];
    showAizuchi(prompt);
    // 途中の促しもTTSで統一（WAVキャラの合いの手と被らないように）
    speakEchoTTS(prompt);
    aizuchiSpoken.push({ text: prompt, isEcho: false });
    silenceTimer = setTimeout(() => {
      if (isRecording) stopRecording();
    }, timeout);
  }, timeout);
}

// ============ AUTO SAVE ============
function resetAutoSaveTimer() {
  clearTimeout(autoSaveTimer);
  const s = getSettings();
  const interval = (s.autoSave || 0) * 1000;
  if (interval <= 0) return;
  
  autoSaveTimer = setTimeout(() => {
    if (!isRecording) return;
    let cleaned = cleanTranscript(fullTranscript).trim();
    if (cleaned.length > 0 && cleaned !== lastSavedTranscript) {
      saveRecord(cleaned);
      lastSavedTranscript = cleaned;
    }
  }, interval);
}

// ============ AIZUCHI TRIGGER ============
let aizuchiCooldown = false;

function extractEchoText() {
  const lines = fullTranscript.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return null;
  let lastLine = lines[lines.length - 1].trim();
  if (lastLine.length > 40) {
    const punctIdx = Math.max(lastLine.lastIndexOf('。', lastLine.length - 2), lastLine.lastIndexOf('、', lastLine.length - 2));
    if (punctIdx > lastLine.length - 40 && punctIdx > 0) {
      lastLine = lastLine.substring(punctIdx + 1).trim();
    } else {
      lastLine = lastLine.slice(-30);
    }
  }
  if (lastLine.length < 3) return null;
  return lastLine;
}

function speakEchoTTS(text) {
  const s = getSettings();
  const cleanText = text.replace(/[♪…]/g, '');
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = 'ja-JP';
  utter.volume = Math.min(1.0, (s.volume ?? 0.8) * 0.6);
  utter.rate = 0.9;
  utter.pitch = 1.0;
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
  if (voices.length > 0) utter.voice = voices[0];
  try { speechSynthesis.speak(utter); } catch(e) {}
}

function triggerAizuchi() {
  if (!isRecording || aizuchiCooldown) return;
  const s = getSettings();
  const delay = (s.interval || 0) * 1000;

  aizuchiCooldown = true;
  clearTimeout(aizuchiTimeout);

  aizuchiTimeout = setTimeout(() => {
    if (!isRecording) return;
    const echoText = extractEchoText();
    if (echoText) {
      aizuchiSpoken.push({ text: echoText, isEcho: true });
      showAizuchi(echoText);
      speakEchoTTS(echoText);
    }
    // echo取得失敗時（短すぎる発話）は何もしない
    setTimeout(() => { aizuchiCooldown = false; }, 1500);
  }, delay);
}

function showAizuchi(text) {
  const el = document.getElementById('aizuchiText');
  el.textContent = text;
  el.className = 'aizuchi-text';
  void el.offsetWidth;
  el.className = 'aizuchi-text show';
}

function getCurrentChar() {
  const s = getSettings();
  return s.charName || document.getElementById('charSelect').value || '';
}

function playWav(key) {
  const s = getSettings();
  const audio = new Audio(window.VOICE_DATA[key]);
  audio.volume = Math.min(1.0, s.volume ?? 0.8);
  audio.play().catch(()=>{});
}

// type: 'start' | 'end' | 'prompt' | 'aizuchi'
async function speakAizuchi(text, emotionParams, type) {
  const charName = getCurrentChar();

  // 無音モード：開始・終了のみ発話、それ以外はテキスト表示のみ
  if (charName === '__silent__') {
    if (type !== 'start' && type !== 'end') return;
    // start/end はTTSフォールバックへ落ちる
  }

  if (charName && window.VOICE_DATA && CHAR_MAP[charName]) {
    const cm = CHAR_MAP[charName];
    let key = null;
    if (type === 'start' && cm.start) {
      key = cm.start;
    } else if (type === 'end' && cm.end) {
      key = cm.end;
    } else if (type === 'prompt' && cm.prompt.length > 0) {
      key = cm.prompt[Math.floor(Math.random() * cm.prompt.length)];
    } else if (cm.aizuchi.length > 0) {
      key = cm.aizuchi[Math.floor(Math.random() * cm.aizuchi.length)];
    }
    if (key) {
      // WAVキーからセリフ部分を抽出して表示
      const wavText = key.replace(/^\d+_.+?_/, '');
      showAizuchi(wavText);
      playWav(key);
      return;
    }
  }

  // フォールバック: TTS（Android対応）
  if (!ttsVoicesLoaded) {
    await loadTTSVoices();
  }
  
  const cleanText = text.replace(/[♪…]/g, '');
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = 'ja-JP';
  const ep = emotionParams || {};
  utter.volume = Math.min(1.0, (getSettings().volume ?? 0.8) * (ep.vol || 1.0));
  utter.rate = ep.rate || 0.85;
  utter.pitch = ep.pitch || 1.3;
  
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
  if (voices.length > 0) {
    utter.voice = voices[0];
  }
  
  try {
    speechSynthesis.speak(utter);
  } catch (e) {
    console.error('TTS error:', e);
  }
}

// ============ TIMER ============
function startTimer() {
  timerSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }
function updateTimerDisplay() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${m}:${s}`;
}

// ============ STORAGE ============
function getRecords() { return JSON.parse(localStorage.getItem('igt_records') || '[]'); }
function saveRecord(text) {
  const records = getRecords();
  records.unshift({ id:Date.now(), date:new Date().toISOString(), text, duration:timerSeconds });
  localStorage.setItem('igt_records', JSON.stringify(records));
}
function deleteRecord(id) {
  let records = getRecords().filter(r => r.id !== id);
  localStorage.setItem('igt_records', JSON.stringify(records));
}
function clearAll() {
  if (confirm('すべての記録を削除しますか？')) {
    localStorage.removeItem('igt_records');
    renderList();
    alert('削除しました');
  }
}

// ============ LIST ============
function renderList() {
  const el = document.getElementById('recordList');
  const records = getRecords();
  if (records.length === 0) {
    el.innerHTML = '<div class="record-empty">まだ記録がありません</div>';
    return;
  }
  el.innerHTML = records.map(r => {
    const d = new Date(r.date);
    const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const dur = r.duration ? ` (${Math.floor(r.duration/60)}:${String(r.duration%60).padStart(2,'0')})` : '';
    return `<div class="record-card" onclick="openModal(${r.id})">
      <div class="record-date">${dateStr}${dur}</div>
      <div class="record-preview">${escapeHtml(r.text)}</div>
    </div>`;
  }).join('');
}
function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ============ MODAL ============
let currentModalId = null;
let modalTouchStartX = 0;
let modalTouchStartY = 0;
let modalTouchStartTime = 0;
let modalSwiping = false;

function openModal(id, skipOverlay) {
  const records = getRecords();
  const r = records.find(r => r.id === id);
  if (!r) return;
  const idx = records.findIndex(r => r.id === id);
  const d = new Date(r.date);
  document.getElementById('modalDate').textContent =
    `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  document.getElementById('modalBody').textContent = r.text;
  document.getElementById('modalDelete').onclick = () => {
    if (confirm('削除しますか？')) { deleteRecord(id); closeModal(); renderList(); }
  };
  const indicator = document.getElementById('modalPosition');
  if (indicator) indicator.textContent = `${idx + 1} / ${records.length}`;
  currentModalId = id;
  if (!skipOverlay) {
    document.getElementById('modal').classList.add('show');
  }
}
function closeModal() { document.getElementById('modal').classList.remove('show'); }

function navigateModal(direction) {
  const records = getRecords();
  const idx = records.findIndex(r => r.id === currentModalId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= records.length) return;

  const content = document.querySelector('.modal-content');
  const slideOut = direction > 0 ? 'slideOutLeft' : 'slideOutRight';
  const slideIn = direction > 0 ? 'slideInRight' : 'slideInLeft';

  content.style.animation = `${slideOut} 0.15s ease-out`;
  content.addEventListener('animationend', function handler() {
    content.removeEventListener('animationend', handler);
    openModal(records[newIdx].id, true);
    content.style.animation = `${slideIn} 0.15s ease-out`;
  });
}

// モーダル横スワイプ
function initModalSwipe() {
  const mc = document.querySelector('.modal-content');
  if (!mc) return;
  mc.addEventListener('touchstart', (e) => {
    modalTouchStartX = e.touches[0].clientX;
    modalTouchStartY = e.touches[0].clientY;
    modalTouchStartTime = Date.now();
    modalSwiping = false;
  }, { passive:true });

  mc.addEventListener('touchmove', (e) => {
    if (!currentModalId) return;
    const dx = e.touches[0].clientX - modalTouchStartX;
    const dy = e.touches[0].clientY - modalTouchStartY;
    if (!modalSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      modalSwiping = true;
    }
    if (modalSwiping) e.preventDefault();
  }, { passive:false });

  mc.addEventListener('touchend', (e) => {
    if (!currentModalId) return;
    const dx = e.changedTouches[0].clientX - modalTouchStartX;
    const dy = e.changedTouches[0].clientY - modalTouchStartY;
    const dt = Date.now() - modalTouchStartTime;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      navigateModal(dx < 0 ? 1 : -1);
    }
    modalSwiping = false;
  }, { passive:true });
}

// ============ EXPORT (Windows対応) ============

function downloadFile(filename, content, mime) {
  // UTF-8 BOM付き、改行を\r\nに変換
  const windowsContent = content.replace(/\n/g, '\r\n');
  const blob = new Blob(['\uFEFF' + windowsContent], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function exportSingle(fmt) {
  const r = getRecords().find(r => r.id === currentModalId);
  if (!r) return;
  const date = formatDate(r.date);
  const slug = date.replace(/[: ]/g, '-');
  if (fmt === 'txt') {
    downloadFile(`igt_${slug}.txt`, `${date}\n\n${r.text}`, 'text/plain');
  } else if (fmt === 'md') {
    const dur = r.duration ? `${Math.floor(r.duration/60)}:${String(r.duration%60).padStart(2,'0')}` : '';
    downloadFile(`igt_${slug}.md`, `# ${date}${dur ? ' ('+dur+')' : ''}\n\n${r.text}\n`, 'text/markdown');
  }
}

function exportAll(fmt) {
  const records = getRecords();
  if (records.length === 0) { alert('記録がありません'); return; }
  const ts = new Date().toISOString().slice(0,10);
  if (fmt === 'json') {
    downloadFile(`igt_all_${ts}.json`, JSON.stringify(records, null, 2), 'application/json');
  } else if (fmt === 'csv') {
    const header = 'id,date,duration,text';
    const rows = records.map(r => {
      const text = '"' + r.text.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
      return `${r.id},${r.date},${r.duration||0},${text}`;
    });
    downloadFile(`igt_all_${ts}.csv`, [header, ...rows].join('\n'), 'text/csv');
  }
}

// ============ INIT ============
// ブラウザ閉じる時に録音中なら自動保存
window.addEventListener('beforeunload', () => {
  if (isRecording) {
    let cleaned = cleanTranscript(fullTranscript).trim();
    if (cleaned.length > 0) saveRecord(cleaned);
  }
});

// カラーパレット初期化
function initColorPalette() {
  const s = getSettings();
  const current = s.accentColor || '#f0c040';
  currentAccentColor = current;
  applyAccentColor(current);
  document.querySelectorAll('.color-swatch').forEach(sw => {
    if (sw.dataset.color === current) sw.classList.add('selected');
    sw.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      applyAccentColor(sw.dataset.color);
    });
  });
}

function applyAccentColor(color) {
  currentAccentColor = color;
  document.documentElement.style.setProperty('--accent', color);
  const r = parseInt(color.slice(1,3),16);
  const g = parseInt(color.slice(3,5),16);
  const b = parseInt(color.slice(5,7),16);
  document.documentElement.style.setProperty('--accent-dim',
    `rgb(${Math.floor(r*0.6)},${Math.floor(g*0.6)},${Math.floor(b*0.6)})`);
  // 録音中なら即反映
  if (isRecording) requestAnimationFrame(applyTextGradient);
}

// ============ FONT SCALE ============
function applyFontScale(fs, fsText) {
  document.documentElement.style.setProperty('--fs', fs);
  document.documentElement.style.setProperty('--fs-text', fsText);
  // 録音中のライブテキストにも反映
  if (isRecording) requestAnimationFrame(applyTextGradient);
}

function previewFontScale() {
  const v = parseFloat(document.getElementById('fontScale').value);
  document.getElementById('fsValue').textContent = v.toFixed(1);
  const vt = parseFloat(document.getElementById('fontScaleText').value);
  applyFontScale(v, vt);
}

function previewFontScaleText() {
  const v = parseFloat(document.getElementById('fontScaleText').value);
  document.getElementById('fsTextValue').textContent = v.toFixed(1);
  const vf = parseFloat(document.getElementById('fontScale').value);
  applyFontScale(vf, v);
}

function previewVolume() {
  const v = parseInt(document.getElementById('voiceVolume').value);
  document.getElementById('volValue').textContent = v;
}

// ============ I18N ============
const I18N = {
  ja: {
    hintText: 'タップ：録音開始 / 停止<br>スワイプ↑：設定・記録一覧',
    'tab-list': '📝 記録',
    'tab-settings': '⚙ 設定',
    'title-color': '🎨 アクセントカラー',
    'title-chara': '🎤 キャラクター',
    'label-chara': '合いの手キャラ',
    'opt-none': 'なし（TTS）',
    'opt-silent': '無音（テキストのみ）',
    'label-vol': '音量（0〜1）',
    'label-delay': '合いの手の遅延（秒）',
    'label-startPhrase': '開始フレーズ（TTS）',
    'desc-startPhrase': 'WAVキャラ未選択時に使用',
    'desc-startCustom': 'または自由入力（こちらが優先されます）',
    'label-endPhrase': '終了フレーズ（TTS）',
    'desc-endPhrase': 'WAVキャラ未選択時に使用',
    'desc-endCustom': 'または自由入力（こちらが優先されます）',
    'title-rec': '🎙 録音',
    'label-silence': '沈黙で終了するまでの秒数',
    'label-autoSave': '自動保存間隔（秒）',
    'desc-autoSave': 'この秒数の無音で自動保存します（0で無効）',
    'label-endWords': '終了ワード（カンマ区切り）',
    'desc-endWords': 'この言葉を言うと録音が自動終了します',
    'btn-save': '設定を保存',
    'title-export': '📤 エクスポート（全件）',
    'title-data': '🗑 データ管理',
    'btn-clearall': 'テキストデータの消去',
    'btn-resetSettings': '設定をリセット',
    'title-howto': 'ℹ 使い方',
    'desc-howto': '画面タップ → 録音開始/停止<br>スワイプ上 → 記録一覧・設定<br><br>音声認識にはインターネット接続が必要です<br>※ Chrome / Edge 推奨',
    'desc-voicedata': 'voice_data.js が必要です',
    modalDelete: 'この記録を削除',
  },
  en: {
    hintText: 'Tap: Start / Stop recording<br>Swipe up: Settings & records',
    'tab-list': '📝 Records',
    'tab-settings': '⚙ Settings',
    'title-color': '🎨 Accent Color',
    'title-chara': '🎤 Character',
    'label-chara': 'Response Character',
    'opt-none': 'None (TTS)',
    'opt-silent': 'Silent (text only)',
    'label-vol': 'Volume (0–1)',
    'label-delay': 'Response delay (sec)',
    'label-startPhrase': 'Start phrase (TTS)',
    'desc-startPhrase': 'Used when no WAV character is selected',
    'desc-startCustom': 'Custom input (takes priority)',
    'label-endPhrase': 'End phrase (TTS)',
    'desc-endPhrase': 'Used when no WAV character is selected',
    'desc-endCustom': 'Custom input (takes priority)',
    'title-rec': '🎙 Recording',
    'label-silence': 'Silence timeout (sec)',
    'label-autoSave': 'Auto-save interval (sec)',
    'desc-autoSave': 'Auto-save after this many seconds of silence (0 to disable)',
    'label-endWords': 'Stop words (comma separated)',
    'desc-endWords': 'Say these words to stop recording automatically',
    'btn-save': 'Save Settings',
    'title-export': '📤 Export (all records)',
    'title-data': '🗑 Data',
    'btn-clearall': 'Clear all text records',
    'btn-resetSettings': 'Reset settings',
    'title-howto': 'ℹ How to Use',
    'desc-howto': 'Tap → Start / Stop recording<br>Swipe up → Records & settings<br><br>Internet connection required for speech recognition<br>※ Chrome / Edge recommended',
    'desc-voicedata': 'voice_data.js required',
    modalDelete: 'Delete this record',
  }
};

let currentLang = 'ja';

function setLang(lang) {
  currentLang = lang;
  const d = I18N[lang];
  // hintText
  document.getElementById('hintText').innerHTML = d.hintText;
  // modalDelete
  const md = document.getElementById('modalDelete');
  if (md) md.textContent = d.modalDelete;
  // その他id
  Object.keys(d).forEach(id => {
    if (id === 'hintText' || id === 'modalDelete') return;
    const el = document.getElementById(id);
    if (el) el.innerHTML = d[id];
  });
  // ボタン色更新
  document.getElementById('langJa').style.background = lang === 'ja' ? 'var(--accent)' : 'rgba(255,255,255,0.07)';
  document.getElementById('langJa').style.color = lang === 'ja' ? '#000' : 'var(--text)';
  document.getElementById('langJa').style.fontWeight = lang === 'ja' ? '700' : '400';
  document.getElementById('langEn').style.background = lang === 'en' ? 'var(--accent)' : 'rgba(255,255,255,0.07)';
  document.getElementById('langEn').style.color = lang === 'en' ? '#000' : 'var(--text)';
  document.getElementById('langEn').style.fontWeight = lang === 'en' ? '700' : '400';
  // 設定に保存
  const s = getSettings();
  s.lang = lang;
  localStorage.setItem('igt_settings', JSON.stringify(s));
}
