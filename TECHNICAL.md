# Dreaming Idea Note (DIN) - 技術解説

このドキュメントでは、DIN がどういう仕組みで動いているかを解説します。
プログラミング初心者でも分かるように書いています。

---

## 全体の構成

DIN は **HTML + CSS + JavaScript** だけで動くウェブアプリです。
サーバーは不要で、ブラウザだけで完結します。

```
din2.html        ← 画面の構造（HTML）とデザイン（CSS）
din_script.js    ← アプリの動作（JavaScript）
voice_data.js    ← キャラクター音声データ（Base64エンコードされたWAVファイル）
```

---

## 使っている技術

### 1. 音声認識 — Web Speech API

ブラウザに内蔵されている音声認識機能を使っています。

```javascript
const recognition = new webkitSpeechRecognition();
recognition.lang = 'ja-JP';       // 日本語で認識
recognition.continuous = true;     // 話し続けても止まらない
recognition.interimResults = true; // 途中経過もリアルタイムで取得
```

- `onresult` イベントで、認識されたテキストを受け取る
- `isFinal` が `true` なら確定テキスト、`false` なら認識途中のテキスト
- 認識が途切れたら自動で再起動する（`onend` で `start()` を再呼び出し）

> Chrome / Edge でしか動きません。これはブラウザがGoogleの音声認識サーバーに音声を送って結果を返してもらう仕組みだからです。

### 2. 音声合成 — Web Speech Synthesis API（TTS）

テキストを声に変換して読み上げる機能です。「合いの手」や開始・終了フレーズに使います。

```javascript
const utter = new SpeechSynthesisUtterance('なるほどね');
utter.lang = 'ja-JP';
utter.pitch = 1.3;  // 声の高さ
utter.rate = 0.8;   // 読み上げ速度
utter.volume = 0.8; // 音量
speechSynthesis.speak(utter);
```

- ブラウザにインストールされている音声一覧は `speechSynthesis.getVoices()` で取得
- 設定画面で声の種類・高さ・速さを変更できる

### 3. キャラクター音声 — WAVファイル（Base64）

`voice_data.js` にはVOICEVOXで生成した音声がBase64形式で入っています。

```javascript
// voice_data.js の中身（イメージ）
window.VOICE_DATA = {
  "01_ずんだもん_なぁに": "data:audio/wav;base64,UklGRi...",
  "02_ずんだもん_おつかれ": "data:audio/wav;base64,UklGRi...",
  ...
};
```

- キー名の形式：`番号_キャラ名_セリフ`
- 各キャラの最初のキーが「開始時の声」、2番目が「終了時の声」
- 残りは合いの手やプロンプト（促し）に使われる
- `new Audio(base64文字列)` で再生するだけなので、サーバー不要

### 4. データ保存 — localStorage

録音した文字起こしテキストや設定は、ブラウザの `localStorage` に保存されます。

```javascript
// 保存
localStorage.setItem('igt_records', JSON.stringify(records));

// 読み込み
const records = JSON.parse(localStorage.getItem('igt_records') || '[]');
```

- `igt_records` — 記録テキストの配列（ID・日時・テキスト・録音時間）
- `igt_settings` — 設定値（音量、キャラ、フォントサイズなど）
- ブラウザを閉じてもデータは残る
- ただしブラウザのデータ消去で消える（サーバーには保存されない）

### 5. エクスポート — Blob + ダウンロード

テキストをファイルとして書き出す仕組みです。

```javascript
const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'filename.txt';
a.click();
```

- `\uFEFF` はBOM（Byte Order Mark）。Windowsのメモ帳で文字化けしないために付ける
- 改行は `\r\n`（Windows形式）に変換

### 6. クリップボードコピー — Clipboard API

モーダルのコピーボタンで使っています。

```javascript
navigator.clipboard.writeText(text).then(() => {
  // 成功
}).catch(() => {
  // 失敗時はフォールバック（古いブラウザ向け）
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
});
```

- HTTPS環境でないと `navigator.clipboard` は動かない
- GitHub Pages は HTTPS なので問題なし

---

## 主な機能の仕組み

### 合いの手（オウム返し）システム

ユーザーが話した内容の最後の部分をTTSで読み返す仕組みです。

1. 音声認識で確定テキストが来る
2. `triggerAizuchi()` が呼ばれる
3. `extractEchoText()` で直近の発話テキストを抽出
4. そのテキストをTTSで読み上げ + 画面に表示

### TTS反響（エコー）防止

TTS（読み上げ）の音声をマイクが拾ってしまう問題への対策です。

```
ユーザーが話す → 認識 → TTS読み上げ → マイクがTTSの音を拾う → 誤認識！
```

対策：
- **TTS発話中フラグ** (`isTTSSpeaking`) — TTS再生中は認識結果を無視
- **テキスト類似度チェック** (`isTTSEcho()`) — TTS終了後1.5秒間、認識テキストがTTSテキストと似ていたら無視

### 終了ワード検出

特定の言葉を言うと録音が自動停止します。

- 設定で変更可能（デフォルト：おわり、以上、おしまい、終了、stop、ストップ）
- 表記ゆれにも対応（「おわり」→「終わり」「終わった」も検出）
- 大文字小文字を無視（stop = Stop = STOP）

### 沈黙検出

一定時間（デフォルト30秒）何も話さないと：
1. まず「それから？」「それで？」などの促しフレーズを再生
2. さらに同じ時間沈黙が続いたら録音を自動停止

### 自動保存

録音中に一定間隔で自動的にlocalStorageに保存します。
ブラウザが突然閉じてもデータが失われません。
`beforeunload` イベントでも保存を試みます。

---

## 画面の仕組み

### メイン画面の操作

| 操作 | 非録音時 | 録音中 |
|------|----------|--------|
| タップ | 録音開始 | 録音停止 |
| スワイプ上 | ドロワー（設定・記録一覧）を開く | ― |
| スワイプ/スクロール | ― | テキストをスクロール |

- タッチイベント (`touchstart`, `touchmove`, `touchend`) で判定
- マウスクリック・ホイールにも対応（PC用）
- タッチとマウスの重複を `sourceCapabilities.firesTouchEvents` で防止

### テキスト表示のグラデーション効果

録音中のテキストは、新しい行ほど大きく明るく表示されます。

```javascript
const distFromEnd = total - 1 - i;  // 最新行からの距離
const size = Math.max(0.65, 1.15 - distFromEnd * 0.06);  // 遠いほど小さく
```

- 最新行はアクセントカラーで太字
- 古い行は小さく薄くなる
- スクロールすると `applyTextGradient()` で再計算

### ドロワー（設定・記録一覧）

画面下からスライドして出てくるパネルです。

- `transform: translateY(100%)` → `translateY(0)` のアニメーション
- オーバーレイ（暗い背景）をタップで閉じる
- タブ切り替えで「記録一覧」と「設定」を表示

### モーダル（記録詳細）

記録カードをタップすると表示される詳細画面です。

- 横スワイプで前後の記録に移動できる
- スライドアニメーション付き
- コピー・TXT・Markdownのエクスポートボタン

---

## 多言語対応（i18n）

日本語と英語に対応しています。

```javascript
const I18N = {
  ja: { hintText: 'タップ：録音開始 / 停止', ... },
  en: { hintText: 'Tap: Start / Stop recording', ... }
};
```

- HTMLの `id` とI18Nオブジェクトのキーを対応させて、`innerHTML` を書き換える
- 言語設定は `localStorage` に保存

---

## CSS変数によるカスタマイズ

```css
:root {
  --fs: 2;        /* UI全体のフォント倍率 */
  --fs-text: 2;   /* テキスト部分のフォント倍率 */
  --accent: #f0c040;  /* アクセントカラー */
}
```

- すべてのフォントサイズは `calc(基準サイズ * var(--fs))` で計算
- アクセントカラーを変えると、ボタン・テキスト・アニメーションが全部変わる
- JavaScriptから `document.documentElement.style.setProperty()` で動的に変更

---

## ファイルサイズについて

- `din2.html` + `din_script.js` は合わせて数十KB程度
- `voice_data.js` はキャラクター音声が入っているため数MB〜数十MBになる
- 音声なしでも動作する（TTS or 無音モード）

---

## セキュリティとプライバシー

- 音声データはGoogleの音声認識サーバーに送信される（Web Speech APIの仕様）
- 録音した文字起こしテキストはブラウザ内（localStorage）にのみ保存
- 外部サーバーへの送信は一切なし
- マイク許可はブラウザが管理（ユーザーが許可/拒否を選択）
