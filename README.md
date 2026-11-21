# お好み焼き かわせ Webサイト

お好み焼き かわせ（静岡県浜松市中央区）の店舗紹介ページ。PC・スマホ両対応の1ページ構成。

- `content.js` … **ページの内容（文章・値段・写真・連絡先）。ふだん編集するのはここだけ**
- `index.html` … ページの枠とデザイン（CSS）
- `render.js` … `content.js` の内容を `index.html` の枠にはめ込むプログラム
- `storefront.jpg` … 店舗外観の写真
- `deluxe.png` … 看板メニュー「デラックス」の写真

## 内容の変え方

`content.js` を開いて書き換え、保存してからブラウザを再読み込みします。

- 値段は数字だけで書く（`price: 600`）。「¥」とカンマは自動で付く
- `popular: true` を付けると「人気」マークが付く
- メニューを増やすときは `{ name: "...", price: 000 },` の行をコピーして追加する
- 文章中の `**太字**` は太字、`\n` は改行になる
- かき氷の欄は `kakigori.show` を `false` にすると非表示になる
- 写真を替えるときは、画像ファイルをこのフォルダに置き、`photo` にファイル名を書く

## 手元で確認する方法

`index.html` をダブルクリックで開いても表示できます。
Claude のブラウザ画面で見るときは `.claude/launch.json` の設定（`python -m http.server 8080`）で http://localhost:8080 を開きます。

## 公開方法（GitHub Pages）

Settings → Pages → Branch を `main` / `/ (root)` にして保存。
`content.js` と `render.js` も一緒にアップロードすること。
