// content.js の内容（window.KAWASE）からページを組み立てるプログラム。
// 内容を変えるだけなら、このファイルは触らなくて大丈夫です。
(function () {
  var d = window.KAWASE;
  if (!d) {
    console.error("content.js が読み込めませんでした");
    return;
  }

  // ---- 小さな道具 ----
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // 改行(\n)→<br>、**太字**→<b>
  function rich(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }
  // 「・」の後ろで折り返せるようにする
  // \n で分けた1行ずつを <span class="line"> で囲む（行の途中で折り返さないため）
  function lines(s) {
    return String(s == null ? "" : s).split("\n").map(function (line) {
      return '<span class="line">' + rich(line) + "</span>";
    }).join("<br>");
  }
  function title(s) {
    return esc(s).replace(/・/g, "・<wbr>");
  }
  function yen(n) {
    return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : esc(n);
  }
  function telHref(t) {
    return "tel:" + String(t).replace(/[^0-9+]/g, "");
  }
  function rows(items) {
    return (items || []).map(function (it) {
      return '<div class="row' + (it.popular ? " star" : "") + '">' +
        '<span class="name">' + esc(it.name) + "</span>" +
        (it.popular ? '<span class="tag tag-accent">人気</span>' : "") +
        "<b>" + yen(it.price) + "</b></div>";
    }).join("");
  }
  function card(m, extraClass) {
    if (!m) return "";
    return '<div class="card' + (extraClass ? " " + extraClass : "") + '">' +
      "<h3>" + title(m.title) + "</h3>" + rows(m.items) + "</div>";
  }
  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function attr(selector, name, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.setAttribute(name, value);
    });
  }
  // 写真の明るさ（100 = 元のまま、数字を大きくすると明るくなる）
  function brightness(selector, value) {
    var el = document.querySelector(selector);
    if (el && typeof value === "number") el.style.filter = "brightness(" + value + "%)";
  }

  var s = d.shop || {};

  // ---- お店の名前・電話・地図 ----
  document.title = s.name || document.title;
  set("brand", esc(s.name));
  set("footer", "© " + esc(s.name));
  document.querySelectorAll("[data-tel-text]").forEach(function (el) {
    el.textContent = s.tel;
  });
  attr("[data-tel]", "href", telHref(s.tel));
  attr("[data-map]", "href", s.mapUrl);

  // ---- お店紹介 ----
  var i = d.intro || {};
  set("intro-tag", esc(i.tag));
  set("intro-title", lines(i.title));
  set("intro-text", lines(i.text));
  attr("#intro-photo", "src", i.photo);
  attr("#intro-photo", "alt", i.photoAlt || "");
  brightness("#intro-photo", i.photoBrightness);

  // ---- 看板メニュー ----
  var h = d.hero || {};
  set("hero-tag", esc(h.tag));
  set("hero-title", lines(h.title));
  set("hero-text", lines(h.text));
  set("hero-chips", (h.chips || []).map(function (c) {
    return '<span class="tag tag-outline">' + esc(c) + "</span>";
  }).join(""));
  attr("#hero-photo", "src", h.photo);
  attr("#hero-photo", "alt", h.photoAlt || "");
  brightness("#hero-photo", h.photoBrightness);

  // ---- お献立 ----
  set("menu-title", esc(d.menuTitle));
  set("menu-note", esc(d.menuNote));

  var k = d.kakigori;
  var ice = "";
  if (k && k.show !== false) {
    var flag = document.getElementById("kori-flag-template");
    ice = '<div class="card ice"><div class="ice-head"><h3>' + title(k.title) + "</h3>" +
      '<div class="ice-title">' + (k.badge ? '<span class="tag tag-ice">' + esc(k.badge) + "</span>" : "") +
      (flag ? flag.innerHTML : "") + "</div></div>" +
      rows(k.items) +
      (k.note ? '<p class="ice-note">' + rich(k.note) + "</p>" : "") + "</div>";
  }

  set("menu-list",
    card(d.okonomiyaki) +
    card(d.yakisoba) +
    '<div class="side">' + card(d.double, "double") +
      '<ul class="notes">' + (d.notes || []).map(function (n) {
        return "<li>" + rich(n) + "</li>";
      }).join("") + "</ul></div>" +
    ice);

  // ---- 店舗・アクセス ----
  set("access-holiday", esc(s.holiday));
  set("access-address", esc(s.address));

  // ---- 欄が狭いとき、文字を欄の幅に合わせて小さくする ----
  // 対象: お店紹介の見出し・文章、看板メニューの文章、お献立の見出し・品名と値段・注意書き
  // いちばん小さくて textMinSize（content.js）まで。それでも入らないときだけ折り返す。
  var MIN = typeof d.textMinSize === "number" ? d.textMinSize : 12;
  var fitTargets = "#intro-title, #intro-text, #hero-text, .menu .card > h3, .menu .row, .notes li";
  document.querySelectorAll(fitTargets).forEach(function (el) {
    el.classList.add("fit");
  });

  function fitText() {
    document.querySelectorAll(".fit").forEach(function (el) {
      el.style.fontSize = "";
      el.classList.remove("fit-wrap");
      var size = parseFloat(getComputedStyle(el).fontSize);
      for (var n = 0; n < 4 && el.scrollWidth > el.clientWidth + 0.5; n++) {
        size = Math.max(MIN, size * el.clientWidth / el.scrollWidth);
        el.style.fontSize = size + "px";
        if (size === MIN) break;
      }
      if (el.scrollWidth > el.clientWidth + 0.5) el.classList.add("fit-wrap");
    });
  }

  var waiting = false;
  function fitLater() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(function () {
      waiting = false;
      fitText();
    });
  }
  fitText();
  window.addEventListener("resize", fitLater);
  window.addEventListener("load", fitLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLater);
})();
