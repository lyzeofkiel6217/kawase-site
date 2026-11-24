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
  // メニューの見出し：空白（全角・半角）で区切った言葉ごとに下線を引き、空白の部分には引かない
  function title(s) {
    var parts = String(s == null ? "" : s).split(/([ 　]+)/);
    return parts.map(function (p) {
      if (!p) return "";
      if (/^[ 　]+$/.test(p)) return esc(p) + "<wbr>";
      return '<span class="word">' + esc(p).replace(/・/g, "・<wbr>") + "</span>";
    }).join("");
  }
  function yen(n) {
    return typeof n === "number" ? "¥" + n.toLocaleString("ja-JP") : esc(n);
  }
  function telHref(t) {
    return "tel:" + String(t).replace(/[^0-9+]/g, "");
  }
  function rows(items) {
    return (items || []).map(function (it) {
      var popularClass = "";
      if (it.popular) {
        popularClass = " star";
        if (d.popularTwoLines !== false) {
          popularClass += " two-line" + (d.popularPriceCenter !== false ? " price-center" : "");
        }
      }
      return '<div class="row' + popularClass + '">' +
        '<span class="name">' + esc(it.name) + "</span>" +
        (it.popular ? '<span class="tag tag-accent">人気</span>' : "") +
        "<b>" + yen(it.price) + "</b></div>";
    }).join("");
  }
  // 同じ値段の品をまとめて1行にする（例: イチゴ・カンロ・レモン・メロン ¥300）
  // 品名は区切り（「・」など）の位置でだけ折り返し、名前の途中では改行しない
  function groupedRows(items, sep) {
    var groups = [];
    (items || []).forEach(function (it) {
      var g = groups.filter(function (x) { return x.price === it.price; })[0];
      if (g) g.names.push(it.name);
      else groups.push({ price: it.price, names: [it.name] });
    });
    return groups.map(function (g) {
      var names = g.names.map(function (n, idx) {
        var last = idx === g.names.length - 1;
        return '<span class="flavor">' + esc(n) + (last ? "" : esc(sep)) + "</span>";
      }).join("<wbr>");
      return '<div class="row group"><span class="name">' + names + "</span>" +
        "<b>" + yen(g.price) + "</b></div>";
    }).join("");
  }
  function menuRows(m) {
    return m.groupSamePrice ? groupedRows(m.items, m.separator || "・") : rows(m.items);
  }
  function card(m, extraClass) {
    if (!m) return "";
    return '<div class="card' + (extraClass ? " " + extraClass : "") + '">' +
      "<h3>" + title(m.title) + "</h3>" + menuRows(m) + "</div>";
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
  // 上のタブの左：看板の写真（logo）があれば写真、なければ店名の文字
  if (s.logo) {
    // showNameWithLogo が true なら、写真の右に店名の文字も並べる
    var withName = s.showNameWithLogo !== false;
    set("brand", '<img class="brand-logo" src="' + esc(s.logo) + '" alt="' + (withName ? "" : esc(s.name)) + '">' +
      (withName ? '<span class="brand-name">' + esc(s.name) + "</span>" : ""));
    var brandEl = document.getElementById("brand");
    if (brandEl) {
      brandEl.classList.add("has-logo");
      if (typeof s.logoWidth === "number") brandEl.style.setProperty("--logo-width", s.logoWidth + "vw");
      if (typeof s.logoMinWidth === "number") brandEl.style.setProperty("--logo-min", s.logoMinWidth + "px");
    }
  } else {
    set("brand", esc(s.name));
  }
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
  // 値段の札を出さない設定（showChips: false）のときは、札の欄ごと隠す
  var chipsEl = document.getElementById("hero-chips");
  if (chipsEl) chipsEl.style.display = (h.showChips === false || !(h.chips || []).length) ? "none" : "";
  attr("#hero-photo", "src", h.photo);
  attr("#hero-photo", "alt", h.photoAlt || "");
  brightness("#hero-photo", h.photoBrightness);
  // 写真の幅（ページの幅に対する %）。ページを広げると写真も大きくなる
  var heroEl = document.querySelector(".hero");
  if (heroEl && typeof h.photoWidth === "number") {
    heroEl.style.setProperty("--hero-photo-width", h.photoWidth + "%");
  }

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
      menuRows(k) +
      (k.note ? '<p class="ice-note">' + rich(k.note) + "</p>" : "") + "</div>";
  }

  set("menu-list",
    card(d.okonomiyaki) +
    card(d.yakisoba) +
    '<div class="side">' + card(d.double, "double") + "</div>" +
    ice);

  // ---- お献立の下の注意書き ----
  set("menu-notes", (d.notes || []).map(function (n) {
    return "<li>" + esc(d.notesMark || "") + rich(n) + "</li>";
  }).join(""));
  var notesEl = document.getElementById("menu-notes");
  if (notesEl) {
    notesEl.classList.toggle("notes-column", d.notesInRow === false);
    if (typeof d.notesGap === "number") notesEl.style.columnGap = d.notesGap + "px";
    notesEl.style.display = (d.notes || []).length ? "" : "none";
  }

  // ---- 営業時間・定休日 ----
  var hours = s.hours || [];
  set("hours-list", hours.map(function (h) {
    return '<div class="hours-row"><span class="hours-label">' + esc(h.label) + "</span>" +
      '<span class="hours-value">' + esc(h.value) + "</span></div>";
  }).join(""));
  var hoursEl = document.getElementById("hours");
  if (hoursEl) hoursEl.style.display = hours.length ? "" : "none";

  // ---- 店舗・アクセス ----
  set("access-address", esc(s.address));

  // ---- 欄が狭いとき、文字を欄の幅に合わせて小さくする ----
  // 対象: お店紹介の見出し・文章、看板メニューの文章、お献立の見出し・品名と値段・注意書き
  // いちばん小さくて textMinSize（content.js）まで。それでも入らないときだけ折り返す。
  var MIN = typeof d.textMinSize === "number" ? d.textMinSize : 12;
  var fitTargets = "#intro-title, #hero-title, #intro-text, #hero-text, .menu .card > h3, .menu .row, .notes li, .hours-row";
  document.querySelectorAll(fitTargets).forEach(function (el) {
    el.classList.add("fit");
  });

  // 1つの要素の文字を、欄に入る大きさまで小さくする（startSize を渡すとその大きさから始める）
  function fitOne(el, startSize) {
    el.style.fontSize = startSize ? startSize + "px" : "";
    el.classList.remove("fit-wrap");
    var size = parseFloat(getComputedStyle(el).fontSize);
    for (var n = 0; n < 4 && el.scrollWidth > el.clientWidth + 0.5; n++) {
      size = Math.max(MIN, size * el.clientWidth / el.scrollWidth);
      el.style.fontSize = size + "px";
      if (size === MIN) break;
    }
    if (el.scrollWidth > el.clientWidth + 0.5) el.classList.add("fit-wrap");
  }

  // メニューと同じ文字の大きさにするもの（sameSizeAsMenu）
  var sameTags = ["#intro-tag", "#hero-tag"];   // お店紹介・看板メニューの札
  var sameTexts = ["#intro-text", "#hero-text"]; // お店紹介・看板メニューの文章

  function fitText() {
    // 1) お献立の行を先に合わせる
    var menuRows = document.querySelectorAll(".menu .row.fit");
    menuRows.forEach(function (el) { fitOne(el); });

    // お献立の行の文字の大きさを、いちばん小さい行に合わせてそろえる（menuSameSize）
    var smallest = Infinity;
    menuRows.forEach(function (el) {
      smallest = Math.min(smallest, parseFloat(getComputedStyle(el).fontSize));
    });
    if (d.menuSameSize !== false && smallest !== Infinity) {
      menuRows.forEach(function (el) {
        el.style.fontSize = smallest + "px";
      });
    }
    var menuSize = smallest !== Infinity ? smallest : null;
    var same = d.sameSizeAsMenu !== false && menuSize;

    // 2) 札をメニューと同じ大きさにする
    sameTags.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.style.fontSize = same ? menuSize + "px" : "";
    });

    // 3) お店紹介の見出しを合わせ、看板メニューの見出しをそれと同じ大きさにする（headingSameSize）
    var introTitle = document.getElementById("intro-title");
    var heroTitle = document.getElementById("hero-title");
    var headingSize = null;
    if (introTitle) {
      fitOne(introTitle);
      headingSize = parseFloat(getComputedStyle(introTitle).fontSize);
    }
    if (heroTitle) {
      var sameHeading = d.headingSameSize !== false && headingSize;
      heroTitle.style.lineHeight = sameHeading && introTitle ? getComputedStyle(introTitle).lineHeight : "";
      fitOne(heroTitle, sameHeading ? headingSize : null);
    }

    // 4) 残りの文字を合わせる（紹介文はメニューと同じ大きさから始める）
    document.querySelectorAll(".fit").forEach(function (el) {
      if (el.matches(".menu .row") || el === introTitle || el === heroTitle) return;
      var isSameText = sameTexts.some(function (sel) { return el.matches(sel); });
      fitOne(el, isSameText && same ? menuSize : null);
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
  // 上のタブの高さを測り、「お献立」などのリンクで飛んだとき見出しがタブに隠れないようにする
  function measureNav() {
    var nav = document.querySelector(".nav");
    if (nav) document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
  }
  measureNav();
  window.addEventListener("resize", measureNav);
  window.addEventListener("load", measureNav);

  fitText();
  window.addEventListener("resize", fitLater);
  window.addEventListener("load", fitLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLater);
})();
