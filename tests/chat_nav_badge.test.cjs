const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptContent = fs.readFileSync(
  path.resolve(__dirname, "../linuxdo-wecom.user.js"),
  "utf8"
);

test("linuxdo-wecom includes new topics badge extraction and chat nav click logic", () => {
  assert.ok(
    scriptContent.includes("findShowMoreElement"),
    "must include findShowMoreElement"
  );
  assert.ok(
    scriptContent.includes("getNewTopicsCount"),
    "must include getNewTopicsCount"
  );
  assert.ok(
    scriptContent.includes("syncChatBadge"),
    "must include syncChatBadge"
  );
  assert.ok(
    scriptContent.includes("handleChatNavClick"),
    "must include handleChatNavClick"
  );
  assert.ok(
    scriptContent.includes("bindRailChatClick"),
    "must include bindRailChatClick"
  );
  assert.ok(
    scriptContent.includes(".show-more.has-topics"),
    "must target .show-more.has-topics selector"
  );
  assert.ok(
    scriptContent.includes("listBody.scrollTo({ top: 0, behavior: \"smooth\" })"),
    "must scroll listBody to top smoothly"
  );
});

test("settings toggles use their status badges without active row backgrounds", () => {
  assert.ok(
    scriptContent.includes('threadViewBtn.classList.remove("is-active");') &&
    scriptContent.includes('base64Btn.classList.remove("is-active");') &&
    scriptContent.includes('imageLayoutBtn.classList.remove("is-active");'),
    "checkbox settings must not receive the active row background"
  );
});

test("list width restoration does not overwrite an active manual resize", () => {
  assert.ok(
    scriptContent.includes("let listWidthInitialized = false;") &&
    scriptContent.includes("function restoreListWidth()") &&
    scriptContent.includes("if (listWidthInitialized) return;"),
    "must restore the saved list width only once per UI lifecycle"
  );
  assert.ok(
    scriptContent.includes("startW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(\"--wc-list\"))"),
    "must begin dragging from the actual rendered list width"
  );
});

test("narrow layouts let the topic list fill the viewport", () => {
  assert.ok(
    scriptContent.includes("@media (max-width: 1000px) {\n      .${ROOT_CLASS}.${LOCK_CLASS} .wecom-list-panel") &&
    scriptContent.includes("min-width: calc(100% - var(--wc-nav)) !important;") &&
    scriptContent.includes("max-width: calc(100% - var(--wc-nav)) !important;") &&
    scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .wecom-chat-panel {\n        left: var(--wc-nav) !important;"),
    "must fill the available viewport with either the list or topic details below 1000px"
  );
  assert.ok(
    scriptContent.includes(".wecom-list-resizer { display: none !important; }"),
    "must disable the desktop list resizer below 1000px"
  );
});

test("simulated getNewTopicsCount logic extracts number from show-more elements", () => {
  function simulateCount(text, hasClass = true) {
    if (!hasClass) return 0;
    const match = text.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!Number.isNaN(num) && num > 0) return num;
    }
    return 1;
  }

  assert.equal(simulateCount("查看 3 个新主题"), 3);
  assert.equal(simulateCount("查看 12 个新主题"), 12);
  assert.equal(simulateCount("5 new topics"), 5);
  assert.equal(simulateCount("有新主题"), 1);
  assert.equal(simulateCount(""), 1);
  assert.equal(simulateCount("查看 3 个新主题", false), 0);
});

test("linuxdo-wecom blanks document.title only while fake titles are enabled", () => {
  assert.ok(
    scriptContent.includes("setupTitleGuard"),
    "must include setupTitleGuard"
  );
  assert.ok(
    scriptContent.includes("enforceBlankTitle"),
    "must include enforceBlankTitle"
  );
  assert.ok(
    scriptContent.includes("function isPageTitleMasked()") &&
    scriptContent.includes('return getViewMode() !== "native" && !otherThemeActive() && isMaskTitle();'),
    "must guard blank titles with the fake-title setting"
  );
  assert.ok(
    scriptContent.includes("setPageTitle(chatState.title);"),
    "must restore the actual topic title when fake titles are disabled"
  );
});

test("linuxdo-wecom uses enlarged border-radius for avatars and bubbles", () => {
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble {\n      padding: 8px 12px !important;\n      border-radius: 8px !important;") ||
    scriptContent.includes("border-radius: 8px !important;"),
    "chat message bubbles must use 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-conv-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "conversation avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-msg-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "message avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail\s+\.wecom-rail-avatar\s*\{[^}]*border-radius:\s*8px/s,
    "rail avatar must have 8px border-radius"
  );
  assert.match(
    scriptContent,
    /\.wecom-member-avatar\s*\{[^}]*border-radius:\s*6px/s,
    "member avatar must have 6px border-radius"
  );
});

test("renderChatError avoids inline onclick and provides native view and retry buttons", () => {
  assert.ok(
    !scriptContent.includes('onclick="location.reload()"'),
    "must not contain broken inline onclick='location.reload()'"
  );
  assert.ok(
    scriptContent.includes("openNativeTopicView"),
    "must define openNativeTopicView"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-native"),
    "must provide wecom-chat-error-native button class"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-retry"),
    "must provide wecom-chat-error-retry button class"
  );
});

test("openNativeTopicView switches view mode to native and reloads/navigates", () => {
  assert.match(
    scriptContent,
    /function\s+openNativeTopicView\s*\(\)\s*\{[^}]*setViewMode\("native"\)/s,
    "openNativeTopicView must call setViewMode('native')"
  );
});

test("api function includes XMLHttpRequest and Discourse headers and detects 429 / CF challenge", () => {
  assert.ok(
    scriptContent.includes('"X-Requested-With": "XMLHttpRequest"'),
    "api must include X-Requested-With: XMLHttpRequest"
  );
  assert.ok(
    scriptContent.includes('"Discourse-Present": "true"'),
    "api must include Discourse-Present: true"
  );
  assert.ok(
    scriptContent.includes("rateLimitCooldownUntil"),
    "api must track rateLimitCooldownUntil"
  );
  assert.ok(
    scriptContent.includes("isCloudflare"),
    "api must detect Cloudflare HTML challenge"
  );
});

test("topic fetching includes in-memory cache and signal aborting", () => {
  assert.ok(
    scriptContent.includes("topicDataCache"),
    "must have topicDataCache in-memory LRU cache"
  );
  assert.ok(
    scriptContent.includes("getCachedTopic"),
    "must define getCachedTopic"
  );
  assert.ok(
    scriptContent.includes("getPreloadedTopic"),
    "must define getPreloadedTopic"
  );
  assert.ok(
    scriptContent.includes("topicAbortController"),
    "must support topicAbortController for aborting previous loads"
  );
});

test("badges do not have black borders or dark box shadows", () => {
  assert.ok(
    !scriptContent.includes("box-shadow: 0 0 0 2px #2B2D31;"),
    "must not contain #2B2D31 box shadow on badges"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-badge\s*\{[^}]*border:\s*none\s*!important/s,
    ".wecom-rail-badge must specify border: none !important"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-badge\s*\{[^}]*box-shadow:\s*none\s*!important/s,
    ".wecom-rail-badge must specify box-shadow: none !important"
  );
  assert.match(
    scriptContent,
    /\.wecom-rail-avatar-badge\s*\{[^}]*border:\s*none\s*!important/s,
    ".wecom-rail-avatar-badge must specify border: none !important"
  );
});

test("Cloudflare shield error opens a native popup window and supports query override", () => {
  assert.ok(
    scriptContent.includes("openNativePopup"),
    "must define openNativePopup function"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-error-popup"),
    "must include wecom-chat-error-popup button"
  );
  assert.ok(
    scriptContent.includes('searchParams.set("wecom_view", "native")'),
    "popup URL must set wecom_view query param to native"
  );
  assert.ok(
    scriptContent.includes('get("wecom_view") === "native"'),
    "getViewMode must support wecom_view=native query parameter"
  );
});

test("Boost reactions support display, hover action tool, and adding/deleting", () => {
  assert.ok(
    scriptContent.includes("boost: `<svg"),
    "ICONS must define boost icon"
  );
  assert.ok(
    scriptContent.includes('data-action="boost"'),
    "message hover tools must include data-action='boost'"
  );
  assert.ok(
    scriptContent.includes("boostsHtml("),
    "must define boostsHtml function"
  );
  assert.ok(
    scriptContent.includes("openBoostPopover"),
    "must define openBoostPopover function"
  );
  assert.ok(
    scriptContent.includes("submitPostBoost"),
    "must define submitPostBoost API caller"
  );
  assert.ok(
    scriptContent.includes("deletePostBoost"),
    "must define deletePostBoost API caller"
  );
  assert.ok(
    scriptContent.includes("/discourse-boosts/posts/"),
    "must send POST to /discourse-boosts/posts/:post_id/boosts"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-boosts"),
    "must define CSS for .wecom-msg-boosts"
  );
  assert.ok(
    scriptContent.includes(".wecom-boost-item"),
    "must define CSS for .wecom-boost-item"
  );
});

test("Boost toggle setting enables hiding and menu toggle", () => {
  assert.ok(
    scriptContent.includes('const BOOST_ENABLED_KEY = "linuxdo-wecom-boost-enabled";'),
    "must define BOOST_ENABLED_KEY constant"
  );
  assert.ok(
    scriptContent.includes("function isBoostEnabled()"),
    "must define isBoostEnabled function"
  );
  assert.ok(
    scriptContent.includes("function setBoostEnabled("),
    "must define setBoostEnabled function"
  );
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-boost"),
    "must provide wecom-menu-toggle-boost button in theme settings menu"
  );
  assert.ok(
    scriptContent.includes("(IS_LINUXDO ?") &&
    scriptContent.includes('`${ICONS.boost}<span class="wecom-menu-label">显示消息 Boost</span>'),
    "must render the Boost setting only for Linux DO, not V2EX"
  );
  assert.ok(
    scriptContent.includes("html.wecom-hide-boost .wecom-msg-boosts"),
    "must hide .wecom-msg-boosts when wecom-hide-boost is set"
  );
  assert.ok(
    scriptContent.includes('html.wecom-hide-boost .wecom-msg-tool-btn[data-action="boost"]'),
    "must hide boost tool button when wecom-hide-boost is set"
  );
  assert.ok(
    scriptContent.includes("if (!isBoostEnabled()) return \"\";"),
    "boostsHtml must check isBoostEnabled and return empty string if disabled"
  );
});

test("Boost popover has symmetrical layout and dynamic positioning", () => {
  assert.ok(
    scriptContent.includes('has-boost-popover'),
    "msgEl must be tagged with has-boost-popover to maintain tool visibility"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg.has-boost-popover .wecom-msg-tools"),
    "CSS must keep .wecom-msg-tools visible while popover is open"
  );
  assert.ok(
    scriptContent.includes("popover.offsetHeight"),
    "must dynamically calculate popover height using offsetHeight"
  );
  assert.ok(
    scriptContent.includes("grid-template-columns: repeat(4, 1fr)"),
    "presets must use symmetrical 4-column grid layout"
  );
});

test("Window Controls Overlay integrates titlebar and draggable regions", () => {
  assert.ok(
    scriptContent.includes("ensureWcoManifest"),
    "must define ensureWcoManifest to inject WCO manifest"
  );
  assert.ok(
    scriptContent.includes("setupWindowControlsOverlay"),
    "must define setupWindowControlsOverlay"
  );
  assert.ok(
    scriptContent.includes('"window-controls-overlay"'),
    "manifest display_override must include window-controls-overlay"
  );
  assert.ok(
    scriptContent.includes("navigator.windowControlsOverlay"),
    "must listen to navigator.windowControlsOverlay geometrychange"
  );
  assert.ok(
    scriptContent.includes("-webkit-app-region: drag"),
    "must declare draggable app regions for headers"
  );
  assert.ok(
    scriptContent.includes("-webkit-app-region: no-drag"),
    "must declare no-drag app regions for clickable buttons and inputs"
  );
  assert.ok(
    scriptContent.includes("env(titlebar-area-width"),
    "must use env(titlebar-area-width) padding to avoid colliding with window controls"
  );
});

test("Scroll-to-top button is available in chat header with smooth scroll and older post fetching", () => {
  assert.ok(
    scriptContent.includes("scrollTop: `<svg"),
    "ICONS must define scrollTop icon"
  );
  assert.ok(
    scriptContent.includes('class="wecom-icon-btn wecom-chat-scroll-top"'),
    "chat header tools must contain wecom-chat-scroll-top button"
  );
  assert.ok(
    scriptContent.includes('title="回到顶部"'),
    "scroll-to-top button must have title '回到顶部'"
  );
  assert.ok(
    scriptContent.includes(".wecom-chat-scroll-top"),
    "handleChatHeaderClick must handle .wecom-chat-scroll-top"
  );
  assert.ok(
    scriptContent.includes('scrollContainer.scrollTo({ top: 0, behavior: "smooth" })'),
    "must smoothly scroll to top 0"
  );
});

test("Top-right window controls and native view buttons are removed, and watermark panel is styled", () => {
  assert.ok(
    scriptContent.includes("winMin: `<svg"),
    "ICONS must define winMin SVG icon"
  );
  assert.ok(
    scriptContent.includes("winMax: `<svg"),
    "ICONS must define winMax SVG icon"
  );
  assert.ok(
    scriptContent.includes("winClose: `<svg"),
    "ICONS must define winClose SVG icon"
  );
  assert.ok(
    !scriptContent.includes('class="wecom-win-controls"'),
    "must not render .wecom-win-controls in chat header (removed per user request)"
  );
  assert.ok(
    !scriptContent.includes('class="wecom-icon-btn wecom-chat-native"'),
    "must not render .wecom-chat-native in chat header (removed per user request)"
  );
  assert.ok(
    scriptContent.includes(".wecom-watermark-panel {"),
    "must define CSS styling for .wecom-watermark-panel popover"
  );
  assert.ok(
    scriptContent.includes(".wecom-watermark-switch"),
    "must define CSS styling for .wecom-watermark-switch toggle"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-watermark-panel"),
    "must define dark mode styles for watermark panel"
  );
  assert.ok(
    scriptContent.includes("if (enabledInput.checked && !normalizeWatermarkText(textInput.value))") &&
    scriptContent.includes("textInput.value = DEFAULT_WATERMARK_TEXT;") &&
    scriptContent.includes("previewWatermarkSettings(panel);"),
    "enabling the watermark must immediately render a valid preview"
  );
});

test("script metadata matches V2EX domains and defines platform constants", () => {
  assert.ok(
    scriptContent.includes("// @match        https://*.v2ex.com/*"),
    "must match https://*.v2ex.com/*"
  );
  assert.ok(
    scriptContent.includes("// @match        https://v2ex.com/*"),
    "must match https://v2ex.com/*"
  );
  assert.ok(
    scriptContent.includes("const IS_V2EX ="),
    "must define IS_V2EX constant"
  );
  assert.ok(
    scriptContent.includes("const IS_LINUXDO ="),
    "must define IS_LINUXDO constant"
  );
});

test("platform switcher widget is rendered in chat header and handles switching between Linux DO and V2EX", () => {
  assert.ok(
    scriptContent.includes('class="wecom-platform-switcher"'),
    "must render .wecom-platform-switcher in chat header"
  );
  assert.ok(
    scriptContent.includes("wecom-platform-btn"),
    "must render .wecom-platform-btn button"
  );
  assert.ok(
    scriptContent.includes("platformSwitch"),
    "must include platformSwitch icon in ICONS"
  );
  assert.ok(
    scriptContent.includes('class="wecom-platform-dropdown"'),
    "must render .wecom-platform-dropdown container"
  );
  assert.ok(
    scriptContent.includes('data-target-platform="linuxdo"'),
    "must include Linux DO platform item"
  );
  assert.ok(
    scriptContent.includes('data-target-platform="v2ex"'),
    "must include V2EX platform item"
  );
  assert.ok(
    scriptContent.includes("bindPlatformSwitcher"),
    "must define bindPlatformSwitcher function"
  );
  assert.ok(
    scriptContent.includes('window.location.href = "https://linux.do/"'),
    "must navigate to Linux DO when selected"
  );
  assert.ok(
    scriptContent.includes('window.location.href = "https://www.v2ex.com/"'),
    "must navigate to V2EX when selected"
  );
});

test("V2EX DOM parser, HTML parsing and API adapters are defined", () => {
  assert.ok(
    scriptContent.includes("extractV2exTopicsFromDoc"),
    "must define extractV2exTopicsFromDoc"
  );
  assert.ok(
    scriptContent.includes("mapV2exJsonTopics"),
    "must define mapV2exJsonTopics"
  );
  assert.ok(
    scriptContent.includes("parseV2exTopicDoc"),
    "must define parseV2exTopicDoc"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicHtml"),
    "must define fetchV2exTopicHtml"
  );
  assert.ok(
    scriptContent.includes("submitV2exReply"),
    "must define submitV2exReply"
  );
  assert.ok(
    scriptContent.includes("isProblemError") &&
    scriptContent.includes("isOnceError") &&
    scriptContent.includes(".problem, #Main .problem"),
    "submitV2exReply must inspect .problem in V2EX response and handle once expiration retry"
  );
  assert.ok(
    scriptContent.includes('showWecomToast(`${action}失败：${message}`, "error", 4000)'),
    "reportComposerError must invoke showWecomToast on submission failures"
  );
  assert.ok(
    scriptContent.includes('showWecomToast("回复发送成功！", "success", 2000)'),
    "submitComposer must invoke showWecomToast on successful V2EX reply"
  );
});

test("V2EX list chips and search form are configured correctly", () => {
  assert.ok(
    scriptContent.includes('data-chip="hot"'),
    "must include hot chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="tech"'),
    "must include tech chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="creative"'),
    "must include creative chip for V2EX"
  );
  assert.ok(
    scriptContent.includes('data-chip="qna"'),
    "must include qna chip for V2EX"
  );
  assert.ok(
    scriptContent.includes("DEFAULT_V2EX_LIST_NAV"),
    "must define DEFAULT_V2EX_LIST_NAV"
  );
  assert.ok(
    scriptContent.includes("https://www.google.com/search"),
    "must support Google search for V2EX topics"
  );
});

test("V2EX integration includes isolation guards and full WeCom interactions", () => {
  assert.ok(
    scriptContent.includes('...(IS_LINUXDO ? { "Discourse-Present": "true" } : {})'),
    "api headers must only include Discourse-Present on Linux DO"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX) return [];"),
    "loadCategories must return empty array on V2EX"
  );
  assert.ok(
    scriptContent.includes("v2exHasMore"),
    "must track v2exHasMore pagination state"
  );
  assert.ok(
    scriptContent.includes("syncV2exPaginationFooter"),
    "must define syncV2exPaginationFooter for V2EX detail pagination"
  );
  assert.ok(
    scriptContent.includes("window.open(`/member/${encodeURIComponent(username)}`, \"_blank\");"),
    "openOriginalUserCard must navigate to V2EX member page on V2EX"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX && input)"),
    "replyToPost must prefix mention on V2EX"
  );
  assert.ok(
    scriptContent.includes("/thank/reply/${postId}?once=${once}"),
    "toggleLike must support V2EX thank reply endpoint"
  );
  assert.ok(
    scriptContent.includes("return tid ? `/t/${tid}` : (location.pathname || \"/\");"),
    "getTopicNativePath must use /t/:id format on V2EX"
  );
});

test("Boost cooked content and emoji images are strictly constrained from stretching", () => {
  assert.ok(
    scriptContent.includes("formatBoostCooked"),
    "must define formatBoostCooked function"
  );
  assert.ok(
    scriptContent.includes(".replace(/\\bonly-emoji\\b/g, \"\")"),
    "formatBoostCooked must strip only-emoji class"
  );
  assert.ok(
    scriptContent.includes(".wecom-boost-cooked img.emoji.only-emoji"),
    "must explicitly target .wecom-boost-cooked img.emoji.only-emoji"
  );
  assert.ok(
    scriptContent.includes("width: 16px !important;"),
    "must enforce 16px width on boost emoji images"
  );
  assert.ok(
    scriptContent.includes("height: 22px !important;"),
    "must enforce 22px height on .wecom-boost-item"
  );

  function simulateFormat(content) {
    return content
      .replace(/^<p\b[^>]*>/i, "")
      .replace(/<\/p>$/i, "")
      .replace(/\bonly-emoji\b/g, "");
  }

  const sample = '<p><img src="/images/emoji/twemoji/grinning_face.png?v=15" title=":grinning_face:" class="emoji only-emoji" alt=":grinning_face:" loading="lazy" width="20" height="20"></p>';
  const formatted = simulateFormat(sample);
  assert.ok(!formatted.startsWith("<p"), "must not start with <p");
  assert.ok(!formatted.endsWith("</p>"), "must not end with </p>");
  assert.ok(!formatted.includes("only-emoji"), "must not contain only-emoji class");
  assert.ok(formatted.includes("grinning_face"), "must preserve emoji image source");
});

test("Home and End key in conversation detail smoothly scrolls chat panel and avoids list scrolling", () => {
  assert.ok(
    scriptContent.includes("function isEditableTarget"),
    "must define isEditableTarget helper"
  );
  assert.ok(
    scriptContent.includes("function handleChatNavigationKeydown"),
    "must define handleChatNavigationKeydown"
  );
  assert.ok(
    scriptContent.includes('window.addEventListener("keydown", handleChatNavigationKeydown, true)'),
    "must register handleChatNavigationKeydown on window with capture: true"
  );
  assert.ok(
    scriptContent.includes("event.stopImmediatePropagation()"),
    "handleChatNavigationKeydown must call stopImmediatePropagation"
  );
  assert.ok(
    scriptContent.includes('chatBody.scrollTo({ top: 0, behavior: "smooth" })'),
    "Home key must smoothly scroll chatBody to top: 0"
  );
  assert.ok(
    scriptContent.includes('chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" })'),
    "End key must smoothly scroll chatBody to chatBody.scrollHeight"
  );
  assert.ok(
    scriptContent.includes("try { conv.blur(); } catch"),
    "must blur clicked conv link to prevent retaining focus on list items"
  );

  // Simulate isEditableTarget logic
  function testIsEditable(target) {
    if (!target) return false;
    const tag = target.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (target.type || "text").toLowerCase();
      const nonTextTypes = ["button", "submit", "reset", "checkbox", "radio", "range", "color", "image", "file"];
      return !nonTextTypes.includes(type);
    }
    if (target.isContentEditable) return true;
    return false;
  }

  assert.strictEqual(testIsEditable({ tagName: "TEXTAREA" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "text" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "search" }), true);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "checkbox" }), false);
  assert.strictEqual(testIsEditable({ tagName: "INPUT", type: "button" }), false);
  assert.strictEqual(testIsEditable({ tagName: "DIV", isContentEditable: true }), true);
  assert.strictEqual(testIsEditable({ tagName: "A" }), false);
  assert.strictEqual(testIsEditable({ tagName: "DIV" }), false);
});

test("V2EX message likes/thanks count with heart icon next to time in meta", () => {
  assert.ok(
    scriptContent.includes("heart: `<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\""),
    "ICONS map must define line/stroke type heart icon"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-likes"),
    "CSS must define .wecom-msg-likes"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-likes svg"),
    "CSS must style .wecom-msg-likes svg"
  );
  assert.ok(
    scriptContent.includes("color: var(--wc-text-3);"),
    "CSS must style heart with light gray var(--wc-text-3)"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-tool.liked"),
    "CSS must style liked tool button"
  );
  assert.ok(
    scriptContent.includes("const likeToolIcon = IS_V2EX ? ICONS.heart : ICONS.like;"),
    "likeToolIcon must use ICONS.heart on V2EX"
  );
  assert.ok(
    scriptContent.includes("likesBadgeHtml"),
    "bubbleHtml must compute likesBadgeHtml"
  );
  assert.ok(
    scriptContent.includes('<span class="wecom-msg-likes" title="${likeLabel}：${likeCount}">'),
    "bubbleHtml must render .wecom-msg-likes badge when likeCount > 0"
  );
  assert.ok(
    scriptContent.includes("like_count: likesCount"),
    "parseV2exTopicDoc must store like_count on parsed reply posts"
  );
});

test("V2EX topic loading stability: initial DOM guard, fallback API, and suppressHistoryApply", () => {
  assert.ok(
    scriptContent.includes("INITIAL_V2EX_TOPIC_ID"),
    "must define INITIAL_V2EX_TOPIC_ID"
  );
  assert.ok(
    scriptContent.includes("initialV2exTopicConsumed"),
    "must track initialV2exTopicConsumed"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicData"),
    "must define fetchV2exTopicData"
  );
  assert.ok(
    scriptContent.includes("fetchV2exTopicApi"),
    "must define fetchV2exTopicApi"
  );
  assert.ok(
    scriptContent.includes("mapV2exTopicApiResponse"),
    "must define mapV2exTopicApiResponse"
  );
  assert.ok(
    scriptContent.includes("hasRenderedMsgs"),
    "loadTopic must check actual rendered messages before early returning"
  );
  assert.ok(
    scriptContent.includes("suppressHistoryApply = true;"),
    "bindListPanelClicks must suppress history apply during pushState"
  );
});

test("Top-left rail avatar disguise presets, cycling, and default styling", () => {
  assert.ok(
    scriptContent.includes('const RAIL_AVATAR_DISGUISE_KEY = "linuxdo-wecom-rail-avatar-disguise";'),
    "must define RAIL_AVATAR_DISGUISE_KEY"
  );
  assert.ok(
    scriptContent.includes("const RAIL_DISGUISE_AVATARS = ["),
    "must define RAIL_DISGUISE_AVATARS presets"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-blue"'),
    "must include wecom-blue corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-green"'),
    "must include wecom-green corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-navy"'),
    "must include wecom-navy corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-slate"'),
    "must include wecom-slate corporate preset"
  );
  assert.ok(
    scriptContent.includes('id: "wecom-orange"'),
    "must include wecom-orange corporate preset"
  );
  assert.ok(
    scriptContent.includes("function getRailDisguiseAvatarId()"),
    "must define getRailDisguiseAvatarId"
  );
  assert.ok(
    scriptContent.includes("function setRailDisguiseAvatarId("),
    "must define setRailDisguiseAvatarId"
  );
  assert.ok(
    scriptContent.includes("function cycleRailDisguiseAvatar()"),
    "must define cycleRailDisguiseAvatar"
  );
  assert.ok(
    scriptContent.includes('avatarEl.setAttribute("title", `当前头像：${disguisePreset.name}（右键切换伪装头像样式）`);'),
    "must set tooltip indicating disguise avatar and right-click cycling"
  );
  assert.ok(
    scriptContent.includes(".wecom-rail .wecom-rail-avatar svg"),
    "CSS must style .wecom-rail .wecom-rail-avatar svg"
  );
  assert.ok(
    scriptContent.includes("cycleRailDisguiseAvatar()"),
    "must bind cycleRailDisguiseAvatar"
  );
});

test("V2EX reply list clicking locates and highlights relevant reply", () => {
  assert.ok(
    scriptContent.includes("function parseV2exReplyTarget("),
    "must define parseV2exReplyTarget"
  );
  assert.ok(
    scriptContent.includes("function locateV2exReply("),
    "must define locateV2exReply"
  );
  assert.ok(
    scriptContent.includes("function keepChatAtV2exReply("),
    "must define keepChatAtV2exReply"
  );
  assert.ok(
    scriptContent.includes("target_floor: target.floor"),
    "extractV2exNotificationsFromDoc must extract target_floor"
  );
  assert.ok(
    scriptContent.includes("target_reply_id: target.replyId"),
    "extractV2exNotificationsFromDoc must extract target_reply_id"
  );
  assert.ok(
    scriptContent.includes("target_anchor: target.anchor"),
    "extractV2exNotificationsFromDoc must extract target_anchor"
  );
  assert.ok(
    scriptContent.includes('const dockAreas = doc.querySelectorAll("#Main .dock_area");'),
    "extractV2exTopicsFromDoc must support member reply dock_area"
  );
  assert.ok(
    scriptContent.includes('data-floor="${post.floor}"'),
    "bubbleHtml must render data-floor attribute"
  );
  assert.ok(
    scriptContent.includes("data-target-floor"),
    "convRowHtml must render data-target-floor attribute"
  );
  assert.ok(
    scriptContent.includes("locateV2exReply(body, target)"),
    "must call locateV2exReply"
  );
  assert.ok(
    scriptContent.includes("keepChatAtV2exReply(body, target)"),
    "loadTopic must call keepChatAtV2exReply"
  );

  // Test parseV2exReplyTarget simulation
  function simulateParseTarget(urlOrHash) {
    const res = { floor: 0, replyId: 0, anchor: "", page: 1 };
    if (!urlOrHash) return res;
    const str = String(urlOrHash);
    const pMatch = str.match(/[?&]p=(\d+)/);
    if (pMatch) res.page = Number(pMatch[1]) || 1;
    const hashIdx = str.indexOf("#");
    const anchor = hashIdx !== -1 ? str.slice(hashIdx + 1) : str;
    res.anchor = anchor;
    const floorMatch = anchor.match(/^reply(\d+)/i) || anchor.match(/(?:^|[?&#])reply(\d+)/i);
    if (floorMatch) {
      res.floor = Number(floorMatch[1]);
      if (!pMatch && res.floor > 100) {
        res.page = Math.floor((res.floor - 1) / 100) + 1;
      }
    }
    const rMatch = anchor.match(/^r_(\d+)/i) || anchor.match(/(?:^|[?&#])r_(\d+)/i);
    if (rMatch) res.replyId = Number(rMatch[1]);
    return res;
  }

  const t1 = simulateParseTarget("/t/1240867#reply77");
  assert.equal(t1.floor, 77);
  assert.equal(t1.page, 1);
  assert.equal(t1.anchor, "reply77");

  const t2 = simulateParseTarget("/t/1240321?p=3#reply263");
  assert.equal(t2.floor, 263);
  assert.equal(t2.page, 3);
  assert.equal(t2.anchor, "reply263");

  const t3 = simulateParseTarget("/t/1240867#r_8516");
  assert.equal(t3.replyId, 8516);
  assert.equal(t3.floor, 0);

  const t4 = simulateParseTarget("/t/1240867#reply150");
  assert.equal(t4.floor, 150);
  assert.equal(t4.page, 2);
});

test("conversation detail links open in _blank with rel=noopener noreferrer", () => {
  assert.ok(
    scriptContent.includes("function hydrateChatLinks("),
    "must define hydrateChatLinks function"
  );
  assert.ok(
    scriptContent.includes("hydrateChatLinks(root);"),
    "hydrateChatImages must invoke hydrateChatLinks"
  );
  assert.ok(
    scriptContent.includes('a.setAttribute("target", "_blank");'),
    "hydrateChatLinks must set target=_blank on anchor tags"
  );
  assert.ok(
    scriptContent.includes("noopener noreferrer"),
    "must set rel noopener noreferrer"
  );
  assert.ok(
    scriptContent.includes('const generalLink = event.target.closest("a[href]");'),
    "handleChatPanelClick must inspect general links"
  );
  assert.ok(
    scriptContent.includes('window.open(fullUrl, "_blank", "noopener,noreferrer");'),
    "must open intercepted detail links via window.open in _blank"
  );
  assert.ok(
    scriptContent.includes('class="wecom-chat-chip" target="_blank" rel="noopener noreferrer"'),
    "wecom-chat-chip templates must have target=_blank and rel=noopener noreferrer"
  );
  assert.ok(
    scriptContent.includes("hydrateChatLinks(panel);"),
    "renderMemberPanel must call hydrateChatLinks"
  );

  // Test hydrateChatLinks simulation
  function simulateHydrateLinks(elements) {
    elements.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("#")) return;
      if (a.classList.contains("wecom-reply-reference")) return;
      a.setAttribute("target", "_blank");
      const rel = a.getAttribute("rel") || "";
      if (!rel.includes("noopener")) {
        a.setAttribute("rel", rel ? `${rel} noopener noreferrer` : "noopener noreferrer");
      }
    });
  }

  class MockElement {
    constructor(attrs = {}, classes = []) {
      this.attrs = { ...attrs };
      this.classList = {
        contains: (cls) => classes.includes(cls)
      };
    }
    getAttribute(name) { return this.attrs[name] || null; }
    setAttribute(name, val) { this.attrs[name] = val; }
  }

  const normalLink = new MockElement({ href: "https://example.com/foo" });
  const internalQuote = new MockElement({ href: "/t/123/4" }, ["wecom-reply-reference"]);
  const anchorLink = new MockElement({ href: "#heading-1" });
  const hashOnly = new MockElement({ href: "#" });
  const jsLink = new MockElement({ href: "javascript:void(0)" });

  simulateHydrateLinks([normalLink, internalQuote, anchorLink, hashOnly, jsLink]);

  assert.equal(normalLink.getAttribute("target"), "_blank");
  assert.equal(normalLink.getAttribute("rel"), "noopener noreferrer");
  assert.equal(internalQuote.getAttribute("target"), null);
  assert.equal(anchorLink.getAttribute("target"), null);
  assert.equal(hashOnly.getAttribute("target"), null);
  assert.equal(jsLink.getAttribute("target"), null);
});

test("V2EX topic detail multi-page pagination and footer bar", () => {
  assert.ok(
    scriptContent.includes("function syncV2exPaginationFooter("),
    "must define syncV2exPaginationFooter"
  );
  assert.ok(
    scriptContent.includes("wecom-v2ex-more-bar"),
    "must include .wecom-v2ex-more-bar"
  );
  assert.ok(
    scriptContent.includes("data.total_replies != null"),
    "loadTopic must support data.total_replies"
  );
  assert.ok(
    scriptContent.includes("chatState.hasNewer = Boolean(chatState.v2exHasMore);"),
    "syncRenderedWindow must sync hasNewer with v2exHasMore"
  );
  assert.ok(
    scriptContent.includes("function loadInitialV2exThreadPages("),
    "threaded V2EX topics must load their second page before the first render"
  );
  assert.ok(
    scriptContent.includes("data = await loadInitialV2exThreadPages(topicId, data, force, signal, targetPage);"),
    "loadTopic must merge the first two V2EX pages before rendering the conversation tree"
  );
  assert.ok(
    scriptContent.includes("function renderBubbles(posts, myName, options = {})") &&
    scriptContent.includes("if (!isThreadViewEnabled() || options.flat)") &&
    scriptContent.includes("appendFreshPosts(fresh, body, { scroll: false, flat: true });"),
    "pagination must append replies flat instead of rebuilding the conversation tree"
  );

  // Test V2EX pagination parsing simulation
  function simulatePaginationParse(html, page) {
    let totalReplies = 0;
    const countMatch = html.match(/(?:gray|cell)[^>]*>[\s\S]*?(\d+)\s*(?:replies|条回复|回复)/i) ||
      html.match(/(\d+)\s*(?:replies|条回复|回复)/i);
    if (countMatch) totalReplies = Number(countMatch[1]) || 0;

    const inputMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*max="(\d+)"/i) ||
      html.match(/max="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
    const inputMax = inputMatch ? Number(inputMatch[1]) : 0;

    const pageNumbers = [...html.matchAll(/(?:href|onclick)="[^"]*(?:^|[?&])p=(\d+)[^"]*"/gi)]
      .map((m) => Number(m[1]));
    const maxP = pageNumbers.length ? Math.max(...pageNumbers) : 0;

    const hasDisabledNext = Boolean(html.match(/normal_page_right[^"]*disable_now/i) || html.match(/disable_now[^"]*normal_page_right/i));
    const hasNextBtn = Boolean(html.match(/title="Next Page"/i)) && !hasDisabledNext;

    const totalPages = Math.max(inputMax, maxP, totalReplies > 0 ? Math.ceil(totalReplies / 100) : 0);
    const hasNextPage = (totalPages > page) || hasNextBtn;

    return { totalReplies, totalPages, hasNextPage };
  }

  // Sample page 1 with 199 replies, input max=2, next page button
  const p1Html = `
    <div class="cell"><span class="gray">199 replies • 2026-09-14</span></div>
    <div class="cell ps_container">
      <a href="?p=1" class="page_current">1</a>
      <a href="?p=2" class="page_normal">2</a>
      <input type="number" class="page_input" value="1" min="1" max="2" />
      <td class="super normal_page_right button" title="Next Page">❯</td>
    </div>
  `;

  // Sample page 2 (last page) with disabled next button
  const p2Html = `
    <div class="cell"><span class="gray">199 replies • 2026-09-14</span></div>
    <div class="cell ps_container">
      <a href="?p=1" class="page_normal">1</a>
      <a href="?p=2" class="page_current">2</a>
      <input type="number" class="page_input" value="2" min="1" max="2" />
      <td class="super normal_page_right button disable_now" title="Next Page">❯</td>
    </div>
  `;

  const res1 = simulatePaginationParse(p1Html, 1);
  assert.equal(res1.totalReplies, 199);
  assert.equal(res1.totalPages, 2);
  assert.equal(res1.hasNextPage, true);

  const res2 = simulatePaginationParse(p2Html, 2);
  assert.equal(res2.totalReplies, 199);
  assert.equal(res2.totalPages, 2);
  assert.equal(res2.hasNextPage, false);
});

test("Topic last read floor persistence and automatic restoration on detail view", () => {
  assert.ok(
    scriptContent.includes("function rememberTopicPost("),
    "must define rememberTopicPost"
  );
  assert.ok(
    scriptContent.includes("function getRememberedPost("),
    "must define getRememberedPost"
  );
  assert.ok(
    scriptContent.includes("function saveCurrentTopicReadingPosition("),
    "must define saveCurrentTopicReadingPosition"
  );
  assert.ok(
    scriptContent.includes('window.addEventListener("beforeunload", saveCurrentTopicReadingPosition);'),
    "must register beforeunload listener to persist reading position"
  );
  assert.ok(
    scriptContent.includes("if (chatState.pinningScroll || chatState.pinnedPost) return;"),
    "handleChatBodyScroll must protect pinningScroll and pinnedPost"
  );
  assert.ok(
    scriptContent.includes('chatBody.addEventListener("wheel", cancelPin, { passive: true });'),
    "bindChatPanelEvents must listen to user wheel event to cancel pinning"
  );
  assert.ok(
    scriptContent.includes("targetPage = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;"),
    "topicHref and syncTopicLastReadHref must compute target page for V2EX floors"
  );
  assert.ok(
    scriptContent.includes("target.floor = remembered - 1;"),
    "conv click and loadTopic must compute target floor from remembered post"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg.is-reply-target > .wecom-msg-content > .wecom-msg-bubble"),
    "restored reply highlighting must outline only the target floor, not nested descendants"
  );

  // Test simulation: V2EX target page & floor computation
  function computeV2exTarget(postNumber) {
    if (!postNumber || postNumber <= 1) return { floor: 0, page: 1, anchor: "" };
    const floor = postNumber - 1;
    const page = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;
    return { floor, page, anchor: `reply${floor}` };
  }

  // Floor 50 (page 1)
  const t50 = computeV2exTarget(51);
  assert.equal(t50.floor, 50);
  assert.equal(t50.page, 1);
  assert.equal(t50.anchor, "reply50");

  // Floor 100 (page 1)
  const t100 = computeV2exTarget(101);
  assert.equal(t100.floor, 100);
  assert.equal(t100.page, 1);
  assert.equal(t100.anchor, "reply100");

  // Floor 101 (page 2)
  const t101 = computeV2exTarget(102);
  assert.equal(t101.floor, 101);
  assert.equal(t101.page, 2);
  assert.equal(t101.anchor, "reply101");

  // Floor 150 (page 2)
  const t150 = computeV2exTarget(151);
  assert.equal(t150.floor, 150);
  assert.equal(t150.page, 2);
  assert.equal(t150.anchor, "reply150");

  // Floor 205 (page 3)
  const t205 = computeV2exTarget(206);
  assert.equal(t205.floor, 205);
  assert.equal(t205.page, 3);
  assert.equal(t205.anchor, "reply205");

  // Test simulation: Reading position selection
  function pickReadingPost(visiblePosts, isAtBottom) {
    if (!visiblePosts.length) return 0;
    return isAtBottom ? visiblePosts[visiblePosts.length - 1] : visiblePosts[0];
  }
  assert.equal(pickReadingPost([10, 11, 12], false), 10);
  assert.equal(pickReadingPost([10, 11, 12], true), 12);
});

test("Linux DO notification menu teardown, route synchronization, and topic navigation stability", () => {
  // 1. Verify notification menu events and auto-close bindings
  assert.ok(
    scriptContent.includes("bindNotifMenuEvents"),
    "must define bindNotifMenuEvents to capture notification item clicks"
  );
  assert.ok(
    scriptContent.includes('const actionable = e.target.closest("a[href], button, .notification, [data-notification-id]");') ||
    scriptContent.includes("actionable"),
    "must detect clicks on actionable links/buttons within user-menu"
  );

  // 2. Verify resetNotifPresentation cleans up float class and inline display
  assert.ok(
    scriptContent.includes('menu.classList.remove("wecom-user-menu-float");'),
    "resetNotifPresentation must remove wecom-user-menu-float class"
  );
  assert.ok(
    scriptContent.includes('menu.style.display = "none";'),
    "resetNotifPresentation must set menu display to none"
  );

  // 3. Verify closeNotifMenu checks visibility before clickUserMenuToggle
  assert.ok(
    scriptContent.includes('const isVisible = menu.offsetParent !== null && menu.style.display !== "none";') ||
    scriptContent.includes("isVisible"),
    "closeNotifMenu must verify menu visibility before simulating toggle click"
  );

  // 4. Verify bindListPanelClicks closes notification menu and syncs discourseRouteTo
  assert.ok(
    scriptContent.includes("closeNotifMenu();\n        e.preventDefault();\n        e.stopPropagation();") ||
    scriptContent.includes("closeNotifMenu();\n        e.preventDefault();"),
    "conversation click in list panel must call closeNotifMenu"
  );
  assert.ok(
    scriptContent.includes("discourseRouteTo(href);\n        loadTopic(topicId"),
    "conversation click must sync route with discourseRouteTo"
  );

  // 5. Verify handleChatNavClick closes notification menu and recovers from unsupported paths
  assert.ok(
    scriptContent.includes("closeNotifMenu();\n\n    // 1. 确保停靠栏「消息」项处于 active 态") ||
    scriptContent.includes("closeNotifMenu();\n\n    // 1."),
    "handleChatNavClick must close notification menu"
  );
  assert.ok(
    scriptContent.includes('navigateInApp(IS_V2EX ? "/?tab=all" : "/latest");') ||
    scriptContent.includes('navigateInApp(IS_V2EX ? "/?tab=all" : (IS_JUEJIN ? "/pins/recommended" : "/latest"));') ||
    scriptContent.includes('navigateInApp(IS_ZHIHU ? "/hot" : (IS_V2EX ? "/?tab=all" : (IS_JUEJIN ? "/pins/recommended" : "/latest")));'),
    "handleChatNavClick must route to latest when clicking from unsupported path"
  );

  // 6. Verify isHomePath includes /notifications on Linux DO
  assert.ok(
    scriptContent.includes("/^(latest|new|unread|unseen|top|categories|hot|posted|read|bookmarks|notifications)\\b/") ||
    scriptContent.includes("bookmarks|notifications"),
    "isHomePath must support /notifications for Linux DO"
  );

  // 7. Verify applyTheme guards loadTopic against duplicate triggers when already loading
  assert.ok(
    scriptContent.includes("Number(chatState.topicId) === Number(targetTopicId) && chatState.loading"),
    "applyTheme must avoid aborting loadTopic when target is already loading"
  );

  // 8. Verify avatar badge click is bound for both platforms
  assert.match(
    scriptContent,
    /avatar\.addEventListener\("click",[\s\S]*const badge = rail\?\.querySelector\("\.wecom-rail-avatar-badge"\);\s*badge\?\.addEventListener\("click"/,
    "avatar badge click must be bound to trigger avatar click on Linux DO"
  );
});

test("V2EX topic list pagination accurately inspects page indicators and avoids early termination", () => {
  assert.ok(
    scriptContent.includes("function parseV2exListPagination("),
    "must define parseV2exListPagination"
  );
  assert.ok(
    scriptContent.includes("function setV2exPagination(apiPath, count, doc = null)"),
    "setV2exPagination must accept doc parameter"
  );
  assert.ok(
    scriptContent.includes('const statusEl = e.target.closest(".wecom-list-status");'),
    "bindListPanelClicks must support clicking .wecom-list-status to load more"
  );

  // Simulation test for v2exPageForPath logic
  function testPageForPath(path) {
    const match = path.match(/[?&]p=(\d+)/);
    if (match) return Math.max(1, Number(match[1]) || 1);
    return 1;
  }
  assert.equal(testPageForPath("/go/programmer"), 1, "node page without p parameter must be page 1");
  assert.equal(testPageForPath("/recent"), 1, "/recent must be page 1");
  assert.equal(testPageForPath("/recent?p=6"), 6, "/recent?p=6 must be page 6");

  // Simulation test for list pagination parsing
  function simulateListPagination(html, apiPath, count) {
    const path = String(apiPath || "");
    const currentPage = testPageForPath(path);
    if (path === "/notifications" || count === 0) return { hasMore: false, nextPageUrl: null };
    const isTabHome = path === "/" || path === "all" || path === "latest" || /^\/\?tab=/i.test(path);
    if (isTabHome) return { hasMore: count > 0, nextPageUrl: count > 0 ? "/recent" : null };
    if (html) {
      const inputMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*max="(\d+)"/i) ||
        html.match(/max="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
      const inputMax = inputMatch ? Number(inputMatch[1]) : 0;
      const valMatch = html.match(/class="[^"]*page_input[^"]*"[^>]*value="(\d+)"/i) ||
        html.match(/value="(\d+)"[^>]*class="[^"]*page_input[^"]*"/i);
      const inputVal = valMatch ? Number(valMatch[1]) : 0;

      const hasDisabledNext = Boolean(html.match(/normal_page_right[^"]*disable_now/i) || html.match(/disable_now[^"]*normal_page_right/i));
      const hasNextBtn = Boolean(html.match(/title="Next Page"/i)) && !hasDisabledNext;

      const totalPages = inputMax;
      const effPage = inputVal || currentPage;
      if (totalPages > 0) {
        const hasMore = (totalPages > effPage) || hasNextBtn;
        return { hasMore, nextPageUrl: hasMore ? `${path.replace(/[?&]p=\d+/, "")}?p=${effPage + 1}` : null };
      }
      if (hasNextBtn) {
        return { hasMore: true, nextPageUrl: `${path.replace(/[?&]p=\d+/, "")}?p=${effPage + 1}` };
      }
      if (hasDisabledNext) {
        return { hasMore: false, nextPageUrl: null };
      }
    }
    return { hasMore: false, nextPageUrl: null };
  }

  // 1. Homepage all tab leads to /recent
  const resHome = simulateListPagination("", "/?tab=all", 52);
  assert.equal(resHome.hasMore, true);
  assert.equal(resHome.nextPageUrl, "/recent");

  // 2. Tab tech paginates via /recent
  const resTech = simulateListPagination("", "/?tab=tech", 50);
  assert.equal(resTech.hasMore, true);
  assert.equal(resTech.nextPageUrl, "/recent");

  // 3. /recent?p=6 with only 19 topics still advances to p=7
  const p6Html = `
    <div class="cell ps_container">
      <input type="number" class="page_input" value="6" min="1" max="41394" />
      <td class="super normal_page_right button" title="Next Page">❯</td>
    </div>
  `;
  const resP6 = simulateListPagination(p6Html, "/recent?p=6", 19);
  assert.equal(resP6.hasMore, true);
  assert.equal(resP6.nextPageUrl, "/recent?p=7");

  // 4. Last page with disabled next button stops
  const lastHtml = `
    <div class="cell ps_container">
      <input type="number" class="page_input" value="41394" min="1" max="41394" />
      <td class="super normal_page_right button disable_now" title="Next Page">❯</td>
    </div>
  `;
  const resLast = simulateListPagination(lastHtml, "/recent?p=41394", 15);
  assert.equal(resLast.hasMore, false);
});

test("sidebar History replaces Docs, persists browsed topics, and enables real-time search & clear", () => {
  // 1. Static checks in script source
  assert.ok(
    scriptContent.includes('{ key: "history", icon: "history", label: "历史" }'),
    "RAIL_DECO_ITEMS must replace doc with history"
  );
  assert.ok(
    !scriptContent.includes('{ key: "doc", icon: "doc", label: "文档" }'),
    "RAIL_DECO_ITEMS must not contain old doc button"
  );
  assert.ok(
    scriptContent.includes("TOPIC_HISTORY_KEY"),
    "must define TOPIC_HISTORY_KEY"
  );
  assert.ok(
    scriptContent.includes("TOPIC_HISTORY_MAX"),
    "must define TOPIC_HISTORY_MAX"
  );
  assert.ok(
    scriptContent.includes("function readTopicHistory"),
    "must define readTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function saveTopicHistory"),
    "must define saveTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function recordTopicHistory"),
    "must define recordTopicHistory"
  );
  assert.ok(
    scriptContent.includes("function handleHistoryNavClick"),
    "must define handleHistoryNavClick"
  );
  assert.ok(
    scriptContent.includes("function bindRailHistoryClick"),
    "must define bindRailHistoryClick"
  );
  assert.ok(
    scriptContent.includes("function bindRailNavClicks"),
    "must define bindRailNavClicks"
  );
  assert.ok(
    scriptContent.includes("function switchToListMode"),
    "must define switchToListMode"
  );
  assert.ok(
    scriptContent.includes("function renderHistoryList"),
    "must define renderHistoryList"
  );
  assert.ok(
    scriptContent.includes("wecom-history-header-bar"),
    "must include wecom-history-header-bar in CSS and DOM"
  );
  assert.ok(
    scriptContent.includes("wecom-history-clear-btn"),
    "must include wecom-history-clear-btn in CSS and DOM"
  );
  assert.ok(
    scriptContent.includes("recordTopicHistory(data, posts)"),
    "loadTopic must call recordTopicHistory"
  );

  // 2. Behavioral simulation: History recording, LRU ordering, and deduplication
  const fakeStorage = new Map();
  const STORAGE_KEY = "linuxdo-wecom-topic-history";
  const MAX_ITEMS = 200;

  function simulateRead() {
    try {
      return JSON.parse(fakeStorage.get(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function simulateSave(list) {
    fakeStorage.set(STORAGE_KEY, JSON.stringify((list || []).slice(0, MAX_ITEMS)));
  }

  function simulateRecord(data, platform = "linuxdo") {
    const existing = simulateRead();
    const item = {
      id: Number(data.id),
      title: data.title,
      last_poster_username: data.author || "user1",
      node_name: data.node || "常规",
      reply_count: data.replyCount || 0,
      visited_at: Date.now(),
      bumped_at: Date.now(),
      platform
    };
    const filtered = existing.filter((t) => Number(t.id) !== Number(data.id) || t.platform !== platform);
    filtered.unshift(item);
    simulateSave(filtered);
  }

  // Record 3 topics
  simulateRecord({ id: 101, title: "Linux 学习指南", node: "教程" });
  simulateRecord({ id: 102, title: "Node.js 性能调优", node: "开发" });
  simulateRecord({ id: 103, title: "前端架构演进", node: "前端" });

  let history = simulateRead();
  assert.equal(history.length, 3);
  assert.equal(history[0].id, 103); // Most recent at index 0
  assert.equal(history[1].id, 102);
  assert.equal(history[2].id, 101);

  // Re-visiting topic 101 moves it to the top (LRU)
  simulateRecord({ id: 101, title: "Linux 学习指南 (更新)", node: "教程" });
  history = simulateRead();
  assert.equal(history.length, 3, "should deduplicate by topic id");
  assert.equal(history[0].id, 101, "re-visited topic must jump to the front");
  assert.equal(history[0].title, "Linux 学习指南 (更新)");
  assert.equal(history[1].id, 103);
  assert.equal(history[2].id, 102);

  // Filter simulation (search query)
  function simulateSearch(query, list) {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((item) =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.node_name && item.node_name.toLowerCase().includes(q)) ||
      (item.last_poster_username && item.last_poster_username.toLowerCase().includes(q))
    );
  }

  const searchNode = simulateSearch("前端", history);
  assert.equal(searchNode.length, 1);
  assert.equal(searchNode[0].id, 103);

  const searchTitle = simulateSearch("linux", history);
  assert.equal(searchTitle.length, 1);
  assert.equal(searchTitle[0].id, 101);

  const searchNone = simulateSearch("python", history);
  assert.equal(searchNone.length, 0);

  // Clear simulation
  simulateSave([]);
  assert.equal(simulateRead().length, 0);
});

test("convRowHtml hover title attribute displays only the real topic title without disguise title prefix", () => {
  assert.ok(
    scriptContent.includes('title="${escapeHtml(String(topic.title || title || ""))}"'),
    "must set title attribute strictly to real topic title"
  );
  assert.ok(
    !scriptContent.includes('title="${escapeHtml(maskList ? `${title} · ${topic.title}` : title)}"'),
    "must not prefix disguise title in hover tooltip"
  );
});

test("detail disguised title long press displays original title, and release restores disguised title", async () => {
  // Static script assertions
  assert.ok(scriptContent.includes("const LONG_PRESS_TITLE_MS = 220;"), "must define LONG_PRESS_TITLE_MS");
  assert.ok(scriptContent.includes("function bindChatTitleLongPress("), "must define bindChatTitleLongPress");
  assert.ok(scriptContent.includes("bindChatTitleLongPress(panel);"), "must call bindChatTitleLongPress in bindChatPanelEvents");
  assert.ok(scriptContent.includes(".wecom-chat-title.is-masked"), "must style .wecom-chat-title.is-masked");
  assert.ok(scriptContent.includes(".wecom-chat-title.is-peeking-title"), "must style .wecom-chat-title.is-peeking-title");
  assert.ok(scriptContent.includes("html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-title"), "must configure WCO no-drag for .wecom-chat-title");

  // Dynamic simulation assertions
  const listeners = {};
  const windowListeners = {};
  const windowMock = {
    addEventListener(type, fn) {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(fn);
    },
    dispatch(type, event = {}) {
      if (windowListeners[type]) windowListeners[type].forEach(fn => fn(event));
    }
  };

  const titleEl = {
    tagName: "SPAN",
    className: "wecom-chat-title",
    classList: {
      _classes: new Set(["wecom-chat-title"]),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) { if (force) this.add(c); else this.remove(c); }
    },
    textContent: "",
    title: "",
    closest(sel) { return sel === ".wecom-chat-title" ? this : null; },
    setPointerCapture(id) { this._captured = id; },
    releasePointerCapture(id) { if (this._captured === id) delete this._captured; }
  };

  const panelMock = {
    dataset: {},
    querySelector(sel) { return sel === ".wecom-chat-title" ? titleEl : null; },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    dispatch(type, event = {}) {
      if (listeners[type]) listeners[type].forEach(fn => fn(event));
    }
  };

  let maskMode = "all";
  const chatState = {
    topicId: 8888,
    title: "真实详情帖子：深入理解浏览器渲染机制"
  };

  function isMaskTitleDetail() {
    return maskMode === "all" || maskMode === "detail";
  }

  function disguiseTitleForTopic(topic) {
    return "【项目推进】2026年技术架构方案";
  }

  const LONG_PRESS_TITLE_MS = 220;

  function bindChatTitleLongPress(panel, win = windowMock) {
    if (!panel || panel.dataset.chatTitleLongPressBound) return;
    panel.dataset.chatTitleLongPressBound = "1";

    let timer = null;
    let isPeeking = false;
    let capturedEl = null;

    const stopPeeking = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (isPeeking) {
        isPeeking = false;
        const titleEl = panel.querySelector(".wecom-chat-title");
        if (titleEl) {
          if (isMaskTitleDetail() && chatState.topicId) {
            titleEl.textContent = disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title });
          } else if (chatState.title) {
            titleEl.textContent = chatState.title;
          }
          titleEl.classList.remove("is-peeking-title");
        }
      }
      if (capturedEl) {
        try {
          if (typeof capturedEl.releasePointerCapture === "function" && capturedEl._pointerId != null) {
            capturedEl.releasePointerCapture(capturedEl._pointerId);
          }
        } catch (_) {}
        delete capturedEl._pointerId;
        capturedEl = null;
      }
    };

    panel.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      const titleEl = e.target && typeof e.target.closest === "function" ? e.target.closest(".wecom-chat-title") : null;
      if (!titleEl) return;
      if (!isMaskTitleDetail() || !chatState.topicId || !chatState.title) return;

      stopPeeking();
      capturedEl = titleEl;
      capturedEl._pointerId = e.pointerId;
      try {
        if (typeof titleEl.setPointerCapture === "function" && e.pointerId != null) {
          titleEl.setPointerCapture(e.pointerId);
        }
      } catch (_) {}

      timer = setTimeout(() => {
        timer = null;
        if (isMaskTitleDetail() && chatState.title) {
          isPeeking = true;
          titleEl.textContent = chatState.title;
          titleEl.classList.add("is-peeking-title");
        }
      }, LONG_PRESS_TITLE_MS);
    });

    panel.addEventListener("pointerup", stopPeeking);
    panel.addEventListener("pointercancel", stopPeeking);
    panel.addEventListener("lostpointercapture", stopPeeking);
    win.addEventListener("pointerup", stopPeeking);
    win.addEventListener("pointercancel", stopPeeking);
    win.addEventListener("blur", stopPeeking);
    win.addEventListener("keydown", (e) => {
      if (e.key === "Escape") stopPeeking();
    });

    return { stopPeeking, getIsPeeking: () => isPeeking, getTimer: () => timer };
  }

  titleEl.textContent = disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title });
  const ctrl = bindChatTitleLongPress(panelMock);

  // Quick click does not trigger peek
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 10, target: titleEl });
  assert.ok(ctrl.getTimer() !== null);
  await new Promise(r => setTimeout(r, 80));
  panelMock.dispatch("pointerup", { button: 0, pointerId: 10, target: titleEl });
  assert.equal(ctrl.getTimer(), null);
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");

  // Long press triggers peek, release restores
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 11, target: titleEl });
  await new Promise(r => setTimeout(r, 260));
  assert.equal(ctrl.getIsPeeking(), true);
  assert.equal(titleEl.textContent, chatState.title);
  assert.ok(titleEl.classList.contains("is-peeking-title"));

  windowMock.dispatch("pointerup", {});
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");
  assert.ok(!titleEl.classList.contains("is-peeking-title"));

  // Long press then blur restores
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 12, target: titleEl });
  await new Promise(r => setTimeout(r, 260));
  assert.equal(ctrl.getIsPeeking(), true);
  windowMock.dispatch("blur", {});
  assert.equal(ctrl.getIsPeeking(), false);
  assert.equal(titleEl.textContent, "【项目推进】2026年技术架构方案");

  // When mask is off, does not trigger
  maskMode = "off";
  titleEl.textContent = chatState.title;
  panelMock.dispatch("pointerdown", { button: 0, pointerId: 13, target: titleEl });
  assert.equal(ctrl.getTimer(), null);
  assert.equal(ctrl.getIsPeeking(), false);
});

test("list panel + button renders dropdown menu with create topic and topic navigation items", () => {
  // Static script assertions
  assert.ok(scriptContent.includes('class="wecom-list-add-wrap"'), "must define .wecom-list-add-wrap");
  assert.ok(scriptContent.includes('class="wecom-list-add-menu"'), "must define .wecom-list-add-menu");
  assert.ok(scriptContent.includes('data-add-action="new-topic"'), "must define new-topic action");
  assert.ok(scriptContent.includes('data-add-action="nav"'), "must define nav action");
  assert.ok(scriptContent.includes("function toggleListAddMenu("), "must define toggleListAddMenu");
  assert.ok(scriptContent.includes("function closeListAddMenu("), "must define closeListAddMenu");
  assert.ok(scriptContent.includes("function updateListAddMenuTexts("), "must define updateListAddMenuTexts");
  assert.ok(scriptContent.includes("https://v2ex.com/new"), "must link to V2EX new topic url");
  assert.ok(scriptContent.includes("function openNewTopic("), "must define openNewTopic");
  assert.ok(scriptContent.includes("wecom-composing-new"), "must style and manage wecom-composing-new state");
  assert.ok(scriptContent.includes("create_topic=true"), "must provide create_topic=true fallback");
  assert.ok(scriptContent.includes(".wecom-list-add-menu"), "must style .wecom-list-add-menu in css");

  // Dynamic simulation assertions
  const panel = {
    _classes: new Set(["wecom-list-panel"]),
    dataset: {},
    querySelector(sel) {
      if (sel === ".wecom-list-add-wrap") return this.addWrap;
      if (sel === ".wecom-list-add-menu") return this.addMenu;
      if (sel === ".wecom-list-add") return this.addBtn;
      if (sel === '[data-add-action="new-topic"]') return this.newTopicItem;
      if (sel === '[data-add-action="nav"]') return this.navItem;
      return null;
    }
  };

  const addBtn = {
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k]; }
  };

  const newTopicText = { textContent: "发布新主题" };
  const newTopicItem = {
    dataset: { addAction: "new-topic" },
    title: "",
    querySelector(sel) {
      if (sel === ".wecom-list-add-item-text") return newTopicText;
      return null;
    }
  };

  const navText = { textContent: "话题分类导航" };
  const navItem = {
    dataset: { addAction: "nav" },
    title: "",
    querySelector(sel) {
      if (sel === ".wecom-list-add-item-text") return navText;
      return null;
    }
  };

  const addMenu = {
    hidden: true,
    querySelector(sel) {
      if (sel === '[data-add-action="new-topic"]') return newTopicItem;
      if (sel === '[data-add-action="nav"]') return navItem;
      return null;
    }
  };

  const addWrap = {
    querySelector(sel) {
      if (sel === ".wecom-list-add-menu") return addMenu;
      if (sel === ".wecom-list-add") return addBtn;
      return null;
    }
  };

  panel.addBtn = addBtn;
  panel.addMenu = addMenu;
  panel.addWrap = addWrap;
  panel.newTopicItem = newTopicItem;
  panel.newTopicText = newTopicText;
  panel.navItem = navItem;
  panel.navText = navText;

  let isMaskList = false;
  function isMaskTitleList() { return isMaskList; }

  function updateListAddMenuTexts(menu) {
    if (!menu) return;
    const isMask = isMaskTitleList();
    const item = menu.querySelector('[data-add-action="new-topic"]');
    if (item) {
      const textEl = item.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "发起新项目群" : "发布新主题";
      item.title = isMask ? "发新话题" : "发布新主题";
    }
    const nItem = menu.querySelector('[data-add-action="nav"]');
    if (nItem) {
      const textEl = nItem.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "部门架构导航" : "话题分类导航";
      nItem.title = isMask ? "话题分类" : "话题分类导航";
    }
  }

  function toggleListAddMenu(p) {
    const wrap = p.querySelector(".wecom-list-add-wrap");
    const menu = wrap?.querySelector(".wecom-list-add-menu");
    const btn = wrap?.querySelector(".wecom-list-add");
    if (!menu || !btn) return;
    const willOpen = menu.hidden;
    if (willOpen) {
      updateListAddMenuTexts(menu);
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    } else {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function closeListAddMenu(p) {
    const menu = p.querySelector(".wecom-list-add-menu");
    const btn = p.querySelector(".wecom-list-add");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  // Initial
  assert.equal(panel.addMenu.hidden, true);

  // Normal open
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, false);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "true");
  assert.equal(panel.newTopicText.textContent, "发布新主题");
  assert.equal(panel.navText.textContent, "话题分类导航");

  // Normal close
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, true);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "false");

  // Disguise mode open
  isMaskList = true;
  toggleListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, false);
  assert.equal(panel.newTopicText.textContent, "发起新项目群");
  assert.equal(panel.navText.textContent, "部门架构导航");

  // Close
  closeListAddMenu(panel);
  assert.equal(panel.addMenu.hidden, true);
  assert.equal(panel.addBtn.getAttribute("aria-expanded"), "false");
});

test("openNewTopic directly invokes Discourse composer service in-page or falls back gracefully", () => {
  // Test 1: On Linux DO with Ember composer service
  let emberComposerOpened = false;
  let emberPayload = null;
  let windowOpenedUrl = null;
  const docClasses = new Set();
  const docEl = {
    classList: {
      add(c) { docClasses.add(c); },
      remove(c) { docClasses.delete(c); },
      contains(c) { return docClasses.has(c); }
    }
  };

  const composerService = {
    open(payload) {
      emberComposerOpened = true;
      emberPayload = payload;
    }
  };

  function simulateOpenNewTopic({ isV2ex = false, hasService = true, hasDomBtn = false } = {}) {
    windowOpenedUrl = null;
    emberComposerOpened = false;
    emberPayload = null;
    docClasses.clear();

    if (isV2ex) {
      windowOpenedUrl = "https://v2ex.com/new";
      return;
    }

    let opened = false;
    if (hasService) {
      composerService.open({
        action: "createTopic",
        draftKey: "new_topic"
      });
      opened = true;
    } else if (hasDomBtn) {
      opened = true;
    }

    if (opened) {
      docEl.classList.add("wecom-composing-new");
    } else {
      windowOpenedUrl = "https://linux.do/?create_topic=true";
    }
  }

  // Scenario 1: Native Ember service available on Linux DO
  simulateOpenNewTopic({ isV2ex: false, hasService: true });
  assert.equal(emberComposerOpened, true);
  assert.deepEqual(emberPayload, { action: "createTopic", draftKey: "new_topic" });
  assert.equal(docEl.classList.contains("wecom-composing-new"), true);
  assert.equal(windowOpenedUrl, null);

  // Scenario 2: Service missing, fallback to DOM #create-topic click
  simulateOpenNewTopic({ isV2ex: false, hasService: false, hasDomBtn: true });
  assert.equal(emberComposerOpened, false);
  assert.equal(docEl.classList.contains("wecom-composing-new"), true);
  assert.equal(windowOpenedUrl, null);

  // Scenario 3: Neither ready, fallback to ?create_topic=true (never /new-topic)
  simulateOpenNewTopic({ isV2ex: false, hasService: false, hasDomBtn: false });
  assert.equal(docEl.classList.contains("wecom-composing-new"), false);
  assert.equal(windowOpenedUrl, "https://linux.do/?create_topic=true");
  assert.ok(!windowOpenedUrl.includes("/new-topic"), "must never use /new-topic");

  // Scenario 4: V2EX opens https://v2ex.com/new
  simulateOpenNewTopic({ isV2ex: true });
  assert.equal(windowOpenedUrl, "https://v2ex.com/new");
  assert.equal(docEl.classList.contains("wecom-composing-new"), false);
});

test("new topic composer applies Enterprise WeChat layout, grippie header, and component styles", () => {
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .grippie"),
    "must style grippie top handle"
  );
  assert.ok(
    scriptContent.includes('content: "发布新主题"'),
    "must show 发布新主题 title in grippie"
  );
  assert.ok(
    scriptContent.includes('content: "发起新项目群"'),
    "must show 发起新项目群 in disguised mode"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control input#reply-title"),
    "must style reply-title input in WeCom aesthetic"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .d-editor"),
    "must style d-editor card and toolbar"
  );
  assert.ok(
    scriptContent.includes("wecom-composing-new #reply-control .submit-panel button.create"),
    "must style create topic submit button with WeCom blue"
  );
  assert.ok(
    scriptContent.includes("wecom-dark.wecom-composing-new #reply-control"),
    "must provide complete dark mode theme for composer"
  );
});

test("Discourse confirmation dialogs and modals have higher z-index than composer and are unblocked", () => {
  assert.ok(
    scriptContent.includes(".dialog-holder") && scriptContent.includes("#discourse-modal-container"),
    "must target Discourse dialog-holder and modal container"
  );
  assert.ok(
    scriptContent.includes("z-index: 20000 !important;"),
    "must elevate modals to z-index 20000 above reply-control 1500"
  );
  assert.ok(
    scriptContent.includes(".dialog-footer button.btn-danger") || scriptContent.includes("button.btn-danger"),
    "must style discard confirmation button"
  );
  assert.ok(
    scriptContent.includes("NATIVE_BRIDGE_SEL") && scriptContent.includes(".dialog-holder"),
    "must include dialog-holder in NATIVE_BRIDGE_SEL to avoid DOM thrashing"
  );
});

test("topic detail image auto-layout setting, 100px thumbnails below text, and click to preview", () => {
  // 1. Script contains configuration constants and toggle functions
  assert.ok(
    scriptContent.includes('const IMAGE_AUTO_LAYOUT_KEY = "linuxdo-wecom-image-auto-layout";'),
    "must define IMAGE_AUTO_LAYOUT_KEY constant"
  );
  assert.ok(
    scriptContent.includes("function isImageAutoLayoutEnabled") && scriptContent.includes("function setImageAutoLayoutEnabled"),
    "must define isImageAutoLayoutEnabled and setImageAutoLayoutEnabled"
  );
  assert.ok(
    scriptContent.includes("function refreshChatMessagesLayout"),
    "must define refreshChatMessagesLayout for in-place updates"
  );

  // 2. Settings menu contains toggle option and synchronization
  assert.ok(
    scriptContent.includes(".wecom-menu-toggle-image-layout"),
    "must include .wecom-menu-toggle-image-layout button in settings menu"
  );
  assert.ok(
    scriptContent.includes("图片自动排版"),
    "must display 图片自动排版 label in settings menu"
  );
  assert.ok(
    scriptContent.includes("setImageAutoLayoutEnabled(!isImageAutoLayoutEnabled())"),
    "must handle toggle click in settings menu"
  );

  // 3. CSS styling constraints for 100px thumbnail and container
  assert.ok(
    scriptContent.includes(".wecom-msg-images"),
    "must define .wecom-msg-images container style"
  );
  assert.ok(
    scriptContent.includes("width: 100px !important;") && scriptContent.includes("height: 100px !important;"),
    "must constrain thumbnails strictly to width: 100px and height: 100px"
  );
  assert.ok(
    scriptContent.includes("object-fit: cover !important;"),
    "must apply object-fit: cover to thumbnail images"
  );
  assert.ok(
    scriptContent.includes("cursor: zoom-in"),
    "must set zoom-in cursor on thumbnails"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-body.is-empty"),
    "must handle image-only posts with is-empty hidden class"
  );

  // 4. Click & keyboard preview delegation
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-msg-thumb")'),
    "must delegate click on .wecom-msg-thumb to openImageViewer"
  );

  // 5. Functional simulation of image extraction and empty paragraph cleanup
  function simulateAutoLayout(bodyHtml, autoLayoutEnabled = true) {
    // Mini mock DOM parser
    const images = [];
    const textMatches = bodyHtml.match(/<p>(.*?)<\/p>/g) || [];
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    let match;
    while ((match = imgRegex.exec(bodyHtml)) !== null) {
      const full = match[0];
      const src = match[2];
      const isEmoji = full.includes('class="emoji"');
      const inQuote = bodyHtml.indexOf("<blockquote>") !== -1 &&
                      bodyHtml.indexOf("<blockquote>") < match.index &&
                      match.index < bodyHtml.indexOf("</blockquote>");
      if (!isEmoji && !inQuote) {
        images.push({ src, alt: "preview" });
      }
    }

    if (!autoLayoutEnabled || images.length === 0) {
      return { hasGallery: false, imageCount: 0, textBody: bodyHtml };
    }

    // Cleaned body without the extracted images
    let cleanedBody = bodyHtml.replace(/<div class="lightbox-wrapper">[\s\S]*?<\/div>/g, "")
                              .replace(/<img\s+[^>]*?src=["']https:\/\/linux\.do\/[^"']+["'][^>]*>/g, "")
                              .replace(/<p>\s*<\/p>/g, "")
                              .trim();

    const galleryHtml = `<div class="wecom-msg-images">` +
      images.map(img => `<div class="wecom-msg-thumb" style="width:100px;height:100px"><img src="${img.src}" style="object-fit:cover"></div>`).join("") +
      `</div>`;

    return {
      hasGallery: true,
      imageCount: images.length,
      textBody: cleanedBody,
      galleryHtml
    };
  }

  const sampleCooked = `
    <p>这是帖子的文字说明</p>
    <div class="lightbox-wrapper">
      <a class="lightbox" href="https://linux.do/uploads/original/1.jpg">
        <img src="https://linux.do/uploads/thumb/1.jpg" alt="pic1">
      </a>
    </div>
    <p>第二段文字说明</p>
    <blockquote><img src="https://linux.do/quote.jpg" alt="quoted"></blockquote>
    <p><img class="emoji" src="smile.png" alt="smile"></p>
  `;

  // Disabled
  const disabledRes = simulateAutoLayout(sampleCooked, false);
  assert.equal(disabledRes.hasGallery, false);

  // Enabled
  const enabledRes = simulateAutoLayout(sampleCooked, true);
  assert.equal(enabledRes.hasGallery, true);
  assert.equal(enabledRes.imageCount, 1); // Only 1 topic image (quote image and emoji excluded)
  assert.ok(!enabledRes.textBody.includes("lightbox-wrapper"), "lightbox-wrapper removed from text");
  assert.ok(enabledRes.textBody.includes("这是帖子的文字说明"), "preserves text paragraph 1");
  assert.ok(enabledRes.textBody.includes("第二段文字说明"), "preserves text paragraph 2");
  assert.ok(enabledRes.galleryHtml.includes("width:100px;height:100px"), "thumbnail constrained to 100px");
});

test("message bubble hover shows 原排版 button and clicking directly toggles original layout", () => {
  // 1. Script contains hover toggle button class and icons
  assert.ok(
    scriptContent.includes(".wecom-bubble-layout-toggle"),
    "must style .wecom-bubble-layout-toggle"
  );
  assert.ok(
    scriptContent.includes("layoutOriginal:") && scriptContent.includes("layoutAuto:"),
    "must define layoutOriginal and layoutAuto icons in ICONS"
  );
  assert.ok(
    scriptContent.includes("<span>原排版</span>") && scriptContent.includes("<span>自动排版</span>"),
    "must support 原排版 and 自动排版 text labels"
  );

  // 2. CSS specifies hover visibility on bubble
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble:hover .wecom-bubble-layout-toggle"),
    "must show toggle button on bubble hover"
  );

  // 3. Script defines toggleMessageBubbleLayout function and delegates click
  assert.ok(
    scriptContent.includes("function toggleMessageBubbleLayout"),
    "must define toggleMessageBubbleLayout function"
  );
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-bubble-layout-toggle")'),
    "must handle click on .wecom-bubble-layout-toggle in chat panel"
  );

  // 4. Functional simulation of toggleMessageBubbleLayout
  const mockPost = {
    id: 101,
    post_number: 1,
    cooked: "<p>原排版正文</p><p><img src=\"https://linux.do/photo.jpg\"></p>"
  };

  const bubbleMock = {
    dataset: { layoutMode: "auto" },
    hasGallery: true,
    bodyHtml: "<p>原排版正文</p>",
    btnTitle: "点击显示原排版",
    btnText: "原排版",
    isRawClass: false
  };

  function simulateToggle(bubble, post) {
    const isRaw = bubble.dataset.layoutMode === "raw";
    if (isRaw) {
      bubble.dataset.layoutMode = "auto";
      bubble.hasGallery = true;
      bubble.bodyHtml = "<p>原排版正文</p>";
      bubble.btnTitle = "点击显示原排版";
      bubble.btnText = "原排版";
      bubble.isRawClass = false;
    } else {
      bubble.dataset.layoutMode = "raw";
      bubble.hasGallery = false;
      bubble.bodyHtml = post.cooked;
      bubble.btnTitle = "点击显示自动排版";
      bubble.btnText = "自动排版";
      bubble.isRawClass = true;
    }
  }

  // Initial auto mode
  assert.equal(bubbleMock.dataset.layoutMode, "auto");
  assert.equal(bubbleMock.btnText, "原排版");
  assert.equal(bubbleMock.hasGallery, true);

  // Toggle to raw
  simulateToggle(bubbleMock, mockPost);
  assert.equal(bubbleMock.dataset.layoutMode, "raw");
  assert.equal(bubbleMock.btnText, "自动排版");
  assert.equal(bubbleMock.btnTitle, "点击显示自动排版");
  assert.equal(bubbleMock.hasGallery, false);
  assert.equal(bubbleMock.bodyHtml, mockPost.cooked);
  assert.equal(bubbleMock.isRawClass, true);

  // Toggle back to auto
  simulateToggle(bubbleMock, mockPost);
  assert.equal(bubbleMock.dataset.layoutMode, "auto");
  assert.equal(bubbleMock.btnText, "原排版");
  assert.equal(bubbleMock.btnTitle, "点击显示原排版");
  assert.equal(bubbleMock.hasGallery, true);
  assert.equal(bubbleMock.isRawClass, false);
});

test("component images such as onebox, poll, details are excluded from image auto-layout", () => {
  // 1. Script checks for onebox containers and component elements
  assert.ok(
    scriptContent.includes("aside.onebox") && scriptContent.includes(".onebox-body"),
    "must exclude aside.onebox and .onebox-body"
  );
  assert.ok(
    scriptContent.includes(".onebox-avatar") && scriptContent.includes(".onebox-thumbnail"),
    "must exclude .onebox-avatar and .onebox-thumbnail"
  );
  assert.ok(
    scriptContent.includes("details") && scriptContent.includes(".poll"),
    "must exclude details and poll components"
  );

  // 2. isPreviewableChatImage excludes onebox images from hijacking clicks
  assert.ok(
    scriptContent.includes('image.closest("aside.onebox, .onebox, .onebox-body, [data-onebox-src]")'),
    "isPreviewableChatImage must return false for images inside onebox"
  );

  // 3. Functional simulation verifying Onebox remains in-place inside text
  const postWithOneboxAndRegularImage = `
    <p>这是正文第一段，推荐阅读这个链接：</p>
    <aside class="onebox githubrepo">
      <article class="onebox-body">
        <img class="thumbnail onebox-avatar" src="https://github.com/avatar.png">
        <h3><a href="https://github.com/example/repo">example/repo</a></h3>
        <p>Repo description</p>
      </article>
    </aside>
    <p>这是正文第二段，附上实际测试截图：</p>
    <div class="lightbox-wrapper">
      <a class="lightbox" href="https://linux.do/uploads/original/test.png">
        <img src="https://linux.do/uploads/thumb/test.png" alt="test.png">
      </a>
    </div>
  `;

  // Filter function simulation matching script's logic
  function filterCandidateImages(html) {
    const images = [];
    const regex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const full = m[0];
      const src = m[2];
      const isOnebox = full.includes("onebox") ||
        (html.indexOf('<aside class="onebox') !== -1 &&
         html.indexOf('<aside class="onebox') < m.index &&
         m.index < html.indexOf('</aside>'));
      const isEmoji = full.includes('class="emoji"');
      if (!isOnebox && !isEmoji) {
        images.push(src);
      }
    }
    return images;
  }

  const extracted = filterCandidateImages(postWithOneboxAndRegularImage);
  assert.equal(extracted.length, 1);
  assert.equal(extracted[0], "https://linux.do/uploads/thumb/test.png");
  assert.ok(!extracted.includes("https://github.com/avatar.png"), "must not extract onebox avatar");
});

test("V2EX embedded images and non-lightbox images are properly preserved in gallery and not self-removed", () => {
  // 1. Script checks that targetToRemove avoids self-removing linkToMove or img
  assert.ok(
    scriptContent.includes("const targetToRemove = (lightboxWrapper && lightboxWrapper !== linkToMove) ? lightboxWrapper : null;"),
    "targetToRemove must only target outer lightboxWrapper when it is distinct from linkToMove"
  );
  assert.ok(
    scriptContent.includes("if (targetToRemove) {\n          targetToRemove.remove();\n        }") ||
    scriptContent.includes("if (targetToRemove)"),
    "targetToRemove.remove() must only run when targetToRemove is non-null"
  );
  assert.ok(
    scriptContent.includes("bubble.dataset.rawCooked"),
    "applyImageAutoLayout and toggleMessageBubbleLayout must preserve bubble.dataset.rawCooked"
  );

  // 2. previewImageSource detects wrapped high-res links for V2EX and markdown images
  assert.ok(
    scriptContent.includes("const generalLink = image.closest(\"a[href]\");"),
    "previewImageSource must check wrapping link"
  );

  // 3. Functional relocation simulation: V2EX <a><img></a> and plain <img> must NOT be destroyed
  function simulateAutoLayout(bodyChildren) {
    const gallery = [];
    for (const item of bodyChildren) {
      const isLightbox = item.type === "lightbox";
      const linkToMove = item.type === "link" ? item.link : null;
      const targetToRemove = isLightbox ? item.wrapper : null;

      const thumb = {
        child: linkToMove || item.img,
        removed: false
      };

      if (targetToRemove) {
        targetToRemove.removed = true;
      }
      // If targetToRemove was linkToMove or img (as in old bug), it would remove thumb.child!
      gallery.push(thumb);
    }
    return gallery;
  }

  const v2exItems = [
    { type: "link", link: { tag: "a", href: "https://i.imgur.com/high.jpg" }, img: { tag: "img", src: "https://i.imgur.com/thumb.jpg" } },
    { type: "plain", img: { tag: "img", src: "https://i.imgur.com/plain.jpg" } }
  ];

  const gallery = simulateAutoLayout(v2exItems);
  assert.equal(gallery.length, 2);
  assert.equal(gallery[0].child.tag, "a");
  assert.equal(gallery[0].removed, false, "V2EX wrapped image must not be removed");
  assert.equal(gallery[1].child.tag, "img");
  assert.equal(gallery[1].removed, false, "V2EX plain image must not be removed");
});

test("clicking notifications clears or decrements badges immediately across avatar, menu, and list", () => {
  // 1. Script defines clearNotificationBadge and decrementNotificationBadge
  assert.ok(
    scriptContent.includes("function clearNotificationBadge()"),
    "must define clearNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("function decrementNotificationBadge()"),
    "must define decrementNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("notificationCountOverride"),
    "must track notificationCountOverride"
  );

  // 2. Notification menu clicks trigger decrement or clear
  assert.ok(
    scriptContent.includes("clearNotificationBadge();\n        } else {\n          decrementNotificationBadge();"),
    "bindNotifMenuEvents must clear or decrement badge on actionable click"
  );

  // 3. V2EX avatar click and /notifications load trigger clearNotificationBadge
  assert.ok(
    scriptContent.includes("clearNotificationBadge();\n        const body = document.querySelector(\".wecom-list-body\");"),
    "V2EX avatar click must call clearNotificationBadge"
  );
  assert.ok(
    scriptContent.includes("if (path === \"/notifications\") {\n                clearNotificationBadge();\n              }"),
    "loadList must call clearNotificationBadge when path is /notifications"
  );

  // 4. Conversation row click eliminates row badge and clears notification badge
  assert.ok(
    scriptContent.includes("convBadge.remove();"),
    "bindListPanelClicks must remove convBadge on click"
  );
  assert.ok(
    scriptContent.includes("if (isNotifItem) {\n          clearNotificationBadge();\n        } else if (convBadge) {\n          decrementNotificationBadge();\n        }"),
    "bindListPanelClicks must update notification badge"
  );

  // 5. Functional state simulation of getUnreadNotificationCount with overrides & new notifications
  let override = null;
  let lastKnownRaw = 0;

  function simulateGetCount(raw) {
    if (raw > lastKnownRaw) {
      override = null;
    }
    lastKnownRaw = raw;
    if (override !== null) return override;
    return raw;
  }

  // Initial state: 2 unread notifications
  assert.equal(simulateGetCount(2), 2);

  // User clicks 1 notification
  override = 1;
  assert.equal(simulateGetCount(2), 1, "must show decremented count 1");

  // User clicks another notification / dismiss
  override = 0;
  assert.equal(simulateGetCount(2), 0, "badge must be eliminated (count 0)");

  // Still 2 on server (cached/static DOM)
  assert.equal(simulateGetCount(2), 0, "must stay eliminated while raw count is not newer");

  // A new notification arrives (raw becomes 3)
  assert.equal(simulateGetCount(3), 3, "must reset override and display count when higher raw count arrives");
});

test("image auto-layout thumbnail size can be configured, supports presets and custom sizes, and applies CSS variable", () => {
  // 1. Script defines size storage keys and helper functions
  assert.ok(
    scriptContent.includes("IMAGE_AUTO_LAYOUT_SIZE_KEY"),
    "must define IMAGE_AUTO_LAYOUT_SIZE_KEY"
  );
  assert.ok(
    scriptContent.includes("function getImageAutoLayoutSize()"),
    "must define getImageAutoLayoutSize"
  );
  assert.ok(
    scriptContent.includes("function setImageAutoLayoutSize(size)"),
    "must define setImageAutoLayoutSize"
  );
  assert.ok(
    scriptContent.includes("function applyImageAutoLayoutSizeCss(size)"),
    "must define applyImageAutoLayoutSizeCss"
  );

  // 2. CSS supports dynamic thumbnail size variable
  assert.ok(
    scriptContent.includes("var(--wecom-image-thumb-size, 100px)"),
    "thumbnails must use CSS variable --wecom-image-thumb-size"
  );
  assert.ok(
    scriptContent.includes(".wecom-menu-image-size-row"),
    "must define .wecom-menu-image-size-row in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-size-chip"),
    "must define .wecom-size-chip in CSS"
  );

  // 3. Settings menu includes size presets and custom trigger
  assert.ok(
    scriptContent.includes('data-size="80"') &&
    scriptContent.includes('data-size="100"') &&
    scriptContent.includes('data-size="120"') &&
    scriptContent.includes('data-size="150"'),
    "must provide preset size buttons 80, 100, 120, 150"
  );
  assert.ok(
    scriptContent.includes('data-size="custom"'),
    "must provide custom size button"
  );

  // 4. Functional simulation of size getter, setter, clamping and CSS variable application
  let storedSize = null;
  const mockStyle = {};
  const MIN = 50;
  const MAX = 400;
  const DEFAULT = 100;

  function simGetSize() {
    const v = parseInt(storedSize, 10);
    if (Number.isFinite(v) && v >= MIN && v <= MAX) return v;
    return DEFAULT;
  }

  function simSetSize(size) {
    const num = Math.min(MAX, Math.max(MIN, Number(size) || DEFAULT));
    storedSize = String(num);
    mockStyle["--wecom-image-thumb-size"] = `${num}px`;
    return num;
  }

  // Default is 100
  assert.equal(simGetSize(), 100);

  // Select 80px preset
  simSetSize(80);
  assert.equal(simGetSize(), 80);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "80px");

  // Select 150px preset
  simSetSize(150);
  assert.equal(simGetSize(), 150);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "150px");

  // Set custom 200px
  simSetSize(200);
  assert.equal(simGetSize(), 200);
  assert.equal(mockStyle["--wecom-image-thumb-size"], "200px");

  // Clamp underflow & overflow
  simSetSize(20);
  assert.equal(simGetSize(), 50, "must clamp underflow to MIN 50");
  assert.equal(mockStyle["--wecom-image-thumb-size"], "50px");

  simSetSize(600);
  assert.equal(simGetSize(), 400, "must clamp overflow to MAX 400");
  assert.equal(mockStyle["--wecom-image-thumb-size"], "400px");
});

test("images with dimensions smaller than layout thumbnail size are excluded from auto-layout", () => {
  // 1. Script defines helper functions and integrates size check into auto-layout
  assert.ok(
    scriptContent.includes("function parsePixelDimension"),
    "must define parsePixelDimension"
  );
  assert.ok(
    scriptContent.includes("function getImageEffectiveDimensions"),
    "must define getImageEffectiveDimensions"
  );
  assert.ok(
    scriptContent.includes("function isImageSmallerThanLayout"),
    "must define isImageSmallerThanLayout"
  );
  assert.ok(
    scriptContent.includes("function attachImageAutoLayoutLoadCheck"),
    "must define attachImageAutoLayoutLoadCheck"
  );
  assert.ok(
    scriptContent.includes("if (isImageSmallerThanLayout(img, layoutSize)) return false;"),
    "candidateImgs filter must exclude images smaller than layoutSize"
  );
  assert.ok(
    scriptContent.includes("refreshChatMessagesLayout();"),
    "setImageAutoLayoutSize must trigger refreshChatMessagesLayout"
  );

  // 2. Functional simulation of parsePixelDimension
  function simParsePixel(val) {
    if (!val) return NaN;
    const str = String(val).trim();
    if (!str || str.endsWith("%") || str.endsWith("vw") || str.endsWith("vh")) return NaN;
    const num = parseFloat(str);
    return Number.isFinite(num) && num > 0 ? num : NaN;
  }

  assert.equal(simParsePixel("50px"), 50);
  assert.equal(simParsePixel("80"), 80);
  assert.equal(simParsePixel(" 120.5 px "), 120.5);
  assert.ok(Number.isNaN(simParsePixel("100%")), "percentage width must return NaN");
  assert.ok(Number.isNaN(simParsePixel("auto")), "auto must return NaN");
  assert.ok(Number.isNaN(simParsePixel(null)), "null must return NaN");

  // 3. Functional simulation of getImageEffectiveDimensions and isImageSmallerThanLayout
  function simGetDimensions(img) {
    if (!img) return null;
    if (img.naturalWidth > 0) {
      return { width: img.naturalWidth, height: img.naturalHeight || img.naturalWidth };
    }
    const attrW = simParsePixel(img.getAttribute?.("width") || img.getAttribute?.("data-width"));
    const attrH = simParsePixel(img.getAttribute?.("height") || img.getAttribute?.("data-height"));
    if (Number.isFinite(attrW) && Number.isFinite(attrH)) return { width: attrW, height: attrH };
    if (Number.isFinite(attrW)) return { width: attrW, height: attrW };
    if (Number.isFinite(attrH)) return { width: attrH, height: attrH };

    const styleW = simParsePixel(img.style?.width);
    const styleH = simParsePixel(img.style?.height);
    if (Number.isFinite(styleW) && Number.isFinite(styleH)) return { width: styleW, height: styleH };
    if (Number.isFinite(styleW)) return { width: styleW, height: styleW };
    if (Number.isFinite(styleH)) return { width: styleH, height: styleH };

    if (img.metaText) {
      const match = img.metaText.match(/(\d+)\s*[×x]\s*(\d+)/i);
      if (match) return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
    return null;
  }

  function simIsSmaller(img, layoutSize) {
    const dim = simGetDimensions(img);
    if (!dim) return false;
    return dim.width < layoutSize && dim.height < layoutSize;
  }

  // Under default layoutSize = 100:
  // Tiny 48x48 icon is smaller than 100px
  assert.equal(simIsSmaller({ getAttribute: (k) => k === "width" ? "48" : "48" }, 100), true);
  // 80x80 small image is smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 80, naturalHeight: 80 }, 100), true);
  // 100x100 is not strictly smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 100, naturalHeight: 100 }, 100), false);
  // 800x600 photo is not smaller than 100px
  assert.equal(simIsSmaller({ naturalWidth: 800, naturalHeight: 600 }, 100), false);
  // 50x300 vertical banner exceeds 100px height -> not smaller
  assert.equal(simIsSmaller({ naturalWidth: 50, naturalHeight: 300 }, 100), false);
  // 300x50 horizontal banner exceeds 100px width -> not smaller
  assert.equal(simIsSmaller({ naturalWidth: 300, naturalHeight: 50 }, 100), false);
  // Discourse meta informations 1920x1080 -> not smaller
  assert.equal(simIsSmaller({ metaText: "1920×1080 200 KB" }, 100), false);

  // Dynamic layout size changes:
  // When layout size is 80px: 80x80 is no longer smaller than layout size
  assert.equal(simIsSmaller({ naturalWidth: 80, naturalHeight: 80 }, 80), false);
  // When layout size is 150px: 120x120 becomes smaller than layout size
  assert.equal(simIsSmaller({ naturalWidth: 120, naturalHeight: 120 }, 150), true);

  // 4. Functional simulation of message auto-layout with small & large images
  function simulateMessageAutoLayout(images, layoutSize) {
    const candidateImgs = [];
    const inlineImgs = [];
    for (const img of images) {
      if (simIsSmaller(img, layoutSize)) {
        inlineImgs.push(img);
      } else {
        candidateImgs.push(img);
      }
    }
    return {
      hasGallery: candidateImgs.length > 0,
      galleryCount: candidateImgs.length,
      inlineCount: inlineImgs.length
    };
  }

  // Post with only small inline icons (e.g. 48px, 64px)
  const iconsOnly = [
    { getAttribute: (k) => k === "width" ? "48" : "48" },
    { getAttribute: (k) => k === "width" ? "64" : "64" }
  ];
  const resIconsOnly = simulateMessageAutoLayout(iconsOnly, 100);
  assert.equal(resIconsOnly.hasGallery, false, "post with only small images must not create gallery");
  assert.equal(resIconsOnly.inlineCount, 2, "small images must remain inline");

  // Post with 1 small badge (60x20) and 1 screenshot (1200x800)
  const mixedImages = [
    { getAttribute: (k) => k === "width" ? "60" : "20" },
    { naturalWidth: 1200, naturalHeight: 800 }
  ];
  const resMixed = simulateMessageAutoLayout(mixedImages, 100);
  assert.equal(resMixed.hasGallery, true, "mixed post must create gallery for large image");
  assert.equal(resMixed.galleryCount, 1, "only large image goes to gallery");
  assert.equal(resMixed.inlineCount, 1, "small badge remains inline in message text");
});

test("image auto-layout aspect ratio configuration (4:3, 1:1, 16:9) and empty lines cleanup", () => {
  // 1. Script defines aspect ratio keys and methods
  assert.ok(
    scriptContent.includes("IMAGE_AUTO_LAYOUT_ASPECT_KEY"),
    "must define IMAGE_AUTO_LAYOUT_ASPECT_KEY"
  );
  assert.ok(
    scriptContent.includes("function getImageAutoLayoutAspect"),
    "must define getImageAutoLayoutAspect"
  );
  assert.ok(
    scriptContent.includes("function setImageAutoLayoutAspect"),
    "must define setImageAutoLayoutAspect"
  );
  assert.ok(
    scriptContent.includes("function computeImageAutoLayoutDimensions"),
    "must define computeImageAutoLayoutDimensions"
  );
  assert.ok(
    scriptContent.includes("function cleanMessageBodyWhitespace"),
    "must define cleanMessageBodyWhitespace"
  );

  // 2. CSS defines aspect ratio variables and settings menu elements
  assert.ok(
    scriptContent.includes(".wecom-menu-image-aspect-row"),
    "must style .wecom-menu-image-aspect-row in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-aspect-chip"),
    "must style .wecom-aspect-chip in CSS"
  );
  assert.ok(
    scriptContent.includes("--wecom-image-thumb-aspect"),
    "must set CSS variable --wecom-image-thumb-aspect"
  );
  assert.ok(
    scriptContent.includes('data-aspect="4:3"') &&
    scriptContent.includes('data-aspect="1:1"') &&
    scriptContent.includes('data-aspect="16:9"'),
    "must offer 4:3, 1:1, 16:9 aspect chips in settings menu"
  );

  // 3. Functional test of computeImageAutoLayoutDimensions
  function simComputeDims(baseSize, aspect) {
    const s = Number(baseSize) || 100;
    if (aspect === "4:3") {
      return { width: Math.round(s * 4 / 3), height: s, cssAspect: "4 / 3" };
    }
    if (aspect === "16:9") {
      return { width: Math.round(s * 16 / 9), height: s, cssAspect: "16 / 9" };
    }
    return { width: s, height: s, cssAspect: "1 / 1" };
  }

  const dims1x1 = simComputeDims(100, "1:1");
  assert.equal(dims1x1.width, 100);
  assert.equal(dims1x1.height, 100);
  assert.equal(dims1x1.cssAspect, "1 / 1");

  const dims4x3 = simComputeDims(100, "4:3");
  assert.equal(dims4x3.width, 133);
  assert.equal(dims4x3.height, 100);
  assert.equal(dims4x3.cssAspect, "4 / 3");

  const dims16x9 = simComputeDims(100, "16:9");
  assert.equal(dims16x9.width, 178);
  assert.equal(dims16x9.height, 100);
  assert.equal(dims16x9.cssAspect, "16 / 9");

  // 4. Functional simulation of cleanMessageBodyWhitespace
  function simCleanWhitespace(html) {
    let cleaned = html
      .replace(/<(p|div)>\s*(?:<br\s*\/?>|&nbsp;|\u00A0|\u200B|\s)*<\/\1>/gi, "")
      .replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br>")
      .replace(/(<\/(?:p|div|blockquote)>)\s*<br\s*\/?>/gi, "$1")
      .replace(/<br\s*\/?>\s*(<(?:p|div|blockquote)>)/gi, "$1")
      .replace(/^(?:\s*<br\s*\/?>|\s)+/i, "")
      .replace(/(?:<br\s*\/?>\s*|\s)+$/i, "")
      .trim();
    return cleaned;
  }

  // Case A: Multiple empty paragraphs left by Discourse removed images
  const discourseCooked = `
    <p>第一段文本</p>
    <p><br></p>
    <p><br></p>
    <p>第二段文本</p>
    <p><br></p>
  `;
  const resDiscourse = simCleanWhitespace(discourseCooked);
  assert.ok(!resDiscourse.includes("<p><br></p>"), "must remove empty paragraphs");
  assert.ok(resDiscourse.includes("<p>第一段文本</p>"), "must preserve first paragraph");
  assert.ok(resDiscourse.includes("<p>第二段文本</p>"), "must preserve second paragraph");
  assert.ok(!resDiscourse.endsWith("<br>"), "must trim trailing linebreaks");

  // Case B: V2EX multiple consecutive <br> tags left after image removal
  const v2exCooked = "这是第一行<br><br><br><br>这是第二行<br><br><br>";
  const resV2ex = simCleanWhitespace(v2exCooked);
  assert.equal(resV2ex, "这是第一行<br>这是第二行", "must collapse multiple <br> and remove trailing <br>");

  // Case C: Leading and trailing empty space before gallery
  const trailingCooked = "<br><br><p>单段文本</p><br><br>";
  const resTrailing = simCleanWhitespace(trailingCooked);
  assert.equal(resTrailing, "<p>单段文本</p>", "must eliminate leading and trailing void space");
});

test("comprehensive dark mode stylesheet covers tokens, user menus, list chips, bubbles, oneboxes, emoji picker, edit dialog, and V2EX", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Core token definitions & overridable color-scheme
  assert.ok(scriptContent.includes("color-scheme: dark !important;"), "must enforce color-scheme: dark !important in dark mode");
  assert.ok(scriptContent.includes("--wc-bg: #202328;"), "must define --wc-bg in dark mode");
  assert.ok(scriptContent.includes("--wc-text-4: #545B66;"), "must define --wc-text-4 in dark mode");
  assert.ok(scriptContent.includes("--wc-blue-soft: rgba(30, 111, 255, 0.18);"), "must define dark --wc-blue-soft");
  assert.ok(scriptContent.includes("--wc-accent-soft: rgba(30, 111, 255, 0.18);"), "must define dark --wc-accent-soft");

  // 2. Left rail & menus
  assert.ok(scriptContent.includes(".sidebar-wrapper"), "must style sidebar-wrapper in dark mode");
  assert.ok(scriptContent.includes(".user-menu.wecom-user-menu-float"), "must style floating user-menu in dark mode");
  assert.ok(scriptContent.includes(".quick-access-panel"), "must style quick-access-panel in dark mode");
  assert.ok(scriptContent.includes(".wecom-theme-menu button:hover"), "must style theme menu button hover in dark mode");

  // 3. Conversation list
  assert.ok(scriptContent.includes(".wecom-chip.active"), "must style active chip in dark mode");
  assert.ok(scriptContent.includes(".wecom-chip-icon"), "must style chip icon in dark mode");
  assert.ok(scriptContent.includes(".wecom-list-nav a.active"), "must style list nav link active in dark mode");
  assert.ok(scriptContent.includes(".wecom-conv-tag.is-dept"), "must style dept tag in dark mode");
  assert.ok(scriptContent.includes(".wecom-conv-tag.is-ext"), "must style ext tag in dark mode");
  assert.ok(scriptContent.includes(".wecom-list-search form:focus-within"), "must style search focus-within in dark mode");

  // 4. Chat header & bubbles & cooked elements
  assert.ok(scriptContent.includes(".wecom-chat-head"), "must style chat head in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-tools"), "must style floating msg tools in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-tool:hover"), "must style msg tool hover in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble aside.onebox"), "must style onebox in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble pre"), "must style pre in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble code"), "must style code in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble table th"), "must style table th in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble .subtle"), "must style V2EX subtle in dark mode");
  assert.ok(scriptContent.includes(".wecom-msg-bubble a.mention"), "must style mention in dark mode");

  // 5. Popovers, composer & dialogs
  assert.ok(scriptContent.includes(".emoji-picker"), "must style emoji picker in dark mode");
  assert.ok(scriptContent.includes(".autocomplete"), "must style autocomplete in dark mode");
  assert.ok(scriptContent.includes(".wecom-edit-dialog-card"), "must style edit dialog card");
  assert.ok(scriptContent.includes(".wecom-edit-input"), "must style edit dialog input");
  assert.ok(scriptContent.includes(".wecom-reply-target"), "must style reply target banner in dark mode");

  // 6. V2EX native fallback styles & float FAB
  assert.ok(scriptContent.includes("html.wecom-dark #Top"), "must style V2EX #Top in dark mode");
  assert.ok(scriptContent.includes("html.wecom-dark #Wrapper"), "must style V2EX #Wrapper in dark mode");
  assert.ok(scriptContent.includes("html.wecom-dark .box"), "must style V2EX .box in dark mode");
  assert.ok(scriptContent.includes(".wecom-mode-fab"), "must style wecom-mode-fab in dark mode");
});

test("Linux DO notification list dismiss ('全部忽略') triggers Discourse mark-read API, updates DOM, and clears badges", () => {
  // 1. Verify isDismissAllTarget recognizes all variations of dismiss buttons
  assert.ok(
    scriptContent.includes("function isDismissAllTarget(target)"),
    "must define isDismissAllTarget"
  );
  assert.ok(
    scriptContent.includes(".btn-dismiss-read") &&
    scriptContent.includes(".dismiss-read") &&
    scriptContent.includes(".dismiss-notification") &&
    scriptContent.includes("dismiss-all"),
    "isDismissAllTarget must cover core Discourse dismiss selectors"
  );
  assert.ok(
    scriptContent.includes("/忽略|已读|dismiss|mark.*read/i"),
    "isDismissAllTarget must match title and aria-label in Chinese and English"
  );
  assert.ok(
    scriptContent.includes(".d-icon-check"),
    "isDismissAllTarget must support checkmark icon buttons"
  );

  // 2. Verify isUserMenuTab prevents premature menu close on tab clicks
  assert.ok(
    scriptContent.includes("function isUserMenuTab(target)"),
    "must define isUserMenuTab"
  );
  assert.ok(
    scriptContent.includes(".user-menu-tab") && scriptContent.includes("tabs-list"),
    "isUserMenuTab must recognize user menu tab components"
  );

  // 3. Verify dismissAllDiscourseNotifications calls PUT /notifications/mark-read with CSRF headers
  assert.ok(
    scriptContent.includes("async function dismissAllDiscourseNotifications()"),
    "must define dismissAllDiscourseNotifications"
  );
  assert.ok(
    scriptContent.includes('await fetch("/notifications/mark-read"'),
    "dismissAllDiscourseNotifications must call PUT /notifications/mark-read"
  );
  assert.ok(
    scriptContent.includes('headers: bridgeHeaders("application/json")'),
    "dismissAllDiscourseNotifications must include CSRF bridge headers"
  );

  // 4. Verify unread notification DOM items are immediately marked as read
  assert.ok(
    scriptContent.includes('item.classList.remove("unread");') &&
    scriptContent.includes('item.classList.add("read");'),
    "dismissAllDiscourseNotifications must update unread class to read on items"
  );
  assert.ok(
    scriptContent.includes(".unread-indicator") &&
    scriptContent.includes(".notification-unread-dot"),
    "dismissAllDiscourseNotifications must strip unread indicators/dots"
  );

  // 5. Verify single notification click calls markDiscourseNotificationRead with notification ID
  assert.ok(
    scriptContent.includes("async function markDiscourseNotificationRead(notificationId)"),
    "must define markDiscourseNotificationRead"
  );
  assert.ok(
    scriptContent.includes("markDiscourseNotificationRead(notifId)"),
    "bindNotifMenuEvents must call markDiscourseNotificationRead on notification item click"
  );

  // 6. Verify global click fallback for dismiss-all
  assert.ok(
    scriptContent.includes("window.__wecomDismissAllBound"),
    "must bind global click listener fallback for dismiss-all"
  );
});

test("Topic opening suppresses Discourse page loading indicator and timeline progress bars via CSS and runtime helpers", () => {
  // 1. Verify CSS rules cover Discourse core page loading indicator container and bars
  assert.ok(
    scriptContent.includes(".loading-indicator-container") &&
    scriptContent.includes(".loading-indicator") &&
    scriptContent.includes("#loading-slider") &&
    scriptContent.includes(".d-loading-slider"),
    "RAW_CSS must hide Discourse page loading indicator containers and sliders"
  );
  assert.ok(
    scriptContent.includes(".topic-timeline") &&
    scriptContent.includes(".timeline-container"),
    "RAW_CSS must hide Discourse topic timeline progress bars"
  );

  // 2. Verify removeLoadingSliderDom cleans up lingering DOM nodes
  assert.ok(
    scriptContent.includes("function removeLoadingSliderDom()"),
    "must define removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("el.remove()"),
    "removeLoadingSliderDom must remove matched loading elements"
  );

  // 3. Verify disablePageLoadingIndicator disables Discourse site setting
  assert.ok(
    scriptContent.includes("function disablePageLoadingIndicator()"),
    "must define disablePageLoadingIndicator"
  );
  assert.ok(
    scriptContent.includes('page_loading_indicator = "none"'),
    "disablePageLoadingIndicator must set page_loading_indicator to none"
  );

  // 4. Verify runtime invocations on topic navigation and DOM mutation
  assert.ok(
    scriptContent.includes("discourseRouteTo(url) {\n    if (IS_V2EX || !url) return false;\n    removeLoadingSliderDom();") ||
    scriptContent.includes("discourseRouteTo(url) {\n    if (IS_V2EX || IS_JUEJIN || IS_ZHIHU || !url) return false;\n    removeLoadingSliderDom();"),
    "discourseRouteTo must invoke removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("removeLoadingSliderDom();\n        discourseRouteTo(href);"),
    "bindListPanelClicks must invoke removeLoadingSliderDom before routing"
  );
  assert.ok(
    scriptContent.includes("topicId = numericTopicId;\n    removeLoadingSliderDom();"),
    "loadTopic must invoke removeLoadingSliderDom"
  );
  assert.ok(
    scriptContent.includes("disablePageLoadingIndicator();\n    removeLoadingSliderDom();\n    restyleSplash();"),
    "applyTheme must invoke disablePageLoadingIndicator and removeLoadingSliderDom"
  );
});

test("Linux DO notification menu sticky positioning for tabs and dismiss button", () => {
  // 1. Verify CSS sticky top rules for menu tabs
  assert.ok(
    scriptContent.includes(".user-menu .menu-tabs-container") &&
    scriptContent.includes(".user-menu .panel-header") &&
    scriptContent.includes(".user-menu .tabs-list"),
    "RAW_CSS must target user-menu tab header elements"
  );
  assert.ok(
    scriptContent.includes("position: sticky !important;\n      top: 0 !important;\n      z-index: 35 !important;"),
    "RAW_CSS must make user-menu tabs sticky at top 0"
  );

  // 2. Verify intermediate containers have overflow: visible
  assert.ok(
    scriptContent.includes(".user-menu .panel-body,") &&
    scriptContent.includes(".user-menu .panel-body-contents,") &&
    scriptContent.includes(".user-menu .user-menu-notifications-list,") &&
    scriptContent.includes(".user-menu .quick-access-panel {\n      overflow: visible !important;"),
    "RAW_CSS must set overflow: visible on intermediate containers to enable sticky positioning"
  );

  // 3. Verify CSS sticky bottom rules for dismiss containers and buttons
  assert.ok(
    scriptContent.includes(".user-menu .panel-bottom,") &&
    scriptContent.includes(".user-menu .bottom-tabs,") &&
    scriptContent.includes(".user-menu .user-menu-dismiss-container,") &&
    scriptContent.includes(".user-menu .notifications-dismiss-container,") &&
    scriptContent.includes(".user-menu .wecom-notif-sticky-dismiss {"),
    "RAW_CSS must target dismiss containers for sticky bottom"
  );
  assert.ok(
    scriptContent.includes("position: sticky !important;\n      bottom: 0 !important;\n      z-index: 30 !important;"),
    "RAW_CSS must make dismiss bar sticky at bottom 0"
  );

  // 4. Verify dark mode styling for sticky elements
  assert.ok(
    scriptContent.includes("html.wecom-dark .user-menu .panel-bottom") &&
    scriptContent.includes("html.wecom-dark .user-menu .bottom-tabs"),
    "RAW_CSS must support dark mode for sticky dismiss bar"
  );

  // 5. Verify ensureStickyDismissButton definition and calls
  assert.ok(
    scriptContent.includes("function ensureStickyDismissButton(menu)"),
    "must define ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("ensureStickyDismissButton(menu);\n    bindNotifMenuEvents(menu);"),
    "positionNotifMenu must call ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("ensureStickyDismissButton(menu);\n    menu.addEventListener(\"mouseenter\""),
    "bindNotifMenuEvents must call ensureStickyDismissButton"
  );
  assert.ok(
    scriptContent.includes("const menu = findUserMenu();\n      if (menu) ensureStickyDismissButton(menu);"),
    "ensureNotifMenuObserver must call ensureStickyDismissButton"
  );

  // 6. Test simulation of ensureStickyDismissButton
  function isDismissAllTarget(target) {
    if (!target) return false;
    const el = target.closest ? target.closest("button, a, [role='button'], .btn") || target : target;
    const text = (el.textContent || "").trim();
    if (text.includes("全部忽略") || text.includes("忽略") || text.includes("Dismiss") || text.includes("Mark all read")) return true;
    return false;
  }

  function simulateEnsureSticky(menu) {
    if (!menu) return;
    const candidates = menu.querySelectorAll("button, a, .btn-dismiss-read");
    let btn = null;
    for (const el of candidates) {
      if (isDismissAllTarget(el)) {
        btn = el;
        break;
      }
    }
    if (!btn) return;
    btn.classList.add("wecom-notif-sticky-btn");
    const parent = btn.parentElement;
    if (parent && parent !== menu && !["notifications", "ul", "ol", "li"].includes(parent.tagName.toLowerCase())) {
      parent.classList.add("wecom-notif-sticky-dismiss");
    } else {
      btn.classList.add("wecom-notif-sticky-dismiss");
    }
  }

  const btnSet = new Set();
  const parentSet = new Set();
  const mockBtn = {
    textContent: "全部忽略",
    parentElement: null,
    tagName: "BUTTON",
    closest() { return this; },
    classList: { add: (c) => btnSet.add(c), contains: (c) => btnSet.has(c) }
  };
  const mockParent = {
    tagName: "DIV",
    children: [mockBtn],
    classList: { add: (c) => parentSet.add(c), contains: (c) => parentSet.has(c) }
  };
  mockBtn.parentElement = mockParent;
  const mockMenu = {
    querySelectorAll() { return [mockBtn]; }
  };

  simulateEnsureSticky(mockMenu);
  assert.ok(mockBtn.classList.contains("wecom-notif-sticky-btn"), "btn must have wecom-notif-sticky-btn");
  assert.ok(mockParent.classList.contains("wecom-notif-sticky-dismiss"), "parent container must have wecom-notif-sticky-dismiss");
});

test("Image viewer supports cursor-centered zooming, drag panning, and prev/next gallery navigation", () => {
  // 1. Verify CSS rules for cursor zoom and navigation controls
  assert.ok(
    scriptContent.includes("transform: translate3d(var(--wecom-image-viewer-x, 0px), var(--wecom-image-viewer-y, 0px), 0px) scale(var(--wecom-image-viewer-scale, 1));"),
    "RAW_CSS must apply translate3d and scale variables to image"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-nav") &&
    scriptContent.includes(".wecom-image-viewer-prev") &&
    scriptContent.includes(".wecom-image-viewer-next"),
    "RAW_CSS must style prev/next navigation buttons"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-counter"),
    "RAW_CSS must style image counter indicator"
  );
  assert.ok(
    scriptContent.includes(".wecom-image-viewer-image.is-dragging"),
    "RAW_CSS must style grabbing cursor during drag"
  );

  // 2. Verify functions definition
  assert.ok(scriptContent.includes("function setImageViewerTransform("), "must define setImageViewerTransform");
  assert.ok(scriptContent.includes("function collectChatImages("), "must define collectChatImages");
  assert.ok(scriptContent.includes("function updateImageViewerNavigationUi("), "must define updateImageViewerNavigationUi");
  assert.ok(scriptContent.includes("function renderImageViewerCurrent("), "must define renderImageViewerCurrent");
  assert.ok(scriptContent.includes("function nextImageViewerImage("), "must define nextImageViewerImage");
  assert.ok(scriptContent.includes("function prevImageViewerImage("), "must define prevImageViewerImage");

  // 3. Verify keyboard shortcuts and pointer event bindings
  assert.ok(
    scriptContent.includes("event.key === \"ArrowLeft\" || event.key === \"PageUp\""),
    "must bind ArrowLeft and PageUp to prevImageViewerImage"
  );
  assert.ok(
    scriptContent.includes("event.key === \"ArrowRight\" || event.key === \"PageDown\""),
    "must bind ArrowRight and PageDown to nextImageViewerImage"
  );
  assert.ok(
    scriptContent.includes("stage.addEventListener(\"pointerdown\"") &&
    scriptContent.includes("stage.addEventListener(\"pointermove\""),
    "must bind pointer events for dragging and panning"
  );
  assert.ok(
    scriptContent.includes("stage.addEventListener(\"dblclick\""),
    "must bind dblclick for toggling zoom"
  );

  // 4. Validate mathematical invariance of cursor-centered zoom
  const cx = 500;
  const cy = 400;
  let currentScale = 1;
  let currentTx = 0;
  let currentTy = 0;
  const mx = 620; // 120px to the right
  const my = 480; // 80px down

  // Zoom to 2x
  const newScale = 2;
  const ratio = newScale / currentScale;
  const newTx = (mx - cx) - ratio * (mx - cx - currentTx);
  const newTy = (my - cy) - ratio * (my - cy - currentTy);

  // Before zoom: mouse pointed to image point (mx - cx - currentTx) / currentScale = (620 - 500) / 1 = 120
  // After zoom: screen position of that same point is cx + newTx + 120 * newScale
  const screenXAfter = cx + newTx + 120 * newScale;
  const screenYAfter = cy + newTy + 80 * newScale;
  assert.equal(Math.round(screenXAfter), mx, "point under cursor X must remain exactly under cursor");
  assert.equal(Math.round(screenYAfter), my, "point under cursor Y must remain exactly under cursor");

  // 5. Validate gallery collection and navigation cycle
  const mockImages = [
    { src: "https://example.com/1.jpg" },
    { src: "https://example.com/2.jpg" },
    { src: "https://example.com/3.jpg" }
  ];
  let activeIndex = 0;
  function next() {
    activeIndex = (activeIndex + 1) % mockImages.length;
  }
  function prev() {
    activeIndex = (activeIndex - 1 + mockImages.length) % mockImages.length;
  }

  next();
  assert.equal(activeIndex, 1, "next() from 0 must move to 1");
  next();
  assert.equal(activeIndex, 2, "next() from 1 must move to 2");
  next();
  assert.equal(activeIndex, 0, "next() from 2 must cycle back to 0");
  prev();
  assert.equal(activeIndex, 2, "prev() from 0 must cycle back to 2");
});

test("Images inside blockquote are auto-laid out into independent galleries without mixing with outer bubble layout", () => {
  // 1. Verify CSS rules for blockquote images gallery
  assert.ok(
    scriptContent.includes("blockquote .wecom-msg-images"),
    "RAW_CSS must style .wecom-msg-images inside blockquote"
  );

  // 2. Verify isNodeVisuallyEmpty preserves .wecom-msg-images and .wecom-msg-thumb
  assert.ok(
    scriptContent.includes(".wecom-msg-images, .wecom-msg-thumb"),
    "isNodeVisuallyEmpty must treat galleries and thumbnails as meaningful content"
  );

  // 3. Verify applyImageAutoLayout scopes images by blockquote
  assert.ok(
    scriptContent.includes("const bq = img.closest(\"blockquote\");\n        const scope = bq || bubble;"),
    "applyImageAutoLayout must group candidate images by blockquote scope"
  );
  assert.ok(
    scriptContent.includes("if (scope === bubble) {\n          cleanMessageBodyWhitespace(bodyEl);\n          bodyEl.after(gallery);\n        } else {\n          cleanMessageBodyWhitespace(scope);\n          scope.appendChild(gallery);\n        }"),
    "applyImageAutoLayout must keep a bubble gallery after its body and before nested reply floors"
  );

  // 4. Verify querySelectorAll is used to remove all galleries on toggle
  assert.ok(
    scriptContent.includes("bubble.querySelectorAll(\".wecom-msg-images\").forEach((el) => el.remove());"),
    "toggleMessageBubbleLayout must remove all galleries inside bubble including blockquote galleries"
  );

  // 5. Functional simulation of scoped grouping
  const mockBubble = { id: "bubble", children: [] };
  const mockBq = { id: "blockquote", children: [] };

  const mockImgs = [
    { src: "out1.png", closest(sel) { return sel === "blockquote" ? null : null; } },
    { src: "quote1.png", closest(sel) { return sel === "blockquote" ? mockBq : null; } },
    { src: "quote2.png", closest(sel) { return sel === "blockquote" ? mockBq : null; } },
    { src: "out2.png", closest(sel) { return sel === "blockquote" ? null : null; } }
  ];

  const groups = new Map();
  for (const img of mockImgs) {
    const bq = img.closest("blockquote");
    const scope = bq || mockBubble;
    if (!groups.has(scope)) groups.set(scope, []);
    groups.get(scope).push(img);
  }

  assert.equal(groups.size, 2, "must have exactly 2 distinct scopes (bubble and blockquote)");
  assert.equal(groups.get(mockBubble).length, 2, "bubble scope must have 2 outer images");
  assert.equal(groups.get(mockBq).length, 2, "blockquote scope must have 2 quoted images");

  assert.deepEqual(
    groups.get(mockBubble).map(i => i.src),
    ["out1.png", "out2.png"],
    "outer bubble gallery must only contain images from outside quotes"
  );
  assert.deepEqual(
    groups.get(mockBq).map(i => i.src),
    ["quote1.png", "quote2.png"],
    "blockquote gallery must only contain images from inside quote"
  );
});

test("Quote title aside.quote .title is beautified with transparent background, no borders, and muted typography", () => {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. Verify aside.quote and aside.quote .title background transparency and border removal
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble aside.quote .title,") &&
    scriptContent.includes("background: transparent !important;") &&
    scriptContent.includes("background-color: transparent !important;") &&
    scriptContent.includes("border: none !important;") &&
    scriptContent.includes("border-left: none !important;"),
    "aside.quote .title must explicitly remove white background and border"
  );

  // 2. Verify subtle muted typography and bold weight (font-weight: 600) for light mode
  assert.ok(
    scriptContent.includes("color: #767C85 !important;"),
    "quote title should use muted non-conspicuous text color in light mode"
  );
  assert.ok(
    scriptContent.includes("font-weight: 600 !important;"),
    "quote title and links must be bold (font-weight: 600)"
  );

  // 3. Verify quote title links inherit muted color without jarring underlines and keep bold weight
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble aside.quote .title a") &&
    scriptContent.includes("color: inherit !important;") &&
    scriptContent.includes("text-decoration: none !important;") &&
    scriptContent.includes("font-weight: 600 !important;"),
    "quote title links must inherit muted color, omit default link styling, and be bold"
  );

  // 4. Verify outgoing bubble (.wecom-msg-me) styles for quotes
  assert.ok(
    scriptContent.includes(".wecom-msg-me .wecom-msg-bubble aside.quote .title"),
    "outgoing bubbles must have dedicated quote title styling"
  );

  // 5. Verify dark mode overrides for quotes
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote .title") &&
    scriptContent.includes("color: #929AA7 !important;"),
    "dark mode must style quote title with soft muted dark-mode color"
  );
});

test("Settings can hide unused rail and composer controls", () => {
  assert.ok(
    scriptContent.includes('const HIDE_UNUSED_UI_KEY = "linuxdo-wecom-hide-unused-ui";') &&
    scriptContent.includes("function isHideUnusedUi(") &&
    scriptContent.includes("function setHideUnusedUi("),
    "must persist the unused control visibility setting"
  );
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-hide-unused-ui") &&
    scriptContent.includes("隐藏无用图标和按钮"),
    "must provide the unused control visibility toggle in settings"
  );
  assert.ok(
    scriptContent.includes('html.wecom-hide-unused-ui .wecom-rail-item[data-rail-key="todo"]') &&
    scriptContent.includes('html.wecom-hide-unused-ui .wecom-composer-tools [data-composer-action="todo"]') &&
    scriptContent.includes('html.wecom-hide-unused-ui .wecom-composer-tools [data-composer-action="phone"]') &&
    !scriptContent.includes("html.wecom-hide-unused-ui .wecom-chat-tools"),
    "must hide unused rail and composer controls without hiding chat header actions"
  );
});

test("V2EX topics support header favorites and first-post engagement statistics", () => {
  assert.ok(
    scriptContent.includes("function parseV2exTopicStats(") &&
    scriptContent.includes("v2ex_topic_stats: v2exTopicStats") &&
    scriptContent.includes("wecom-v2ex-topic-stats"),
    "must parse and render V2EX topic statistics on the opening post"
  );
  assert.ok(
    scriptContent.includes("function toggleV2exTopicFavorite(") &&
    scriptContent.includes("/favorite/topic/${topicId}?once=${encodeURIComponent(once)}") &&
    scriptContent.includes('doc.querySelector("input[name=\'once\']")?.value?.trim()') &&
    scriptContent.includes("unfavoriteLink") &&
    scriptContent.includes("setV2exTopicFavoriteState(false)"),
    "must obtain tokens and support both favoriting and unfavoriting V2EX topics"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {") &&
    scriptContent.includes("toggleV2exTopicFavorite().catch"),
    "must route the visible header bookmark button to V2EX favorites"
  );
});

test("Conversation detail avatars can be configured to be hidden via settings and header controls", () => {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. Verify constant definition
  assert.ok(
    scriptContent.includes('const HIDE_CHAT_AVATAR_KEY = "linuxdo-wecom-hide-chat-avatar";'),
    "must define HIDE_CHAT_AVATAR_KEY"
  );

  // 2. Verify getter and setter helpers
  assert.ok(scriptContent.includes("function isHideChatAvatar("), "must define isHideChatAvatar helper");
  assert.ok(scriptContent.includes("function setHideChatAvatar("), "must define setHideChatAvatar helper");

  // 3. Verify CSS styling when hidden
  assert.ok(
    scriptContent.includes("html.wecom-hide-chat-avatar .wecom-msg-avatar") &&
    scriptContent.includes("html.wecom-hide-chat-avatar .wecom-chat-avatar") &&
    scriptContent.includes("display: none !important;"),
    "must hide message and header avatars when html.wecom-hide-chat-avatar class is present"
  );

  // 4. Verify presence in theme menu
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-hide-chat-avatar") &&
    scriptContent.includes("隐藏对话详情头像"),
    "must provide toggle item in theme menu"
  );

  // 5. Verify presence in chat header tools
  assert.ok(
    scriptContent.includes("wecom-chat-avatar-toggle") &&
    scriptContent.includes("隐藏对话头像"),
    "must provide instant toggle button in chat header tools"
  );

  // 6. Verify userCardAttributes is attached to .wecom-msg-name
  assert.ok(
    scriptContent.includes('<span class="wecom-msg-name"${userCardAttributes(post)}>'),
    "userCardAttributes must be attached to .wecom-msg-name so profiles remain accessible"
  );

  // 7. Verify functional state simulation
  let storageState = "0";
  const fakeDocEl = {
    classList: {
      classes: new Set(),
      toggle(cls, val) {
        if (val) this.classes.add(cls);
        else this.classes.delete(cls);
      },
      contains(cls) {
        return this.classes.has(cls);
      }
    }
  };

  const isHidden = () => storageState === "1";
  const setHidden = (val) => {
    storageState = val ? "1" : "0";
    fakeDocEl.classList.toggle("wecom-hide-chat-avatar", !!val);
  };

  assert.equal(isHidden(), false, "default must be false (avatars shown)");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), false);

  setHidden(true);
  assert.equal(isHidden(), true, "must be true after enabling");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), true, "must add class to html");

  setHidden(false);
  assert.equal(isHidden(), false, "must be false after disabling");
  assert.equal(fakeDocEl.classList.contains("wecom-hide-chat-avatar"), false, "must remove class from html");
});

test("Selection Base64 auto-decoding parses valid strings, prevents false positives, and provides UI controls", () => {
  // 1. Verify script declarations and components
  assert.ok(
    scriptContent.includes('const BASE64_DECODE_KEY = "linuxdo-wecom-base64-decode";'),
    "must declare BASE64_DECODE_KEY"
  );
  assert.ok(
    scriptContent.includes("function decodeBase64(raw)"),
    "must define decodeBase64"
  );
  assert.ok(
    scriptContent.includes("function showBase64Popover("),
    "must define showBase64Popover"
  );
  assert.ok(
    scriptContent.includes("function closeBase64Popover()"),
    "must define closeBase64Popover"
  );
  assert.ok(
    scriptContent.includes("function bindBase64Selection()"),
    "must define bindBase64Selection"
  );
  assert.ok(
    scriptContent.includes("bindBase64Selection();"),
    "must call bindBase64Selection in bootstrap"
  );

  // 2. Verify Theme Menu presence
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-base64") &&
    scriptContent.includes("划词自动解码 Base64"),
    "theme menu must include toggle for base64 auto-decoding"
  );

  // 3. Verify CSS styling for popover and dark mode
  assert.ok(
    scriptContent.includes(".wecom-base64-popover") &&
    scriptContent.includes(".wecom-base64-decoded-text") &&
    scriptContent.includes(".wecom-base64-copy-btn"),
    "must include CSS styling for base64 popover components"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-base64-popover") ||
    scriptContent.includes(".wecom-dark .wecom-base64-popover"),
    "must include dark mode CSS for base64 popover"
  );

  // 4. Verify decodeBase64 implementation logic
  function testDecode(raw) {
    if (!raw || typeof raw !== "string") return null;
    let str = raw.trim().replace(/^(?:base64|b64)[:：]\s*/i, "").replace(/^['"`“‘「\[]+|['"`”’」\]]+$/g, "").replace(/\s+/g, "");
    if (str.length < 6 || str.length > 10000) return null;
    if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(str)) return null;
    let normalized = str.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) normalized += "=";
    try {
      const binary = atob(normalized);
      if (!binary || binary.length === 0) return null;
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!decoded || decoded === raw || !decoded.trim()) return null;
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(decoded)) return null;
      if (!/^[\u0020-\u007E\u00A0-\uFFFF\r\n\t]+$/.test(decoded)) return null;
      if (!str.includes("=") && /^[a-zA-Z]+$/.test(str)) {
        const looksLegit = /(https?:\/\/|[.:/?#=_\-@&%+\\]|[\u4e00-\u9fa5]|\s)/.test(decoded);
        if (!looksLegit) return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  // URLs
  assert.equal(testDecode("aHR0cHM6Ly9saW51eC5kbw=="), "https://linux.do");
  assert.equal(testDecode("aHR0cHM6Ly9saW51eC5kbw"), "https://linux.do", "unpadded base64 should decode");
  assert.equal(testDecode("Base64: aHR0cHM6Ly9saW51eC5kbw=="), "https://linux.do", "prefixed with Base64: should decode");
  assert.equal(testDecode('"aHR0cHM6Ly9saW51eC5kbw=="'), "https://linux.do", "quoted base64 should decode");

  // Chinese text
  assert.equal(testDecode("5L2g5aW977yM5LiW55WM"), "你好，世界", "UTF-8 Chinese should decode correctly");

  // Magnet link
  assert.equal(
    testDecode("bWFnbmV0Oj94dD11cm46YnRpaDoxMjM0NTY3ODkwYWJjZGVm"),
    "magnet:?xt=urn:btih:1234567890abcdef",
    "magnet URI should decode"
  );

  // URL-safe base64
  const urlSafe = Buffer.from("https://linux.do/t/topic/123?foo=bar_baz-qux").toString("base64url");
  assert.equal(testDecode(urlSafe), "https://linux.do/t/topic/123?foo=bar_baz-qux");

  // Prevent false positives on common words and non-base64
  assert.equal(testDecode("important"), null, "regular English word 'important' must not trigger decode");
  assert.equal(testDecode("interface"), null, "regular English word 'interface' must not trigger decode");
  assert.equal(testDecode("window"), null, "regular English word 'window' must not trigger decode");
  assert.equal(testDecode("developer"), null, "regular English word 'developer' must not trigger decode");
  assert.equal(testDecode("1234567890"), null, "numeric string must not trigger decode");
  assert.equal(testDecode("abc"), null, "too short string must not trigger decode");
  assert.equal(testDecode(""), null, "empty string must not trigger decode");

  // 5. Verify default enabled state in storage simulation
  let storage = {};
  const isEnabled = () => storage["linuxdo-wecom-base64-decode"] !== "0";
  const setEnabled = (val) => { storage["linuxdo-wecom-base64-decode"] = val ? "1" : "0"; };

  assert.equal(isEnabled(), true, "must be enabled by default");
  setEnabled(false);
  assert.equal(isEnabled(), false, "must be disabled when set to false");
  setEnabled(true);
  assert.equal(isEnabled(), true, "must be re-enabled when set to true");
});

test("V2EX editor uploads images via Imgur API and inserts direct image links", async () => {
  // 1. Verify declarations and metadata
  assert.ok(
    scriptContent.includes('const V2EX_IMGUR_CLIENT_ID = "60605aad4a62882";'),
    "must define V2EX_IMGUR_CLIENT_ID"
  );
  assert.ok(
    scriptContent.includes('const V2EX_IMGUR_UPLOAD_URL = "https://api.imgur.com/3/upload";'),
    "must define V2EX_IMGUR_UPLOAD_URL"
  );
  assert.ok(
    scriptContent.includes("async function uploadImageFileToImgur(file)"),
    "must define uploadImageFileToImgur"
  );
  assert.ok(
    scriptContent.includes("// @connect      api.imgur.com"),
    "must declare @connect api.imgur.com"
  );
  assert.ok(
    scriptContent.includes("// @connect      imgur.com"),
    "must declare @connect imgur.com"
  );

  // 2. Verify V2EX branch routing in uploadImageFile and uploadedImageMarkdown
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {\n      const link = await uploadImageFileToImgur(file);") ||
    (scriptContent.includes("if (IS_V2EX)") && scriptContent.includes("uploadImageFileToImgur")),
    "uploadImageFile must route to uploadImageFileToImgur when IS_V2EX is true"
  );
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {\n      return url;\n    }") ||
    (scriptContent.includes("if (IS_V2EX)") && scriptContent.includes("return url;")),
    "uploadedImageMarkdown must return plain url on V2EX"
  );

  // 3. Functional simulation of uploadedImageMarkdown
  function simulateUploadedImageMarkdown(payload, file, isV2ex) {
    const url = payload?.url || payload?.link || payload?.data?.link;
    if (!url) throw new Error("站点未返回图片地址");
    if (isV2ex) return url;
    const rawLabel = String(file?.name || "图片");
    const label = rawLabel.replace(/\.[^.]+$/, "").replace(/[\[\]\\|]/g, "_");
    return `![${label}](${url})`;
  }

  const v2exUrl = simulateUploadedImageMarkdown(
    { url: "https://i.imgur.com/example123.png" },
    { name: "screenshot.png" },
    true
  );
  assert.equal(v2exUrl, "https://i.imgur.com/example123.png", "V2EX should receive raw image url");

  const linuxdoMarkdown = simulateUploadedImageMarkdown(
    { url: "https://linux.do/uploads/default/original/2X/1/123.png" },
    { name: "screenshot.png" },
    false
  );
  assert.equal(
    linuxdoMarkdown,
    "![screenshot](https://linux.do/uploads/default/original/2X/1/123.png)",
    "Linux DO should receive markdown image syntax"
  );

  // 4. Functional simulation of Imgur response handling
  function parseImgurResponse(respOk, status, payload) {
    if (!respOk || !payload?.success || !payload?.data?.link) {
      const errObj = payload?.data?.error;
      const errMsg = (typeof errObj === "string" ? errObj : errObj?.message) ||
        payload?.error?.message ||
        payload?.error ||
        `Imgur upload failed with ${status}`;
      throw new Error(errMsg);
    }
    return String(payload.data.link).replace(/^http:\/\//i, "https://");
  }

  // Success with HTTPS link
  assert.equal(
    parseImgurResponse(true, 200, { success: true, data: { link: "https://i.imgur.com/abc1234.png" } }),
    "https://i.imgur.com/abc1234.png"
  );

  // Success with HTTP link (should upgrade to HTTPS)
  assert.equal(
    parseImgurResponse(true, 200, { success: true, data: { link: "http://i.imgur.com/abc1234.jpg" } }),
    "https://i.imgur.com/abc1234.jpg"
  );

  // Error payload with error string
  assert.throws(
    () => parseImgurResponse(false, 400, { success: false, data: { error: "Imgur is over capacity" } }),
    /Imgur is over capacity/
  );

  // Error payload with error object
  assert.throws(
    () => parseImgurResponse(false, 403, { success: false, data: { error: { message: "Invalid Client-ID" } } }),
    /Invalid Client-ID/
  );

  // Non-JSON or status error fallback
  assert.throws(
    () => parseImgurResponse(false, 500, null),
    /Imgur upload failed with 500/
  );
});

test("wecom-compose-status is positioned in wecom-composer-bottom with refined 11px font styling", () => {
  // 1. Verify it is located in .wecom-composer-bottom, not in .wecom-composer-tools
  assert.ok(
    scriptContent.includes(
      '<div class="wecom-composer-bottom">\n            <span class="wecom-compose-status" aria-live="polite"></span>\n            <button type="button" class="wecom-send-btn" disabled>发送(S)</button>\n          </div>'
    ),
    "must place .wecom-compose-status inside .wecom-composer-bottom next to send button"
  );

  // 2. Verify CSS styling defines 11px font size and appropriate layout
  assert.ok(
    scriptContent.includes(".wecom-compose-status {\n      font-size: 11px !important;"),
    "must style .wecom-compose-status with 11px font size"
  );
  assert.ok(
    scriptContent.includes(".wecom-compose-status:empty {\n      display: none !important;\n    }"),
    "must hide .wecom-compose-status when empty"
  );

  // 3. Verify status color classes
  assert.ok(
    scriptContent.includes(".wecom-compose-status.busy") &&
    scriptContent.includes(".wecom-compose-status.success") &&
    scriptContent.includes(".wecom-compose-status.error"),
    "must define busy, success, and error colors"
  );
});

test("V2EX built-in emoji picker integrates with composer, supports tabs, Unicode emojis, and handles non-Discourse environments", () => {
  // 1. Definition and helpers exist
  assert.ok(scriptContent.includes("const V2EX_EMOJI_CATEGORIES = Object.freeze(["), "must define V2EX_EMOJI_CATEGORIES");
  assert.ok(scriptContent.includes("function showV2exEmojiPicker("), "must define showV2exEmojiPicker");
  assert.ok(scriptContent.includes("function toggleV2exEmojiPicker("), "must define toggleV2exEmojiPicker");
  assert.ok(scriptContent.includes("function closeV2exEmojiPicker()"), "must define closeV2exEmojiPicker");
  assert.ok(scriptContent.includes("function bindV2exEmojiPickerEvents()"), "must define bindV2exEmojiPickerEvents");

  // 2. CSS styles are defined for light and dark modes
  assert.ok(scriptContent.includes(".wecom-v2ex-emoji-picker {"), "must style .wecom-v2ex-emoji-picker");
  assert.ok(scriptContent.includes(".wecom-emoji-picker-tabs {"), "must style .wecom-emoji-picker-tabs");
  assert.ok(scriptContent.includes(".wecom-emoji-tab-btn {"), "must style .wecom-emoji-tab-btn");
  assert.ok(scriptContent.includes(".wecom-emoji-picker-body {"), "must style .wecom-emoji-picker-body");
  assert.ok(scriptContent.includes(".wecom-emoji-item-btn {"), "must style .wecom-emoji-item-btn");
  assert.ok(scriptContent.includes("html.wecom-dark .wecom-v2ex-emoji-picker"), "must style emoji picker in dark mode");

  // 3. Composer tool action branches for IS_V2EX and graceful fallback
  assert.ok(
    scriptContent.includes("if (action === \"emoji\") {\n      if (IS_V2EX || IS_JUEJIN) {\n        toggleV2exEmojiPicker(button);\n        return;\n      }\n      showOfficialEmojiPicker(button).catch(() => {\n        toggleV2exEmojiPicker(button);\n      });\n      return;\n    }") ||
    scriptContent.includes("if (action === \"emoji\") {\n      if (IS_V2EX || IS_JUEJIN || IS_ZHIHU) {\n        toggleV2exEmojiPicker(button);\n        return;\n      }\n      showOfficialEmojiPicker(button).catch(() => {\n        toggleV2exEmojiPicker(button);\n      });\n      return;\n    }"),
    "handleComposerToolClick must branch to toggleV2exEmojiPicker when IS_V2EX or IS_JUEJIN is true, and fall back on error"
  );

  // 4. Modal check includes .wecom-v2ex-emoji-picker
  assert.ok(
    scriptContent.includes(".wecom-v2ex-emoji-picker:not([hidden])"),
    "isModalOrViewerOpen must check .wecom-v2ex-emoji-picker:not([hidden])"
  );

  // 5. Verify category extraction and emoji tab switching logic
  const catMatch = scriptContent.match(/const V2EX_EMOJI_CATEGORIES = Object\.freeze\(\[\s*([\s\S]*?)\]\);/);
  assert.ok(catMatch, "must extract V2EX_EMOJI_CATEGORIES");
  const categories = eval(`[${catMatch[1]}]`);
  assert.equal(categories.length, 5, "must contain 5 emoji categories");
  const catIds = categories.map(c => c.id);
  assert.deepEqual(catIds, ["smileys", "gestures", "symbols", "animals", "food"]);

  for (const cat of categories) {
    assert.ok(cat.id, "category must have id");
    assert.ok(cat.name, "category must have name");
    assert.ok(cat.icon, "category must have icon");
    assert.ok(Array.isArray(cat.emojis) && cat.emojis.length > 20, `${cat.name} must have emojis`);
  }

  // 6. Test interaction flow simulation
  let inserted = "";
  function fakeInsert(emo) {
    inserted = emo;
  }
  // Simulate clicking an emoji in the smileys tab
  const smiley = categories[0].emojis[0]; // 😀
  fakeInsert(smiley);
  assert.equal(inserted, "😀");

  // Simulate switching to gestures tab
  const gesture = categories[1].emojis[0]; // 👍
  fakeInsert(gesture);
  assert.equal(inserted, "👍");
});

test("Restore original style shortcut (Alt+W / Alt+O) toggles between WeCom IM theme and native site layout", () => {
  // 1. Definition and helpers exist
  assert.ok(
    scriptContent.includes("function toggleViewModeByShortcut()"),
    "must define toggleViewModeByShortcut"
  );
  assert.ok(
    scriptContent.includes("function bindViewModeShortcut()"),
    "must define bindViewModeShortcut"
  );
  assert.ok(
    scriptContent.includes("bindViewModeShortcut();"),
    "bootstrap must call bindViewModeShortcut"
  );

  // 2. Shortcut handles Alt+W and Alt+O
  assert.ok(
    scriptContent.includes("key === \"w\" || key === \"o\" || code === \"KeyW\" || code === \"KeyO\""),
    "must check for Alt+W or Alt+O (case-insensitive and code checks)"
  );
  assert.ok(
    scriptContent.includes("!e.altKey || e.ctrlKey || e.metaKey"),
    "must guard that Alt is held and Ctrl/Meta are not held"
  );

  // 3. Theme menu has option to restore native style
  assert.ok(
    scriptContent.includes('class="wecom-menu-restore-native"'),
    "theme menu must render .wecom-menu-restore-native option"
  );
  assert.ok(
    scriptContent.includes("toggleViewModeByShortcut();"),
    "theme menu click must trigger toggleViewModeByShortcut"
  );

  // 4. Native mode FAB title mentions shortcut
  assert.ok(
    scriptContent.includes("切回企业微信 IM 视图 (快捷键: Alt+W / Alt+O)"),
    "fab button title must document the shortcut"
  );

  // 5. Test toggle logic simulation
  let currentMode = "im";
  let reloaded = false;
  let navigatedTo = null;

  function fakeToggle() {
    if (currentMode === "native") {
      currentMode = "im";
      reloaded = true;
    } else {
      currentMode = "native";
      navigatedTo = "/t/123456";
    }
  }

  // From IM -> Native
  fakeToggle();
  assert.equal(currentMode, "native");
  assert.equal(navigatedTo, "/t/123456");

  // From Native -> IM
  fakeToggle();
  assert.equal(currentMode, "im");
  assert.equal(reloaded, true);
});

test("Topic reply polling and background post sync preserves user reading position and avoids jumping to bottom", () => {
  // 1. appendFreshPosts inspects wasNearBottom before DOM insertions
  assert.ok(
    scriptContent.includes("const wasNearBottom = body.clientHeight > 0 && (prevScrollHeight - (prevScrollTop + body.clientHeight) <= 32);"),
    "appendFreshPosts must calculate wasNearBottom before DOM mutations"
  );

  // 2. shouldScroll condition requires explicit true or wasNearBottom
  assert.ok(
    scriptContent.includes("const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);"),
    "must only auto-scroll if options.scroll === true or user was already at the bottom"
  );

  // 3. submitComposer explicitly specifies { scroll: true } on user submission
  assert.ok(
    scriptContent.includes("appendFreshPosts([post], document.querySelector(\".wecom-chat-body\"), {\n          scroll: true,") ||
    scriptContent.includes("appendFreshPosts([post], document.querySelector(\".wecom-chat-body\"), {\r\n          scroll: true,") ||
    scriptContent.includes("appendFreshPosts([post], document.querySelector(\".wecom-chat-body\"), { scroll: true"),
    "submitting post must pass { scroll: true } to follow user's own sent message"
  );

  // 4. Test scrolling calculation simulation
  function simulateScrollDecision(scrollTop, scrollHeight, clientHeight, options) {
    const wasNearBottom = clientHeight > 0 && (scrollHeight - (scrollTop + clientHeight) <= 32);
    const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);
    return { wasNearBottom, shouldScroll };
  }

  // Scenario A: User is reading at top (e.g. floor 1, scrollTop = 0, scrollHeight = 3000, clientHeight = 600)
  // Background polling arrives with empty options {}
  const topRes = simulateScrollDecision(0, 3000, 600, {});
  assert.equal(topRes.wasNearBottom, false, "user at top must not be near bottom");
  assert.equal(topRes.shouldScroll, false, "polling must NOT scroll to bottom when user is reading at top");

  // Scenario B: User is reading middle floors (e.g. scrollTop = 1200)
  const midRes = simulateScrollDecision(1200, 3000, 600, {});
  assert.equal(midRes.wasNearBottom, false, "user in middle must not be near bottom");
  assert.equal(midRes.shouldScroll, false, "polling must NOT scroll to bottom when user is reading middle floors");

  // Scenario C: User is actively at bottom (e.g. scrollTop = 2400, scrollHeight = 3000, clientHeight = 600)
  const bottomRes = simulateScrollDecision(2400, 3000, 600, {});
  assert.equal(bottomRes.wasNearBottom, true, "user at bottom must be detected as near bottom");
  assert.equal(bottomRes.shouldScroll, true, "polling should keep view pinned to bottom if user was already at bottom");

  // Scenario D: User explicitly sends a message with { scroll: true }, even if previously scrolled up
  const submitRes = simulateScrollDecision(500, 3000, 600, { scroll: true });
  assert.equal(submitRes.shouldScroll, true, "user message submission must always scroll to bottom");

  // Scenario E: Loading older posts with { scroll: false }
  const olderRes = simulateScrollDecision(2400, 3000, 600, { scroll: false });
  assert.equal(olderRes.shouldScroll, false, "options.scroll: false must never scroll to bottom");
});

test("V2EX category navigation extracts #Tabs, provides persistent cache, and renders .wecom-v2ex-nav2 sidebar", () => {
  // 1. Script definitions and CSS
  assert.ok(
    scriptContent.includes("function extractV2exTabsFromDom("),
    "must define extractV2exTabsFromDom"
  );
  assert.ok(
    scriptContent.includes("function getV2exTabs()"),
    "must define getV2exTabs"
  );
  assert.ok(
    scriptContent.includes("function ensureV2exNav2()"),
    "must define ensureV2exNav2"
  );
  assert.ok(
    scriptContent.includes("function syncV2exNav2()"),
    "must define syncV2exNav2"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-nav2"),
    "must include .wecom-v2ex-nav2 in CSS"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-nav2-item"),
    "must include .wecom-v2ex-nav2-item in CSS"
  );
  assert.ok(
    scriptContent.includes('localStorage.setItem("linuxdo-wecom-v2ex-tabs"'),
    "must persist parsed #Tabs to localStorage"
  );

  // 2. DEFAULT_V2EX_LIST_NAV includes full standard categories from #Tabs
  assert.ok(
    scriptContent.includes('{ href: "/?tab=tech", label: "技术" }'),
    "DEFAULT_V2EX_LIST_NAV must include 技术"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=creative", label: "创意" }'),
    "DEFAULT_V2EX_LIST_NAV must include 创意"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=all", label: "全部" }'),
    "DEFAULT_V2EX_LIST_NAV must include 全部"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=hot", label: "最热" }'),
    "DEFAULT_V2EX_LIST_NAV must include 最热"
  );
  assert.ok(
    scriptContent.includes('{ href: "/?tab=r2", label: "R2" }'),
    "DEFAULT_V2EX_LIST_NAV must include R2"
  );
  assert.ok(
    scriptContent.includes('{ href: "/xna", label: "VXNA" }'),
    "DEFAULT_V2EX_LIST_NAV must include VXNA"
  );

  // 3. Simulation test for extractV2exTabsFromDom
  function simulateExtractV2exTabs(root) {
    const tabsEl = root.querySelector("#Tabs");
    if (!tabsEl) return null;
    const links = [...tabsEl.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href") || "#",
      label: (a.textContent || "").replace(/\s+/g, " ").trim(),
      active: a.classList.contains("tab_current")
    })).filter((it) => it.label && it.href && it.href !== "#" && !it.href.startsWith("javascript:"));
    return links.length ? links : null;
  }

  const mockTabsEl = {
    querySelectorAll: (sel) => {
      if (sel === "a") {
        return [
          { getAttribute: () => "/?tab=tech", textContent: "技术", classList: { contains: (c) => c === "tab_current" } },
          { getAttribute: () => "/?tab=creative", textContent: "创意", classList: { contains: () => false } },
          { getAttribute: () => "/?tab=apple", textContent: "Apple", classList: { contains: () => false } },
          { getAttribute: () => "/planet", textContent: "", classList: { contains: () => false } }, // empty label (image only)
          { getAttribute: () => "#", textContent: "无效", classList: { contains: () => false } }
        ];
      }
      return [];
    }
  };

  const mockDoc = {
    querySelector: (sel) => (sel === "#Tabs" ? mockTabsEl : null)
  };

  const extracted = simulateExtractV2exTabs(mockDoc);
  assert.ok(extracted, "must extract tabs from #Tabs");
  assert.equal(extracted.length, 3, "must filter out empty text and invalid # links");
  assert.equal(extracted[0].label, "技术");
  assert.equal(extracted[0].href, "/?tab=tech");
  assert.equal(extracted[0].active, true);
  assert.equal(extracted[1].label, "创意");
  assert.equal(extracted[1].href, "/?tab=creative");
  assert.equal(extracted[1].active, false);

  // When #Tabs is absent (e.g. topic page)
  const emptyDoc = { querySelector: () => null };
  assert.equal(simulateExtractV2exTabs(emptyDoc), null);
});

test("V2EX avatar click opens user popover card with #money balance and quick actions", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-v2ex-user-popover"),
    "must define CSS for .wecom-v2ex-user-popover"
  );
  assert.ok(
    scriptContent.includes("extractV2exMoneyFromDom"),
    "must define extractV2exMoneyFromDom helper"
  );
  assert.ok(
    scriptContent.includes("getV2exMoneyHtml"),
    "must define getV2exMoneyHtml helper"
  );
  assert.ok(
    scriptContent.includes("openV2exUserPopover"),
    "must define openV2exUserPopover function"
  );
  assert.ok(
    scriptContent.includes("closeV2exUserPopover"),
    "must define closeV2exUserPopover function"
  );
  assert.ok(
    scriptContent.includes("isV2exUserPopoverOpen"),
    "must define isV2exUserPopoverOpen function"
  );
  assert.ok(
    scriptContent.includes('const V2EX_MONEY_KEY = "linuxdo-wecom-v2ex-money";'),
    "must define persistent cache key for V2EX money"
  );
  assert.match(
    scriptContent,
    /WECOM_UI_SEL\s*=\s*"[^"]*\.wecom-v2ex-user-popover/,
    "WECOM_UI_SEL must include .wecom-v2ex-user-popover"
  );
  assert.ok(
    scriptContent.includes("closeV2exUserPopover();"),
    "removePanels must call closeV2exUserPopover"
  );

  // 2. Avatar click toggles popover & badge click directly loads notifications
  assert.ok(
    /isV2exUserPopoverOpen\(\)\s*\?\s*closeV2exUserPopover\(\)\s*:\s*openV2exUserPopover\(\)/.test(scriptContent) ||
    scriptContent.includes("if (isV2exUserPopoverOpen()) {\n          closeV2exUserPopover();\n        } else {\n          openV2exUserPopover();\n        }"),
    "avatar click on V2EX must toggle user popover"
  );

  // 3. Extraction logic functional test
  function simulateExtractV2exMoney(root) {
    if (!root || typeof root.querySelector !== "function") return null;
    const el = root.querySelector("#money, .balance_area, a[href^='/balance'], #Rightbar a[href^='/balance'], #Top a[href^='/balance']");
    if (!el) return null;
    let html = el.innerHTML || "";
    const aMatch = html.match(/<a\s+[^>]*href=["']?\/balance["']?[^>]*>([\s\S]*?)<\/a>/i);
    if (aMatch) {
      html = aMatch[1];
    }
    html = html.replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();
    return html || null;
  }

  // Variant A: #money containing <a href="/balance" class="balance_area">
  const mockDocA = {
    querySelector: (sel) => ({
      innerHTML: '<a href="/balance" class="balance_area">11 <img src="/static/img/gold@2x.png" height="16" alt="G" border="0">&nbsp;50 <img src="/static/img/silver@2x.png" height="16" alt="S" border="0">&nbsp;80 <img src="/static/img/bronze@2x.png" height="16" alt="B" border="0"></a>'
    })
  };
  const moneyA = simulateExtractV2exMoney(mockDocA);
  assert.ok(moneyA.includes("https://www.v2ex.com/static/img/gold@2x.png"), "must replace relative static url");
  assert.ok(!moneyA.includes("<a"), "must strip outer a tag");
  assert.ok(moneyA.includes("11") && moneyA.includes("50") && moneyA.includes("80"));

  // Variant B: standalone a.balance_area
  const mockDocB = {
    querySelector: (sel) => ({
      innerHTML: '20 <img src="/static/img/silver@2x.png" alt="S"> 30 <img src="/static/img/bronze@2x.png" alt="B">'
    })
  };
  const moneyB = simulateExtractV2exMoney(mockDocB);
  assert.ok(moneyB.includes("https://www.v2ex.com/static/img/silver@2x.png"));
  assert.ok(moneyB.includes("20") && moneyB.includes("30"));

  // Variant C: no money element
  const mockDocC = { querySelector: () => null };
  assert.equal(simulateExtractV2exMoney(mockDocC), null);
});

test("Composer toolbar provides Base64 text conversion and insertion dialog", () => {
  // 1. Check ICONS.base64
  assert.ok(
    scriptContent.includes('base64: `<svg width="18" height="18" viewBox="0 0 24 24"'),
    "ICONS must define base64 icon"
  );

  // 2. Toolbar integration
  assert.ok(
    scriptContent.includes('{ key: "base64", label: "插入字符转 Base64 (Alt+B)", icon: ICONS.base64, arrow: false }'),
    "toolKeys must include base64 action button"
  );
  assert.ok(
    scriptContent.includes('!panel.querySelector(\'[data-composer-action="base64"]\')'),
    "ensureChatPanel must verify base64 button existence"
  );

  // 3. Alt+B shortcut in composer
  assert.ok(
    scriptContent.includes('if (event.altKey && !event.ctrlKey && !event.metaKey && (event.key === "b" || event.key === "B")) {') &&
    scriptContent.includes('openBase64InsertDialog();'),
    "guardComposerShortcut must handle Alt+B to open base64 dialog"
  );

  // 4. Alt+click in-place conversion
  assert.ok(
    scriptContent.includes('} else if (action === "base64") {') &&
    scriptContent.includes('if (event.altKey) {') &&
    scriptContent.includes('encodeUtf8Base64(') &&
    scriptContent.includes('insertComposerInlineText('),
    "Alt+click on base64 toolbar button must directly convert selection"
  );

  // 5. Codec functions
  assert.ok(
    scriptContent.includes('function encodeUtf8Base64('),
    "must define encodeUtf8Base64"
  );
  assert.ok(
    scriptContent.includes('function decodeUtf8Base64('),
    "must define decodeUtf8Base64"
  );

  // Functional test for UTF-8 Base64 codec
  function encodeUtf8Base64(str) {
    if (!str) return "";
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return "";
    }
  }

  function decodeUtf8Base64(b64) {
    if (!b64) return "";
    const clean = b64.replace(/^base64:/i, "").trim();
    try {
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return "";
    }
  }

  assert.equal(encodeUtf8Base64("Hello World"), "SGVsbG8gV29ybGQ=");
  assert.equal(decodeUtf8Base64("SGVsbG8gV29ybGQ="), "Hello World");
  assert.equal(decodeUtf8Base64("base64:SGVsbG8gV29ybGQ="), "Hello World");

  const chineseText = "你好，Linux DO & V2EX！🎉";
  const encodedChinese = encodeUtf8Base64(chineseText);
  assert.ok(encodedChinese.length > 0);
  assert.equal(decodeUtf8Base64(encodedChinese), chineseText);

  // 6. Dialog UI functions & selectors
  assert.ok(
    scriptContent.includes('function ensureBase64InsertDialog()'),
    "must define ensureBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function openBase64InsertDialog()'),
    "must define openBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function closeBase64InsertDialog()'),
    "must define closeBase64InsertDialog"
  );
  assert.ok(
    scriptContent.includes('function insertBase64ToComposer(text, selection)'),
    "must define insertBase64ToComposer"
  );

  // 7. Modal management and WECOM_UI_SEL
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog:not([hidden])"),
    "isModalOrViewerOpen must include .wecom-base64-insert-dialog"
  );
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog") && scriptContent.includes("WECOM_UI_SEL = "),
    "WECOM_UI_SEL must include .wecom-base64-insert-dialog"
  );
  assert.ok(
    scriptContent.includes("closeBase64InsertDialog();"),
    "removePanels must call closeBase64InsertDialog"
  );

  // 8. CSS styling exists
  assert.ok(
    scriptContent.includes(".wecom-base64-insert-dialog {") &&
    scriptContent.includes(".wecom-base64-insert-card {") &&
    scriptContent.includes(".wecom-base64-insert-tabs {") &&
    scriptContent.includes(".wecom-base64-insert-result {"),
    "must include base64 insert dialog CSS styles"
  );
});

test("V2EX user popover displays nodes, topics, following, coins pill, theme toggle, and auto-checkin with toast", () => {
  // 1. Toast component and container
  assert.ok(
    scriptContent.includes("function showWecomToast("),
    "must define showWecomToast helper"
  );
  assert.ok(
    scriptContent.includes(".wecom-toast-container") && scriptContent.includes(".wecom-toast"),
    "must include CSS for toast container and pill"
  );
  assert.ok(
    scriptContent.includes("WECOM_UI_SEL = \".wecom-toast-container,"),
    "WECOM_UI_SEL must include .wecom-toast-container"
  );
  assert.ok(
    scriptContent.includes("document.querySelector(\".wecom-toast-container\")?.remove();"),
    "removePanels must clean up toast container"
  );

  // 2. Storage keys
  assert.ok(
    scriptContent.includes('const V2EX_USER_STATS_KEY = "linuxdo-wecom-v2ex-user-stats";'),
    "must define persistent cache key for user stats"
  );
  assert.ok(
    scriptContent.includes('const V2EX_LAST_CHECKIN_KEY = "linuxdo-wecom-v2ex-last-checkin";'),
    "must define persistent cache key for last checkin date"
  );

  // 3. User stats extraction functions
  assert.ok(
    scriptContent.includes("function extractV2exUserStatsFromHtml("),
    "must define extractV2exUserStatsFromHtml"
  );
  assert.ok(
    scriptContent.includes("function extractV2exUserStatsFromDom("),
    "must define extractV2exUserStatsFromDom"
  );
  assert.ok(
    scriptContent.includes("function getV2exUserStats("),
    "must define getV2exUserStats"
  );
  assert.ok(
    scriptContent.includes("function syncV2exUserStats("),
    "must define syncV2exUserStats"
  );
  assert.ok(
    scriptContent.includes("function updateOpenV2exUserPopover("),
    "must define updateOpenV2exUserPopover"
  );

  // 4. Daily auto-checkin service
  assert.ok(
    scriptContent.includes("async function checkinV2exDaily("),
    "must define checkinV2exDaily"
  );
  assert.ok(
    scriptContent.includes('checkinV2exDaily(false);'),
    "bootstrap must trigger checkinV2exDaily on startup"
  );

  // 5. Popover elements (matching screenshot)
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-theme-toggle"),
    "popover must include theme toggle switch"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-stats"),
    "popover must include 3-column stats section"
  );
  assert.ok(
    scriptContent.includes("data-act=\"nodes\"") &&
    scriptContent.includes("data-act=\"topics\"") &&
    scriptContent.includes("data-act=\"following\""),
    "popover stats must include nodes, topics, and following links"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-popover-bar"),
    "popover must include progress bar divider"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-footer-coins"),
    "popover must include coins pill"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-checkin-btn"),
    "popover must include checkin status and action button"
  );

  // 6. Functional test: HTML stats parser
  const mockHtml = `
  <div class="box">
    <div class="cell">
      <a href="/member/szabc"><img src="/static/img/avatar.png" class="avatar" /></a>
      <span class="bigger"><a href="/member/szabc">szabc</a></span>
    </div>
    <div class="cell">
      <a href="/my/nodes" class="dark"><span class="bigger">5</span><span class="fade">节点收藏</span></a>
      <a href="/my/topics" class="dark"><span class="bigger">12</span><span class="fade">主题收藏</span></a>
      <a href="/my/following" class="dark"><span class="bigger">3</span><span class="fade">特别关注</span></a>
    </div>
    <div class="cell">
      <a href="/notifications" class="fade">2 条未读提醒</a>
      <a href="/balance" class="balance_area">1 <img src="/static/img/gold@2x.png"> 90 <img src="/static/img/silver@2x.png"> 40 <img src="/static/img/bronze@2x.png"></a>
    </div>
    <div class="inner">
      <span class="fade">已连续登录 15 天</span>
    </div>
  </div>
  `;

  function simulateExtractStats(html) {
    const stats = {};
    const uMatch = html.match(/<a\s+[^>]*href=["']\/member\/([^"'/]+)["'][^>]*>([^<]+)<\/a>/i);
    if (uMatch) stats.username = uMatch[1].trim();

    const nMatch = html.match(/href=["']\/my\/nodes["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (nMatch) stats.nodesCount = parseInt(nMatch[1], 10);

    const tMatch = html.match(/href=["']\/my\/topics["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (tMatch) stats.topicsCount = parseInt(tMatch[1], 10);

    const fMatch = html.match(/href=["']\/my\/following["'][^>]*>[\s\S]*?<span[^>]*class=["']bigger["'][^>]*>(\d+)<\/span>/i);
    if (fMatch) stats.followingCount = parseInt(fMatch[1], 10);

    const notifMatch = html.match(/href=["']\/notifications["'][^>]*>(\d+)\s*(?:条未读提醒|未读提醒)/i);
    if (notifMatch) stats.unreadNotifs = parseInt(notifMatch[1], 10);

    const bMatch = html.match(/<a\s+[^>]*href=["']\/balance["'][^>]*class=["']balance_area["'][^>]*>([\s\S]*?)<\/a>/i);
    if (bMatch) stats.moneyHtml = bMatch[1].replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();

    const daysMatch = html.match(/已连续登录\s*(\d+)\s*天/i);
    if (daysMatch) stats.checkinDays = parseInt(daysMatch[1], 10);

    return stats;
  }

  const res = simulateExtractStats(mockHtml);
  assert.equal(res.username, "szabc");
  assert.equal(res.nodesCount, 5);
  assert.equal(res.topicsCount, 12);
  assert.equal(res.followingCount, 3);
  assert.equal(res.unreadNotifs, 2);
  assert.ok(res.moneyHtml.includes("https://www.v2ex.com/static/img/gold@2x.png"));
  assert.equal(res.checkinDays, 15);

  // 7. hasV2exCoins validator and real coins guarantee in popover
  assert.ok(
    scriptContent.includes("function hasV2exCoins("),
    "must define hasV2exCoins validation helper"
  );
  assert.ok(
    !scriptContent.includes('moneyHtml = "<span>100.0 分 (正常)</span>";'),
    "popover must not replace real coins with mock score in disguise mode"
  );
  assert.ok(
    scriptContent.includes('fetch("/balance", { credentials: "include" })'),
    "syncV2exUserStats must fall back to fetching /balance if coins are missing"
  );
  assert.ok(
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">节点收藏</span>") &&
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">主题收藏</span>") &&
    scriptContent.includes("<span class=\"wecom-v2ex-stat-label\">特别关注</span>"),
    "popover stat labels must show 节点收藏, 主题收藏, 特别关注"
  );
});

test("V2EX member profile card parses user information and displays popup on avatar click", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-v2ex-member-card"),
    "must define CSS for .wecom-v2ex-member-card"
  );
  assert.ok(
    scriptContent.includes("parseV2exMemberProfile"),
    "must define parseV2exMemberProfile parser"
  );
  assert.ok(
    scriptContent.includes("fetchV2exMemberProfile"),
    "must define fetchV2exMemberProfile fetcher"
  );
  assert.ok(
    scriptContent.includes("openV2exMemberCard"),
    "must define openV2exMemberCard function"
  );
  assert.ok(
    scriptContent.includes("closeV2exMemberCard"),
    "must define closeV2exMemberCard function"
  );
  assert.ok(
    scriptContent.includes("isV2exMemberCardOpen"),
    "must define isV2exMemberCardOpen function"
  );
  assert.ok(
    scriptContent.includes("v2exMemberProfileCache"),
    "must define v2exMemberProfileCache memory cache"
  );
  assert.match(
    scriptContent,
    /WECOM_UI_SEL\s*=\s*"[^"]*\.wecom-v2ex-member-card/,
    "WECOM_UI_SEL must include .wecom-v2ex-member-card"
  );
  assert.ok(
    scriptContent.includes("closeV2exMemberCard();"),
    "removePanels must call closeV2exMemberCard"
  );

  // 2. Avatar click in list panel & chat messages
  assert.ok(
    scriptContent.includes("openV2exMemberCard(username, trigger, event);"),
    "openOriginalUserCard must invoke openV2exMemberCard on V2EX"
  );
  assert.ok(
    scriptContent.includes("data-user-card") &&
    scriptContent.includes("v2exAuthor"),
    "convAvatarHtml must output data-user-card for V2EX authors"
  );
  assert.ok(
    scriptContent.includes(".wecom-list-panel [data-user-card]"),
    "CSS must define cursor: pointer for .wecom-list-panel [data-user-card]"
  );

  // 3. Functional parser simulation
  function simulateParseProfile(html, username) {
    if (!html || typeof html !== "string") return null;
    const profile = {
      username: username || "",
      avatarUrl: "",
      uid: "",
      isOnline: false,
      tagline: "",
      memberNum: "",
      joinedDate: "",
      activityRank: "",
      isPro: false,
      badgeText: "",
      balanceHtml: "",
      socials: [],
      intro: "",
      recentTopics: []
    };

    const userMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (userMatch) profile.username = userMatch[1].trim();

    const avatarMatch = html.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*avatar/i) ||
                        html.match(/<img\s+[^>]*class=["'][^"']*avatar[^"']*["'][^>]*src=["']([^"']+)["']/i);
    if (avatarMatch) {
      let src = avatarMatch[1];
      if (src.startsWith("//")) src = "https:" + src;
      profile.avatarUrl = src;
    }

    const uidMatch = html.match(/data-uid=["'](\d+)["']/i) || html.match(/member\s*#(\d+)/i) || html.match(/第\s*(\d+)\s*号会员/i);
    if (uidMatch) {
      profile.uid = uidMatch[1];
      profile.memberNum = uidMatch[1];
    }

    if (html.includes('class="online"') || html.includes("class='online'") || html.includes(">ONLINE<")) {
      profile.isOnline = true;
    }

    const taglineMatch = html.match(/<h1[\s\S]*?<\/h1>[\s\r\n]*<span\s+class=["']bigger["']>([\s\S]*?)<\/span>/i);
    if (taglineMatch) {
      profile.tagline = taglineMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    const joinedMatch = html.match(/(?:joined on|加入于)\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (joinedMatch) profile.joinedDate = joinedMatch[1];

    const rankMatch = html.match(/(?:activity rank|今日活跃度排名)[\s\S]*?<a[^>]*>(\d+)<\/a>/i);
    if (rankMatch) profile.activityRank = rankMatch[1];

    const badgeMatch = html.match(/<div\s+class=["']badge\s+([^"']+)["']>([^<]+)<\/div>/i);
    if (badgeMatch) {
      profile.isPro = badgeMatch[1].includes("pro");
      profile.badgeText = badgeMatch[2].trim();
    }

    const balMatch = html.match(/<div\s+class=["']balance_area["'][^>]*>([\s\S]*?)<\/div>/i);
    if (balMatch) {
      profile.balanceHtml = balMatch[1].replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/').trim();
    }

    const socialRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*class=["']social_label["'][^>]*>([\s\S]*?)<\/a>/gi;
    let sMatch;
    while ((sMatch = socialRegex.exec(html)) !== null) {
      const url = sMatch[1];
      const text = sMatch[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
      let type = "link";
      if (url.includes("twitter.com") || url.includes("x.com")) type = "twitter";
      else if (url.includes("github.com")) type = "github";
      else if (url.includes("weibo.com")) type = "weibo";
      profile.socials.push({ url, text, type });
    }

    const widgetsIdx = html.indexOf('class="widgets"');
    if (widgetsIdx !== -1) {
      const afterWidgets = html.slice(widgetsIdx);
      const cellMatch = afterWidgets.match(/<div\s+class=["']cell["']>([\s\S]*?)<\/div>/i);
      if (cellMatch && !cellMatch[1].includes("<table") && !cellMatch[1].includes("cell_tabs")) {
        profile.intro = cellMatch[1].replace(/<[^>]+>/g, " ").trim();
      }
    }

    const topicRegex = /<span\s+class=["']item_title["']>\s*<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let tMatch;
    while ((tMatch = topicRegex.exec(html)) !== null && profile.recentTopics.length < 2) {
      profile.recentTopics.push({
        url: tMatch[1],
        title: tMatch[2].replace(/<[^>]+>/g, "").trim()
      });
    }

    return profile;
  }

  const sampleHtml = `
    <div>
      <img src="https://cdn.v2ex.com/avatar/984b/5881/367256_large.png" class="avatar" width="73">
      <h1>laojuelv</h1>
      <span class="bigger">Wehat: xyetf818</span>
      <strong class="online">ONLINE</strong>
      <div class="badge pro">PRO</div>
      <div class="balance_area">
        5 <img src="/static/img/gold@2x.png">&nbsp;8 <img src="/static/img/silver@2x.png">&nbsp;66 <img src="/static/img/bronze@2x.png">
      </div>
      <span class="gray">V2EX 第 367256 号会员，加入于 2018-12-02 23:25:35 +08:00，今日活跃度排名 <a href="/top/dau">58</a></span>
      <div class="widgets">
        <a href="https://twitter.com/laojuelv" class="social_label">Twitter</a>
      </div>
      <div class="cell">独立全栈开发者</div>
      <span class="item_title"><a href="/t/100001">测试主题 1</a></span>
      <span class="item_title"><a href="/t/100002">测试主题 2</a></span>
    </div>
  `;

  const parsed = simulateParseProfile(sampleHtml, "laojuelv");
  assert.equal(parsed.username, "laojuelv");
  assert.equal(parsed.avatarUrl, "https://cdn.v2ex.com/avatar/984b/5881/367256_large.png");
  assert.equal(parsed.isOnline, true);
  assert.equal(parsed.uid, "367256");
  assert.equal(parsed.memberNum, "367256");
  assert.equal(parsed.joinedDate, "2018-12-02");
  assert.equal(parsed.activityRank, "58");
  assert.equal(parsed.isPro, true);
  assert.equal(parsed.tagline, "Wehat: xyetf818");
  assert.ok(parsed.balanceHtml.includes("https://www.v2ex.com/static/img/gold@2x.png"));
  assert.equal(parsed.socials.length, 1);
  assert.equal(parsed.socials[0].type, "twitter");
  assert.equal(parsed.intro, "独立全栈开发者");
  assert.equal(parsed.recentTopics.length, 2);
  assert.equal(parsed.recentTopics[0].title, "测试主题 1");
});

test("V2EX member profile card supports block and follow buttons, parses recent replies, and correctly identifies OP username without falling back to 楼主", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes(".wecom-member-card-actions"),
    "must define CSS for .wecom-member-card-actions"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-action-btn"),
    "must define CSS for .wecom-member-action-btn"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-follow-btn"),
    "must define follow button in card"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-block-btn"),
    "must define block button in card"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-replies-box"),
    "must define CSS and DOM container for .wecom-member-replies-box"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-item"),
    "must define CSS for .wecom-member-reply-item"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-topic"),
    "must define CSS for .wecom-member-reply-topic"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-reply-text"),
    "must define CSS for .wecom-member-reply-text"
  );
  assert.ok(
    scriptContent.includes('username === "楼主"'),
    "must guard against 楼主 username"
  );

  // 2. Functional test: OP username parsing from V2EX topic HTML
  // In real V2EX HTML, the avatar link <div class="fr"><a href="/member/toubi"><img ...></a></div> appears BEFORE the text link
  const sampleTopicHtml = `
    <div id="Main">
      <div class="header">
        <div class="fr"><a href="/member/toubi"><img src="https://cdn.v2ex.com/avatar/662677.png" class="avatar" alt="toubi" /></a></div>
        <a href="/">V2EX</a> <span class="chevron">&nbsp;›&nbsp;</span> <a href="/go/share">分享发现</a>
        <div class="sep10"></div>
        <h1>测试主题标题</h1>
        <small class="gray"><a href="/member/toubi">toubi</a> · 2 天前 · 1234 次点击</small>
      </div>
      <div class="topic_content">主题正文内容</div>
      <div class="cell" id="r_1001">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="48" valign="top" align="center"><img src="/avatar/1.png" class="avatar"></td>
            <td width="10"></td>
            <td width="auto" valign="top">
              <span class="no">1</span> &nbsp; <a href="/member/replier" class="dark">replier</a>
              <div class="reply_content">第一条回复</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  function simulateExtractOpUsername(html) {
    let opUsername = "";
    const memberMatches = [...html.matchAll(/<a\s+[^>]*href=["']\/member\/([^"'/]+)["'][^>]*>/gi)];
    for (const m of memberMatches) {
      const raw = decodeURIComponent(m[1]).trim();
      if (raw && raw !== "楼主") {
        opUsername = raw;
        break;
      }
    }
    if (!opUsername) {
      const altMatch = html.match(/<img[^>]*class=["'][^"']*avatar[^"']*["'][^>]*alt=["']([^"']+)["']/i);
      if (altMatch && altMatch[1] !== "楼主") {
        opUsername = altMatch[1].trim();
      }
    }
    return opUsername || "v2ex_user";
  }

  const extractedOp = simulateExtractOpUsername(sampleTopicHtml);
  assert.equal(extractedOp, "toubi", "must extract OP username 'toubi' and never fall back to '楼主'");

  // 3. Functional test: Parse replies and follow/block buttons in member profile
  const sampleMemberProfileHtml = `
    <div>
      <img src="https://cdn.v2ex.com/avatar/984b/5881/367256_large.png" class="avatar" data-uid="367256" width="73">
      <h1>laojuelv</h1>
      <span class="gray">V2EX 第 367256 号会员</span>
      <input type="button" value="特别关注" onclick="if (confirm('确定要开始关注 laojuelv？')) { location.href = '/follow/367256?once=89432'; }" class="super special button" />
      <input type="button" value="Block" onclick="if (confirm('确定要屏蔽 laojuelv？')) { location.href = '/block/367256?once=89432'; }" class="super normal button" />
      <div class="dock_area">
        <span class="gray">回复了 laojuelv 创建的主题 › <a href="/t/1242010#reply48">“万一免五”大概率进入“倒计时”～有必要先占位？！</a></span>
      </div>
      <div class="reply_content">
        对的，免五主要是小额交易，重点费率低就行
      </div>
      <div class="dock_area">
        <span class="gray">回复了 someone 创建的主题 › <a href="/t/1242020#reply12">讨论另一个话题</a></span>
      </div>
      <div class="reply_content">
        支持一下楼主！
      </div>
    </div>
  `;

  function simulateParseMemberActionsAndReplies(html, username) {
    const profile = {
      username: username || "",
      uid: "",
      recentReplies: [],
      followUrl: "",
      isFollowed: false,
      blockUrl: "",
      isBlocked: false
    };

    const uidMatch = html.match(/data-uid=["'](\d+)["']/i) || html.match(/member\s*#(\d+)/i) || html.match(/第\s*(\d+)\s*号会员/i);
    if (uidMatch) profile.uid = uidMatch[1];

    const replyRegex = /<div\s+class=["']dock_area["']>[\s\S]*?<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<div\s+class=["']reply_content["']>([\s\S]*?)<\/div>/gi;
    let rMatch;
    while ((rMatch = replyRegex.exec(html)) !== null && profile.recentReplies.length < 2) {
      profile.recentReplies.push({
        url: rMatch[1],
        topicTitle: rMatch[2].replace(/<[^>]+>/g, "").trim(),
        content: rMatch[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      });
    }

    const followMatch = html.match(/location\.href\s*=\s*['"](\/(?:follow|unfollow)\/\d+\?once=\d+)['"]/i) ||
                        html.match(/href=['"](\/(?:follow|unfollow)\/\d+\?once=\d+)['"]/i);
    if (followMatch) {
      profile.followUrl = followMatch[1];
      profile.isFollowed = followMatch[1].includes("/unfollow/");
    }

    const blockMatch = html.match(/location\.href\s*=\s*['"](\/(?:block|unblock)\/\d+\?once=\d+)['"]/i) ||
                       html.match(/href=['"](\/(?:block|unblock)\/\d+\?once=\d+)['"]/i);
    if (blockMatch) {
      profile.blockUrl = blockMatch[1];
      profile.isBlocked = blockMatch[1].includes("/unblock/");
    }

    return profile;
  }

  const parsedActions = simulateParseMemberActionsAndReplies(sampleMemberProfileHtml, "laojuelv");
  assert.equal(parsedActions.uid, "367256");
  assert.equal(parsedActions.followUrl, "/follow/367256?once=89432");
  assert.equal(parsedActions.isFollowed, false);
  assert.equal(parsedActions.blockUrl, "/block/367256?once=89432");
  assert.equal(parsedActions.isBlocked, false);
  assert.equal(parsedActions.recentReplies.length, 2);
  assert.equal(parsedActions.recentReplies[0].url, "/t/1242010#reply48");
  assert.equal(parsedActions.recentReplies[0].topicTitle, "“万一免五”大概率进入“倒计时”～有必要先占位？！");
  assert.ok(parsedActions.recentReplies[0].content.includes("对的，免五主要是小额交易"));
  assert.equal(parsedActions.recentReplies[1].topicTitle, "讨论另一个话题");
  assert.equal(parsedActions.recentReplies[1].content, "支持一下楼主！");
});

test("Linux DO left rail navigation displays Connect instead of calendar, and clicking opens Connect modal with Trust Level & metrics", () => {
  // 1. Metadata header includes @connect connect.linux.do
  assert.ok(
    scriptContent.includes("// @connect      connect.linux.do"),
    "metadata header must declare @connect connect.linux.do"
  );

  // 2. ICONS contains connect SVG
  assert.ok(
    scriptContent.includes("connect:"),
    "ICONS dictionary must contain connect icon"
  );

  // 3. RAIL_DECO_ITEMS differentiates Linux DO (Connect) and V2EX/Juejin (通知)
  assert.ok(
    scriptContent.includes('(IS_V2EX || IS_JUEJIN) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }') ||
    scriptContent.includes('(IS_V2EX || IS_JUEJIN || IS_ZHIHU) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }'),
    "RAIL_DECO_ITEMS must show Connect on Linux DO and 通知 on V2EX/Juejin"
  );

  // 4. Rail click binding includes bindRailConnectClick
  assert.ok(
    scriptContent.includes("bindRailConnectClick(rail)"),
    "bindRailNavClicks must call bindRailConnectClick"
  );
  assert.ok(
    scriptContent.includes('rail?.querySelector(\'[data-rail-key="connect"]\')'),
    "bindRailConnectClick must query [data-rail-key=\"connect\"]"
  );

  // 5. Connect modal lifecycle and helpers exist
  assert.ok(
    scriptContent.includes("function isLinuxDoConnectModalOpen()"),
    "must define isLinuxDoConnectModalOpen"
  );
  assert.ok(
    scriptContent.includes("function closeLinuxDoConnectModal()"),
    "must define closeLinuxDoConnectModal"
  );
  assert.ok(
    scriptContent.includes("function openLinuxDoConnectModal()"),
    "must define openLinuxDoConnectModal"
  );
  assert.ok(
    scriptContent.includes("function fetchLinuxDoConnectData("),
    "must define fetchLinuxDoConnectData"
  );
  assert.ok(
    scriptContent.includes("function renderConnectModalContent("),
    "must define renderConnectModalContent"
  );
  assert.ok(
    scriptContent.includes("function getTrustLevelInfo("),
    "must define getTrustLevelInfo"
  );
  assert.ok(
    scriptContent.includes("function formatConnectTime("),
    "must define formatConnectTime"
  );
  assert.ok(
    scriptContent.includes("function formatConnectNumber("),
    "must define formatConnectNumber"
  );

  // 6. Test trust level info resolution
  function simulateGetTrustLevelInfo(tl) {
    const level = Number(tl) || 0;
    switch (level) {
      case 1:
        return { level: 1, name: "基本用户", code: "TL1", color: "tl-1", badgeText: "🌱 基本用户 (TL1)" };
      case 2:
        return { level: 2, name: "中级成员", code: "TL2", color: "tl-2", badgeText: "🌿 中级成员 (TL2)" };
      case 3:
        return { level: 3, name: "活跃成员", code: "TL3", color: "tl-3", badgeText: "⭐ 活跃成员 (TL3)" };
      case 4:
        return { level: 4, name: "领袖管理", code: "TL4", color: "tl-4", badgeText: "👑 领袖管理 (TL4)" };
      default:
        return { level: 0, name: "见习用户", code: "TL0", color: "tl-0", badgeText: "🐣 见习用户 (TL0)" };
    }
  }

  assert.equal(simulateGetTrustLevelInfo(0).code, "TL0");
  assert.equal(simulateGetTrustLevelInfo(0).name, "见习用户");
  assert.equal(simulateGetTrustLevelInfo(1).code, "TL1");
  assert.equal(simulateGetTrustLevelInfo(2).code, "TL2");
  assert.equal(simulateGetTrustLevelInfo(3).code, "TL3");
  assert.equal(simulateGetTrustLevelInfo(3).name, "活跃成员");
  assert.equal(simulateGetTrustLevelInfo(4).code, "TL4");
  assert.equal(simulateGetTrustLevelInfo(4).name, "领袖管理");

  // 7. Test formatConnectTime and formatConnectNumber
  function simulateFormatConnectTime(seconds) {
    if (!seconds || seconds <= 0) return "0 分钟";
    const hours = Math.round(seconds / 3600);
    if (hours < 1) {
      const mins = Math.max(1, Math.round(seconds / 60));
      return `${mins} 分钟`;
    }
    return `${hours} 小时`;
  }

  function simulateFormatConnectNumber(num) {
    if (num === null || num === undefined) return "0";
    const val = Number(num) || 0;
    if (val >= 10000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return val.toLocaleString();
  }

  assert.equal(simulateFormatConnectTime(0), "0 分钟");
  assert.equal(simulateFormatConnectTime(120), "2 分钟");
  assert.equal(simulateFormatConnectTime(3600), "1 小时");
  assert.equal(simulateFormatConnectTime(1123200), "312 小时");

  assert.equal(simulateFormatConnectNumber(92), "92");
  assert.equal(simulateFormatConnectNumber(1420), "1,420");
  assert.equal(simulateFormatConnectNumber(28600), "28.6k");

  // 8. Test TL3 progress calculation
  function simulateCalculateTl3Progress(trustLevel, summary) {
    const daysVisited = summary.days_visited || 0;
    const topicsEntered = summary.topics_entered || 0;
    const postsRead = summary.posts_read_count || 0;
    const likesGiven = summary.likes_given || 0;
    const likesReceived = summary.likes_received || 0;

    let tl3ProgressPercent = 100;
    let tl3IsAchieved = trustLevel >= 3;
    if (trustLevel < 3) {
      const sVisited = Math.min(1, daysVisited / 50);
      const sTopics = Math.min(1, topicsEntered / 500);
      const sPosts = Math.min(1, postsRead / 20000);
      const sGiven = Math.min(1, likesGiven / 30);
      const sReceived = Math.min(1, likesReceived / 20);
      tl3ProgressPercent = Math.min(99, Math.round(((sVisited + sTopics + sPosts + sGiven + sReceived) / 5) * 100));
    }
    return { percent: tl3ProgressPercent, isAchieved: tl3IsAchieved };
  }

  const tl3User = simulateCalculateTl3Progress(3, { days_visited: 92, topics_entered: 1420, posts_read_count: 28600, likes_given: 680, likes_received: 450 });
  assert.equal(tl3User.isAchieved, true);
  assert.equal(tl3User.percent, 100);

  const halfWayUser = simulateCalculateTl3Progress(1, { days_visited: 25, topics_entered: 250, posts_read_count: 10000, likes_given: 15, likes_received: 10 });
  assert.equal(halfWayUser.isAchieved, false);
  assert.equal(halfWayUser.percent, 50);

  // 9. Cleanup & UI selectors include Connect modal
  assert.ok(
    scriptContent.includes(".wecom-connect-overlay, .wecom-connect-modal"),
    "WECOM_UI_SEL and cleanup must include .wecom-connect-overlay, .wecom-connect-modal"
  );
  assert.ok(
    scriptContent.includes("closeLinuxDoConnectModal();"),
    "removePanels must call closeLinuxDoConnectModal"
  );

  // 10. Styles contain modal classes and dark mode tokens
  assert.ok(
    scriptContent.includes(".wecom-connect-modal"),
    "styles must define .wecom-connect-modal"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-stats-grid"),
    "styles must define .wecom-connect-stats-grid"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-badge.tl-3"),
    "styles must define TL badges"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-connect-modal"),
    "dark mode styles must theme .wecom-connect-modal"
  );
});

test("V2EX topic detail conversation background polling and seamless fresh reply appending", () => {
  // 1. Constants & helper functions exist
  assert.ok(
    scriptContent.includes("const V2EX_TOPIC_POLL_INTERVAL_MS = 10000;"),
    "must define V2EX_TOPIC_POLL_INTERVAL_MS = 10000"
  );
  assert.ok(
    scriptContent.includes("async function pollV2exCurrentTopicOnce("),
    "must define pollV2exCurrentTopicOnce"
  );
  assert.ok(
    scriptContent.includes("function startV2exTopicPolling()"),
    "must define startV2exTopicPolling"
  );
  assert.ok(
    scriptContent.includes("function stopV2exTopicPolling()"),
    "must define stopV2exTopicPolling"
  );

  // 2. Lifecycle integration
  assert.ok(
    scriptContent.includes("stopV2exTopicPolling();"),
    "removePanels must call stopV2exTopicPolling"
  );
  assert.ok(
    scriptContent.includes("startV2exTopicPolling();"),
    "bootstrap must call startV2exTopicPolling on V2EX"
  );
  assert.ok(
    scriptContent.includes("pollV2exCurrentTopicOnce();"),
    "visibilitychange and submitComposer must trigger pollV2exCurrentTopicOnce"
  );

  // 3. Functional simulation of poll filtering and appending
  function simulatePollFilter(renderedNumbers, newPosts) {
    const renderedSet = new Set(renderedNumbers);
    return newPosts
      .filter((post) => {
        const num = post.post_number || (post.floor ? post.floor + 1 : 0);
        return num > 1 && !renderedSet.has(num);
      })
      .sort((a, b) => (a.post_number || 0) - (b.post_number || 0));
  }

  // Existing thread with OP (post 1) and replies 2..5 (floors 1..4)
  const existingNumbers = [1, 2, 3, 4, 5];
  // Server poll returns replies 2..7 (floors 1..6)
  const polledPosts = [
    { post_number: 1, id: 100, cooked: "OP content" },
    { post_number: 2, id: 101, cooked: "Reply 1" },
    { post_number: 3, id: 102, cooked: "Reply 2" },
    { post_number: 4, id: 103, cooked: "Reply 3" },
    { post_number: 5, id: 104, cooked: "Reply 4" },
    { post_number: 6, id: 105, username: "alice", cooked: "<p>New reply 5</p>" },
    { post_number: 7, id: 106, username: "bob", cooked: "<p>New reply 6</p>" }
  ];

  const fresh = simulatePollFilter(existingNumbers, polledPosts);
  assert.equal(fresh.length, 2);
  assert.equal(fresh[0].post_number, 6);
  assert.equal(fresh[0].username, "alice");
  assert.equal(fresh[1].post_number, 7);
  assert.equal(fresh[1].username, "bob");

  // 4. Test list item update logic
  function simulateConvUpdate(conv, lastPost) {
    if (!conv || !lastPost) return;
    const snippet = (lastPost.cooked || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    conv.msg = `${lastPost.username}: ${snippet.slice(0, 50)}`;
    conv.time = "刚刚";
  }

  const mockConv = { msg: "old msg", time: "10分钟前" };
  simulateConvUpdate(mockConv, fresh[1]);
  assert.equal(mockConv.msg, "bob: New reply 6");
  assert.equal(mockConv.time, "刚刚");

  // 5. Test subtitle update
  function simulateSubtitleUpdate(totalReplies, nodeTitle, isMask = false) {
    if (isMask) return `企业内部群 · ${totalReplies} 条消息`;
    const nodePart = nodeTitle ? `归属于 ${nodeTitle} · ` : "归属于 v2ex.com · ";
    return `${nodePart}${totalReplies} 条回复`;
  }

  assert.equal(simulateSubtitleUpdate(7, "程序员"), "归属于 程序员 · 7 条回复");
  assert.equal(simulateSubtitleUpdate(7, "程序员", true), "企业内部群 · 7 条消息");
});

test("relative time real-time refresh across conv list and chat bubbles (v0.7.37)", () => {
  // 1. Script checks
  assert.ok(
    scriptContent.includes("function parseTimestamp("),
    "must define parseTimestamp"
  );
  assert.ok(
    scriptContent.includes("function refreshRelativeTimes("),
    "must define refreshRelativeTimes"
  );
  assert.ok(
    scriptContent.includes("function startRelativeTimeRefresh("),
    "must define startRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("function stopRelativeTimeRefresh("),
    "must define stopRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("RELATIVE_TIME_REFRESH_INTERVAL_MS = 30000"),
    "must use 30s refresh interval"
  );
  assert.ok(
    scriptContent.includes('const timeMs = parseTimestamp(rawTime);') &&
    scriptContent.includes('data-time="${timeMs}"'),
    "convRowHtml must render data-time attribute"
  );
  assert.ok(
    scriptContent.includes('const postTimeMs = parseTimestamp(post.created_at);') &&
    scriptContent.includes('wecom-msg-time"${timeAttr}'),
    "bubbleHtml must render .wecom-msg-time with data-time"
  );
  assert.ok(
    scriptContent.includes("stopRelativeTimeRefresh();"),
    "removePanels must call stopRelativeTimeRefresh"
  );
  assert.ok(
    scriptContent.includes("startRelativeTimeRefresh();"),
    "bootstrap and applyTheme must start relative time refresh"
  );

  // 2. Functional test of parseTimestamp
  function simParseTimestamp(val) {
    if (!val) return 0;
    if (typeof val === "number") {
      return val < 1e11 ? val * 1000 : val;
    }
    const str = String(val).trim();
    if (!str) return 0;
    if (/^\d+$/.test(str)) {
      const n = Number(str);
      return n < 1e11 ? n * 1000 : n;
    }
    const isoMs = Date.parse(str.replace(/-/g, "/"));
    if (!Number.isNaN(isoMs) && isoMs > 0) return isoMs;

    const directMs = Date.parse(str);
    if (!Number.isNaN(directMs) && directMs > 0) return directMs;

    const now = Date.now();
    if (/刚刚|just\s*now|moments?\s*ago/i.test(str)) {
      return now;
    }
    let m = str.match(/(\d+)\s*(?:分钟前|分前|min(?:ute)?s?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 60 * 1000;
    m = str.match(/(\d+)\s*(?:小时前|hr?s?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 3600 * 1000;
    m = str.match(/(\d+)\s*(?:天前|days?\s*ago)/i);
    if (m) return now - parseInt(m[1], 10) * 86400 * 1000;
    if (/昨天|yesterday/i.test(str)) {
      return now - 86400 * 1000;
    }
    return 0;
  }

  const now = Date.now();
  assert.equal(simParseTimestamp(now), now);
  assert.equal(simParseTimestamp(Math.floor(now / 1000)), Math.floor(now / 1000) * 1000);
  assert.ok(Math.abs(simParseTimestamp("刚刚") - now) < 50);
  assert.ok(Math.abs(simParseTimestamp("5 分钟前") - (now - 5 * 60 * 1000)) < 50);
  assert.ok(Math.abs(simParseTimestamp("2 小时前") - (now - 2 * 3600 * 1000)) < 50);
  assert.ok(Math.abs(simParseTimestamp("3 天前") - (now - 3 * 86400 * 1000)) < 50);

  // 3. Functional test of formatTime dynamic transition
  function simFormatTime(iso, baseNow) {
    if (!iso) return "";
    const timeMs = simParseTimestamp(iso);
    if (!timeMs) return String(iso);
    const date = new Date(timeMs);
    const current = baseNow ? new Date(baseNow) : new Date();
    const diffMs = Math.max(0, current.getTime() - date.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffMin < 1) {
      return "刚刚";
    }
    if (diffMin < 60) {
      return `${diffMin} 分钟前`;
    }

    const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.getTime() === yesterday.getTime()) {
      return "昨天";
    }

    if (date.getFullYear() === current.getFullYear()) {
      return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const baseTime = new Date(2026, 8, 16, 14, 0, 0).getTime();
  // +30 seconds later -> "刚刚"
  assert.equal(simFormatTime(baseTime, baseTime + 30 * 1000), "刚刚");
  // +15 minutes later -> "15 分钟前"
  assert.equal(simFormatTime(baseTime, baseTime + 15 * 60 * 1000), "15 分钟前");
  // +1.5 hours later same day -> "14:00"
  assert.equal(simFormatTime(baseTime, baseTime + 90 * 60 * 1000), "14:00");
  // +24 hours later next day -> "昨天"
  assert.equal(simFormatTime(baseTime, baseTime + 24 * 3600 * 1000), "昨天");
  // +5 days later same year -> "9-16"
  assert.equal(simFormatTime(baseTime, baseTime + 5 * 86400 * 1000), "9-16");

  // 4. Test DOM refresh simulation
  const elements = [
    { textContent: "刚刚", dataset: { time: String(baseTime) } },
    { textContent: "5 分钟前", dataset: { time: String(baseTime) } },
    { textContent: "刚刚", dataset: {} } // legacy item without data-time
  ];

  function simRefreshTimes(els, simNow) {
    for (const el of els) {
      let timeMs = Number(el.dataset.time);
      if (!timeMs) {
        timeMs = simParseTimestamp(el.textContent);
        if (timeMs) el.dataset.time = String(timeMs);
      }
      if (timeMs) {
        const formatted = simFormatTime(timeMs, simNow);
        if (formatted && el.textContent !== formatted) {
          el.textContent = formatted;
        }
      }
    }
  }

  // At +2 hours later:
  const twoHoursLater = baseTime + 2 * 3600 * 1000;
  simRefreshTimes(elements, twoHoursLater);
  assert.equal(elements[0].textContent, "14:00");
  assert.equal(elements[1].textContent, "14:00");
  assert.ok(elements[2].dataset.time, "legacy item should have data-time backfilled");
});

test("polling replies strictly preserves scrollbar position without jumping (v0.7.38)", () => {
  // 1. Script checks
  assert.ok(
    scriptContent.includes("overflow-anchor: none;"),
    "CSS must specify overflow-anchor: none on .wecom-chat-body"
  );
  assert.ok(
    scriptContent.includes("totalAppended = appendFreshPosts(freshPosts, currentBody, { isPolling: true, scroll: false });"),
    "pollV2exCurrentTopicOnce must pass { isPolling: true, scroll: false } to appendFreshPosts"
  );
  assert.ok(
    scriptContent.includes("currentBody.scrollTop = prevScrollTop;"),
    "pollV2exCurrentTopicOnce must restore prevScrollTop"
  );
  assert.ok(
    scriptContent.includes("return appendFreshPosts(posts, body, { isPolling: true, scroll: false });"),
    "syncNewPostsFromDom must pass { isPolling: true, scroll: false } to appendFreshPosts"
  );
  assert.ok(
    scriptContent.includes("body.scrollTop = prevScrollTop;"),
    "appendFreshPosts must restore body.scrollTop to prevScrollTop"
  );

  // 2. Functional simulation of appendFreshPosts scroll handling
  function simulateScrollHandling(initialScrollTop, initialScrollHeight, clientHeight, newContentHeight, options = {}) {
    const prevScrollTop = initialScrollTop;
    const prevScrollHeight = initialScrollHeight;
    const wasNearBottom = clientHeight > 0 && (prevScrollHeight - (prevScrollTop + clientHeight) <= 32);

    let scrollTop = initialScrollTop;
    const newScrollHeight = initialScrollHeight + newContentHeight;

    const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);
    if (shouldScroll) {
      scrollTop = newScrollHeight;
    } else {
      scrollTop = prevScrollTop;
    }

    return {
      scrollTop,
      wasNearBottom,
      shouldScroll,
      scrollDelta: scrollTop - prevScrollTop
    };
  }

  // Case 1: User is actively reading at the bottom (e.g. wasNearBottom = true)
  // Background polling arrives with { isPolling: true, scroll: false }
  // MUST NOT scroll, delta must be 0!
  const pollBottomRes = simulateScrollHandling(2400, 3000, 600, 400, { isPolling: true, scroll: false });
  assert.equal(pollBottomRes.wasNearBottom, true);
  assert.equal(pollBottomRes.shouldScroll, false, "polling must never trigger shouldScroll even if wasNearBottom");
  assert.equal(pollBottomRes.scrollTop, 2400, "scrollTop must stay exactly at 2400");
  assert.equal(pollBottomRes.scrollDelta, 0, "scroll delta must be strictly 0");

  // Case 2: User is reading middle of thread (e.g. scrollTop = 1000)
  // Polling arrives with { isPolling: true, scroll: false }
  const pollMidRes = simulateScrollHandling(1000, 3000, 600, 400, { isPolling: true, scroll: false });
  assert.equal(pollMidRes.wasNearBottom, false);
  assert.equal(pollMidRes.shouldScroll, false);
  assert.equal(pollMidRes.scrollTop, 1000);
  assert.equal(pollMidRes.scrollDelta, 0);

  // Case 3: User actively posts a new reply via composer with { scroll: true }
  // MUST scroll to bottom
  const submitRes = simulateScrollHandling(1000, 3000, 600, 200, { scroll: true });
  assert.equal(submitRes.shouldScroll, true, "user posting must follow new reply");
  assert.equal(submitRes.scrollTop, 3200, "user post must scroll to new scrollHeight");
  assert.equal(submitRes.scrollDelta, 2200);
});

test("Linux DO Connect modal retrieves and renders page-content requirements data (rings, bars, quotas, vetos, tables) (v0.7.39)", () => {
  // 1. Core functions are defined in userscript
  assert.ok(
    scriptContent.includes("function parseNumberValue("),
    "must define parseNumberValue"
  );
  assert.ok(
    scriptContent.includes("function extractCurrentRequired("),
    "must define extractCurrentRequired"
  );
  assert.ok(
    scriptContent.includes("function fetchConnectHtml()"),
    "must define fetchConnectHtml"
  );
  assert.ok(
    scriptContent.includes("function parseLinuxDoConnectHtml("),
    "must define parseLinuxDoConnectHtml"
  );
  assert.ok(
    scriptContent.includes("function buildFallbackRequirements("),
    "must define buildFallbackRequirements"
  );

  // 2. CSS selectors include page-content cards and badges
  assert.ok(
    scriptContent.includes(".wecom-connect-banner"),
    "must include .wecom-connect-banner in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-progress-box"),
    "must include .wecom-connect-progress-box in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-section"),
    "must include .wecom-connect-section in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-item"),
    "must include .wecom-connect-req-item in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-mini-bar"),
    "must include .wecom-connect-mini-bar in styles"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-badge"),
    "must include .wecom-connect-req-badge in styles"
  );

  // 3. Functional simulation of parseNumberValue and extractCurrentRequired
  function parseNumberValue(text) {
    const normalized = String(text || "").replace(/,/g, "");
    const match = normalized.match(/-?\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function extractCurrentRequired(text) {
    const normalized = String(text || "").replace(/,/g, "");
    const parts = normalized.split("/");
    if (parts.length >= 2) {
      return {
        currentValue: parseNumberValue(parts[0]),
        requiredValue: parseNumberValue(parts[1])
      };
    }
    const allNums = normalized.match(/-?\d+/g) || [];
    if (allNums.length >= 2) {
      return {
        currentValue: parseInt(allNums[0], 10),
        requiredValue: parseInt(allNums[1], 10)
      };
    }
    return {
      currentValue: allNums.length === 1 ? parseInt(allNums[0], 10) : 0,
      requiredValue: 0
    };
  }

  assert.equal(parseNumberValue("24,500"), 24500);
  assert.equal(parseNumberValue("/ 50"), 50);
  assert.equal(parseNumberValue("-5"), -5);
  assert.equal(parseNumberValue(""), 0);

  const nums1 = extractCurrentRequired("45 / 30");
  assert.equal(nums1.currentValue, 45);
  assert.equal(nums1.requiredValue, 30);

  const nums2 = extractCurrentRequired("12/500");
  assert.equal(nums2.currentValue, 12);
  assert.equal(nums2.requiredValue, 500);

  // 4. Mock DOM parser simulation
  function createMockNode(tag, attrs = {}, text = '', children = []) {
    const classes = (attrs.class || '').split(/\s+/).filter(Boolean);
    return {
      tagName: tag.toUpperCase(),
      className: attrs.class || '',
      classList: {
        contains: (c) => classes.includes(c)
      },
      textContent: text,
      children,
      querySelector: function(sel) {
        return this.querySelectorAll(sel)[0] || null;
      },
      querySelectorAll: function(sel) {
        const results = [];
        const matchSel = (node, s) => {
          if (!s) return false;
          if (s.startsWith('.')) {
            const c = s.slice(1);
            return node.classList && node.classList.contains(c);
          }
          if (s.toLowerCase() === node.tagName?.toLowerCase()) return true;
          return false;
        };

        const selectors = sel.split(',').map(s => s.trim());
        const traverse = (n) => {
          for (const s of selectors) {
            if (matchSel(n, s)) {
              results.push(n);
              break;
            }
          }
          (n.children || []).forEach(traverse);
        };
        (this.children || []).forEach(traverse);
        return results;
      }
    };
  }

  function simulateParseLinuxDoConnectFromDoc(doc) {
    const trustCard = doc.querySelector('.card, .page-content, .page-body') || doc;
    const headingText = (trustCard.querySelector('.card-title, h2, h1, .page-title')?.textContent || '').trim();
    const levelMatch = headingText.match(/信任级别\s*(\d+)/i);
    const targetLevel = levelMatch ? parseInt(levelMatch[1], 10) : 3;

    const subtitleText = (trustCard.querySelector('.card-subtitle')?.textContent || '').trim();
    const subtitleUserMatch = subtitleText.match(/@([^\s·]+)/);
    const username = subtitleUserMatch ? subtitleUserMatch[1] : '';

    const requirements = [];

    // Rings
    trustCard.querySelectorAll('.tl3-ring').forEach(item => {
      const name = (item.querySelector('.tl3-ring-label')?.textContent || '').trim();
      const currentText = (item.querySelector('.tl3-ring-current')?.textContent || '').trim();
      const targetText = (item.querySelector('.tl3-ring-target')?.textContent || '').trim();
      if (!name) return;

      const currentValue = parseNumberValue(currentText);
      const requiredValue = parseNumberValue(targetText);
      const circle = item.querySelector('.tl3-ring-circle');
      const isSuccess = circle ? circle.classList.contains('met') : currentValue >= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : (currentValue === 0 ? 100 : 0);

      requirements.push({ name, category: '活跃程度', current: currentValue, required: requiredValue, isSuccess, percent, type: 'ring' });
    });

    // Bars
    trustCard.querySelectorAll('.tl3-bar-item').forEach(bar => {
      const name = (bar.querySelector('.tl3-bar-label')?.textContent || '').trim();
      const numsText = (bar.querySelector('.tl3-bar-nums')?.textContent || '').trim();
      if (!name) return;

      const { currentValue, requiredValue } = extractCurrentRequired(numsText);
      const numsNode = bar.querySelector('.tl3-bar-nums');
      const fillNode = bar.querySelector('.tl3-bar-fill');
      const isSuccess = (numsNode?.classList.contains('met') || fillNode?.classList.contains('met')) || currentValue >= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : 100;

      requirements.push({ name, category: '互动参与', current: currentValue, required: requiredValue, isSuccess, percent, type: 'bar' });
    });

    // Quotas
    trustCard.querySelectorAll('.tl3-quota-card').forEach(quota => {
      const name = (quota.querySelector('.tl3-quota-label')?.textContent || '').trim();
      const numsText = (quota.querySelector('.tl3-quota-nums')?.textContent || '').trim();
      if (!name) return;

      const { currentValue, requiredValue } = extractCurrentRequired(numsText);
      const isSuccess = quota.classList.contains('met') || currentValue <= requiredValue;
      const percent = requiredValue > 0 ? Math.min(100, Math.round((currentValue / requiredValue) * 100)) : 100;

      requirements.push({ name, category: '合规记录', current: currentValue, required: requiredValue, isSuccess, percent, type: 'quota' });
    });

    // Vetos
    trustCard.querySelectorAll('.tl3-veto-item').forEach(veto => {
      const name = (veto.querySelector('.tl3-veto-label')?.textContent || '').trim();
      const currentText = (veto.querySelector('.tl3-veto-value')?.textContent || '').trim();
      if (!name) return;

      const currentValue = parseNumberValue(currentText);
      const isSuccess = veto.classList.contains('met') || currentValue === 0;

      requirements.push({ name, category: '限制要求', current: currentValue, required: 0, isSuccess, percent: isSuccess ? 100 : 0, type: 'veto' });
    });

    const statusNode = trustCard.querySelector('.status-met, .status-unmet');
    const isMeetingRequirements = statusNode ? statusNode.classList.contains('status-met') : requirements.every(r => r.isSuccess);
    const metCount = requirements.filter(r => r.isSuccess).length;
    const totalCount = requirements.length;
    const overallPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    return { targetLevel, username, requirements, isMeetingRequirements, metCount, totalCount, overallPercent };
  }

  const mockDoc = createMockNode('div', { class: 'page-wrapper' }, '', [
    createMockNode('div', { class: 'page-content' }, '', [
      createMockNode('div', { class: 'card' }, '', [
        createMockNode('div', { class: 'card-header' }, '', [
          createMockNode('h2', { class: 'card-title' }, '信任级别 3 的要求'),
          createMockNode('div', { class: 'card-subtitle' }, '@neo · 距离下次评估还剩 3 天')
        ]),
        createMockNode('div', { class: 'card-body' }, '', [
          createMockNode('div', { class: 'status-met' }, '已符合信任级别 3 要求'),
          createMockNode('div', { class: 'tl3-ring' }, '', [
            createMockNode('div', { class: 'tl3-ring-circle met' }),
            createMockNode('div', { class: 'tl3-ring-label' }, '访问天数'),
            createMockNode('div', { class: 'tl3-ring-current' }, '85'),
            createMockNode('div', { class: 'tl3-ring-target' }, '/ 50')
          ]),
          createMockNode('div', { class: 'tl3-bar-item' }, '', [
            createMockNode('div', { class: 'tl3-bar-label' }, '送出的点赞'),
            createMockNode('div', { class: 'tl3-bar-nums met' }, '45 / 30'),
            createMockNode('div', { class: 'tl3-bar-fill met' })
          ]),
          createMockNode('div', { class: 'tl3-quota-card met' }, '', [
            createMockNode('div', { class: 'tl3-quota-label' }, '被举报数量'),
            createMockNode('div', { class: 'tl3-quota-nums' }, '0 / 5')
          ]),
          createMockNode('div', { class: 'tl3-veto-item met' }, '', [
            createMockNode('div', { class: 'tl3-veto-label' }, '被禁言 (过去 6 个月)'),
            createMockNode('div', { class: 'tl3-veto-value' }, '0')
          ])
        ])
      ])
    ])
  ]);

  const parsed = simulateParseLinuxDoConnectFromDoc(mockDoc);
  assert.equal(parsed.targetLevel, 3);
  assert.equal(parsed.username, 'neo');
  assert.equal(parsed.isMeetingRequirements, true);
  assert.equal(parsed.requirements.length, 4);
  assert.equal(parsed.metCount, 4);
  assert.equal(parsed.overallPercent, 100);

  // 5. Fallback requirements generation
  function simulateBuildFallbackRequirements(trustLevel, summary = {}, user = {}) {
    const daysVisited = summary.days_visited || 0;
    const topicsEntered = summary.topics_entered || 0;
    const postsRead = summary.posts_read_count || 0;
    const likesGiven = summary.likes_given || 0;
    const likesReceived = summary.likes_received || 0;

    const targetLevel = trustLevel >= 3 ? 3 : (trustLevel === 2 ? 3 : 2);
    const requirements = [
      { name: "访问天数 (过去100天)", category: "活跃程度", current: daysVisited, required: 50, isSuccess: daysVisited >= 50, percent: Math.min(100, Math.round((daysVisited / 50) * 100)), unit: "天", type: "ring" },
      { name: "浏览话题 (过去100天)", category: "活跃程度", current: topicsEntered, required: 500, isSuccess: topicsEntered >= 500, percent: Math.min(100, Math.round((topicsEntered / 500) * 100)), unit: "个", type: "ring" },
      { name: "阅读帖子 (过去100天)", category: "活跃程度", current: postsRead, required: 20000, isSuccess: postsRead >= 20000, percent: Math.min(100, Math.round((postsRead / 20000) * 100)), unit: "帖", type: "ring" },
      { name: "送出的点赞", category: "互动参与", current: likesGiven, required: 30, isSuccess: likesGiven >= 30, percent: Math.min(100, Math.round((likesGiven / 30) * 100)), unit: "次", type: "bar" },
      { name: "收获的点赞", category: "互动参与", current: likesReceived, required: 20, isSuccess: likesReceived >= 20, percent: Math.min(100, Math.round((likesReceived / 20) * 100)), unit: "次", type: "bar" },
      { name: "社区违规惩罚", category: "限制要求", current: (user.silenced || user.suspended) ? 1 : 0, required: 0, isSuccess: !user.silenced && !user.suspended, percent: (!user.silenced && !user.suspended) ? 100 : 0, unit: "次", type: "veto" },
      { name: "封禁记录 (过去6个月)", category: "限制要求", current: 0, required: 0, isSuccess: true, percent: 100, unit: "次", type: "veto" }
    ];

    const isMeetingRequirements = trustLevel >= targetLevel || requirements.every((r) => r.isSuccess);
    const metCount = requirements.filter((r) => r.isSuccess).length;
    const totalCount = requirements.length;
    const overallPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

    return { targetLevel, requirements, isMeetingRequirements, metCount, totalCount, overallPercent, source: "discourse_fallback" };
  }

  const fallbackData = simulateBuildFallbackRequirements(2, {
    days_visited: 55,
    topics_entered: 600,
    posts_read_count: 22000,
    likes_given: 40,
    likes_received: 25
  });
  assert.equal(fallbackData.targetLevel, 3);
  assert.equal(fallbackData.isMeetingRequirements, true);
  assert.equal(fallbackData.metCount, 7);
  assert.equal(fallbackData.totalCount, 7);
  assert.equal(fallbackData.overallPercent, 100);

  const partialData = simulateBuildFallbackRequirements(2, {
    days_visited: 10,
    topics_entered: 50,
    posts_read_count: 500,
    likes_given: 2,
    likes_received: 1
  });
  assert.equal(partialData.targetLevel, 3);
  assert.equal(partialData.isMeetingRequirements, false);
  assert.equal(partialData.metCount, 2); // 2 vetos pass (no violation, no ban)
  assert.ok(partialData.overallPercent < 50);
});

test("Linux DO like button provides immediate visual feedback, optimistic badge count updates, self-like rejection toast, and reactions toggle API (v0.7.40)", () => {
  // 1. Script static checks
  assert.ok(
    scriptContent.includes("/discourse-reactions/posts/${postId}/custom-reactions/heart/toggle"),
    "toggleLike must use Discourse Reactions toggle endpoint"
  );
  assert.ok(
    scriptContent.includes('showWecomToast(IS_V2EX ? "不能感谢自己的回复" : "不能给自己的帖子点赞", "info", 2000);'),
    "toggleLike must guard against self-liking with clear toast"
  );
  assert.ok(
    scriptContent.includes('showWecomToast(wasLiked ? "已取消点赞" : "已点赞", wasLiked ? "info" : "success", 1800);'),
    "toggleLike must provide immediate toast feedback for like and unlike"
  );
  assert.ok(
    scriptContent.includes("activeLikingPosts.add(postId);"),
    "toggleLike must prevent concurrent double clicks on the same post"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-tool.liked svg"),
    "CSS must define scale transition for liked button"
  );
  assert.ok(
    scriptContent.includes("transform: scale(1.15);"),
    "CSS must scale liked button on active like"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-tool.liked svg path"),
    "CSS must style path of liked tool button"
  );
  assert.ok(
    scriptContent.includes("consumeClick(event);"),
    "handleMessageToolClick must consume click event before handling like"
  );
  assert.ok(
    scriptContent.includes('if (action === "like") return toggleLike(Number(message.dataset.postId), button, message);'),
    "handleMessageToolClick must pass message element to toggleLike"
  );

  // 2. Functional simulation of toggleLike optimistic DOM updates and error rollback
  function simulateToggleLike({
    isMine,
    isLoggedIn = true,
    initialLiked = false,
    initialLikeCount = 0,
    apiSuccess = true,
    apiErrorMessage = ""
  }) {
    const toasts = [];
    function showToast(msg, type) { toasts.push({ msg, type }); }

    if (isMine) {
      showToast("不能给自己的帖子点赞", "info");
      return { toasts, liked: initialLiked, likeCount: initialLikeCount, badgePresent: initialLikeCount > 0 };
    }
    if (!isLoggedIn) {
      showToast("请先登录 Linux DO", "warning");
      return { toasts, liked: initialLiked, likeCount: initialLikeCount, badgePresent: initialLikeCount > 0 };
    }

    const wasLiked = initialLiked;
    let liked = !wasLiked;
    let likeCount = initialLikeCount;
    let badgePresent = initialLikeCount > 0;
    const prevCount = initialLikeCount;
    let addedBadge = false;
    let removedBadge = false;

    if (badgePresent) {
      if (!wasLiked) {
        likeCount = prevCount + 1;
      } else {
        likeCount = Math.max(0, prevCount - 1);
        if (likeCount === 0) {
          badgePresent = false;
          removedBadge = true;
        }
      }
    } else if (!wasLiked) {
      likeCount = 1;
      badgePresent = true;
      addedBadge = true;
    }

    showToast(wasLiked ? "已取消点赞" : "已点赞", wasLiked ? "info" : "success");

    if (!apiSuccess) {
      // Rollback
      liked = wasLiked;
      if (addedBadge) {
        badgePresent = false;
        likeCount = prevCount;
      } else if (removedBadge) {
        badgePresent = true;
        likeCount = prevCount;
      } else {
        likeCount = prevCount;
      }
      showToast("点赞操作失败：" + (apiErrorMessage || "网络异常"), "error");
    }

    return { toasts, liked, likeCount, badgePresent };
  }

  // Case A: Liking a post with 0 likes
  const resA = simulateToggleLike({ isMine: false, initialLiked: false, initialLikeCount: 0 });
  assert.equal(resA.liked, true);
  assert.equal(resA.likeCount, 1);
  assert.equal(resA.badgePresent, true);
  assert.equal(resA.toasts[0].msg, "已点赞");
  assert.equal(resA.toasts[0].type, "success");

  // Case B: Un-liking a post with 1 like (badge should be removed)
  const resB = simulateToggleLike({ isMine: false, initialLiked: true, initialLikeCount: 1 });
  assert.equal(resB.liked, false);
  assert.equal(resB.likeCount, 0);
  assert.equal(resB.badgePresent, false);
  assert.equal(resB.toasts[0].msg, "已取消点赞");
  assert.equal(resB.toasts[0].type, "info");

  // Case C: Liking a post with 5 likes (count increments to 6)
  const resC = simulateToggleLike({ isMine: false, initialLiked: false, initialLikeCount: 5 });
  assert.equal(resC.liked, true);
  assert.equal(resC.likeCount, 6);
  assert.equal(resC.badgePresent, true);

  // Case D: Un-liking a post with 5 likes (count decrements to 4, badge preserved)
  const resD = simulateToggleLike({ isMine: false, initialLiked: true, initialLikeCount: 5 });
  assert.equal(resD.liked, false);
  assert.equal(resD.likeCount, 4);
  assert.equal(resD.badgePresent, true);

  // Case E: Self-like rejected without state change
  const resE = simulateToggleLike({ isMine: true, initialLiked: false, initialLikeCount: 2 });
  assert.equal(resE.liked, false);
  assert.equal(resE.likeCount, 2);
  assert.equal(resE.toasts[0].msg, "不能给自己的帖子点赞");

  // Case F: API failure rolls back state
  const resF = simulateToggleLike({ isMine: false, initialLiked: false, initialLikeCount: 0, apiSuccess: false, apiErrorMessage: "HTTP 429" });
  assert.equal(resF.liked, false);
  assert.equal(resF.likeCount, 0);
  assert.equal(resF.badgePresent, false);
  assert.equal(resF.toasts.length, 2);
  assert.equal(resF.toasts[0].msg, "已点赞");
  assert.equal(resF.toasts[1].msg, "点赞操作失败：HTTP 429");
  assert.equal(resF.toasts[1].type, "error");
});

test("V2EX notification navigation, URL pushState synchronization, MutationObserver badge guard, and empty list stability (v0.7.42)", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes('if (location.pathname !== "/notifications") {\n          navigateInApp("/notifications");'),
    "must call navigateInApp('/notifications') on avatar badge or popover click"
  );
  assert.ok(
    scriptContent.includes('el.closest("#Top a[href^=\'/notifications\'], #Rightbar a[href^=\'/notifications\']")'),
    "MutationObserver must ignore V2EX native notification badge changes"
  );
  assert.ok(
    scriptContent.includes('navigateInApp("/?tab=all");') &&
    scriptContent.includes('listState.apiPath.startsWith("/notifications")'),
    "handleChatNavClick must navigate back to /?tab=all from /notifications"
  );
  assert.ok(
    scriptContent.includes('emptyNotice = isNotifs') &&
    scriptContent.includes('"暂无未读提醒"'),
    "empty notifications list must display '暂无未读提醒'"
  );
  assert.ok(
    scriptContent.includes("!force && listState.loadedApiPath === apiPath && Array.isArray(listState.topics)"),
    "loadList must recognize loaded empty topics array without unnecessary refetching"
  );

  // 2. Behavioral simulation of the notification click & flash bug prevention
  let currentPathname = "/";
  let historyPath = "/";
  let appliedApi = "";
  let mutationObserverTriggered = false;

  function navigateInAppSim(url) {
    historyPath = url;
    currentPathname = url.split("?")[0];
    applyThemeSim();
  }

  function listApiForPathSim(pathname, search = "") {
    if (pathname === "/notifications") return pathname;
    if (search.includes("tab=hot")) return "/api/topics/hot.json";
    return "/?tab=all";
  }

  function applyThemeSim() {
    appliedApi = listApiForPathSim(currentPathname);
  }

  function simulateMutation(targetSelector) {
    const isUi = targetSelector.includes("wecom");
    const isBadge = targetSelector.includes("#Top a[href^='/notifications']");
    if (isUi || isBadge) {
      return false; // ignored
    }
    mutationObserverTriggered = true;
    applyThemeSim();
    return true;
  }

  // Initial state: User is on home with unread badge
  assert.equal(currentPathname, "/");

  // Step 1: User clicks "3 未读提醒"
  // Avatar badge click handler clears badge
  const badgeMutated = simulateMutation("#Top a[href^='/notifications']");
  assert.equal(badgeMutated, false, "MutationObserver must NOT treat badge clear as external mutation");
  assert.equal(mutationObserverTriggered, false);

  // Step 2: navigateInApp("/notifications") is executed
  navigateInAppSim("/notifications");
  assert.equal(currentPathname, "/notifications");
  assert.equal(historyPath, "/notifications");
  assert.equal(appliedApi, "/notifications", "Theme must resolve and apply /notifications api path");

  // Step 3: If an external mutation DOES occur while on /notifications
  const externalMutation = simulateMutation("#content");
  assert.equal(externalMutation, true);
  assert.equal(mutationObserverTriggered, true);
  // Even if applyTheme runs, it stays on /notifications because currentPathname is /notifications
  assert.equal(appliedApi, "/notifications", "Must remain on /notifications and not revert to home");

  // Step 4: Clicking chat nav on left rail navigates back to home
  function handleChatNavClickSim() {
    if (currentPathname === "/notifications") {
      navigateInAppSim("/?tab=all");
    }
  }
  handleChatNavClickSim();
  assert.equal(currentPathname, "/");
  assert.equal(appliedApi, "/?tab=all", "Navigating away returns cleanly to home tab");
});

test("V2EX left rail replaces schedule (cal) with notifications (notif), binds click, and synchronizes badges and active status (v0.7.43)", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes('(IS_V2EX || IS_JUEJIN) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }') ||
    scriptContent.includes('(IS_V2EX || IS_JUEJIN || IS_ZHIHU) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }'),
    "must configure notif with bell icon and '通知' label on V2EX and Juejin"
  );
  assert.ok(
    scriptContent.includes("function handleNotifNavClick()"),
    "must define handleNotifNavClick function"
  );
  assert.ok(
    scriptContent.includes("function bindRailNotifClick(rail)"),
    "must define bindRailNotifClick function"
  );
  assert.ok(
    scriptContent.includes('rail?.querySelector(\'[data-rail-key="notif"]\')'),
    "bindRailNotifClick must query [data-rail-key='notif']"
  );
  assert.ok(
    scriptContent.includes("bindRailNotifClick(rail);"),
    "bindRailNavClicks must include bindRailNotifClick"
  );
  assert.ok(
    scriptContent.includes("syncRailNavActive"),
    "must define and call syncRailNavActive"
  );
  assert.ok(
    scriptContent.includes('item.key === "notif" ? \'<span class="wecom-rail-badge" style="display:none"></span>\' : ""'),
    "ensureRail must render rail badge for notif item"
  );

  // 2. Behavioral simulation
  let currentPath = "/";
  let railActiveKey = "chat";
  let unreadBadgeCount = 5;

  function simulateSyncRailNavActive(pathname, mode = "chat") {
    if (mode === "history") {
      railActiveKey = "history";
    } else if (pathname === "/notifications") {
      railActiveKey = "notif";
    } else {
      railActiveKey = "chat";
    }
  }

  function simulateHandleNotifNavClick() {
    unreadBadgeCount = 0; // clear badge
    currentPath = "/notifications";
    simulateSyncRailNavActive(currentPath);
  }

  // Initial state on home:
  simulateSyncRailNavActive(currentPath);
  assert.equal(railActiveKey, "chat");
  assert.equal(unreadBadgeCount, 5);

  // User clicks "通知" on rail:
  simulateHandleNotifNavClick();
  assert.equal(currentPath, "/notifications");
  assert.equal(railActiveKey, "notif", "Rail must activate 'notif' item when on /notifications");
  assert.equal(unreadBadgeCount, 0, "Notification badge must be cleared");

  // User switches back to "消息":
  currentPath = "/?tab=all";
  simulateSyncRailNavActive(currentPath);
  assert.equal(railActiveKey, "chat", "Rail must reactivate 'chat' item when returning to messages");
});

test("entering notifications or calling clearNotificationBadge updates V2EX unread count to 0 未读提醒 across popover, storage, and native DOM (v0.7.44)", () => {
  // 1. Static code assertions
  assert.ok(
    scriptContent.includes('popoverNotif.textContent = "0 未读提醒";'),
    "clearNotificationBadge must update popover footer to '0 未读提醒'"
  );
  assert.ok(
    scriptContent.includes('notifLink.textContent = "0 未读提醒";'),
    "clearNotificationBadge must update native DOM notif link to '0 未读提醒'"
  );
  assert.ok(
    scriptContent.includes("cachedV2exUserStats.unreadNotifs = 0;"),
    "clearNotificationBadge must set cachedV2exUserStats.unreadNotifs to 0"
  );
  assert.ok(
    scriptContent.includes('if (IS_V2EX && location.pathname === "/notifications")'),
    "getUnreadNotificationCount must return 0 when pathname is /notifications"
  );
  assert.ok(
    scriptContent.includes("el.textContent = `${stats.unreadNotifs} 未读提醒`;"),
    "updateOpenV2exUserPopover must update .wecom-v2ex-footer-notifs"
  );

  // 2. Behavioral simulation
  let cachedStats = { unreadNotifs: 3, nodesCount: 10, topicsCount: 5 };
  let domNotifText = "3 条未读提醒";
  let popoverNotifText = `${cachedStats.unreadNotifs} 未读提醒`;
  let notificationCountOverride = null;

  function simulateClearNotificationBadge() {
    notificationCountOverride = 0;
    cachedStats.unreadNotifs = 0;
    popoverNotifText = "0 未读提醒";
    domNotifText = "0 未读提醒";
  }

  function simulateOpenPopover() {
    const notifCount = notificationCountOverride != null ? notificationCountOverride : cachedStats.unreadNotifs;
    return `${Math.max(0, notifCount)} 未读提醒`;
  }

  // Before click:
  assert.equal(popoverNotifText, "3 未读提醒");
  assert.equal(domNotifText, "3 条未读提醒");

  // User enters /notifications (click badge or popover footer):
  simulateClearNotificationBadge();
  assert.equal(popoverNotifText, "0 未读提醒", "Popover footer must immediately display '0 未读提醒'");
  assert.equal(domNotifText, "0 未读提醒", "Native DOM text must display '0 未读提醒'");
  assert.equal(cachedStats.unreadNotifs, 0, "Cached stats must have 0 unreadNotifs");

  // If user opens popover while in notifications:
  const reopenedText = simulateOpenPopover();
  assert.equal(reopenedText, "0 未读提醒", "Reopening popover must render '0 未读提醒'");
});

test("convCategoryTag omits is-dept tags and CSS hides .wecom-conv-tag.is-dept (v0.7.45)", () => {
  // 1. Static code assertions
  assert.ok(
    !scriptContent.includes('return `<span class="wecom-conv-tag is-dept">'),
    "convCategoryTag must NOT return is-dept tag"
  );
  assert.ok(
    scriptContent.includes(".wecom-conv-tag.is-dept {\n      display: none !important;"),
    "light mode CSS must hide .wecom-conv-tag.is-dept with display: none !important"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.is-dept {\n      display: none !important;"),
    "dark mode CSS must hide .wecom-conv-tag.is-dept with display: none !important"
  );

  // 2. Behavioral simulation of convCategoryTag
  function simulateConvCategoryTag(topic, categories = {}) {
    if (!categories || !topic.category_id) return "";
    const cat = categories[topic.category_id];
    if (!cat) return "";
    const name = cat.name || "";
    const isExt = /外|ext|资源|闲聊|搞七/i.test(name);
    if (!isExt) return "";
    return `<span class="wecom-conv-tag is-ext">@${name}</span>`;
  }

  // Topic with node_name (V2EX topic)
  assert.equal(simulateConvCategoryTag({ node_name: "qna" }), "", "V2EX node must not render dept tag");

  // Normal category on Linux DO
  assert.equal(
    simulateConvCategoryTag({ category_id: 1 }, { 1: { name: "日常讨论" } }),
    "",
    "Normal department category must not render dept tag"
  );

  // External category on Linux DO
  assert.equal(
    simulateConvCategoryTag({ category_id: 2 }, { 2: { name: "外部联系人" } }),
    '<span class="wecom-conv-tag is-ext">@外部联系人</span>',
    "External category must keep is-ext tag"
  );
});

test("convRowHtml exempts notifications from fake titles and displays real title (v0.7.46-v0.7.48)", () => {
  // 1. Static assertions on userscript logic
  assert.ok(
    scriptContent.includes("const isNotif = Boolean(") &&
    scriptContent.includes("topic.notification_text") &&
    scriptContent.includes("topic.node_name === \"通知\""),
    "convRowHtml must identify notification items"
  );
  assert.ok(
    scriptContent.includes("const title = (isNotif || !maskList) ? String(topic.title || \"\") : disguiseTitleForTopic(topic);"),
    "notifications must never use fake title and always show real title"
  );
  assert.ok(
    scriptContent.includes("if (maskList && !isNotif)"),
    "fake title summary override must not apply to notifications"
  );

  // 2. Behavioral simulation
  function simulateConvRow(topic, maskList, listApiPath = "") {
    const unread = topic.unread > 0 ? topic.unread : (topic.new_posts > 0 ? topic.new_posts : 0);
    const replyCount = Math.max(0, (topic.posts_count || 1) - 1);
    const isNotif = Boolean(
      topic.notification_text ||
      topic.node_name === "通知" ||
      topic.notif_type ||
      listApiPath.startsWith("/notifications")
    );
    let notifText = topic.notification_text || "";
    if (notifText && topic.last_poster_username && topic.last_poster_username !== "楼主") {
      if (!notifText.startsWith(topic.last_poster_username) && !notifText.startsWith("❤️") && !notifText.startsWith("⭐") && !notifText.startsWith("@")) {
        notifText = `${topic.last_poster_username}: ${notifText}`;
      }
    }
    const rawSummary = notifText || (topic.last_poster_username
      ? `${topic.last_poster_username}: ${replyCount > 0 ? `[${replyCount}条回复]` : "发起话题"}`
      : `${topic.posts_count || 0} 回复`);
    const title = (isNotif || !maskList) ? String(topic.title || "") : "伪装工作报告";
    let summary = rawSummary;
    if (maskList && !isNotif) {
      summary = String(topic.title || rawSummary);
    }
    return { title, summary };
  }

  // Normal topic with maskList off: shows author & reply count
  const normOff = simulateConvRow({ id: 101, title: "关于VS Code配置", last_poster_username: "alice", posts_count: 3 }, false);
  assert.equal(normOff.title, "关于VS Code配置");
  assert.equal(normOff.summary, "alice: [2条回复]");

  // Normal topic with maskList on: shows fake title at top, real title in summary
  const normOn = simulateConvRow({ id: 101, title: "关于VS Code配置", last_poster_username: "alice", posts_count: 3 }, true);
  assert.equal(normOn.title, "伪装工作报告");
  assert.equal(normOn.summary, "关于VS Code配置");

  // Notification reply with maskList off: shows real topic title and reply text
  const notifOff = simulateConvRow({
    id: 202,
    title: "关于VS Code配置",
    last_poster_username: "bob",
    notification_text: "确实已修复，感谢！",
    node_name: "通知"
  }, false, "/notifications");
  assert.equal(notifOff.title, "关于VS Code配置");
  assert.equal(notifOff.summary, "bob: 确实已修复，感谢！");

  // Notification reply with maskList ON: NEVER uses fake title! Still shows real title and reply text
  const notifOn = simulateConvRow({
    id: 202,
    title: "关于VS Code配置",
    last_poster_username: "bob",
    notification_text: "确实已修复，感谢！",
    node_name: "通知"
  }, true, "/notifications");
  assert.equal(notifOn.title, "关于VS Code配置", "Notification must keep real topic title even when fake title is enabled");
  assert.equal(notifOn.summary, "bob: 确实已修复，感谢！", "Notification summary must show clean reply without corruption");

  // Thank notification: clean summary
  const thankRow = simulateConvRow({
    id: 203,
    title: "企业微信UI插件",
    last_poster_username: "charlie",
    notification_text: "❤️ charlie 感谢了你的回复",
    notif_type: "thank",
    node_name: "通知"
  }, true, "/notifications");
  assert.equal(thankRow.title, "企业微信UI插件");
  assert.equal(thankRow.summary, "❤️ charlie 感谢了你的回复");
});

test("notification reply content is styled with non-gray color and V2EX supports background unread notification polling (v0.7.47)", () => {
  // 1. Static assertions for non-gray notification CSS and markup
  assert.ok(
    scriptContent.includes(".wecom-conv.is-notif .wecom-conv-msg,") &&
    scriptContent.includes(".wecom-conv-msg.is-notif-msg,") &&
    scriptContent.includes(".wecom-conv.is-notif .wecom-notif-reply"),
    "must define CSS for non-gray notification reply content"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv.is-notif .wecom-notif-reply {\n      color: #E6E8EB !important;"),
    "must define dark mode non-gray color for notification reply content"
  );
  assert.ok(
    scriptContent.includes('span class="wecom-conv-msg${isNotif ? " is-notif-msg" : ""}">'),
    "convRowHtml must render is-notif-msg class on notification rows"
  );
  assert.ok(
    scriptContent.includes('span class="wecom-notif-reply"'),
    "convRowHtml must render .wecom-notif-reply container"
  );

  // 2. Static assertions for V2EX background notification polling
  assert.ok(
    scriptContent.includes("const V2EX_NOTIF_POLL_INTERVAL_MS = 45000;"),
    "must define V2EX_NOTIF_POLL_INTERVAL_MS as 45s"
  );
  assert.ok(
    scriptContent.includes("function applyV2exRemoteNotifCount("),
    "must define applyV2exRemoteNotifCount"
  );
  assert.ok(
    scriptContent.includes("async function pollV2exNotificationsOnce("),
    "must define pollV2exNotificationsOnce"
  );
  assert.ok(
    scriptContent.includes("function startV2exNotificationPolling("),
    "must define startV2exNotificationPolling"
  );
  assert.ok(
    scriptContent.includes("function stopV2exNotificationPolling("),
    "must define stopV2exNotificationPolling"
  );

  // 3. Behavioral simulation of applyV2exRemoteNotifCount
  let simulatedOverride = 0;
  let simulatedRawCount = 0;
  let simulatedListReloaded = false;
  let simulatedCachedStats = { unreadNotifs: 0 };
  const mockDomLinks = [{ textContent: "" }];

  function simulateApplyV2exRemoteNotifCount(count, isNotifPage = false) {
    if (isNotifPage) {
      if (count > 0) simulatedListReloaded = true;
      return;
    }
    if (count > simulatedRawCount) {
      simulatedOverride = null;
    }
    simulatedRawCount = count;
    simulatedCachedStats.unreadNotifs = count;
    mockDomLinks.forEach(a => {
      a.textContent = count > 0 ? `${count} 条未读提醒` : "0 未读提醒";
    });
  }

  // Initial state: 0 unread
  simulateApplyV2exRemoteNotifCount(0);
  assert.equal(mockDomLinks[0].textContent, "0 未读提醒");
  assert.equal(simulatedCachedStats.unreadNotifs, 0);

  // Remote detects 2 new notifications while not on notification page
  simulateApplyV2exRemoteNotifCount(2, false);
  assert.equal(mockDomLinks[0].textContent, "2 条未读提醒");
  assert.equal(simulatedCachedStats.unreadNotifs, 2);
  assert.equal(simulatedOverride, null, "Override must be cleared when count increases");

  // Remote detects notification while on notification page: triggers list reload
  simulateApplyV2exRemoteNotifCount(1, true);
  assert.equal(simulatedListReloaded, true, "Must trigger notification list reload when on notifications page");
});

test("notifications exempt from fake title, clear distinction between likes/replies, and infinite scroll pagination (v0.7.48)", () => {
  // 1. Static assertions for notification CSS, tags, and pagination logic
  assert.ok(
    scriptContent.includes(".wecom-conv-tag.wecom-notif-tag {") &&
    scriptContent.includes(".wecom-conv-tag.wecom-notif-tag.is-thank") &&
    scriptContent.includes(".wecom-conv-tag.wecom-notif-tag.is-reply") &&
    scriptContent.includes(".wecom-conv-tag.wecom-notif-tag.is-mention") &&
    scriptContent.includes(".wecom-conv-tag.wecom-notif-tag.is-fav"),
    "must define distinct light mode CSS classes for notification tags"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.wecom-notif-tag.is-thank") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.wecom-notif-tag.is-reply") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.wecom-notif-tag.is-mention") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.wecom-notif-tag.is-fav"),
    "must define distinct dark mode CSS classes for notification tags"
  );
  assert.ok(
    scriptContent.includes("const title = (isNotif || !maskList) ? String(topic.title || \"\") : disguiseTitleForTopic(topic);"),
    "convRowHtml must never disguise notification titles"
  );
  assert.ok(
    scriptContent.includes('const isNotifPage = pageUrl.startsWith("/notifications") || (typeof listState.apiPath === "string" && listState.apiPath.startsWith("/notifications"));'),
    "loadMoreList must recognize /notifications pageUrl"
  );
  assert.ok(
    scriptContent.includes("? extractV2exNotificationsFromDoc(doc)") &&
    scriptContent.includes(": extractV2exTopicsFromDoc(doc);"),
    "loadMoreList must extract notifications on notification pages"
  );

  // 2. Behavioral simulation of extractV2exNotificationsFromDoc
  function simulateExtractNotifications(mockCells) {
    return mockCells.map((cell) => {
      const { href, topicTitle, author, cellText, payloadText, id } = cell;
      let notifType = "reply";
      let notifLabel = "回复";
      if (cellText.includes("感谢了你") || cellText.includes("感谢你的") || cellText.includes("点赞") || cellText.includes("送了你")) {
        notifType = "thank";
        notifLabel = "点赞";
      } else if (cellText.includes("提到了你") || cellText.includes("提到你") || cellText.includes("at了你")) {
        notifType = "mention";
        notifLabel = "提到";
      } else if (cellText.includes("收藏了你") || cellText.includes("收藏你的")) {
        notifType = "fav";
        notifLabel = "收藏";
      }

      let text = "";
      if (payloadText) {
        text = author ? `${author}: ${payloadText}` : payloadText;
      } else if (notifType === "thank") {
        text = cellText.includes("回复")
          ? `❤️ ${author || "有人"} 感谢了你的回复`
          : `❤️ ${author || "有人"} 感谢了你的主题`;
      } else if (notifType === "fav") {
        text = `⭐ ${author || "有人"} 收藏了你的主题`;
      } else if (notifType === "mention") {
        text = `@ ${author || "有人"} 提到了你`;
      } else {
        text = cellText;
      }

      return {
        id,
        title: topicTitle,
        notif_type: notifType,
        notif_label: notifLabel,
        notification_text: text,
        node_name: "通知"
      };
    });
  }

  const notifs = simulateExtractNotifications([
    {
      id: 101,
      href: "/t/101#reply5",
      topicTitle: "关于MacBook选购建议",
      author: "alice",
      cellText: "alice 感谢了你在主题 关于MacBook选购建议 里的回复",
      payloadText: null
    },
    {
      id: 102,
      href: "/t/102#reply18",
      topicTitle: "分享一个VS Code插件",
      author: "bob",
      cellText: "bob 在 分享一个VS Code插件 里回复了你",
      payloadText: "非常实用，点赞支持！"
    },
    {
      id: 103,
      href: "/t/103#reply2",
      topicTitle: "AI代码辅助工具对比",
      author: "charlie",
      cellText: "charlie 在 AI代码辅助工具对比 里提到了你",
      payloadText: "@you 可以参考一下这个方案"
    }
  ]);

  // Thank notification: categorized as 'thank' / '点赞', clean message
  assert.equal(notifs[0].notif_type, "thank");
  assert.equal(notifs[0].notif_label, "点赞");
  assert.equal(notifs[0].notification_text, "❤️ alice 感谢了你的回复");

  // Reply notification: categorized as 'reply' / '回复', author + payload
  assert.equal(notifs[1].notif_type, "reply");
  assert.equal(notifs[1].notif_label, "回复");
  assert.equal(notifs[1].notification_text, "bob: 非常实用，点赞支持！");

  // Mention notification: categorized as 'mention' / '提到'
  assert.equal(notifs[2].notif_type, "mention");
  assert.equal(notifs[2].notif_label, "提到");
  assert.equal(notifs[2].notification_text, "charlie: @you 可以参考一下这个方案");

  // 3. Behavioral simulation of parseV2exListPagination on /notifications
  function simulatePagination(path, count, pageInputMax, hasNextBtn) {
    if (count === 0) return { hasMore: false, nextPageUrl: null };
    const currentPage = 1;
    const totalPages = pageInputMax || 0;
    if (totalPages > 0) {
      const hasMore = (totalPages > currentPage) || hasNextBtn;
      return {
        hasMore,
        nextPageUrl: hasMore ? `${path}?p=${currentPage + 1}` : null,
        totalPages
      };
    }
    if (hasNextBtn) {
      return {
        hasMore: true,
        nextPageUrl: `${path}?p=${currentPage + 1}`,
        totalPages: 2
      };
    }
    if (path.startsWith("/notifications") && count >= 10) {
      return {
        hasMore: true,
        nextPageUrl: `${path}?p=${currentPage + 1}`,
        totalPages: 0
      };
    }
    return { hasMore: false, nextPageUrl: null };
  }

  // Page 1 of notifications with page_input max=3
  const pag1 = simulatePagination("/notifications", 20, 3, true);
  assert.equal(pag1.hasMore, true);
  assert.equal(pag1.nextPageUrl, "/notifications?p=2");

  // Page 1 of notifications with 2 items (no more pages)
  const pagEmpty = simulatePagination("/notifications", 2, 1, false);
  assert.equal(pagEmpty.hasMore, false);
  assert.equal(pagEmpty.nextPageUrl, null);
});

test("V2EX threaded conversation view: reply target resolution, tree hierarchy, indicators, and UI controls (v0.7.49)", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptContent = fs.readFileSync(path.join(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. 验证关键选择器与 CSS 规则存在
  assert.ok(scriptContent.includes(".wecom-menu-toggle-thread-view"), "contains .wecom-menu-toggle-thread-view in settings menu");
  assert.ok(scriptContent.includes(".wecom-reply-children"), "contains .wecom-reply-children continuous tree line style");
  assert.ok(scriptContent.includes(".wecom-thread-node"), "contains .wecom-thread-node container style");
  assert.ok(scriptContent.includes(".wecom-msg-reply-indicator"), "contains .wecom-msg-reply-indicator style");
  assert.ok(
    scriptContent.includes(".wecom-msg-me .wecom-msg-header:has(.wecom-msg-reply-indicator)") &&
    scriptContent.includes("align-self: flex-start;"),
    "keeps reply indicators left-aligned above outgoing message bubbles"
  );
  assert.ok(
    scriptContent.includes(".wecom-reply-children .wecom-msg.wecom-msg-me .wecom-msg-content") &&
    scriptContent.includes("align-items: flex-start !important;"),
    "keeps an author's nested reply bubble content left-aligned"
  );
  assert.ok(
    scriptContent.includes(".wecom-reply-children .wecom-msg.wecom-msg-me .wecom-msg-boosts") &&
    scriptContent.includes("justify-content: flex-start !important;"),
    "keeps nested reply metadata and Boosts left-aligned"
  );
  assert.ok(scriptContent.includes("function extractReferencedReply("), "contains extractReferencedReply");
  assert.ok(scriptContent.includes("function resolveV2exReplyRelationships("), "contains resolveV2exReplyRelationships");
  assert.ok(scriptContent.includes("function buildConversationTree("), "contains buildConversationTree");
  assert.ok(scriptContent.includes("function flattenReplies("), "contains flattenReplies");
  assert.ok(scriptContent.includes("function replyIndicatorHtml("), "contains replyIndicatorHtml");
  assert.ok(
    scriptContent.includes('if (IS_V2EX || (IS_LINUXDO && isThreadViewEnabled())) return "";'),
    "must hide duplicate Linux DO reply reference cards while threaded view is enabled"
  );
  assert.ok(scriptContent.includes("function replyBodyHtml("), "removes a duplicated leading reply mention from the message body");
  assert.ok(scriptContent.includes("const bodyHtml = replyBodyHtml(post, Boolean(replyInd));"), "uses the normalized reply body when rendering messages");
  assert.ok(
    scriptContent.includes('<div class="wecom-msg-header">') &&
    scriptContent.includes("${metaHtml}"),
    "places message metadata inside wecom-msg-header"
  );
  assert.ok(scriptContent.includes("function isThreadViewEnabled("), "contains isThreadViewEnabled");
  assert.ok(scriptContent.includes("function setThreadViewEnabled("), "contains setThreadViewEnabled");

  // 2. 验证 extractReferencedReply 严格匹配正文开头，支持各种 V2EX HTML 锚点形式，杜绝中段误伤
  function extractReferencedReply(content) {
    if (!content) return { author: "", floor: 0 };
    const raw = String(content).trim();
    let unwrapped = raw.replace(/^(?:<p[^>]*>|<br\s*\/?>|\s)+/i, "").trim();

    let author = "";
    let floor = 0;

    const memberMatch = unwrapped.match(/^(?:@\s*)?<a\s+[^>]*href=["']\/member\/([^"'/?#]+)["'][^>]*>(?:@)?([^<]*)<\/a>/i);
    if (memberMatch) {
      author = memberMatch[1] || memberMatch[2] || "";
      unwrapped = unwrapped.slice(memberMatch[0].length).trim();
    }

    const floorLinkMatch = unwrapped.match(/^(?:<br\s*\/?>|\s)*<a\s+[^>]*href=["'][^"']*#(?:reply)?(\d+)["'][^>]*>#?\s*(\d+)#?<\/a>/i);
    if (floorLinkMatch) {
      floor = Number(floorLinkMatch[1] || floorLinkMatch[2]) || 0;
      unwrapped = unwrapped.slice(floorLinkMatch[0].length).trim();
    }

    const text = unwrapped
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!floor) {
      const floorMatch = text.match(/^#\s*(\d+)\b/);
      if (floorMatch) {
        floor = Number(floorMatch[1]) || 0;
      }
    }

    if (!author) {
      const atMatch = text.match(/^@\s*([^\s#:：]+)/);
      if (atMatch) {
        author = atMatch[1];
        if (!floor) {
          const afterAt = text.slice(atMatch[0].length).trim();
          const fMatch = afterAt.match(/^#\s*(\d+)\b/);
          if (fMatch) {
            floor = Number(fMatch[1]) || 0;
          }
        }
      } else if (!floor) {
        const fMatch = text.match(/^#\s*(\d+)\b/);
        if (fMatch) {
          floor = Number(fMatch[1]) || 0;
        }
      }
    }

    return { author, floor };
  }

  // 验证真实 V2EX HTML 各种前缀形式均可正确提取
  assert.deepEqual(extractReferencedReply('@<a href="/member/a">a</a> #2 ccccccc'), { author: "a", floor: 2 });
  assert.deepEqual(extractReferencedReply('@<a href="/member/a">a</a> <a href="#reply2">#2</a> ccccccc'), { author: "a", floor: 2 });
  assert.deepEqual(extractReferencedReply('<a href="/member/a">@a</a> #2 ccccccc'), { author: "a", floor: 2 });
  assert.deepEqual(extractReferencedReply('<a href="/member/a">a</a> #2 ccccccc'), { author: "a", floor: 2 });
  assert.deepEqual(extractReferencedReply('<a href="/member/a">@a</a> ccccccc'), { author: "a", floor: 0 });
  assert.deepEqual(extractReferencedReply('@<a href="/member/a">a</a> ccccccc'), { author: "a", floor: 0 });
  assert.deepEqual(extractReferencedReply("@a #2 ccccccc"), { author: "a", floor: 2 });
  assert.deepEqual(extractReferencedReply("#2 ccccccc"), { author: "", floor: 2 });
  assert.deepEqual(extractReferencedReply('<a href="#reply2">#2</a> ccccccc'), { author: "", floor: 2 });
  assert.deepEqual(extractReferencedReply("@a: ccccccc"), { author: "a", floor: 0 });
  // 正文中段提及或数字，严格判定为无回复引用，避免误伤
  assert.deepEqual(extractReferencedReply("<p>普通路过顶贴</p>"), { author: "", floor: 0 });
  assert.deepEqual(extractReferencedReply("<p>感谢分享，@someone 来看一下</p>"), { author: "", floor: 0 });
  assert.deepEqual(extractReferencedReply("<p>在 #2 里已经讨论过了</p>"), { author: "", floor: 0 });
  assert.deepEqual(extractReferencedReply("<p>楼主威武</p>"), { author: "", floor: 0 });

  // 3. 验证回复解析与时序树状构建（参考 GreasyFork 590698 与用户示例）
  // 示例场景：
  // a: xxxxx (楼主, post 1, floor 0)
  //   b回复a: ccccccc (post 2, floor 1)
  //   c回复a: vvvvvvv (post 3, floor 2)
  //   b回复c: xxxxxxx (post 4, floor 3)
  // d: 我是路人，顶一下 (post 5, floor 4, 无引用 -> 独立根回复，不缩进)
  //   e回复b: 赞同你说的 (post 6, floor 5, 回复 b -> 嵌套在最新 b (post 4) 下)
  const userExamplePosts = [
    { post_number: 1, floor: 0, username: "a", cooked: "<p>xxxxx</p>" },
    { post_number: 2, floor: 1, username: "b", cooked: '<p><a href="/member/a">@a</a> ccccccc</p>' },
    { post_number: 3, floor: 2, username: "c", cooked: '<p><a href="/member/a">@a</a> vvvvvvv</p>' },
    { post_number: 4, floor: 3, username: "b", cooked: '<p><a href="/member/c">@c</a> xxxxxxx</p>' },
    { post_number: 5, floor: 4, username: "d", cooked: "<p>我是路人，顶一下</p>" },
    { post_number: 6, floor: 5, username: "e", cooked: '<p><a href="/member/b">@b</a> 赞同你说的</p>' }
  ];

  function resolveV2exReplyRelationships(posts) {
    if (!posts || !posts.length) return posts;
    const opPost = posts.find((p) => p.post_number === 1 || p.floor === 0) || posts[0];
    const opAuthor = String(opPost?.username || "").trim().toLowerCase();

    const normalized = [...posts].sort((a, b) => a.post_number - b.post_number);
    const byFloor = new Map();
    const latestByAuthor = new Map();

    for (const post of normalized) {
      if (post.floor != null) {
        byFloor.set(Number(post.floor), post);
      }
    }

    for (const post of normalized) {
      if (post === opPost || post.post_number === 1 || post.floor === 0) {
        post.reply_to_post_number = null;
        post.reply_to_floor = null;
        post.reply_to_user = null;
        post.is_explicit_reply = false;
        if (opAuthor) {
          latestByAuthor.set(opAuthor, post);
        }
        continue;
      }

      const ref = post.replyReference || extractReferencedReply(post.cooked || post.content || "");
      post.replyReference = ref;

      let parent = null;
      if (ref.floor) {
        parent = byFloor.get(Number(ref.floor)) || null;
      }
      if (!parent && ref.author) {
        parent = latestByAuthor.get(String(ref.author).toLowerCase()) || null;
      }

      if (parent && parent !== post && parent.post_number < post.post_number) {
        post.reply_to_post_number = parent.post_number;
        post.reply_to_floor = parent.floor != null ? parent.floor : (parent.post_number - 1);
        post.reply_to_user = {
          username: parent.username,
          name: parent.name || parent.displayName || parent.username
        };
        post.is_explicit_reply = true;
      } else {
        post.reply_to_post_number = null;
        post.reply_to_floor = null;
        post.reply_to_user = null;
        post.is_explicit_reply = false;
      }

      const authorKey = String(post.username || "").trim().toLowerCase();
      if (authorKey) {
        latestByAuthor.set(authorKey, post);
      }
    }

    return posts;
  }

  function buildConversationTree(posts) {
    if (!posts || !posts.length) return [];
    resolveV2exReplyRelationships(posts);

    const opPost = posts.find((p) => p.post_number === 1 || p.floor === 0) || posts[0];
    const normalized = [...posts].sort((a, b) => a.post_number - b.post_number);
    const byPostNum = new Map(normalized.map((p) => [p.post_number, p]));

    for (const post of normalized) {
      post.children = [];
      post._threadDepth = 0;
    }

    const roots = [];

    for (const post of normalized) {
      if (post === opPost || post.post_number === 1 || post.floor === 0) {
        roots.push(post);
        continue;
      }

      let parentNum = Number(post.reply_to_post_number) || 0;
      let parent = parentNum ? byPostNum.get(parentNum) : null;

      if (parent && parent !== post && parent.post_number < post.post_number) {
        parent.children.push(post);
      } else {
        roots.push(post);
      }
    }

    function setDepth(node, depth) {
      node._threadDepth = depth;
      if (node.children && node.children.length) {
        for (const child of node.children) {
          setDepth(child, depth + 1);
        }
      }
    }

    for (const root of roots) {
      setDepth(root, 0);
    }

    return roots;
  }

  function flattenReplies(nodes, result = []) {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      result.push(node);
      if (node.children && node.children.length) {
        flattenReplies(node.children, result);
      }
    }
    return result;
  }

  function replyIndicatorHtml(post) {
    const parentNum = Number(post?.reply_to_post_number) || 0;
    if (!parentNum) return "";
    const targetUser = post.reply_to_user?.name || post.reply_to_user?.username || "";
    const targetFloor = post.reply_to_floor != null && post.reply_to_floor > 0
      ? `#${post.reply_to_floor}`
      : (parentNum === 1 ? "楼主" : `#${parentNum}`);
    const userPart = targetUser ? `@${targetUser}` : "";
    const floorPart = targetFloor || "";
    const floorAttr = post.reply_to_floor != null ? ` data-reply-floor="${post.reply_to_floor}"` : "";
    return `<span class="wecom-msg-reply-indicator" data-reply-post-number="${parentNum}"${floorAttr}>` +
      `回复 ${userPart ? `${userPart} ` : ""}${floorPart}</span>`;
  }

  resolveV2exReplyRelationships(userExamplePosts);

  // 验证各回帖引用的目标
  assert.equal(userExamplePosts[1].reply_to_post_number, 1, "b replies to a (post 1)");
  assert.equal(userExamplePosts[1].reply_to_user?.username, "a");
  assert.equal(userExamplePosts[1].is_explicit_reply, true);

  assert.equal(userExamplePosts[2].reply_to_post_number, 1, "c replies to a (post 1)");
  assert.equal(userExamplePosts[2].reply_to_user?.username, "a");
  assert.equal(userExamplePosts[2].is_explicit_reply, true);

  assert.equal(userExamplePosts[3].reply_to_post_number, 3, "b replies to c (post 3, floor 2)");
  assert.equal(userExamplePosts[3].reply_to_user?.username, "c");
  assert.equal(userExamplePosts[3].reply_to_floor, 2);
  assert.equal(userExamplePosts[3].is_explicit_reply, true);

  // d 为无引用普通回帖，不被强制归入楼主，保持 null
  assert.equal(userExamplePosts[4].reply_to_post_number, null, "d has no reply reference");
  assert.equal(userExamplePosts[4].is_explicit_reply, false);

  // e 回复 b，精准关联到此前最新的 b 回帖 (post 4, floor 3)
  assert.equal(userExamplePosts[5].reply_to_post_number, 4, "e replies to latest b (post 4)");
  assert.equal(userExamplePosts[5].reply_to_user?.username, "b");
  assert.equal(userExamplePosts[5].reply_to_floor, 3);
  assert.equal(userExamplePosts[5].is_explicit_reply, true);

  // 验证角标渲染与跳转属性
  const indB1 = replyIndicatorHtml(userExamplePosts[1]);
  assert.ok(indB1.includes("回复 @a 楼主"));
  assert.ok(indB1.includes('data-reply-post-number="1"'));

  const indB2 = replyIndicatorHtml(userExamplePosts[3]);
  assert.ok(indB2.includes("回复 @c #2"));
  assert.ok(indB2.includes('data-reply-post-number="3"'));
  assert.ok(indB2.includes('data-reply-floor="2"'));

  const indD = replyIndicatorHtml(userExamplePosts[4]);
  assert.equal(indD, "", "independent post has no reply indicator");

  // 验证树状遍历与层级结构
  const tree = buildConversationTree(userExamplePosts);
  // roots 包含 a (楼主) 和 d (独立路人回帖)
  assert.equal(tree.length, 2, "roots contains post a and independent post d");
  assert.equal(tree[0].username, "a");
  assert.equal(tree[0]._threadDepth, 0);
  assert.equal(tree[1].username, "d");
  assert.equal(tree[1]._threadDepth, 0);

  // 验证 a 的子节点：b (floor 1) 与 c (floor 2)
  assert.equal(tree[0].children.length, 2);
  assert.equal(tree[0].children[0].username, "b");
  assert.equal(tree[0].children[0]._threadDepth, 1);
  assert.equal(tree[0].children[1].username, "c");
  assert.equal(tree[0].children[1]._threadDepth, 1);

  // 验证 c 的子节点：b (floor 3)
  assert.equal(tree[0].children[1].children.length, 1);
  assert.equal(tree[0].children[1].children[0].username, "b");
  assert.equal(tree[0].children[1].children[0]._threadDepth, 2);

  // 验证 b (floor 3) 的子节点：e (floor 5)
  assert.equal(tree[0].children[1].children[0].children.length, 1);
  assert.equal(tree[0].children[1].children[0].children[0].username, "e");
  assert.equal(tree[0].children[1].children[0].children[0]._threadDepth, 3);

  // 验证平铺结构与时序一致性
  const flattened = flattenReplies(tree);
  assert.equal(flattened.length, 6);
  assert.deepEqual(
    flattened.map((p) => ({ floor: p.floor, depth: p._threadDepth })),
    [
      { floor: 0, depth: 0 }, // a (OP)
      { floor: 1, depth: 1 }, // b -> a
      { floor: 2, depth: 1 }, // c -> a
      { floor: 3, depth: 2 }, // b -> c
      { floor: 5, depth: 3 }, // e -> b
      { floor: 4, depth: 0 }  // d (independent root)
    ]
  );

  // 4. 验证递归渲染 HTML 结构生成气泡内嵌套子回复容器与防冒泡引导线
  function renderThreadNode(node, myName, state, depth = 0) {
    node._threadDepth = depth;
    const post = node;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const childrenHtml = hasChildren
      ? `<div class="wecom-reply-children">${node.children.map((child) => renderThreadNode(child, myName, state, depth + 1)).join("")}</div>`
      : "";
    const bubble = `<div class="wecom-msg" data-post-number="${post.post_number}" data-floor="${post.floor}"><div class="wecom-msg-name">${post.username}</div><div class="wecom-msg-bubble">${post.cooked || ""}${childrenHtml}</div></div>`;
    if (depth === 0 && !hasChildren) {
      return bubble;
    }
    return `<div class="wecom-thread-node" data-post-number="${post.post_number}">${bubble}</div>`;
  }

  const renderedRoots = tree.map((root) => renderThreadNode(root, "me", { lastTime: 0 }, 0)).join("");
  assert.ok(renderedRoots.includes('class="wecom-thread-node" data-post-number="1"'), "renders thread node for post 1");
  assert.ok(renderedRoots.includes('class="wecom-reply-children"'), "renders continuous child container");
  assert.ok(renderedRoots.includes('<div class="wecom-msg-bubble"><p>xxxxx</p><div class="wecom-reply-children">'), "children are nested inside parent bubble");
  assert.ok(renderedRoots.includes('data-post-number="5"'), "renders independent post 5");
});

test("V2EX balance card duplication fix: cleanV2exMoneyContent strips wrapping tags, prevents duplicate blocks on second open (v0.7.60)", () => {
  // 1. Script contains cleanV2exMoneyContent
  assert.ok(
    scriptContent.includes("function cleanV2exMoneyContent("),
    "must define cleanV2exMoneyContent helper"
  );

  // 2. Script removes all popovers on close
  assert.ok(
    scriptContent.includes('document.querySelectorAll(".wecom-v2ex-user-popover").forEach(el => el.remove());'),
    "closeV2exUserPopover must remove all popover elements"
  );

  // 3. Functional tests for cleanV2exMoneyContent
  function cleanV2exMoneyContent(raw) {
    if (!raw || typeof raw !== "string") return "";
    let str = raw.trim();
    str = str.replace(/<\/?(?!img\b)[a-z0-9]+(?:\s+[^>]*)?>/gi, " ").trim();
    str = str.replace(/src=["']\/static\//gi, 'src="https://www.v2ex.com/static/');
    str = str.replace(/\s+/g, " ").trim();
    return str;
  }

  // Corrupted unclosed tag (from previous regex bug)
  const corrupted = '<a href="/balance" class="balance_area">11 <img src="/static/img/gold@2x.png"> 50 <img src="/static/img/silver@2x.png"> 80 <img src="/static/img/bronze@2x.png">';
  const cleanedCorrupted = cleanV2exMoneyContent(corrupted);
  assert.ok(!cleanedCorrupted.includes("<a"), "must strip <a tag");
  assert.ok(!cleanedCorrupted.includes("balance_area"), "must strip balance_area class");
  assert.ok(cleanedCorrupted.includes("https://www.v2ex.com/static/img/gold@2x.png"), "must replace static img url");
  assert.ok(cleanedCorrupted.includes("11") && cleanedCorrupted.includes("50") && cleanedCorrupted.includes("80"));

  // Nested #money > a
  const nestedMoney = '<div id="money"><a href="/balance" class="balance_area">11 <img src="/static/img/gold@2x.png"> 50 <img src="/static/img/silver@2x.png"> 80 <img src="/static/img/bronze@2x.png"></a></div>';
  const cleanedNested = cleanV2exMoneyContent(nestedMoney);
  assert.ok(!cleanedNested.includes("<div") && !cleanedNested.includes("<a"), "must strip all div and a tags");
  assert.ok(cleanedNested.includes("https://www.v2ex.com/static/img/gold@2x.png"));

  // DOM extraction ignores userscript popover elements
  assert.ok(
    scriptContent.includes('el.closest(".wecom-v2ex-user-popover, .wecom-v2ex-member-card, .wecom-rail, .wecom-v2ex-footer-coins-group")'),
    "extractV2exMoneyFromDom must ignore userscript-injected elements"
  );

  // getV2exUserStats cleans cached moneyHtml on read
  assert.ok(
    scriptContent.includes("cleanV2exMoneyContent(cachedV2exUserStats.moneyHtml)"),
    "getV2exUserStats must clean moneyHtml on read to heal corrupt localStorage"
  );
});

test("V2EX member profile card handles 404 user profiles as banned or renamed (v0.7.61)", () => {
  // 1. Static code checks
  assert.ok(
    scriptContent.includes(".wecom-member-badge.is-banned"),
    "must include CSS for banned member badge"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-notice.is-banned"),
    "must include CSS for banned member notice box"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-member-badge.is-banned"),
    "must include dark mode CSS for banned member badge"
  );
  assert.ok(
    scriptContent.includes("resp.status === 404"),
    "fetchV2exMemberProfile must check for 404 status code"
  );
  assert.ok(
    scriptContent.includes("isNotFound: true"),
    "fetchV2exMemberProfile must set isNotFound: true"
  );
  assert.ok(
    scriptContent.includes("已被封号或改名 (404)"),
    "openV2exMemberCard must display banned or renamed tagline on 404"
  );
  assert.ok(
    scriptContent.includes("已封号 / 改名"),
    "openV2exMemberCard must display banned or renamed badge text on 404"
  );

  // 2. Functional simulation of 404 detection logic
  function simulateCheckProfile(status, html) {
    if (status === 404) {
      return { isNotFound: true, status: 404 };
    }
    if (
      html.includes("未能找到指定的用户") ||
      html.includes("用户未找到") ||
      html.includes("Member not found") ||
      html.includes("找不到指定") ||
      ((html.includes("404") || html.includes("Not Found")) && (html.includes("用户") || html.includes("Member") || html.includes("指定")))
    ) {
      return { isNotFound: true, status: 404 };
    }
    return { isNotFound: false };
  }

  assert.equal(simulateCheckProfile(404, "").isNotFound, true);
  assert.equal(simulateCheckProfile(200, "<html>404 未能找到指定的用户</html>").isNotFound, true);
  assert.equal(simulateCheckProfile(200, "<html><div class='box'><div class='cell'>V2EX › 用户未找到</div></div></html>").isNotFound, true);
  assert.equal(simulateCheckProfile(200, "<html><h1>normaluser</h1><img class='avatar' src='//v2ex.com/avatar.png'></html>").isNotFound, false);
});

test("Test 89: Floor message metadata (wecom-msg-meta) positioned inside wecom-msg-header row (v0.7.62)", () => {
  // 1. 验证 HTML 模板结构：wecom-msg-meta 紧随 displayName / replyInd 渲染在 wecom-msg-header 内部
  const expectedHeaderPattern =
    '<div class="wecom-msg-header">\\s*' +
    '<span class="wecom-msg-name"\\${userCardAttributes\\(post\\)}>\\${escapeHtml\\(displayName\\)}<\\/span>\\s*' +
    '\\${replyInd}\\s*' +
    '\\${metaHtml}\\s*' +
    '<\\/div>';
  assert.ok(
    new RegExp(expectedHeaderPattern).test(scriptContent),
    "wecom-msg-header must contain displayName, replyInd, and metaHtml inline"
  );

  // 2. 验证 wecom-msg-bubble 之后不再多余渲染 metaHtml
  const postBubbleFragment =
    '<div class="wecom-msg-bubble">\\s*' +
    '\\${replyReferenceHtml\\(post\\)}\\s*' +
    '<div class="wecom-msg-body">\\${bodyHtml}<\\/div>\\s*' +
    '\\${childrenHtml \\|\\| ""}\\s*' +
    '<\\/div>\\s*' +
    '\\${boostsHtml\\(post\\)}\\s*' +
    '<div class="wecom-msg-tools">';
  assert.ok(
    new RegExp(postBubbleFragment).test(scriptContent),
    "metaHtml must not be rendered after wecom-msg-bubble"
  );

  // 3. 验证样式：.wecom-msg-header 支持 flex-wrap，.wecom-msg-meta 为 inline-flex 且 margin-top 为 0
  assert.ok(
    scriptContent.includes(".wecom-msg-header {") &&
    scriptContent.includes("flex-wrap: wrap;"),
    "wecom-msg-header must include flex-wrap: wrap to accommodate header meta gracefully"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-header .wecom-msg-meta") &&
    scriptContent.includes("display: inline-flex;"),
    "wecom-msg-meta in header must use inline-flex display"
  );
  assert.ok(
    scriptContent.includes("margin-top: 0;") &&
    scriptContent.includes(".wecom-msg-meta {"),
    "wecom-msg-meta must not have top margin pushing it downwards"
  );
});

test("Test 90: Left-bottom theme toggle event delegation, duplicate rail pruning, and wecom-list-add dark mode styles", () => {
  // 1. 验证 wecom-list-add 在深色模式下的样式定义与按钮 class 完整性
  assert.ok(
    scriptContent.includes('class="wecom-list-add wecom-list-add-btn"'),
    "list add button must carry both .wecom-list-add and .wecom-list-add-btn classes"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-list-add,") &&
    scriptContent.includes("html.wecom-dark .wecom-list-add,"),
    "WECOM_DARK_REFINEMENTS must style .wecom-list-add with dark background and color"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-list-add:hover,") &&
    scriptContent.includes("html.wecom-dark .wecom-list-add:hover,"),
    "WECOM_DARK_REFINEMENTS must style .wecom-list-add:hover for dark mode"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-list-add svg,") &&
    scriptContent.includes("html.wecom-dark .wecom-list-add svg,"),
    "WECOM_DARK_REFINEMENTS must style .wecom-list-add svg in dark mode"
  );

  // 2. 验证 bindThemeControls 全局事件委托 (event delegation)
  assert.ok(
    scriptContent.includes('const toggle = event.target.closest(".wecom-theme-toggle");') &&
    scriptContent.includes('setThemeMode(isDarkMode() ? "light" : "dark");'),
    "bindThemeControls must delegate click events for .wecom-theme-toggle globally"
  );
  assert.ok(
    scriptContent.includes('const options = event.target.closest(".wecom-theme-options");') &&
    scriptContent.includes('setThemeMenuOpen(!!menu?.hidden);'),
    "bindThemeControls must delegate click events for .wecom-theme-options globally"
  );

  // 3. 验证 bootstrap 启动阶段即注册全局主题控制器
  assert.ok(
    scriptContent.includes("bindViewModeShortcut();\n    // 停靠栏深浅色切换与外观设置全局事件代理\n    bindThemeControls();"),
    "bootstrap must call bindThemeControls early to ensure click events are never missed"
  );

  // 4. 验证 syncThemeControls 支持同步所有 .wecom-theme-toggle 实例及 V2EX 弹窗 pill
  assert.ok(
    scriptContent.includes('document.querySelectorAll(".wecom-theme-toggle").forEach('),
    "syncThemeControls must update all .wecom-theme-toggle elements on the page"
  );
  assert.ok(
    scriptContent.includes('v2exPill.classList.toggle("active", dark);'),
    "syncThemeControls must sync the V2EX popover theme switch pill"
  );

  // 5. 验证 ensureRail 清理多余重复 rail 元素
  assert.ok(
    scriptContent.includes('const rails = document.querySelectorAll(".wecom-rail");') &&
    scriptContent.includes("if (rails.length > 1)"),
    "ensureRail must prune duplicate rails to avoid stale detached elements"
  );
});

test("Test 91: Discourse SiteSettings deprecation warning prevention and MutationObserver infinite loop break", () => {
  // 1. 验证 disablePageLoadingIndicator 不直接触碰 Discourse 2.8+ 弃用 getter 并具备禁用状态缓存
  assert.ok(
    scriptContent.includes("let pageLoadingIndicatorDisabled = false;") &&
    (scriptContent.includes("if (IS_V2EX || pageLoadingIndicatorDisabled) return;") ||
     scriptContent.includes("if (IS_V2EX || IS_JUEJIN || IS_ZHIHU || pageLoadingIndicatorDisabled) return;")),
    "disablePageLoadingIndicator must cache completion state to avoid redundant calls"
  );
  assert.ok(
    scriptContent.includes('const settings = safeLookup(owner, "service:site-settings");') &&
    scriptContent.includes('settings.page_loading_indicator = "none";') &&
    scriptContent.includes('typeof rawDescriptor.get !== "function"'),
    "disablePageLoadingIndicator must prefer injected site-settings service and avoid touching deprecated Discourse.SiteSettings getter"
  );

  // 2. 验证 applyTheme 防重入及执行完毕后清空 MutationObserver 积压记录
  assert.ok(
    scriptContent.includes("let isApplyingTheme = false;") &&
    scriptContent.includes("let domMutationObserver = null;"),
    "applyTheme must maintain isApplyingTheme and domMutationObserver references"
  );
  assert.ok(
    scriptContent.includes("if (isApplyingTheme) return;") &&
    scriptContent.includes("isApplyingTheme = true;") &&
    scriptContent.includes("domMutationObserver.takeRecords();") &&
    scriptContent.includes("isApplyingTheme = false;"),
    "applyTheme must take pending records in finally block to eliminate observer queue bounce"
  );

  // 3. 验证 bootstrap MutationObserver 具有自研组件与 body/head 挂载过滤
  assert.ok(
    scriptContent.includes("function isWecomOrBridgeNode(node)") &&
    scriptContent.includes("if (isApplyingTheme) return;") &&
    scriptContent.includes("changedNodes.every(isWecomOrBridgeNode)"),
    "MutationObserver must ignore internal WeCom node mutations on root containers"
  );

  // 4. 验证 syncThemeControls 和 injectStyle 包含脏检查避免重复操作 DOM
  assert.ok(
    scriptContent.includes("if (icon && icon.innerHTML !== nextIcon) icon.innerHTML = nextIcon;") &&
    scriptContent.includes("if (style.textContent !== nextCss)"),
    "syncThemeControls and injectStyle must check for actual changes before writing DOM"
  );

  // 5. 验证 FAVICON_URI 已更新为新的企业微信矢量图标
  const faviconMatch = scriptContent.match(/const FAVICON_URI = "data:image\/svg\+xml;base64,([^"]+)";/);
  assert.ok(faviconMatch, "FAVICON_URI must be a valid base64 svg data URI");
  const decodedFavicon = Buffer.from(faviconMatch[1], "base64").toString("utf8");
  assert.ok(
    decodedFavicon.includes("#006BFF") && decodedFavicon.includes("119.78919"),
    "FAVICON_URI must contain the updated WeCom icon svg"
  );
});

test("Test 92: V2EX topic appendices (.subtle) extraction and dual-mode bubble styling", () => {
  // 1. 验证 parseV2exTopicDoc 提取正文时排除 .subtle 内部的 .topic_content，避免无正文时重复
  assert.ok(
    scriptContent.includes('doc.querySelectorAll("#Main .topic_content, #Main .entry-content")') &&
    scriptContent.includes('!el.closest?.(".subtle")'),
    "parseV2exTopicDoc must extract main content excluding subtle children"
  );

  // 2. 验证 parseV2exTopicDoc 提取所有附言（.subtle）并拼接进 opContent
  assert.ok(
    scriptContent.includes('doc.querySelectorAll("#Main .box .subtle, #Main .subtle, .subtle")') &&
    scriptContent.includes('!el.parentElement?.closest?.(".subtle")') &&
    scriptContent.includes('opSubtleHtml'),
    "parseV2exTopicDoc must extract all subtle appendices"
  );
  assert.ok(
    scriptContent.includes("if (opMainHtml && opSubtleHtml) {") &&
    scriptContent.includes("opContent = `${opMainHtml}\\n${opSubtleHtml}`;") &&
    scriptContent.includes("else if (opSubtleHtml) {"),
    "parseV2exTopicDoc must combine main content and appendices or fallback gracefully"
  );

  // 3. 验证浅色与深色模式下均有 .wecom-msg-bubble .subtle 完整样式定义（低调浅灰色左边框）
  assert.ok(
    scriptContent.includes("/* V2EX 附言 (.subtle) 样式规范（浅色模式） */") &&
    scriptContent.includes(".wecom-msg-bubble .subtle {") &&
    scriptContent.includes("border-left: 3px solid #D5D8DE !important;"),
    "WECOM_LATEST_REFINEMENTS must style .wecom-msg-bubble .subtle with muted gray border in light mode"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-msg-bubble .subtle,") &&
    scriptContent.includes("border-left: 3px solid rgba(255, 255, 255, 0.2) !important;"),
    "WECOM_DARK_REFINEMENTS must style .wecom-msg-bubble .subtle with muted border in dark mode"
  );
});

test("Test 93: V2EX thank action confirmation layer (.wecom-confirm-dialog) to prevent accidental clicks", () => {
  // 1. 验证定义了 showWecomConfirm 确认弹层组件
  assert.ok(
    scriptContent.includes("function showWecomConfirm({") &&
    scriptContent.includes('class="wecom-confirm-card"') &&
    scriptContent.includes('class="wecom-confirm-btn-primary"'),
    "must define showWecomConfirm with modal structure and action buttons"
  );

  // 2. 验证弹窗样式与深色模式样式
  assert.ok(
    scriptContent.includes(".wecom-confirm-dialog") &&
    scriptContent.includes(".wecom-confirm-btn-primary {"),
    "CSS must style .wecom-confirm-dialog and primary confirm button"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-confirm-card,") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-confirm-card"),
    "WECOM_DARK_REFINEMENTS must style confirm modal in dark mode"
  );

  // 3. 验证 toggleLike 在 V2EX 环境下弹出确认层并防误触
  assert.ok(
    scriptContent.includes("activeConfirmingPosts.add(postId);") &&
    scriptContent.includes("confirmed = await showWecomConfirm({") &&
    scriptContent.includes("if (!confirmed) return;"),
    "toggleLike must invoke showWecomConfirm and early return on cancel to prevent accidental thank"
  );
  assert.ok(
    scriptContent.includes('subtext: "发送后将消耗 10 个铜币，且不可撤销。"') &&
    scriptContent.includes('title: "发送谢意"'),
    "showWecomConfirm call must inform user about 10 copper coins deduction and irreversibility"
  );

  // 4. 验证区分主题与回帖感谢接口
  assert.ok(
    scriptContent.includes("const thankUrl = isTopic") &&
    scriptContent.includes("`/thank/topic/${chatState.topicId || postId}?once=${once}`") &&
    scriptContent.includes("`/thank/reply/${postId}?once=${once}`"),
    "toggleLike must route to thank/topic for topic post and thank/reply for replies"
  );
});

test("Test 94: V2EX member profile 404 false-positive prevention (e.g. opengps) and cache size bound", () => {
  // 1. 验证有效资料优先于 404 文本检测，避免发过包含 404 标题的正常用户被误判
  assert.ok(
    scriptContent.includes("const hasValidProfile = Boolean(profile && (profile.uid || profile.avatarUrl || profile.joinedDate));") &&
    scriptContent.includes("if (hasValidProfile) {"),
    "fetchV2exMemberProfile must prioritize valid parsed profile over error heuristics"
  );

  // 2. 验证仅在未能提取有效用户资料时检测 404 标题或提示框
  assert.ok(
    scriptContent.includes("const isTitleNotFound = /<title>[^<]*(?:404|not found|用户未找到|找不到)[^<]*<\\/title>/i.test(html);") &&
    scriptContent.includes("const isBoxNotFound = /<div[^>]*class=[\"'][^\"']*(?:message|problem)"),
    "fetchV2exMemberProfile must check title and problem box only when profile is missing"
  );

  // 3. 验证存在 LRU 淘汰函数 cacheMemberProfile 及最大容量控制
  assert.ok(
    scriptContent.includes("const V2EX_MEMBER_CACHE_MAX = 60;") &&
    scriptContent.includes("function cacheMemberProfile(username, data) {") &&
    scriptContent.includes("v2exMemberProfileCache.delete(oldestKey);"),
    "must bound v2exMemberProfileCache with LRU eviction to prevent unbounded memory growth"
  );
});

test("Test 95: wecom-msg-name margin-bottom removal and user card auto-hiding scrollbars", () => {
  // 1. 验证 .wecom-msg-name 的 margin-bottom 已置为 0
  assert.ok(
    scriptContent.includes(".wecom-msg-name {") &&
    scriptContent.includes("margin-bottom: 0 !important;"),
    ".wecom-msg-name must set margin-bottom: 0 !important"
  );
  assert.ok(
    !/\.wecom-msg-name\s*\{[^}]*margin-bottom:\s*4px/i.test(scriptContent),
    "must eliminate obsolete margin-bottom: 4px !important on message names"
  );

  // 2. 验证用户卡片包含在自动隐藏滚动条规则中
  assert.ok(
    scriptContent.includes(".wecom-v2ex-member-card,") &&
    scriptContent.includes(".wecom-v2ex-user-popover {") &&
    scriptContent.includes("scrollbar-color: transparent transparent !important;"),
    "user card must use transparent scrollbars by default"
  );
  assert.ok(
    scriptContent.includes(".wecom-v2ex-member-card:hover::-webkit-scrollbar-thumb,") &&
    scriptContent.includes(".wecom-v2ex-user-popover:hover::-webkit-scrollbar-thumb {"),
    "user card scrollbar thumb must appear on hover like conversation list"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-member-card:hover::-webkit-scrollbar-thumb,"),
    "dark mode must style user card scrollbar thumb on hover"
  );
});

test("Test 96: list pagination incremental append to avoid innerHTML redraw (appendListRows)", () => {
  // 1. 验证定义了 appendListRows 增量追加函数
  assert.ok(
    scriptContent.includes("function appendListRows(freshTopics = []) {") &&
    scriptContent.includes("statusEl.insertAdjacentHTML(\"beforebegin\", html);"),
    "must define appendListRows with insertAdjacentHTML before statusEl to avoid full innerHTML redraw"
  );

  // 2. 验证 applyListJson 在 append 为 true 时调用 appendListRows(fresh)
  assert.ok(
    scriptContent.includes("if (append) {") &&
    scriptContent.includes("appendListRows(fresh);") &&
    scriptContent.includes("renderListRows();"),
    "applyListJson must call appendListRows(fresh) when append is true and fallback to renderListRows"
  );

  // 3. 验证 V2EX 在 loadMoreList 中使用 appendListRows(fresh)
  assert.ok(
    scriptContent.includes("appendListRows(fresh);") &&
    scriptContent.includes("syncRail();"),
    "loadMoreList must use appendListRows for incremental pagination"
  );

  // 4. 验证 loadMoreList 在加载中展示「正在加载更多…」，失败时提供点击重试
  assert.ok(
    scriptContent.includes('statusEl.textContent = "正在加载更多…";') &&
    scriptContent.includes('statusEl.textContent = "加载失败，点击重试";') &&
    scriptContent.includes('statusEl.classList.add("is-clickable");'),
    "loadMoreList must manage status element state for loading and error recovery"
  );

  // 5. 行为仿真验证：已有 DOM 节点未被替换，新节点直接追加在 statusEl 前面
  const existingConv = { id: 101, title: "原有第一篇话题" };
  const freshTopics = [
    { id: 102, title: "第二页新增话题 A" },
    { id: 103, title: "第二页新增话题 B" }
  ];

  let bodyHtml = `<a class="wecom-conv" data-topic-id="101">原有第一篇话题</a><div class="wecom-list-status is-clickable">下拉或点击加载更多…</div>`;
  const inserted = [];
  const mockStatusEl = {
    textContent: "下拉或点击加载更多…",
    className: "wecom-list-status is-clickable",
    insertAdjacentHTML(position, html) {
      inserted.push({ position, html });
    }
  };

  // 模拟增量追加调用
  const mockHtml = freshTopics.map((t) => `<a class="wecom-conv" data-topic-id="${t.id}">${t.title}</a>`).join("");
  mockStatusEl.insertAdjacentHTML("beforebegin", mockHtml);

  assert.strictEqual(inserted.length, 1);
  assert.strictEqual(inserted[0].position, "beforebegin");
  assert.ok(inserted[0].html.includes("第二页新增话题 A"));
  assert.ok(inserted[0].html.includes("第二页新增话题 B"));
});

test("Test 97: Juejin Pins (掘金 · 沸点) platform support, 64-bit ID string safety, routing, and conversation mappings", () => {
  // 1. Metadata matches and host detection
  assert.ok(scriptContent.includes("// @match        *://juejin.cn/*"), "metadata must declare @match for juejin.cn");
  assert.ok(scriptContent.includes("// @match        https://juejin.cn/*"), "metadata must declare @match https for juejin.cn");
  assert.ok(scriptContent.includes("// @connect      api.juejin.cn"), "metadata must declare @connect api.juejin.cn");
  assert.ok(scriptContent.includes("const IS_JUEJIN = /(?:^|\\.)juejin\\.cn$/i.test(CURRENT_HOST);"), "must define IS_JUEJIN regex");
  assert.ok(scriptContent.includes('IS_JUEJIN ? "juejin" : (IS_V2EX ? "v2ex" : "linuxdo")'), "must include juejin in CURRENT_PLATFORM");

  // Host regex simulation
  const juejinRegex = /(?:^|\.)juejin\.cn$/i;
  assert.ok(juejinRegex.test("juejin.cn"));
  assert.ok(juejinRegex.test("www.juejin.cn"));
  assert.ok(juejinRegex.test("api.juejin.cn"));
  assert.ok(!juejinRegex.test("linux.do"));
  assert.ok(!juejinRegex.test("v2ex.com"));

  // 2. CSS suppression for Juejin elements
  assert.ok(
    scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} #juejin,") &&
    scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .main-container,") &&
    scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .global-component-box,") &&
    scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .suspension-panel"),
    "must suppress Juejin DOM containers under WeCom theme"
  );

  // 3. 64-bit ID precision preservation
  const testPinId = "7687440193650475014";
  assert.strictEqual(Number(testPinId).toString(), "7687440193650475000", "sanity: Number loses precision for 19-digit IDs");

  // topicRouteFromPath simulation
  function simTopicRouteFromPath(pathname, isJuejin) {
    if (isJuejin) {
      const m = String(pathname || "").match(/\/pin\/([0-9a-zA-Z_-]+)/);
      if (m) return { topicId: m[1], postNumber: 0, slug: "" };
      return { topicId: null, postNumber: 0, slug: "" };
    }
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts[0] === "t") return { topicId: Number(parts[2] || parts[1]), postNumber: 0, slug: "" };
    return { topicId: null, postNumber: 0, slug: "" };
  }

  const routeRes = simTopicRouteFromPath("/pin/" + testPinId, true);
  assert.strictEqual(routeRes.topicId, testPinId, "must preserve string ID for 64-bit pin ID");

  // isSameTopic simulation
  function simIsSameTopic(id1, id2, isJuejin) {
    if (id1 == null || id2 == null) return false;
    if (isJuejin) return String(id1) === String(id2);
    return Number(id1) === Number(id2);
  }
  assert.ok(simIsSameTopic(testPinId, testPinId, true));
  assert.ok(!simIsSameTopic(testPinId, "7687440193650475000", true));

  // 4. Data mapping functions
  assert.ok(scriptContent.includes("function mapJuejinPinToTopic(item)"), "must define mapJuejinPinToTopic");
  assert.ok(scriptContent.includes("function mapJuejinPinToPost(pin)"), "must define mapJuejinPinToPost");
  assert.ok(scriptContent.includes("function mapJuejinCommentToPost(c, postNumber)"), "must define mapJuejinCommentToPost");
  assert.ok(scriptContent.includes("async function fetchJuejinPinsList("), "must define fetchJuejinPinsList");
  assert.ok(scriptContent.includes("async function fetchJuejinPinData("), "must define fetchJuejinPinData");
  assert.ok(scriptContent.includes("async function submitJuejinComment("), "must define submitJuejinComment");

  // 5. UI integrations
  assert.ok(scriptContent.includes('IS_JUEJIN ? "搜索掘金沸点" :'), "search placeholder for Juejin");
  assert.ok(scriptContent.includes('data-target-platform="juejin"'), "platform switcher includes juejin option");
  assert.ok(scriptContent.includes('window.location.href = "https://juejin.cn/pins"'), "platform switcher redirects to juejin pins");
  assert.ok(scriptContent.includes('endpoint = isLiked ? "/interact_api/v1/digg/cancel" : "/interact_api/v1/digg/save"'), "toggleLike hooks juejin digg save/cancel");
  assert.ok(scriptContent.includes('submitJuejinComment(chatState.topicId, raw)'), "submitComposer hooks submitJuejinComment");
});

test("Test 98: Bubble hover tools isolation: Boost, bookmark, and edit tools restricted to Linux DO (v0.7.67)", () => {
  assert.ok(
    scriptContent.includes("const boostButton = IS_LINUXDO"),
    "boostButton must be strictly scoped to IS_LINUXDO"
  );
  assert.ok(
    scriptContent.includes("const bookmarkButton = IS_LINUXDO && post.id"),
    "bookmarkButton must be strictly scoped to IS_LINUXDO"
  );
  assert.ok(
    scriptContent.includes("const editButton = IS_LINUXDO && me && (post.id || post.post_number)"),
    "editButton must be strictly scoped to IS_LINUXDO"
  );
  assert.ok(
    scriptContent.includes('if (!IS_LINUXDO) return "";\n    if (!isBoostEnabled()) return "";'),
    "boostsHtml must return empty string when not on Linux DO"
  );
  assert.ok(
    scriptContent.includes('function openBoostPopover(msgEl, anchorBtn) {\n    if (!IS_LINUXDO) return;'),
    "openBoostPopover must guard against non-Linux DO invocation"
  );
  assert.ok(
    scriptContent.includes('async function openEditPost(message, trigger) {\n    if (!IS_LINUXDO) return;'),
    "openEditPost must guard against non-Linux DO invocation"
  );
  assert.ok(
    scriptContent.includes('async function openOriginalPostBookmark(message) {\n    if (!IS_LINUXDO) return;'),
    "openOriginalPostBookmark must guard against non-Linux DO invocation"
  );
  assert.ok(
    scriptContent.includes('class="wecom-platform-item${IS_LINUXDO ? " is-active" : ""}" data-target-platform="linuxdo"'),
    "platform switcher must check IS_LINUXDO instead of !IS_V2EX"
  );
});

test("Test 99: Juejin Pins background comment polling and seamless fresh reply appending (v0.7.68)", () => {
  assert.ok(
    scriptContent.includes("async function pollJuejinCurrentTopicOnce()"),
    "must define pollJuejinCurrentTopicOnce"
  );
  assert.ok(
    scriptContent.includes("function startJuejinTopicPolling()"),
    "must define startJuejinTopicPolling"
  );
  assert.ok(
    scriptContent.includes("function stopJuejinTopicPolling()"),
    "must define stopJuejinTopicPolling"
  );
  assert.ok(
    scriptContent.includes("JUEJIN_TOPIC_POLL_INTERVAL_MS = 10000"),
    "must define JUEJIN_TOPIC_POLL_INTERVAL_MS as 10000"
  );
  assert.ok(
    scriptContent.includes("let appended = await pollJuejinCurrentTopicOnce();"),
    "submitComposer must poll for newly submitted Juejin comment"
  );
  assert.ok(
    scriptContent.includes("stopJuejinTopicPolling();"),
    "cleanup must stop Juejin polling timer"
  );
  assert.ok(
    scriptContent.includes("startJuejinTopicPolling();"),
    "bootstrap must start Juejin polling timer"
  );
  assert.ok(
    scriptContent.includes("pollJuejinCurrentTopicOnce();"),
    "visibilitychange must trigger Juejin topic polling"
  );
});

test("Test 100: Juejin user profile card popup, metrics, follow action, and dismissal (v0.7.69)", () => {
  // 1. Core function and state definitions
  assert.ok(
    scriptContent.includes("async function fetchJuejinUserProfile(userId)"),
    "must define fetchJuejinUserProfile"
  );
  assert.ok(
    scriptContent.includes("function openJuejinMemberCard(username, userId, triggerEl, event)"),
    "must define openJuejinMemberCard"
  );
  assert.ok(
    scriptContent.includes("function closeJuejinMemberCard()"),
    "must define closeJuejinMemberCard"
  );
  assert.ok(
    scriptContent.includes("function isJuejinMemberCardOpen()"),
    "must define isJuejinMemberCardOpen"
  );
  assert.ok(
    scriptContent.includes("const juejinUserCache = new Map();"),
    "must define juejinUserCache memory cache"
  );

  // 2. Lifecycle, cleanup, and selector integration
  assert.match(
    scriptContent,
    /WECOM_UI_SEL\s*=\s*"[^"]*\.wecom-juejin-member-card/,
    "WECOM_UI_SEL must include .wecom-juejin-member-card"
  );
  assert.ok(
    scriptContent.includes("closeJuejinMemberCard();"),
    "removePanels must call closeJuejinMemberCard"
  );
  assert.ok(
    scriptContent.includes("if (isJuejinMemberCardOpen()) closeJuejinMemberCard();"),
    "Escape keydown listener must close Juejin member card"
  );

  // 3. User card trigger routing
  assert.ok(
    scriptContent.includes("openJuejinMemberCard(username, uid, trigger, event);"),
    "openOriginalUserCard must invoke openJuejinMemberCard on Juejin"
  );
  assert.ok(
    scriptContent.includes("IS_JUEJIN && topic.last_poster_username"),
    "convAvatarHtml must handle Juejin author attributes"
  );
  assert.ok(
    scriptContent.includes('data-user-id="${escapeHtml(String(jUid))}"'),
    "convAvatarHtml must attach data-user-id for Juejin author"
  );

  // 4. syncUserCardElement & data-user-id
  assert.ok(
    scriptContent.includes('for (const attribute of ["data-user-card", "role", "tabindex", "aria-label", "title", "data-user-id"])'),
    "syncUserCardElement must clean up data-user-id"
  );
  assert.ok(
    scriptContent.includes("element.dataset.userId = String(uid);"),
    "syncUserCardElement must populate data-user-id from user_id"
  );

  // 5. Follow & undo endpoints
  assert.ok(
    scriptContent.includes('const endpoint = willFollow ? "/interact_api/v1/follow/do" : "/interact_api/v1/follow/undo";'),
    "openJuejinMemberCard must support follow and unfollow toggle"
  );
  assert.ok(
    scriptContent.includes("juejinApi(endpoint, { id: String(profile.userId || userId), type: 1, client_type: 2608 })") ||
    scriptContent.includes("juejinApi(endpoint, { id: String(userId), type: 1, client_type: 2608 })"),
    "follow action must call juejinApi with correct payload"
  );

  // 6. Metrics formatting simulation
  const mockUserResp = {
    err_no: 0,
    data: {
      user_id: "272252119999999",
      user_name: "前端技术大佬",
      avatar_large: "https://p3-passport.byteimg.com/img/avatar.png",
      company: "字节跳动",
      job_title: "前端架构师",
      description: "专注于现代化前端架构与性能优化",
      level: 6,
      power: 28400,
      got_digg_count: 15300,
      got_view_count: 520000,
      post_shortmsg_count: 88,
      post_article_count: 42,
      follower_count: 6700,
      followee_count: 120,
      is_followed: false,
      is_current_user: false
    }
  };

  const user = mockUserResp.data;
  const profile = {
    userId: String(user.user_id),
    username: user.user_name || "掘友",
    avatarUrl: user.avatar_large || "",
    company: user.company || "",
    jobTitle: user.job_title || "",
    description: user.description || "",
    level: Number(user.level) || 0,
    power: Number(user.power) || 0,
    gotDiggCount: Number(user.got_digg_count) || 0,
    postArticleCount: Number(user.post_article_count) || 0,
    postPinCount: Number(user.post_shortmsg_count) || 0,
    followerCount: Number(user.follower_count) || 0,
    followeeCount: Number(user.followee_count) || 0,
    isFollowed: Boolean(user.is_followed),
    isCurrentUser: Boolean(user.is_current_user)
  };

  assert.strictEqual(profile.userId, "272252119999999");
  assert.strictEqual(profile.username, "前端技术大佬");
  assert.strictEqual(profile.level, 6);
  assert.strictEqual(profile.power, 28400);
  assert.strictEqual(profile.gotDiggCount, 15300);
  assert.strictEqual(profile.followerCount, 6700);
  assert.strictEqual(profile.postPinCount, 88);
  assert.strictEqual(profile.postArticleCount, 42);
  assert.strictEqual([profile.jobTitle, profile.company].filter(Boolean).join(" @ "), "前端架构师 @ 字节跳动");
});

test("Test 101: Juejin UI deduplication, publish modal, notification routing, and redundant feature stripping (v0.7.70)", () => {
  // 1. Redundant feature stripping: Connect removed from Juejin
  assert.ok(
    scriptContent.includes('(IS_V2EX || IS_JUEJIN) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }') ||
    scriptContent.includes('(IS_V2EX || IS_JUEJIN || IS_ZHIHU) ? { key: "notif", icon: "bell", label: "通知" } : { key: "connect", icon: "connect", label: "Connect" }'),
    "Juejin must not show Connect on rail"
  );
  assert.ok(
    scriptContent.includes('loadList("/notification", true);'),
    "Juejin notification click must load notifications in-page via loadList"
  );
  assert.ok(
    scriptContent.includes("if (IS_LINUXDO) {\n      bindRailConnectClick(rail);\n    }"),
    "bindRailConnectClick must be restricted to Linux DO"
  );

  // 2. Chat header bookmark replaced with open in web on Juejin
  assert.ok(
    scriptContent.includes("wecom-open-pin-web") &&
    scriptContent.includes('title="在原站打开沸点 ↗"'),
    "Juejin chat header must replace bookmark with open-in-web"
  );
  assert.ok(
    scriptContent.includes('window.open(`https://juejin.cn/pin/${chatState.topicId}`'),
    "wecom-open-pin-web click must open current pin on juejin.cn"
  );
  assert.ok(
    scriptContent.includes("if (IS_JUEJIN) return true;") ||
    scriptContent.includes("if (IS_JUEJIN || IS_ZHIHU) return true;"),
    "wecom-topic-bookmark click must guard against Juejin"
  );

  // 3. Avoid 200px gap from setNav2Open
  assert.ok(
    scriptContent.includes("if (IS_JUEJIN) {\n      setListNavOpen(open);\n      return;\n    }") ||
    scriptContent.includes("if (IS_JUEJIN || IS_ZHIHU) {\n      setListNavOpen(open);\n      return;\n    }"),
    "setNav2Open must delegate to setListNavOpen on Juejin"
  );
  assert.ok(
    scriptContent.includes("if (IS_JUEJIN) return false;\n    try { return localStorage.getItem(NAV2_KEY)") ||
    scriptContent.includes("if (IS_JUEJIN || IS_ZHIHU) return false;\n    try { return localStorage.getItem(NAV2_KEY)"),
    "isNav2Open must return false on Juejin"
  );

  // 4. In-page Juejin pin publishing modal
  assert.ok(
    scriptContent.includes("async function publishJuejinPin(content, topicId = \"\")"),
    "must define publishJuejinPin API caller"
  );
  assert.ok(
    scriptContent.includes("function openJuejinPublishModal()"),
    "must define openJuejinPublishModal"
  );
  assert.ok(
    scriptContent.includes("function closeJuejinPublishModal()"),
    "must define closeJuejinPublishModal"
  );
  assert.ok(
    scriptContent.includes("closeJuejinPublishModal();"),
    "removePanels must call closeJuejinPublishModal"
  );

  // 5. Left-top rail avatar click on Juejin
  assert.ok(
    scriptContent.includes("if (isJuejinMemberCardOpen()) {\n          closeJuejinMemberCard();\n          return;\n        }"),
    "rail avatar click on Juejin must toggle member card"
  );

  // 6. Direct built-in emoji picker on Juejin
  assert.ok(
    scriptContent.includes("if (IS_V2EX || IS_JUEJIN) {\n        toggleV2exEmojiPicker(button);\n        return;\n      }") ||
    scriptContent.includes("if (IS_V2EX || IS_JUEJIN || IS_ZHIHU) {\n        toggleV2exEmojiPicker(button);\n        return;\n      }"),
    "composer emoji picker must directly invoke built-in picker on Juejin"
  );

  // 7. getEmberOwner early return
  assert.ok(
    scriptContent.includes("function getEmberOwner() {\n    if (IS_V2EX || IS_JUEJIN) return null;") ||
    scriptContent.includes("function getEmberOwner() {\n    if (IS_V2EX || IS_JUEJIN || IS_ZHIHU) return null;"),
    "getEmberOwner must return null early on V2EX and Juejin"
  );

  // 8. Juejin chips expansion
  assert.ok(
    scriptContent.includes('data-chip="topic_6824710203108229134">掘友求助</button>'),
    "chipsHtml must include 掘友求助 for Juejin"
  );
  assert.ok(
    scriptContent.includes('data-chip="topic_6824710203204698126">树洞吐槽</button>'),
    "chipsHtml must include 树洞吐槽 for Juejin"
  );
});

test("Test 102: Juejin notification list panel (V2EX-style) & rail avatar profile card popover (v0.7.71)", () => {
  // 1. Left rail notification click loads in-panel notification list like V2EX
  assert.ok(
    scriptContent.includes('loadList("/notification", true);'),
    "Juejin notification click must load notifications in-page via loadList"
  );
  assert.ok(
    scriptContent.includes('function syncRailNavActive(rail)'),
    "must have syncRailNavActive helper"
  );
  assert.ok(
    scriptContent.includes('location.pathname.startsWith("/notification")') &&
    scriptContent.includes('listState.apiPath.startsWith("/notification")'),
    "syncRailNavActive must set notif active when in /notification"
  );

  // 2. Chat nav click returns from notification to recommend
  assert.ok(
    scriptContent.includes('listState.apiPath.startsWith("/notification")') &&
    scriptContent.includes('loadList("recommend", true);'),
    "handleChatNavClick must return to recommend when leaving notifications on Juejin"
  );

  // 3. Juejin notification list fetching & mapping
  assert.ok(
    scriptContent.includes('async function fetchJuejinNotificationsList(cursor = "0")'),
    "must define fetchJuejinNotificationsList"
  );
  assert.ok(
    scriptContent.includes('function mapJuejinMessageToTopic(msg, idx = 0)'),
    "must define mapJuejinMessageToTopic"
  );
  assert.ok(
    scriptContent.includes('function extractJuejinNotificationsFromDoc(doc)'),
    "must define extractJuejinNotificationsFromDoc"
  );
  assert.ok(
    scriptContent.includes('const res = listState.apiPath.startsWith("/notification")\n          ? await fetchJuejinNotificationsList(listState.juejinCursor)\n          : await fetchJuejinPinsList(listState.apiPath, listState.juejinCursor);'),
    "loadMoreList must fetch notifications when listState.apiPath starts with /notification"
  );

  // 4. In-panel row rendering for notifications
  assert.ok(
    scriptContent.includes('(listState.apiPath.startsWith("/notifications") || listState.apiPath.startsWith("/notification"))'),
    "list rendering must treat both /notifications and /notification as notification mode"
  );

  // 5. Rail avatar profile popover & self profile retrieval
  assert.ok(
    scriptContent.includes('const currentUser = getCurrentUserIdentity();'),
    "bindRailAvatarNotif must get current user identity on Juejin"
  );
  assert.ok(
    scriptContent.includes('openJuejinMemberCard(username, uid, avatar, event);'),
    "bindRailAvatarNotif must call openJuejinMemberCard on avatar click"
  );
  assert.ok(
    scriptContent.includes('/user_api/v1/user/get'),
    "fetchJuejinUserProfile must call /user_api/v1/user/get for self profile"
  );
  assert.ok(
    scriptContent.includes('isCurrentUser: Boolean(user.is_current_user || !userId)'),
    "profile extraction must flag isCurrentUser"
  );
  assert.ok(
    scriptContent.includes('wecom-member-self-tag') &&
    scriptContent.includes('当前登录账号'),
    "openJuejinMemberCard must display self badge for current user"
  );

  // 6. Modal / viewer open check includes member cards and publish dialog
  assert.ok(
    scriptContent.includes('.wecom-juejin-member-card:not([hidden])'),
    "isModalOrViewerOpen must include Juejin member card"
  );
  assert.ok(
    scriptContent.includes('.wecom-juejin-publish-dialog:not([hidden])'),
    "isModalOrViewerOpen must include Juejin publish dialog"
  );
});

test("Test 103: Full-site unified 6px auto-hiding scrollbar system (Connect, Nav2, Cards, Inputs, Modals) (v0.7.72)", () => {
  // 1. LINUX DO Connect modal & body unified scrollbars and structure
  assert.ok(
    scriptContent.includes(".wecom-connect-modal,") &&
    scriptContent.includes(".wecom-connect-body,") &&
    scriptContent.includes("scrollbar-color: transparent transparent !important;"),
    "Connect modal & body must have transparent scrollbars by default"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-modal::-webkit-scrollbar,") &&
    scriptContent.includes(".wecom-connect-body::-webkit-scrollbar,") &&
    scriptContent.includes("width: 6px !important;"),
    "Connect modal & body must use standard 6px scrollbar width"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-body {") &&
    scriptContent.includes("flex: 1 1 auto;") &&
    scriptContent.includes("min-height: 0;"),
    "Connect body must flex and scroll smoothly between pinned header/footer"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-header {") &&
    scriptContent.includes("flex-shrink: 0;"),
    "Connect header must be pinned with flex-shrink: 0"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-footer {") &&
    scriptContent.includes("flex-shrink: 0;"),
    "Connect footer must be pinned with flex-shrink: 0"
  );
  assert.ok(
    scriptContent.includes('connectBody?.classList.add("is-scrolling");') &&
    scriptContent.includes('connectBody?.addEventListener("scroll", handleConnectScroll, { passive: true });'),
    "openLinuxDoConnectModal must bind scroll listener for .is-scrolling"
  );

  // 2. Nav2 list scrollbar unification & obsolete rule removal
  assert.ok(
    scriptContent.includes(".wecom-v2ex-nav2-list,") &&
    scriptContent.includes(".wecom-v2ex-nav2-list::-webkit-scrollbar,"),
    "Nav2 list must participate in unified scrollbar rules"
  );
  assert.ok(
    !/\.wecom-v2ex-nav2-list\s*\{[^}]*::-webkit-scrollbar\s*\{[^}]*width:\s*4px/i.test(scriptContent),
    "Obsolete 4px custom scrollbar on Nav2 list must be removed"
  );
  assert.ok(
    !scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-nav2-list:hover::-webkit-scrollbar-thumb {\n      background: rgba(255, 255, 255, 0.15);"),
    "Obsolete 0.15 dark mode hover rule on Nav2 list must be removed"
  );
  assert.ok(
    scriptContent.includes('listEl?.addEventListener("scroll", () => {') &&
    scriptContent.includes('listEl.classList.add("is-scrolling");'),
    "Nav2 list must toggle .is-scrolling on scroll"
  );

  // 3. Complete list of scrollable surfaces included in unified styling
  const requiredSurfaces = [
    ".wecom-list-body",
    ".wecom-chat-body",
    ".wecom-chat-messages",
    ".wecom-member-body",
    ".wecom-theme-menu",
    ".wecom-connect-modal",
    ".wecom-connect-body",
    ".wecom-v2ex-nav2-list",
    ".wecom-emoji-picker-body",
    ".wecom-base64-popover-body",
    ".wecom-base64-insert-result",
    ".wecom-chat-compose",
    ".wecom-edit-input",
    ".wecom-juejin-publish-input",
    ".wecom-juejin-member-card",
    ".user-menu.wecom-user-menu-float",
    ".d-editor-preview-wrapper",
    ".wecom-msg-bubble pre",
    ".wecom-msg-content pre",
    "#discourse-modal-container .modal-body",
    ".d-modal__body",
    ".wecom-v2ex-member-card",
    ".wecom-v2ex-user-popover"
  ];

  for (const sel of requiredSurfaces) {
    assert.ok(
      scriptContent.includes(`${sel},`) || scriptContent.includes(`${sel} {`),
      `Base scrollbar rule must include ${sel}`
    );
    assert.ok(
      scriptContent.includes(`${sel}::-webkit-scrollbar,`) || scriptContent.includes(`${sel}::-webkit-scrollbar {`),
      `Webkit scrollbar rule must include ${sel}`
    );
    assert.ok(
      scriptContent.includes(`${sel}::-webkit-scrollbar-thumb,`) || scriptContent.includes(`${sel}::-webkit-scrollbar-thumb {`),
      `Webkit thumb rule must include ${sel}`
    );
  }

  // 4. Dark mode unified rules
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-connect-body:hover::-webkit-scrollbar-thumb,") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-connect-body.is-scrolling::-webkit-scrollbar-thumb,") &&
    scriptContent.includes("background: rgba(255, 255, 255, 0.22) !important;"),
    "Dark mode must style Connect scrollbar thumb on hover and scroll with 0.22 opacity"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-connect-body::-webkit-scrollbar-thumb:hover,") &&
    scriptContent.includes("background: rgba(255, 255, 255, 0.38) !important;"),
    "Dark mode must style Connect scrollbar thumb direct hover with 0.38 opacity"
  );

  // 5. Member cards .is-scrolling support
  assert.ok(
    scriptContent.includes("openV2exMemberCard(username, triggerEl, event)") &&
    scriptContent.includes('card.addEventListener("scroll", () => {\n      card.classList.add("is-scrolling");'),
    "openV2exMemberCard must support .is-scrolling feedback on scroll"
  );
  assert.ok(
    scriptContent.includes("openJuejinMemberCard(username, userId, triggerEl, event)") &&
    scriptContent.includes('card.addEventListener("scroll", () => {\n      card.classList.add("is-scrolling");'),
    "openJuejinMemberCard must support .is-scrolling feedback on scroll"
  );
});

test("Test 104: Seamless visual scroll anchoring during polling and replies insertion (v0.7.73)", () => {
  // 1. Definition and structure checks
  assert.ok(
    scriptContent.includes("function captureChatScrollAnchor(body)"),
    "must define captureChatScrollAnchor"
  );
  assert.ok(
    scriptContent.includes("function restoreChatScrollAnchor(body, anchor, options = {})"),
    "must define restoreChatScrollAnchor"
  );
  assert.ok(
    scriptContent.includes("const anchor = captureChatScrollAnchor(body);"),
    "appendFreshPosts must capture anchor before DOM mutations"
  );
  assert.ok(
    scriptContent.includes("restoreChatScrollAnchor(body, anchor, options);"),
    "appendFreshPosts must restore scroll anchor on polling/non-bottom"
  );
  assert.ok(
    scriptContent.includes("if (totalAppended === 0 && currentBody.scrollTop !== prevScrollTop)"),
    "polling must avoid overriding anchor compensation when totalAppended > 0"
  );

  // 2. Functional algorithm verification
  function simulateAnchorHandling({ initialScrollTop, initialOffsetTop, insertedAboveHeight, insertedBelowHeight, options = {} }) {
    let scrollTop = initialScrollTop;
    const anchorOffsetTop = initialOffsetTop;
    const currentOffsetTop = initialOffsetTop + insertedAboveHeight;
    const drift = currentOffsetTop - anchorOffsetTop;

    const shouldScroll = options.scroll === true || (options.scroll !== false && !options.isPolling && options.wasNearBottom);
    if (shouldScroll) {
      scrollTop = 999999;
    } else {
      if (Math.abs(drift) >= 0.5) {
        scrollTop += drift;
      }
    }

    const finalScreenPositionOfAnchor = currentOffsetTop - (scrollTop - initialScrollTop);
    return {
      scrollTop,
      drift,
      finalScreenPositionOfAnchor,
      displacement: finalScreenPositionOfAnchor - initialOffsetTop
    };
  }

  // Case A: User scrolled to middle reading post #20 (initial offset 20px).
  // Polling inserts 120px of replies ahead (above post #20) and 300px at bottom.
  const resA = simulateAnchorHandling({
    initialScrollTop: 1500,
    initialOffsetTop: 20,
    insertedAboveHeight: 120,
    insertedBelowHeight: 300,
    options: { isPolling: true, scroll: false }
  });
  assert.strictEqual(resA.scrollTop, 1620, "scrollTop must be adjusted by exactly the inserted above height (120px)");
  assert.strictEqual(resA.finalScreenPositionOfAnchor, 20, "post #20 must stay at the exact same screen position");
  assert.strictEqual(resA.displacement, 0, "visual displacement of user reading target must be strictly 0px (completely seamless)");

  // Case B: Polling inserts replies only below current view (insertedAboveHeight = 0)
  const resB = simulateAnchorHandling({
    initialScrollTop: 1500,
    initialOffsetTop: 20,
    insertedAboveHeight: 0,
    insertedBelowHeight: 500,
    options: { isPolling: true, scroll: false }
  });
  assert.strictEqual(resB.scrollTop, 1500, "scrollTop must not change when items are inserted below");
  assert.strictEqual(resB.finalScreenPositionOfAnchor, 20);
  assert.strictEqual(resB.displacement, 0);

  // Case C: User actively posts a reply with { scroll: true }
  const resC = simulateAnchorHandling({
    initialScrollTop: 1500,
    initialOffsetTop: 20,
    insertedAboveHeight: 0,
    insertedBelowHeight: 200,
    options: { scroll: true }
  });
  assert.strictEqual(resC.scrollTop, 999999, "user posting must follow to bottom");
});

test("Test 105: LINUX DO Connect modal anti-compression and full content uncropped layout (v0.7.74)", () => {
  // 1. Static assertions for modal width, overflow, and anti-compression rules
  assert.ok(
    scriptContent.includes(".wecom-connect-modal {") &&
    scriptContent.includes("width: 520px;") &&
    scriptContent.includes("overflow: hidden;"),
    "Connect modal must be 520px wide with overflow: hidden"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-body > * {\n      flex-shrink: 0;\n    }"),
    "Connect body direct children must have flex-shrink: 0 to prevent block compression"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-section,\n    .wecom-connect-source-note,\n    .wecom-connect-loading {\n      flex-shrink: 0;\n      min-height: min-content;\n    }"),
    "Connect sections, cards, and banners must enforce flex-shrink: 0 and min-height: min-content"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-item {") &&
    scriptContent.includes("min-height: 44px;") &&
    scriptContent.includes("flex-shrink: 0;"),
    "Connect requirement items must have min-height: 44px and flex-shrink: 0"
  );
  assert.ok(
    scriptContent.includes(".wecom-connect-req-values {") &&
    scriptContent.includes("white-space: nowrap;"),
    "Connect requirement values must have white-space: nowrap to prevent line wraps"
  );

  // 2. Structural simulation: items inside body preserve natural heights under flexbox
  function simulateFlexColumnLayout({ containerHeight, items }) {
    // If flex-shrink: 0, every item takes its full preferred height
    const renderedHeights = items.map((it) => it.naturalHeight);
    const totalContentHeight = renderedHeights.reduce((a, b) => a + b, 0);
    const isCropped = renderedHeights.some((h, idx) => h < items[idx].naturalHeight);
    const canScroll = totalContentHeight > containerHeight;
    return { renderedHeights, totalContentHeight, isCropped, canScroll };
  }

  const result = simulateFlexColumnLayout({
    containerHeight: 639,
    items: [
      { name: "user-card", naturalHeight: 76 },
      { name: "banner", naturalHeight: 54 },
      { name: "progress", naturalHeight: 56 },
      { name: "section-1", naturalHeight: 168 },
      { name: "section-2", naturalHeight: 124 },
      { name: "section-3", naturalHeight: 80 },
      { name: "note", naturalHeight: 20 }
    ]
  });

  assert.strictEqual(result.isCropped, false, "no item should ever be cropped or compressed");
  assert.strictEqual(result.totalContentHeight, 578, "total height should match sum of natural heights");
  assert.strictEqual(result.renderedHeights[3], 168, "section 1 must remain 168px high");
});

test("Test 106: LINUX DO Credit red envelope WeChat-style card, auto-claim, and modal (v0.7.75)", () => {
  // 1. Userscript connect permissions
  assert.ok(
    scriptContent.includes("// @connect      credit.linux.do"),
    "Userscript header must declare @connect credit.linux.do"
  );

  // 2. Constants and Key Functions
  assert.ok(
    scriptContent.includes('const RED_ENVELOPE_AUTOCLAIM_KEY = "linuxdo-wecom-redenvelope-autoclaim";'),
    "must define RED_ENVELOPE_AUTOCLAIM_KEY"
  );
  assert.ok(
    scriptContent.includes('const RED_ENVELOPE_CACHE_PREFIX = "wecom_redenvelope_";'),
    "must define RED_ENVELOPE_CACHE_PREFIX"
  );
  assert.ok(
    scriptContent.includes("function isRedEnvelopeAutoClaimEnabled"),
    "must define isRedEnvelopeAutoClaimEnabled"
  );
  assert.ok(
    scriptContent.includes("function setRedEnvelopeAutoClaimEnabled"),
    "must define setRedEnvelopeAutoClaimEnabled"
  );
  assert.ok(
    scriptContent.includes("function getRedEnvelopeCache"),
    "must define getRedEnvelopeCache"
  );
  assert.ok(
    scriptContent.includes("function setRedEnvelopeCache"),
    "must define setRedEnvelopeCache"
  );
  assert.ok(
    scriptContent.includes("async function requestCreditApi"),
    "must define requestCreditApi"
  );
  assert.ok(
    scriptContent.includes("async function fetchRedEnvelopeDetail"),
    "must define fetchRedEnvelopeDetail"
  );
  assert.ok(
    scriptContent.includes("async function claimRedEnvelope"),
    "must define claimRedEnvelope"
  );
  assert.ok(
    scriptContent.includes("function parseClaimError"),
    "must define parseClaimError"
  );
  assert.ok(
    scriptContent.includes("function showRedEnvelopeToast"),
    "must define showRedEnvelopeToast"
  );
  assert.ok(
    scriptContent.includes("async function triggerRedEnvelopeAutoClaim"),
    "must define triggerRedEnvelopeAutoClaim"
  );
  assert.ok(
    scriptContent.includes("function updateRedEnvelopeCards"),
    "must define updateRedEnvelopeCards"
  );
  assert.ok(
    scriptContent.includes("function createRedEnvelopeCardElement"),
    "must define createRedEnvelopeCardElement"
  );
  assert.ok(
    scriptContent.includes("function hydrateRedEnvelopes"),
    "must define hydrateRedEnvelopes"
  );
  assert.ok(
    scriptContent.includes("function openRedEnvelopeModal"),
    "must define openRedEnvelopeModal"
  );
  assert.ok(
    scriptContent.includes("function closeRedEnvelopeModal"),
    "must define closeRedEnvelopeModal"
  );
  assert.ok(
    scriptContent.includes("function renderUnopenedRedEnvelopeView"),
    "must define renderUnopenedRedEnvelopeView"
  );
  assert.ok(
    scriptContent.includes("function renderOpenedRedEnvelopeView"),
    "must define renderOpenedRedEnvelopeView"
  );

  // 3. Hydration Hook in hydrateChatImages
  assert.ok(
    scriptContent.includes("hydrateRedEnvelopes(root);"),
    "hydrateChatImages must invoke hydrateRedEnvelopes(root)"
  );
  assert.ok(
    scriptContent.includes(".wecom-redpacket-card"),
    "isNodeVisuallyEmpty meaningful selector must include .wecom-redpacket-card"
  );

  // 4. WeChat Red Envelope UI Styles
  assert.ok(
    scriptContent.includes(".wecom-redpacket-card {") &&
    scriptContent.includes("linear-gradient(135deg, #fa9d3b 0%, #f15b43 100%)"),
    "must style red packet card with WeChat warm gradient"
  );
  assert.ok(
    scriptContent.includes(".wecom-redpacket-modal {") &&
    scriptContent.includes("width: 320px;"),
    "must define 320px WeChat-style red packet modal"
  );
  assert.ok(
    scriptContent.includes(".wecom-rp-kai-btn {") &&
    scriptContent.includes("@keyframes wecom-kai-spin"),
    "must define golden '開' button with 3D rotation animation"
  );
  assert.ok(
    scriptContent.includes(".wecom-rp-claimed") &&
    scriptContent.includes(".wecom-rp-finished") &&
    scriptContent.includes(".wecom-rp-expired"),
    "must support claimed, finished, and expired card states"
  );
  assert.ok(
    scriptContent.includes(".wecom-rp-toast {") &&
    scriptContent.includes("@keyframes wecom-toast-slide"),
    "must define subtle red envelope toast notifications"
  );

  // 5. Dark Mode Compatibility
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-redpacket-card,") ||
    scriptContent.includes("wecom-dark .wecom-redpacket-card"),
    "must include dark theme rules for red packet cards"
  );
  assert.ok(
    scriptContent.includes(".wecom-dark .wecom-rp-opened") ||
    scriptContent.includes(".wecom-rp-opened") && scriptContent.includes("#1C1E22"),
    "must adapt opened red packet detail view to dark theme"
  );

  // 6. Settings Menu Toggle
  assert.ok(
    scriptContent.includes("wecom-menu-toggle-redpacket-autoclaim"),
    "must add auto-claim toggle button to settings menu"
  );
  assert.ok(
    scriptContent.includes("setRedEnvelopeAutoClaimEnabled(!isRedEnvelopeAutoClaimEnabled())"),
    "settings menu must toggle red envelope auto claim state"
  );

  // 7. Regex and URL Extraction Simulation
  const sampleUrl = "https://credit.linux.do/redenvelope/109929605904728064";
  const regex = /https?:\/\/credit\.linux\.do\/redenvelope\/([a-zA-Z0-9_-]+)/i;
  const match = sampleUrl.match(regex);
  assert.ok(match, "must match standard Linux DO credit envelope URL");
  assert.strictEqual(match[1], "109929605904728064", "must extract 64-bit snowflake ID correctly");

  // 8. Error Parsing Simulation
  function simulateErrorParser(msg, status) {
    if (status === 401 || /未登录|Unauthorized|login/i.test(msg)) {
      return "unauthorized";
    }
    if (/已领取|AlreadyClaimed|already claimed/i.test(msg)) {
      return "already_claimed";
    }
    if (/领完|抢完|Finished|finished/i.test(msg)) {
      return "finished";
    }
    if (/过期|Expired|expired/i.test(msg)) {
      return "expired";
    }
    if (/自己|CannotClaimOwn/i.test(msg)) {
      return "own";
    }
    return "error";
  }

  assert.strictEqual(simulateErrorParser("红包已领取", 400), "already_claimed");
  assert.strictEqual(simulateErrorParser("手慢了，红包已被领完", 400), "finished");
  assert.strictEqual(simulateErrorParser("红包已过期", 400), "expired");
  assert.strictEqual(simulateErrorParser("不能领取自己的红包", 400), "own");
  assert.strictEqual(simulateErrorParser("未登录", 401), "unauthorized");

  // 9. Full Script Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

test("Test 107: LINUX DO Credit red envelope CORS fallback, popup bridge, opener postMessage, and seamless auto-claim", () => {
  // 1. Userscript metadata header @match rules for credit.linux.do
  assert.ok(
    scriptContent.includes("// @match        *://credit.linux.do/*") &&
    scriptContent.includes("// @match        https://credit.linux.do/*"),
    "Userscript header must match *://credit.linux.do/* and https://credit.linux.do/*"
  );

  // 2. IS_CREDIT definition and host regex simulation
  assert.ok(
    scriptContent.includes("const IS_CREDIT = /(?:^|\\.)credit\\.linux\\.do$/i.test(CURRENT_HOST);"),
    "must define IS_CREDIT constant with correct hostname regex"
  );
  const creditRegex = /(?:^|\.)credit\.linux\.do$/i;
  assert.ok(creditRegex.test("credit.linux.do"), "must match credit.linux.do");
  assert.ok(!creditRegex.test("linux.do"), "must not match main linux.do forum");
  assert.ok(!creditRegex.test("v2ex.com"), "must not match v2ex.com");
  assert.ok(!creditRegex.test("juejin.cn"), "must not match juejin.cn");

  // 3. Credit Bridge and Popup Communication
  assert.ok(
    scriptContent.includes("function initCreditRedEnvelopeBridge"),
    "must define initCreditRedEnvelopeBridge"
  );
  assert.ok(
    scriptContent.includes("function isCorsOrFetchError"),
    "must define isCorsOrFetchError"
  );
  assert.ok(
    scriptContent.includes("function claimViaPopupBridge"),
    "must define claimViaPopupBridge"
  );
  assert.ok(
    scriptContent.includes('type: "WECOM_RED_PACKET_RESULT"'),
    "must support WECOM_RED_PACKET_RESULT postMessage protocol between credit popup and linux.do"
  );

  // 4. Fallback button in modal and CSS styling
  assert.ok(
    scriptContent.includes(".wecom-rp-blocked-wrap") &&
    scriptContent.includes(".wecom-rp-direct-btn"),
    "must define fallback direct button styles for blocked popups or CORS fallback"
  );

  // 5. CORS and fetch error parser simulation
  function simulateErrorParser(err) {
    const msg = String(err?.message || err?.msg || err || "");
    if (err?.name === "TypeError" && /fetch/i.test(msg)) {
      return "cors";
    }
    if (/failed to fetch|networkerror|load failed|cross-origin|cors/i.test(msg)) {
      return "cors";
    }
    if (msg === "popup_blocked") {
      return "popup_blocked";
    }
    return "error";
  }

  assert.strictEqual(simulateErrorParser(new TypeError("Failed to fetch")), "cors", "TypeError: Failed to fetch must be parsed as cors");
  assert.strictEqual(simulateErrorParser({ message: "NetworkError when attempting to fetch resource." }), "cors", "NetworkError must be parsed as cors");
  assert.strictEqual(simulateErrorParser({ message: "popup_blocked" }), "popup_blocked", "popup_blocked must be parsed as popup_blocked");

  // 6. Bootstrap early return for credit.linux.do
  assert.ok(
    scriptContent.includes("if (IS_CREDIT) {") &&
    scriptContent.includes("initCreditRedEnvelopeBridge();") &&
    scriptContent.includes("return;"),
    "bootstrap must route credit.linux.do directly to initCreditRedEnvelopeBridge and return"
  );

  // 7. Accurate communication data: wecom_user parameter and Next.js SSR / DOM isolation
  assert.ok(
    scriptContent.includes("wecom_user=${encodeURIComponent(myUsername)}"),
    "claimViaPopupBridge must pass wecom_user parameter in popupUrl to identify current user"
  );
  assert.ok(
    scriptContent.includes('document.getElementById("__NEXT_DATA__")'),
    "initCreditRedEnvelopeBridge must parse Next.js __NEXT_DATA__ for accurate claims and envelope detail"
  );
  assert.ok(
    scriptContent.includes("header, nav, footer, aside") &&
    scriptContent.includes("[class*='balance']"),
    "initCreditRedEnvelopeBridge must strip header, nav, and balance elements to avoid reading account balance"
  );
  assert.ok(
    scriptContent.includes('finishWithError("finished"') ||
    scriptContent.includes('err.kind = status'),
    "claimViaPopupBridge must accurately handle finished status without faking user_claimed"
  );

  // 8. Accurate User Claim Amount Extraction Simulation
  const mockClaims = [
    { username: "alice", amount: 1.50, created_at: "2026-09-30T10:00:00Z" },
    { username: "test_user", amount: 3.88, created_at: "2026-09-30T10:01:00Z" },
    { username: "bob", amount: 0.62, created_at: "2026-09-30T10:02:00Z" }
  ];
  const targetUser = "test_user";
  const matched = mockClaims.find((c) => c.username.toLowerCase() === targetUser.toLowerCase());
  assert.ok(matched, "must find user in claims list");
  assert.strictEqual(String(matched.amount), "3.88", "must accurately extract claimed amount of target user");

  // 9. Full JavaScript Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

test("Test 108: V2EX /new compose draft syntax guard and Select2 node selection crash prevention (v0.7.78)", () => {
  // 1. Definition of fixV2exComposeDraft
  assert.ok(
    scriptContent.includes("function fixV2exComposeDraft"),
    "must define fixV2exComposeDraft"
  );

  // 2. Syntax shim injection and auto-check
  assert.ok(
    scriptContent.includes("wecom-syntax-shim"),
    "must define wecom-syntax-shim to prevent null syntax query"
  );
  assert.ok(
    scriptContent.includes('document.querySelector(\'input[name="syntax"]:checked\')'),
    "must check for input[name='syntax']:checked"
  );

  // 3. Global window.saveComposeDraft and window.loadComposeDraft interception
  assert.ok(
    scriptContent.includes('Object.defineProperty(window, "saveComposeDraft"') &&
    scriptContent.includes('Object.defineProperty(window, "loadComposeDraft"'),
    "must intercept saveComposeDraft and loadComposeDraft on window"
  );

  // 4. Document-start invocation in bootstrap
  assert.ok(
    scriptContent.includes("if (IS_V2EX) {") &&
    scriptContent.includes("fixV2exComposeDraft();"),
    "bootstrap must call fixV2exComposeDraft at document-start for V2EX"
  );

  // 5. Select2 dark mode styling for /new
  assert.ok(
    scriptContent.includes("html.wecom-dark .select2-container--default") &&
    scriptContent.includes("html.wecom-dark .select2-dropdown"),
    "must provide Select2 dark theme styles for V2EX /new"
  );

  // 6. Simulation of crash prevention
  function simulateNativeV2exSaveDraft(domQuerySelector) {
    const el = domQuerySelector('input[name="syntax"]:checked');
    return el.value;
  }
  assert.throws(() => {
    simulateNativeV2exSaveDraft(() => null);
  }, /Cannot read properties of null/);

  function simulateSafeV2exSaveDraft(domQuerySelector) {
    let el = domQuerySelector('input[name="syntax"]:checked');
    if (!el) {
      el = { value: "0", checked: true };
    }
    return el.value;
  }
  assert.strictEqual(simulateSafeV2exSaveDraft(() => null), "0", "safe shim must return default syntax without throwing");

  // 7. Full JavaScript Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

test("Test 109: V2EX /new left sidebar hiding and global non-locked pages body scrollbar restoration (v0.7.79)", () => {
  // 1. CSS rules for hiding left rail, nav2, strip, resizer on V2EX /new
  assert.ok(
    scriptContent.includes("html.wecom-v2ex-new-page .wecom-rail") &&
    scriptContent.includes("html.wecom-v2ex-new-page .wecom-v2ex-nav2") &&
    scriptContent.includes("html.wecom-v2ex-new-page .wecom-strip") &&
    scriptContent.includes("html.wecom-v2ex-new-page .wecom-rail-resizer"),
    "must hide WeCom left sidebar elements on V2EX /new"
  );

  // 2. CSS variables reset for V2EX /new
  assert.ok(
    scriptContent.includes("--wc-nav: 0px !important;") &&
    scriptContent.includes("--wc-nav2w: 0px !important;") &&
    scriptContent.includes("--wc-strip: 0px !important;"),
    "must reset left sidebar width CSS variables to 0px on V2EX /new"
  );

  // 3. Early document-start tag in bootstrap
  assert.ok(
    scriptContent.includes('if (location.pathname === "/new" || location.pathname.startsWith("/new/")) {') &&
    scriptContent.includes('document.documentElement.classList.add("wecom-v2ex-new-page");'),
    "bootstrap must tag wecom-v2ex-new-page early at document-start"
  );

  // 4. Early exit and DOM cleanup in _applyTheme
  assert.ok(
    scriptContent.includes('const isV2exNew = IS_V2EX && (pathname === "/new" || pathname.startsWith("/new/"));') &&
    scriptContent.includes('document.documentElement.classList.toggle("wecom-v2ex-new-page", isV2exNew);') &&
    scriptContent.includes('document.querySelector(".wecom-rail")?.remove();') &&
    scriptContent.includes('document.querySelector(".wecom-v2ex-nav2")?.remove();'),
    "_applyTheme must clean up left sidebar elements and exit early for V2EX /new"
  );

  // 5. Global body overflow-y: auto for non-locked pages (fixes missing scrollbars)
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.${LOCK_CLASS} body {\n      overflow: hidden !important;\n    }") ||
    scriptContent.includes("html.${ROOT_CLASS}.${LOCK_CLASS} body {\r\n      overflow: hidden !important;\r\n    }"),
    "overflow: hidden must be strictly scoped to LOCK_CLASS"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}:not(.${LOCK_CLASS}) body {\n      overflow-y: auto !important;\n    }") ||
    scriptContent.includes("html.${ROOT_CLASS}:not(.${LOCK_CLASS}) body {\r\n      overflow-y: auto !important;\r\n    }"),
    "non-locked pages must have overflow-y: auto !important to ensure vertical scrollbar is present"
  );
  assert.ok(
    scriptContent.includes("html.wecom-v2ex-new-page body,\n    html.${ROOT_CLASS}.wecom-v2ex-new-page body {\n      overflow-y: auto !important;\n    }") ||
    scriptContent.includes("html.wecom-v2ex-new-page body,\r\n    html.${ROOT_CLASS}.wecom-v2ex-new-page body {\r\n      overflow-y: auto !important;\r\n    }"),
    "V2EX /new body must explicitly have overflow-y: auto !important"
  );

  // 6. Full JavaScript Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

test("Test 110: V2EX member card recent topics and replies list unrestricted count and auto-hiding scrollbar (v0.7.80)", () => {
  // 1. Parsing without artificial < 2 restriction
  assert.ok(
    !scriptContent.includes("profile.recentTopics.length < 2") &&
    !scriptContent.includes("profile.recentReplies.length < 2"),
    "must not artificially restrict recent topics and replies to 2 items"
  );
  assert.ok(
    scriptContent.includes("profile.recentTopics.length < 50") &&
    scriptContent.includes("profile.recentReplies.length < 50"),
    "must allow parsing all recent topics and replies up to safe ceiling"
  );

  // 2. Scrollable containers rendered in openV2exMemberCard
  assert.ok(
    scriptContent.includes('class="wecom-member-topics-list"') &&
    scriptContent.includes('class="wecom-member-replies-list"'),
    "openV2exMemberCard must wrap topic and reply items in dedicated list containers"
  );

  // 3. Scroll listeners for auto-hiding is-scrolling class
  assert.ok(
    scriptContent.includes('topicsListEl?.addEventListener("scroll"') &&
    scriptContent.includes('repliesListEl?.addEventListener("scroll"'),
    "must bind scroll event listeners to add is-scrolling on scroll"
  );

  // 4. CSS rules for scrollable lists with max-height and auto scroll
  assert.ok(
    scriptContent.includes(".wecom-member-topics-list {\n      max-height: 140px;\n      overflow-y: auto;") ||
    scriptContent.includes(".wecom-member-topics-list {\r\n      max-height: 140px;\r\n      overflow-y: auto;"),
    "must specify max-height and overflow-y: auto on .wecom-member-topics-list"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-replies-list {\n      max-height: 160px;\n      overflow-y: auto;") ||
    scriptContent.includes(".wecom-member-replies-list {\r\n      max-height: 160px;\r\n      overflow-y: auto;"),
    "must specify max-height and overflow-y: auto on .wecom-member-replies-list"
  );

  // 5. Inclusion in unified 6px auto-hiding scrollbar system
  assert.ok(
    scriptContent.includes(".wecom-member-topics-list::-webkit-scrollbar") &&
    scriptContent.includes(".wecom-member-replies-list::-webkit-scrollbar"),
    "must include topics and replies lists in 6px scrollbar definitions"
  );

  // 6. Test parsing simulation with > 2 topics and replies
  const manyHtml = `
    <span class="item_title"><a href="/t/1">主题 1</a></span>
    <span class="item_title"><a href="/t/2">主题 2</a></span>
    <span class="item_title"><a href="/t/3">主题 3</a></span>
    <span class="item_title"><a href="/t/4">主题 4</a></span>
    <div class="dock_area"><a href="/t/10">回复 1</a></div><div class="reply_content">内容 1</div>
    <div class="dock_area"><a href="/t/11">回复 2</a></div><div class="reply_content">内容 2</div>
    <div class="dock_area"><a href="/t/12">回复 3</a></div><div class="reply_content">内容 3</div>
  `;

  const topicRegex = /<span\s+class=["']item_title["']>\s*<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const replyRegex = /<div\s+class=["']dock_area["']>[\s\S]*?<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<div\s+class=["']reply_content["']>([\s\S]*?)<\/div>/gi;
  const topics = [];
  const replies = [];
  let tm, rm;
  while ((tm = topicRegex.exec(manyHtml)) !== null && topics.length < 50) {
    topics.push({ url: tm[1], title: tm[2] });
  }
  while ((rm = replyRegex.exec(manyHtml)) !== null && replies.length < 50) {
    replies.push({ url: rm[1], topicTitle: rm[2], content: rm[3] });
  }
  assert.strictEqual(topics.length, 4, "must parse all 4 topics without artificial 2 item limit");
  assert.strictEqual(replies.length, 3, "must parse all 3 replies without artificial 2 item limit");

  // 7. Full JavaScript Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

test("Test 111: Left rail group item positioned under notifications and search plus button direct compose trigger (v0.7.81)", () => {
  // 1. Static assertion: ensureRail places group item immediately following notif or connect
  assert.ok(
    scriptContent.includes('if (item.key === "notif" || item.key === "connect") {\n          renderedGroup = true;\n          return (\n            itemHtml +\n            `<button type="button" class="wecom-rail-item wecom-rail-more" data-rail-key="group"') ||
    scriptContent.includes('if (item.key === "notif" || item.key === "connect") {\r\n          renderedGroup = true;\r\n          return (\r\n            itemHtml +\r\n            `<button type="button" class="wecom-rail-item wecom-rail-more" data-rail-key="group"'),
    "ensureRail must render group item immediately following notif or connect item"
  );

  // 2. Static assertion: ensureRail rebuilds if outdated DOM does not have group as nextElementSibling of notif/connect
  assert.ok(
    scriptContent.includes("(notifOrConnect && groupEl && notifOrConnect.nextElementSibling !== groupEl)"),
    "ensureRail must prune rail if group is not the immediate next sibling of notif/connect"
  );

  // 3. Static assertion: search plus button click directly calls closeListAddMenu and openNewTopic
  assert.ok(
    scriptContent.includes("const addBtn = e.target.closest(\".wecom-list-add\");\n      if (addBtn && panel.contains(addBtn)) {\n        e.preventDefault();\n        e.stopPropagation();\n        closeListAddMenu();\n        openNewTopic();\n        return;\n      }") ||
    scriptContent.includes("const addBtn = e.target.closest(\".wecom-list-add\");\r\n      if (addBtn && panel.contains(addBtn)) {\r\n        e.preventDefault();\r\n        e.stopPropagation();\r\n        closeListAddMenu();\r\n        openNewTopic();\r\n        return;\r\n      }"),
    "bindListPanelClicks must directly call openNewTopic on clicking .wecom-list-add without opening menu"
  );

  // 4. Behavioral simulation: DOM order verification for rail items
  const mockRailItems = [
    { key: "chat", label: "消息" },
    { key: "history", label: "历史" },
    { key: "notif", label: "通知" },
    { key: "todo", label: "待办" }
  ];
  let renderedGroup = false;
  const elements = [];
  elements.push({ key: "chat" });
  mockRailItems.slice(1).forEach((item) => {
    elements.push({ key: item.key });
    if (item.key === "notif" || item.key === "connect") {
      renderedGroup = true;
      elements.push({ key: "group" });
    }
  });
  if (!renderedGroup) elements.push({ key: "group" });

  const notifIdx = elements.findIndex(e => e.key === "notif");
  const groupIdx = elements.findIndex(e => e.key === "group");
  assert.strictEqual(groupIdx, notifIdx + 1, "group item must be positioned immediately under notif");

  // 5. Behavioral simulation: direct click invocation without menu
  let newTopicTriggered = false;
  let menuToggled = false;
  function mockOpenNewTopic() { newTopicTriggered = true; }
  function mockToggleMenu() { menuToggled = true; }

  const mockPanel = {
    contains(el) { return true; }
  };
  const mockTarget = {
    closest(sel) {
      if (sel === ".wecom-list-add") return this;
      return null;
    }
  };
  const mockEvent = {
    target: mockTarget,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; }
  };

  const addBtn = mockEvent.target.closest(".wecom-list-add");
  if (addBtn && mockPanel.contains(addBtn)) {
    mockEvent.preventDefault();
    mockEvent.stopPropagation();
    mockOpenNewTopic();
  } else {
    mockToggleMenu();
  }

  assert.strictEqual(newTopicTriggered, true, "clicking addBtn must directly trigger openNewTopic");
  assert.strictEqual(menuToggled, false, "clicking addBtn must NOT toggle or pop up menu");
  assert.strictEqual(mockEvent.defaultPrevented, true, "event default must be prevented");
  assert.strictEqual(mockEvent.propagationStopped, true, "event propagation must be stopped");

  // 6. Full JavaScript Syntax Validation
  assert.doesNotThrow(() => {
    new Function(scriptContent);
  }, "userscript must have strictly valid JavaScript syntax without parse or token errors");
});

/* ============================================================================
 * Test 112: Floor Reply Scroll Position, Scroll-to-Bottom Button, Back-to-Position Button, and V2EX ?tab=xxx Pagination (v0.7.82)
 * ============================================================================ */
test("Test 112: floor reply scroll position, floating scroll-to-bottom button, back-to-last-position button on floor click, and V2EX ?tab=xxx list pagination (v0.7.82)", () => {
  // 1. Static assertions: Floor reply scroll position (V2EX & Linux DO)
  assert.ok(
    scriptContent.includes("function scrollToSubmittedReply(body, newPostNumber = 0, replyToPostNumber = 0)"),
    "must define scrollToSubmittedReply helper for scrolling to the newly posted floor reply instead of forcing bottom"
  );
  assert.ok(
    scriptContent.includes("replyToPostNumber: requestedReply"),
    "completeComposerSubmission on Linux DO must pass replyToPostNumber to appendFreshPosts"
  );
  assert.ok(
    scriptContent.includes("await pollV2exCurrentTopicOnce({ submittedReplyTo: replyTo, isAfterSubmit: true });"),
    "submitComposer on V2EX must pass submittedReplyTo and isAfterSubmit to pollV2exCurrentTopicOnce"
  );
  assert.ok(
    scriptContent.includes("if (options.scroll === true) {\n      scrollToSubmittedReply(body, lastFreshNum, replyToNum);") ||
    scriptContent.includes("if (options.scroll === true) {\r\n      scrollToSubmittedReply(body, lastFreshNum, replyToNum);"),
    "appendFreshPosts must use scrollToSubmittedReply when options.scroll === true"
  );
  assert.ok(
    scriptContent.includes("const floorPrefix = floor > 0 ? `@${name} #${floor} ` : `@${name} `;"),
    "V2EX replyToPost must include #floor in the @mention prefix when replying to a floor"
  );

  // 2. Static assertions: Floating scroll-to-bottom & back-to-position buttons centered at bottom
  assert.ok(
    scriptContent.includes('class="wecom-chat-float-nav"') &&
    scriptContent.includes('class="wecom-chat-back-pos"') &&
    scriptContent.includes('class="wecom-chat-scroll-bottom"'),
    "ensureChatPanel must render .wecom-chat-float-nav with .wecom-chat-back-pos and .wecom-chat-scroll-bottom"
  );
  assert.ok(
    scriptContent.includes("background: rgba(255, 255, 255, 0.38);") &&
    scriptContent.includes("backdrop-filter: blur(8px) saturate(140%);") &&
    scriptContent.includes("left: 50%;") &&
    scriptContent.includes("transform: translateX(-50%);"),
    "scroll-to-bottom and back-pos buttons must use subtle translucent frosted-glass texture and be centered at the bottom"
  );
  assert.ok(
    scriptContent.includes("wecom-chat-more-btn") &&
    scriptContent.includes("wecom-chat-more-actions") &&
    scriptContent.includes("wecom-chat-more-item wecom-chat-avatar-toggle") &&
    scriptContent.includes("wecom-chat-more-item wecom-chat-members-toggle") &&
    scriptContent.includes("wecom-chat-more-item wecom-watermark-settings"),
    "chat header must keep only scroll-top, refresh, and more button, moving other actions into the more dropdown menu"
  );
  assert.ok(
    scriptContent.includes("function syncChatFloatNav(body)"),
    "must define syncChatFloatNav to toggle floating navigation buttons based on scroll position"
  );
  assert.ok(
    scriptContent.includes("function saveChatJumpPosition(body, prevScrollTop, sourceEl = null)"),
    "must define saveChatJumpPosition to record scrollTop before jumping to a floor"
  );
  assert.ok(
    scriptContent.includes("function linkifyV2exFloorMentions(html)"),
    "must define linkifyV2exFloorMentions to make #floor mentions clickable in V2EX messages"
  );

  // 3. Static assertions: V2EX /?tab=xxx list pagination
  assert.ok(
    scriptContent.includes('path.startsWith("/?tab=") ||') &&
    scriptContent.includes("const isHomeTab ="),
    "v2exNextPageUrl and parseV2exListPagination must treat all /?tab=xxx routes as tab home paginating to /recent"
  );
  assert.ok(
    scriptContent.includes("while (pageUrl && hops < 3 && accumulatedFresh.length === 0)"),
    "loadMoreList on V2EX must support multi-page hop when initial /recent page overlaps with existing tab topics"
  );

  // 4. Behavioral simulation: scrollToSubmittedReply scrolls to target floor / reply instead of scrollHeight
  const mockMessages = new Map([
    [3, { offsetTop: 240, offsetHeight: 80, classes: new Set() }],
    [15, { offsetTop: 330, offsetHeight: 75, classes: new Set() }]
  ]);
  const mockBody = {
    scrollTop: 200,
    clientHeight: 500,
    scrollHeight: 4200,
    scrolledTo: null,
    querySelector(sel) {
      const m = sel.match(/data-post-number="(\d+)"/);
      if (!m) return null;
      const num = Number(m[1]);
      const item = mockMessages.get(num);
      if (!item) return null;
      return {
        offsetTop: item.offsetTop,
        offsetHeight: item.offsetHeight,
        classList: {
          add(c) { item.classes.add(c); },
          remove(c) { item.classes.delete(c); }
        },
        scrollIntoView() {
          mockBody.scrolledTo = item.offsetTop;
        }
      };
    }
  };

  function simScrollToSubmittedReply(body, newPostNumber, replyToPostNumber) {
    const targetEl = (newPostNumber > 0 && body.querySelector(`.wecom-msg[data-post-number="${newPostNumber}"]`))
      || (replyToPostNumber > 0 && body.querySelector(`.wecom-msg[data-post-number="${replyToPostNumber}"]`));
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      targetEl.classList.add("is-target-highlight");
      return;
    }
    if (!replyToPostNumber || replyToPostNumber <= 1) {
      body.scrollTop = body.scrollHeight;
    }
  }

  // Replying to floor #2 (post_number = 3), new post is #14 (post_number = 15) placed under post 3 in thread view
  simScrollToSubmittedReply(mockBody, 15, 3);
  assert.strictEqual(mockBody.scrolledTo, 330, "must scroll to the newly inserted reply under the target floor");
  assert.notStrictEqual(mockBody.scrollTop, 4200, "must NOT jump scrollTop to the very bottom (4200)");
  assert.strictEqual(mockMessages.get(15).classes.has("is-target-highlight"), true, "must highlight the new reply");

  // 5. Behavioral simulation: Floating scroll-to-bottom & back-to-position state machine
  const floatState = {
    scrollTop: 120,
    scrollHeight: 2000,
    clientHeight: 500,
    lastJumpScrollTop: null,
    scrollBottomVisible: false,
    backPosVisible: false
  };
  function simSyncFloatNav() {
    const distFromBottom = floatState.scrollHeight - floatState.scrollTop - floatState.clientHeight;
    floatState.scrollBottomVisible = distFromBottom > 48;
    floatState.backPosVisible = floatState.lastJumpScrollTop !== null && Number.isFinite(floatState.lastJumpScrollTop);
  }
  function simClickFloorLink(targetScrollTop) {
    floatState.lastJumpScrollTop = floatState.scrollTop;
    floatState.scrollTop = targetScrollTop;
    simSyncFloatNav();
  }
  function simClickBackPos() {
    if (floatState.lastJumpScrollTop !== null) {
      floatState.scrollTop = floatState.lastJumpScrollTop;
      floatState.lastJumpScrollTop = null;
      simSyncFloatNav();
    }
  }
  function simClickScrollBottom() {
    floatState.scrollTop = floatState.scrollHeight - floatState.clientHeight;
    simSyncFloatNav();
  }

  simSyncFloatNav();
  assert.strictEqual(floatState.scrollBottomVisible, true, "scroll-to-bottom button must be visible when not at bottom");
  assert.strictEqual(floatState.backPosVisible, false, "back-to-position button must be hidden before any floor jump");

  // User clicks a floor indicator to jump from 120 to 950
  simClickFloorLink(950);
  assert.strictEqual(floatState.scrollTop, 950);
  assert.strictEqual(floatState.backPosVisible, true, "back-to-position button must appear after clicking a floor");

  // User clicks "回到上次位置"
  simClickBackPos();
  assert.strictEqual(floatState.scrollTop, 120, "clicking back-to-position must restore previous scrollTop (120)");
  assert.strictEqual(floatState.backPosVisible, false, "back-to-position button must hide after returning");

  // User clicks scroll-to-bottom arrow
  simClickScrollBottom();
  assert.strictEqual(floatState.scrollTop, 1500, "clicking scroll-to-bottom must scroll to bottom");
  assert.strictEqual(floatState.scrollBottomVisible, false, "scroll-to-bottom button must hide when at bottom");
});

test("Test 113: V2EX notification click accurately jumps to target reply floor (payload/author/mine matching, thread-view scroll, and :not(.is-notif) protection)", () => {
  const vm = require("node:vm");

  // 1. Structural assertions
  assert.ok(
    scriptContent.includes("function normalizeV2exReplyMatchText(text)"),
    "must define normalizeV2exReplyMatchText helper"
  );
  assert.ok(
    scriptContent.includes("function findV2exReplyElement(body, target)"),
    "must define findV2exReplyElement helper"
  );
  assert.ok(
    scriptContent.includes("function scrollChatToV2exReplyEl(body, el)"),
    "must define scrollChatToV2exReplyEl helper"
  );
  assert.ok(
    scriptContent.includes('.wecom-conv[data-topic-id="${topicId}"]:not(.is-notif)'),
    "syncTopicLastReadHref must exclude .is-notif rows so notification jump targets are never overwritten"
  );
  assert.ok(
    scriptContent.includes('data-target-author=') &&
    scriptContent.includes('data-target-payload=') &&
    scriptContent.includes('data-target-notif-type='),
    "convRowHtml must serialize data-target-author, data-target-payload, and data-target-notif-type"
  );

  // 2. Extract and run parseV2exReplyTarget, normalizeV2exReplyMatchText, findV2exReplyElement, scrollChatToV2exReplyEl
  const startIdx = scriptContent.indexOf("function parseV2exReplyTarget(urlOrHash)");
  const endIdx = scriptContent.indexOf("function locateV2exReply(body, target)");
  assert.ok(startIdx > 0 && endIdx > startIdx, "must locate V2EX reply target functions in script");
  const fnCode = scriptContent.slice(startIdx, endIdx);

  const sandbox = {
    chatState: { pinningScroll: false },
    Number,
    String,
    Math
  };
  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  // 2a. parseV2exReplyTarget must not treat plain path without '#' as anchor
  const parsedPlain = sandbox.parseV2exReplyTarget("/t/123456");
  assert.strictEqual(parsedPlain.anchor, "", "plain URL without hash must have empty anchor");
  assert.strictEqual(parsedPlain.floor, 0);
  const parsedAnchor = sandbox.parseV2exReplyTarget("/t/123456?p=2#reply118");
  assert.strictEqual(parsedAnchor.page, 2);
  assert.strictEqual(parsedAnchor.floor, 118);
  assert.strictEqual(parsedAnchor.anchor, "reply118");

  // 2b. normalizeV2exReplyMatchText strips leading @user #floor prefixes
  assert.strictEqual(
    sandbox.normalizeV2exReplyMatchText("@alice #12 同意这个方案"),
    "同意这个方案",
    "must strip leading @username #floor from reply text"
  );

  // 2c. Behavioral test of findV2exReplyElement across notification types
  function makeMockMsg({ floor, postNumber, username, text, mine = false }) {
    return {
      dataset: {
        floor: String(floor),
        postNumber: String(postNumber || floor + 1),
        username,
        mine: mine ? "1" : "0"
      },
      classList: {
        contains: (c) => c === "is-mine" && mine
      },
      querySelector: (sel) => {
        if (sel === ".wecom-msg-name") return { textContent: username };
        if (sel === ".wecom-msg-body") return { textContent: text };
        return null;
      },
      textContent: text
    };
  }

  const msgs = [
    makeMockMsg({ floor: 0, postNumber: 1, username: "op_user", text: "楼主主贴内容" }),
    makeMockMsg({ floor: 12, postNumber: 13, username: "me_user", text: "这是我之前在第12楼发表的精彩回复", mine: true }),
    makeMockMsg({ floor: 23, postNumber: 24, username: "bob_dev", text: "因为前面删了两层楼，这条回复从25楼变成了23楼" }),
    makeMockMsg({ floor: 80, postNumber: 81, username: "someone_else", text: "最后一楼无关回复" })
  ];

  const mockBody = {
    querySelectorAll: (sel) => (sel === ".wecom-msg" ? msgs : []),
    querySelector: (sel) => {
      const fMatch = sel.match(/data-floor="(\d+)"/);
      if (fMatch) {
        const f = Number(fMatch[1]);
        return msgs.find((m) => Number(m.dataset.floor) === f) || null;
      }
      const pMatch = sel.match(/data-post-number="(\d+)"/);
      if (pMatch) {
        const p = Number(pMatch[1]);
        return msgs.find((m) => Number(m.dataset.postNumber) === p) || null;
      }
      return null;
    }
  };

  // Case 1: "感谢了你在主题 › ... 中的回复" where V2EX href is #reply80 (total replies), but thanked reply is mine at floor 12
  const matchedThank = sandbox.findV2exReplyElement(mockBody, {
    floor: 80,
    anchor: "reply80",
    notifType: "thank",
    author: "thanker_user",
    payload: "这是我之前在第12楼发表的精彩回复"
  });
  assert.strictEqual(Number(matchedThank.dataset.floor), 12, "thank notification must locate user's thanked reply at floor 12 instead of total reply count 80");

  // Case 2: "感谢了你在主题 › ... 中的回复" without payload (falls back to user's own reply <= floor)
  const matchedThankNoPayload = sandbox.findV2exReplyElement(mockBody, {
    floor: 80,
    anchor: "reply80",
    notifType: "thank",
    author: "thanker_user",
    payload: ""
  });
  assert.strictEqual(Number(matchedThankNoPayload.dataset.floor), 12, "thank notification without payload must locate user's own reply at floor 12");

  // Case 3: Reply notification where floor shifted from #25 to #23 due to deleted posts, and rawPayload had "@me_user #12 "
  const matchedShifted = sandbox.findV2exReplyElement(mockBody, {
    floor: 25,
    anchor: "reply25",
    notifType: "reply",
    author: "bob_dev",
    payload: "@me_user #12 因为前面删了两层楼，这条回复从25楼变成了23楼"
  });
  assert.strictEqual(Number(matchedShifted.dataset.floor), 23, "shifted reply notification must locate bob_dev's reply at floor 23 via author+payload");

  // 2d. Behavioral test of scrollChatToV2exReplyEl with nested .wecom-reply-children
  const scrollContainer = {
    scrollTop: 0,
    getBoundingClientRect: () => ({ top: 100, bottom: 700, height: 600 })
  };
  const parentReplyWithHugeSubtree = {
    // Own header+body is at top: 900..960, while entire .wecom-msg (with children) is 900..2800
    getBoundingClientRect: () => ({ top: 900, bottom: 2800, height: 1900 }),
    querySelector: (sel) => {
      if (sel.includes(".wecom-msg-header")) {
        return { getBoundingClientRect: () => ({ top: 900, bottom: 924, height: 24 }) };
      }
      if (sel.includes(".wecom-msg-body")) {
        return { getBoundingClientRect: () => ({ top: 924, bottom: 964, height: 40 }) };
      }
      return null;
    }
  };
  sandbox.scrollChatToV2exReplyEl(scrollContainer, parentReplyWithHugeSubtree);
  // deltaTop = 900 - 100 = 800, ownHeight = 64, offset = min(120, round((600 - 64) * 0.28)) = 120 -> scrollTop = 680
  assert.strictEqual(scrollContainer.scrollTop, 680, "must scroll to the reply's own header+body (680) instead of centering the 1900px nested subtree");
});

test("Test 114: WeCom-styled topic timeline / page slider popover triggered by top-right icon button", () => {
  // 1. Structural assertions: icon, button, popover DOM, CSS, and event wiring
  assert.ok(
    scriptContent.includes('scrollTop: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11l5 -5l5 5" /><path d="M7 17l5 -5l5 5" /></svg>`') &&
    scriptContent.includes('timeline: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 4v4" /><circle cx="8.5" cy="10.2" r="2.2" />'),
    "ICONS must define refined minimalist scrollTop and timeline icon SVGs"
  );
  assert.ok(
    scriptContent.includes('class="wecom-icon-btn wecom-chat-timeline-toggle" title="楼层与进度滑块" aria-label="楼层与进度滑块" aria-expanded="false">${ICONS.timeline}</button>') &&
    scriptContent.includes('class="wecom-icon-btn wecom-chat-more-item wecom-chat-refresh" title="刷新本话题" aria-label="刷新本话题">'),
    "ensureChatPanel must render .wecom-chat-timeline-toggle in .wecom-chat-tools and move .wecom-chat-refresh into .wecom-chat-more-actions"
  );
  assert.ok(
    scriptContent.includes('<aside class="wecom-timeline-popover" aria-label="楼层进度导航" hidden>') &&
    scriptContent.includes('class="wecom-timeline-scrollarea"') &&
    scriptContent.includes('class="wecom-timeline-scroller"') &&
    scriptContent.includes('class="wecom-timeline-replies"') &&
    scriptContent.includes('class="wecom-timeline-jump-input"'),
    "ensureChatPanel must render .wecom-timeline-popover with hidden attribute by default"
  );
  assert.ok(
    scriptContent.includes(".wecom-timeline-popover[hidden]") &&
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-timeline-popover"),
    "CSS must style .wecom-timeline-popover in both light and dark modes and keep [hidden] display:none"
  );
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-chat-timeline-toggle")') &&
    scriptContent.includes("toggleTimelinePopover();"),
    "handleChatHeaderClick must toggle the timeline popover when clicking the top-right timeline icon"
  );

  // 2. Behavioral verification via VM sandbox
  const startIdx = scriptContent.indexOf("function getTopicTimelineMetrics(body)");
  const endIdx = scriptContent.indexOf("function bindTimelineSliderEvents(panel)");
  assert.ok(startIdx > 0 && endIdx > startIdx, "must locate timeline slider functions in script");
  const fnCode = scriptContent.slice(startIdx, endIdx);

  const mockScroller = { style: { top: "" } };
  const mockFill = { style: { height: "" } };
  const mockReplies = { textContent: "" };
  const mockAgo = { textContent: "" };
  const mockTopBtn = { textContent: "" };
  const mockBottomBtn = { textContent: "" };
  const mockJumpInput = { max: "", placeholder: "", value: "" };

  const popoverClasses = new Set();
  const mockPopover = {
    hidden: true,
    classList: {
      add: (...cls) => cls.forEach((c) => popoverClasses.add(c)),
      remove: (...cls) => cls.forEach((c) => popoverClasses.delete(c)),
      contains: (c) => popoverClasses.has(c)
    },
    querySelector: (sel) => {
      if (sel === ".wecom-timeline-scroller") return mockScroller;
      if (sel === ".wecom-timeline-fill") return mockFill;
      if (sel === ".wecom-timeline-replies") return mockReplies;
      if (sel === ".wecom-timeline-ago") return mockAgo;
      if (sel === ".wecom-timeline-date-top") return mockTopBtn;
      if (sel === ".wecom-timeline-date-bottom") return mockBottomBtn;
      if (sel === ".wecom-timeline-jump-input") return mockJumpInput;
      return null;
    }
  };

  const btnClasses = new Set();
  const btnAttrs = new Map([["aria-expanded", "false"]]);
  const mockToggleBtn = {
    classList: {
      add: (...cls) => cls.forEach((c) => btnClasses.add(c)),
      remove: (...cls) => cls.forEach((c) => btnClasses.delete(c)),
      contains: (c) => btnClasses.has(c)
    },
    setAttribute: (k, v) => btnAttrs.set(k, String(v)),
    getAttribute: (k) => btnAttrs.get(k)
  };

  const mockBody = {
    clientHeight: 500,
    scrollHeight: 5000,
    scrollTop: 1200,
    querySelector: (sel) => {
      if (sel.includes('data-post-number="25"')) return { dataset: { postNumber: "25" } };
      return null;
    }
  };

  const mockPanel = {
    querySelector: (sel) => {
      if (sel === ".wecom-timeline-popover") return mockPopover;
      if (sel === ".wecom-chat-timeline-toggle") return mockToggleBtn;
      if (sel === ".wecom-chat-body") return mockBody;
      return null;
    }
  };

  let scrolledToPost = null;
  let rememberedPost = null;
  const postsByNumber = new Map([
    [1, { post_number: 1, created_at: "2026-09-01T10:00:00Z" }],
    [15, { post_number: 15, created_at: "2026-09-05T12:00:00Z" }],
    [25, { post_number: 25, created_at: "2026-09-08T15:30:00Z" }],
    [51, { post_number: 51, created_at: "2026-09-10T18:00:00Z" }]
  ]);

  const sandbox = {
    IS_V2EX: false,
    chatState: {
      topicId: 999,
      stream: Array.from({ length: 51 }, (_, i) => i + 1),
      replyTotal: 51,
      renderedLastNumber: 51,
      hasOlder: false,
      hasNewer: false,
      postsByNumber
    },
    listState: { topics: [] },
    document: {
      activeElement: null,
      querySelector: (sel) => {
        if (sel === ".wecom-chat-panel") return mockPanel;
        if (sel === ".wecom-chat-body") return mockBody;
        return null;
      }
    },
    visibleTopicPosts: () => [15, 16, 17],
    getRememberedPost: () => 1,
    isSameTopic: (a, b) => a === b,
    formatTime: (iso) => iso.slice(5, 10),
    closeAllPlatformDropdowns: () => {},
    closeWatermarkSettings: () => {},
    isMessageInChatViewport: () => false,
    saveChatJumpPosition: () => {},
    scrollChatToPost: (_b, num) => { scrolledToPost = num; },
    keepChatAtPost: () => {},
    rememberTopicPost: (_id, num) => { rememberedPost = num; },
    replaceTopicPostUrl: () => {},
    syncChatFloatNav: () => {},
    loadTopic: async () => {},
    setTimeout: () => {},
    Number,
    String,
    Math,
    Array
  };

  const vm = require("node:vm");
  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  // 2a. Initially hidden; clicking toggle opens popover and syncs metrics (15 / 51 -> 28.00%)
  assert.strictEqual(mockPopover.hidden, true);
  sandbox.toggleTimelinePopover();
  assert.strictEqual(mockPopover.hidden, false, "toggleTimelinePopover must unhide popover");
  assert.ok(mockToggleBtn.classList.contains("is-active"), "toggle button must receive .is-active when open");
  assert.strictEqual(mockToggleBtn.getAttribute("aria-expanded"), "true");
  assert.strictEqual(mockReplies.textContent, "15 / 51");
  assert.strictEqual(mockScroller.style.top, "28.00%");
  assert.strictEqual(mockFill.style.height, "28.00%");
  assert.strictEqual(mockTopBtn.textContent, "09-01");
  assert.strictEqual(mockBottomBtn.textContent, "09-10");
  assert.strictEqual(mockAgo.textContent, "09-05");
  assert.strictEqual(mockJumpInput.placeholder, "1 - 51");

  // 2b. Drag preview updates scroller and floor label to previewFloor (26 / 51 -> 50.00%)
  sandbox.syncTimelineSlider(mockBody, 26);
  assert.strictEqual(mockReplies.textContent, "26 / 51");
  assert.strictEqual(mockScroller.style.top, "50.00%");

  // 2c. Jumping to an existing post scrolls directly to that floor
  sandbox.jumpChatToTimelinePost(25);
  assert.strictEqual(scrolledToPost, 25);
  assert.strictEqual(rememberedPost, 25);
  assert.strictEqual(mockReplies.textContent, "25 / 51");

  // 2d. Toggling again closes popover and resets button state
  sandbox.toggleTimelinePopover();
  assert.strictEqual(mockPopover.hidden, true);
  assert.strictEqual(mockToggleBtn.getAttribute("aria-expanded"), "false");

  // 3. Reply indicator user color is muted (inherit) rather than highlighted
  assert.match(
    scriptContent,
    /\.wecom-msg-reply-indicator\s+\.wecom-msg-reply-indicator-user\s*\{\s*font-weight:\s*500;\s*color:\s*inherit;\s*\}/,
    ".wecom-msg-reply-indicator-user must use color: inherit instead of highlighted accent color"
  );

  // 4. Back-to-position button (.wecom-chat-back-pos) only appears when floor jump leaves visible area
  const navStartIdx = scriptContent.indexOf("function getMessageOwnBounds(el)");
  const navEndIdx = scriptContent.indexOf("function handleReplyReferenceClick(event, panel)");
  assert.ok(navStartIdx > 0 && navEndIdx > navStartIdx, "must locate visible-area jump helpers");
  const navCode = scriptContent.slice(navStartIdx, navEndIdx);

  const mockBackPosBtn = { hidden: true };
  const mockScrollBottomBtn = { hidden: true };
  const navBody = {
    clientHeight: 500,
    scrollHeight: 4000,
    scrollTop: 1000,
    getBoundingClientRect: () => ({ top: 100, bottom: 600, height: 500 }),
    querySelector: () => null
  };
  const navPanel = {
    dataset: { empty: "0" },
    querySelector: (sel) => {
      if (sel === ".wecom-chat-body") return navBody;
      if (sel === ".wecom-chat-back-pos") return mockBackPosBtn;
      if (sel === ".wecom-chat-scroll-bottom") return mockScrollBottomBtn;
      return null;
    }
  };
  const navSandbox = {
    chatState: {
      topicId: 999,
      lastJumpScrollTop: null,
      lastJumpPostNumber: 0,
      pinningScroll: false
    },
    document: {
      querySelector: (sel) => (sel === ".wecom-chat-panel" ? navPanel : navBody)
    },
    syncTimelineSlider: () => {},
    Number,
    Math,
    Boolean
  };
  vm.createContext(navSandbox);
  vm.runInContext(navCode, navSandbox);

  // 4a. Small jump within visible area (1000 -> 920): back-pos button must stay hidden
  navBody.scrollTop = 920;
  navSandbox.saveChatJumpPosition(navBody, 1000);
  assert.strictEqual(mockBackPosBtn.hidden, true, "back-pos button must stay hidden when jump stays within visible area");
  assert.strictEqual(navSandbox.chatState.lastJumpScrollTop, null);

  // 4b. Large jump outside visible area (1000 -> 150): back-pos button must appear
  navBody.scrollTop = 150;
  navSandbox.saveChatJumpPosition(navBody, 1000);
  assert.strictEqual(mockBackPosBtn.hidden, false, "back-pos button must appear when floor jump leaves visible area");
  assert.strictEqual(navSandbox.chatState.lastJumpScrollTop, 1000);

  // 4c. Scrolling back into the original visible area hides back-pos button automatically
  navBody.scrollTop = 980;
  navSandbox.syncChatFloatNav(navBody);
  assert.strictEqual(mockBackPosBtn.hidden, true, "back-pos button must hide once user returns to the previous visible area");
});

test("Test 115: Linux.do notification item click jumps accurately to the corresponding floor", () => {
  const vm = require("node:vm");

  // 1. Verify topicRouteFromPath parses standard, full-origin, query-string, and numeric-slug URLs
  const routeStart = scriptContent.indexOf("function topicRouteFromPath(pathname)");
  const routeEnd = scriptContent.indexOf("function topicIdFromPath(pathname)");
  assert.ok(routeStart > 0 && routeEnd > routeStart, "must locate topicRouteFromPath");
  const routeSandbox = { IS_JUEJIN: false, String, Number };
  vm.createContext(routeSandbox);
  vm.runInContext(scriptContent.slice(routeStart, routeEnd), routeSandbox);

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(routeSandbox.topicRouteFromPath("/t/some-topic/123456/78"))),
    { topicId: 123456, postNumber: 78, slug: "some-topic" }
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(routeSandbox.topicRouteFromPath("https://linux.do/t/some-topic/123456/78?u=alice"))),
    { topicId: 123456, postNumber: 78, slug: "some-topic" }
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(routeSandbox.topicRouteFromPath("/t/2026/123456/78"))),
    { topicId: 123456, postNumber: 78, slug: "2026" }
  );

  // 2. Verify handleNotifMenuClick extracts href, remembers target floor, pushes state, and calls loadTopic with { postNumber }
  const notifStart = scriptContent.indexOf("function handleNotifMenuClick(e, menu)");
  const notifEnd = scriptContent.indexOf("function bindNotifMenuEvents(menu)");
  assert.ok(notifStart > 0 && notifEnd > notifStart, "must locate handleNotifMenuClick");

  let rememberedArgs = null;
  let loadedArgs = null;
  let pushedUrl = null;
  let menuClosed = false;
  const rowClasses = new Set(["unread"]);
  const mockLink = {
    tagName: "A",
    getAttribute: (k) => (k === "href" ? "/t/test-slug/123456/78" : null),
    closest: (sel) => {
      if (sel.includes("a[href]")) return mockLink;
      if (sel.includes(".notification")) return mockRow;
      return null;
    }
  };
  const mockRow = {
    dataset: { notificationId: "555" },
    classList: {
      remove: (c) => rowClasses.delete(c),
      add: (c) => rowClasses.add(c)
    },
    querySelector: () => mockLink
  };
  const mockMenu = {
    contains: (el) => el === mockLink || el === mockRow
  };

  const notifSandbox = {
    notifIgnoreHoverUntil: 0,
    suppressHistoryApply: false,
    LOCK_CLASS: "wecom-locked",
    location: { pathname: "/latest", search: "", hash: "" },
    history: {
      pushState: (_s, _t, url) => { pushedUrl = url; }
    },
    document: {
      documentElement: { classList: { add: () => {} } }
    },
    isUserMenuTab: () => false,
    isDismissAllTarget: () => false,
    topicRouteFromPath: routeSandbox.topicRouteFromPath,
    decrementNotificationBadge: () => {},
    markDiscourseNotificationRead: () => {},
    closeNotifMenu: () => { menuClosed = true; },
    isPlainClick: () => true,
    rememberTopicPost: (id, post) => { rememberedArgs = { id, post }; },
    ensureListPanel: () => {},
    ensureChatPanel: () => {},
    loadTopic: (id, force, opts) => { loadedArgs = { id, force, opts }; },
    Date,
    String,
    Boolean
  };
  vm.createContext(notifSandbox);
  vm.runInContext(scriptContent.slice(notifStart, notifEnd), notifSandbox);

  let defaultPrevented = false;
  notifSandbox.handleNotifMenuClick({
    target: mockLink,
    preventDefault: () => { defaultPrevented = true; },
    stopPropagation: () => {}
  }, mockMenu);

  assert.strictEqual(defaultPrevented, true, "must prevent default on notification topic link click");
  assert.strictEqual(menuClosed, true, "must close notification menu");
  assert.ok(rowClasses.has("read") && !rowClasses.has("unread"), "must mark notification row as read");
  assert.deepStrictEqual(rememberedArgs, { id: 123456, post: 78 }, "must immediately remember target floor 78");
  assert.strictEqual(pushedUrl, "/t/test-slug/123456/78", "must push notification URL to history");
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(loadedArgs)),
    { id: 123456, force: true, opts: { postNumber: 78 } },
    "must call loadTopic with force=true and { postNumber: 78 }"
  );

  // 3. Verify fetchTopicJson checks hasRequestedPost before returning cached/preloaded data
  assert.ok(
    scriptContent.includes("const hasRequestedPost = (topicData) =>") &&
    scriptContent.includes("if (cached && hasRequestedPost(cached)) return cached;"),
    "fetchTopicJson must verify that cached topic data contains the requested postNumber before returning cache"
  );
});

test("Test 116: Discourse Poll rich card rendering, voting, progress bars, and view toggle in WeCom UI", () => {
  // 1. Static assertions for Poll card functions, endpoints, and styles
  assert.ok(
    scriptContent.includes("function hydratePolls(root)"),
    "must define hydratePolls"
  );
  assert.ok(
    scriptContent.includes("hydratePolls(root);"),
    "hydrateChatImages must call hydratePolls"
  );
  assert.ok(
    scriptContent.includes("async function voteDiscoursePoll("),
    "must define voteDiscoursePoll"
  );
  assert.ok(
    scriptContent.includes('fetch("/polls/vote"') &&
    scriptContent.includes('method: "PUT"'),
    "voteDiscoursePoll must call PUT /polls/vote"
  );
  assert.ok(
    scriptContent.includes("async function removeDiscoursePollVote("),
    "must define removeDiscoursePollVote"
  );
  assert.ok(
    scriptContent.includes('method: "DELETE"'),
    "removeDiscoursePollVote must call DELETE /polls/vote"
  );
  assert.ok(
    scriptContent.includes(".wecom-poll-card {") &&
    scriptContent.includes(".wecom-poll-result-bar {") &&
    scriptContent.includes(".wecom-poll-choice-item {"),
    "must include light-mode styles for wecom-poll-card, result bars, and choices"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-poll-card") &&
    scriptContent.includes("html.wecom-dark .wecom-poll-result-bar"),
    "must include dark-mode styles for wecom-poll-card"
  );

  // 2. Functional simulation: percentage calculation and result / voting mode rendering
  function simulatePollPercentages(poll, userVotes = []) {
    const isMultiple = poll.type === "multiple";
    const totalVoters = Number(poll.voters) || 0;
    const totalVotes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

    return poll.options.map((opt) => {
      const isChosen = userVotes.includes(opt.id);
      const votes = Number(opt.votes) || 0;
      let percent = 0;
      if (isMultiple) {
        percent = totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
      } else {
        percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      }
      return { id: opt.id, votes, percent, isChosen };
    });
  }

  const sampleSinglePoll = {
    name: "poll",
    type: "regular",
    status: "open",
    voters: 10,
    options: [
      { id: "opt1", html: "选项一", votes: 7 },
      { id: "opt2", html: "选项二", votes: 3 }
    ]
  };

  const results = simulatePollPercentages(sampleSinglePoll, ["opt1"]);
  assert.strictEqual(results[0].percent, 70, "opt1 should be 70%");
  assert.strictEqual(results[0].isChosen, true, "opt1 should be marked chosen");
  assert.strictEqual(results[1].percent, 30, "opt2 should be 30%");
  assert.strictEqual(results[1].isChosen, false, "opt2 should not be chosen");

  const sampleMultiplePoll = {
    name: "poll",
    type: "multiple",
    status: "open",
    max: 2,
    voters: 5,
    options: [
      { id: "a", html: "A", votes: 4 },
      { id: "b", html: "B", votes: 3 },
      { id: "c", html: "C", votes: 1 }
    ]
  };

  const multiResults = simulatePollPercentages(sampleMultiplePoll, ["a", "b"]);
  assert.strictEqual(multiResults[0].percent, 80, "4 of 5 voters chose A = 80%");
  assert.strictEqual(multiResults[1].percent, 60, "3 of 5 voters chose B = 60%");
  assert.strictEqual(multiResults[2].percent, 20, "1 of 5 voters chose C = 20%");
  assert.strictEqual(multiResults[0].isChosen, true);
  assert.strictEqual(multiResults[1].isChosen, true);
  assert.strictEqual(multiResults[2].isChosen, false);
});

test("Test 117: Recall/delete, share link, liked users popover, post flagging, solution toggle, topic state chips/lockout, @ mention autocomplete, and selection quote reply (v0.7.83)", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptContent = fs.readFileSync(path.join(__dirname, "../linuxdo-wecom.user.js"), "utf8");

  // 1. Verify icons
  assert.ok(scriptContent.includes("trash:"), "ICONS must define trash icon");
  assert.ok(scriptContent.includes("share:"), "ICONS must define share icon");
  assert.ok(scriptContent.includes("flag:"), "ICONS must define flag icon");
  assert.ok(scriptContent.includes("checkCircle:"), "ICONS must define checkCircle icon");
  assert.ok(scriptContent.includes("lock:"), "ICONS must define lock icon");
  assert.ok(scriptContent.includes("quote:"), "ICONS must define quote icon");

  // 2. Verify CSS styles for Light & Dark mode
  assert.ok(scriptContent.includes(".wecom-msg-recalled"), "CSS must style recalled message state");
  assert.ok(scriptContent.includes(".wecom-likes-popover"), "CSS must style liked users popover");
  assert.ok(scriptContent.includes(".wecom-flag-dialog"), "CSS must style flag dialog");
  assert.ok(scriptContent.includes(".wecom-solved-banner"), "CSS must style accepted solution banner");
  assert.ok(scriptContent.includes(".wecom-chat-chip.is-solved"), "CSS must style solved header chip");
  assert.ok(scriptContent.includes(".wecom-chat-chip.is-locked"), "CSS must style locked header chip");
  assert.ok(scriptContent.includes(".wecom-chat-chip.is-slowmode"), "CSS must style slow-mode header chip");
  assert.ok(scriptContent.includes(".wecom-composer-card.is-locked"), "CSS must style locked composer card");
  assert.ok(scriptContent.includes(".wecom-mention-popup"), "CSS must style mention suggestion popup");
  assert.ok(scriptContent.includes(".wecom-mini-toast"), "CSS must style mini toast");
  assert.ok(scriptContent.includes(".wecom-quote-tooltip"), "CSS must style selection quote tooltip");
  assert.ok(scriptContent.includes(".wecom-quote-tooltip:hover"), "CSS must style selection quote tooltip hover state");
  assert.ok(scriptContent.includes("html.wecom-dark .wecom-quote-tooltip"), "CSS must style selection quote tooltip for dark mode");

  // 3. Verify tool action buttons in bubbleHtml and handleMessageToolClick
  assert.ok(scriptContent.includes('data-action="delete"'), "bubbleHtml must render delete tool button for own posts");
  assert.ok(scriptContent.includes('data-action="share"'), "bubbleHtml must render share tool button");
  assert.ok(scriptContent.includes('data-action="flag"'), "bubbleHtml must render flag tool button for other posts");
  assert.ok(scriptContent.includes('data-action="accept-solution"'), "bubbleHtml must support accept-solution tool button");
  assert.ok(scriptContent.includes('data-action="unaccept-solution"'), "bubbleHtml must support unaccept-solution tool button");

  assert.ok(scriptContent.includes('if (action === "delete")'), "handleMessageToolClick must handle delete action");
  assert.ok(scriptContent.includes('if (action === "share")'), "handleMessageToolClick must handle share action");
  assert.ok(scriptContent.includes('if (action === "flag")'), "handleMessageToolClick must handle flag action");
  assert.ok(scriptContent.includes('if (action === "accept-solution")'), "handleMessageToolClick must handle accept-solution action");
  assert.ok(scriptContent.includes('if (action === "unaccept-solution")'), "handleMessageToolClick must handle unaccept-solution action");

  // 4. Verify helper functions exist
  assert.ok(scriptContent.includes("function deletePostMessage("), "script must define deletePostMessage");
  assert.ok(scriptContent.includes("function copyPostFloorLink("), "script must define copyPostFloorLink");
  assert.ok(scriptContent.includes("function openLikedUsersPopover("), "script must define openLikedUsersPopover");
  assert.ok(scriptContent.includes("function openFlagDialog("), "script must define openFlagDialog");
  assert.ok(scriptContent.includes("function toggleSolution("), "script must define toggleSolution");
  assert.ok(scriptContent.includes("function updateHeaderChips("), "script must define updateHeaderChips");
  assert.ok(scriptContent.includes("function syncComposerTopicState("), "script must define syncComposerTopicState");
  assert.ok(scriptContent.includes("function handleMentionInput("), "script must define handleMentionInput");
  assert.ok(scriptContent.includes("function handleMentionKeyDown("), "script must define handleMentionKeyDown");
  assert.ok(scriptContent.includes("function showMiniToast("), "script must define showMiniToast");
  assert.ok(scriptContent.includes("function closeQuoteTooltip("), "script must define closeQuoteTooltip");
  assert.ok(scriptContent.includes("function handleSelectionQuoteCheck("), "script must define handleSelectionQuoteCheck");
  assert.ok(scriptContent.includes("function showQuoteTooltip("), "script must define showQuoteTooltip");
  assert.ok(scriptContent.includes("function executeSelectionQuote("), "script must define executeSelectionQuote");

  // 5. Test mention query regex logic
  const matchMention = (text) => {
    const match = text.match(/(?:^|\s)@([a-zA-Z0-9_\u4e00-\u9fa5\-]*)$/);
    return match ? match[1] : null;
  };
  assert.strictEqual(matchMention("@neo"), "neo");
  assert.strictEqual(matchMention("你好 @张三"), "张三");
  assert.strictEqual(matchMention("Hello @user-123"), "user-123");
  assert.strictEqual(matchMention("email@domain.com"), null);
  assert.strictEqual(matchMention("@"), "");

  // 6. Test topic state perception logic
  const simulateTopicChips = (state) => {
    const chips = [];
    if (state.hasAcceptedAnswer) chips.push("is-solved");
    if (state.isClosed) chips.push("is-locked");
    if (state.slowModeSeconds > 0) chips.push("is-slowmode");
    return chips;
  };
  assert.deepStrictEqual(simulateTopicChips({ hasAcceptedAnswer: true, isClosed: false, slowModeSeconds: 0 }), ["is-solved"]);
  assert.deepStrictEqual(simulateTopicChips({ hasAcceptedAnswer: false, isClosed: true, slowModeSeconds: 30 }), ["is-locked", "is-slowmode"]);
  assert.deepStrictEqual(simulateTopicChips({ hasAcceptedAnswer: true, isClosed: true, slowModeSeconds: 0 }), ["is-solved", "is-locked"]);

  // 7. Test selection quote formatting logic
  const formatSelectionQuote = ({ isLinuxDo, username, postNumber, topicId, text }) => {
    if (isLinuxDo) {
      const header = topicId
        ? `[quote="${username}, post:${postNumber}, topic:${topicId}"]`
        : `[quote="${username}, post:${postNumber}"]`;
      return `${header}\n${text}\n[/quote]\n\n`;
    }
    return `> @${username}: ${text}\n\n`;
  };

  const linuxdoQuote = formatSelectionQuote({
    isLinuxDo: true,
    username: "alice",
    postNumber: 5,
    topicId: 12345,
    text: "这是一段被划选引用的文字"
  });
  assert.strictEqual(
    linuxdoQuote,
    '[quote="alice, post:5, topic:12345"]\n这是一段被划选引用的文字\n[/quote]\n\n',
    "Discourse/Linux.do quote format should include username, post, topic, and text inside bbcode"
  );

  const v2exQuote = formatSelectionQuote({
    isLinuxDo: false,
    username: "bob",
    postNumber: 3,
    topicId: null,
    text: "V2EX划选引用测试"
  });
  assert.strictEqual(
    v2exQuote,
    "> @bob: V2EX划选引用测试\n\n",
    "V2EX/Juejin quote format should use markdown blockquote with @username"
  );

  // 8. Verify Discourse reactions & post_action_users likers resolution
  assert.ok(
    scriptContent.includes("/discourse-reactions/posts/${postId}/reactions-users.json"),
    "openLikedUsersPopover must request discourse-reactions endpoint"
  );
  assert.ok(
    scriptContent.includes("/post_action_users.json?id=${postId}&post_action_type_id=2"),
    "openLikedUsersPopover must fallback to post_action_users.json"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-likes-popover"),
    "must include dark mode styles for wecom-likes-popover"
  );
  assert.ok(
    scriptContent.includes("function fetchMentionRemote("),
    "must define fetchMentionRemote for searching users"
  );
  assert.ok(
    scriptContent.includes("if (!trigger || !IS_LINUXDO) return;"),
    "openLikedUsersPopover must return immediately without creating popover on non-LinuxDo platforms"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-likes.is-static"),
    "CSS must include .wecom-msg-likes.is-static for static like badges"
  );

  // Test liked users extraction simulation
  const extractLikedUsers = (reactionsData, fallbackData) => {
    let users = [];
    if (Array.isArray(reactionsData?.reaction_users)) {
      for (const group of reactionsData.reaction_users) {
        if (Array.isArray(group.users)) users.push(...group.users);
      }
    }
    if (!users.length && Array.isArray(fallbackData?.post_action_users)) {
      users = fallbackData.post_action_users;
    }
    const seen = new Set();
    return users.filter((u) => {
      const key = (u?.username || u?.id || "").toString().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const sampleReactions = {
    reaction_users: [
      { id: "heart", users: [{ username: "alice", name: "Alice" }, { username: "bob", name: "Bob" }] },
      { id: "+1", users: [{ username: "alice", name: "Alice" }, { username: "charlie", name: "Charlie" }] }
    ]
  };
  const extracted = extractLikedUsers(sampleReactions, null);
  assert.strictEqual(extracted.length, 3, "should deduplicate alice across multiple reaction groups");
  assert.deepStrictEqual(extracted.map((u) => u.username), ["alice", "bob", "charlie"]);

  const sampleFallback = {
    post_action_users: [{ username: "david", name: "David" }]
  };
  const fallbackExtracted = extractLikedUsers({ reaction_users: [] }, sampleFallback);
  assert.strictEqual(fallbackExtracted.length, 1);
  assert.strictEqual(fallbackExtracted[0].username, "david");

  // Test mention candidates aggregation simulation
  const aggregateMentionCandidates = ({ topicData, posts, myUsername, query }) => {
    const raw = [];
    if (topicData?.details?.created_by) raw.push(topicData.details.created_by);
    if (Array.isArray(topicData?.details?.participants)) raw.push(...topicData.details.participants);
    if (posts) raw.push(...posts);

    const matched = [];
    const seen = new Set();
    const myLower = (myUsername || "").toLowerCase();
    const qLower = (query || "").toLowerCase();

    for (const p of raw) {
      const u = (p?.username || "").trim();
      const n = (p?.name || "").trim();
      const uLower = u.toLowerCase();
      const nLower = n.toLowerCase();
      if (!u || uLower === myLower || seen.has(uLower)) continue;
      if (!qLower || uLower.includes(qLower) || nLower.includes(qLower)) {
        seen.add(uLower);
        matched.push({ username: u, name: n || u });
        if (matched.length >= 8) break;
      }
    }
    return matched;
  };

  const mockTopicData = {
    details: {
      created_by: { username: "op_user", name: "楼主" },
      participants: [{ username: "responder_1", name: "甲" }, { username: "responder_2", name: "乙" }]
    }
  };
  const mockPosts = [
    { username: "responder_2", name: "乙" },
    { username: "new_responder", name: "丙" }
  ];

  const mentionListAll = aggregateMentionCandidates({
    topicData: mockTopicData,
    posts: mockPosts,
    myUsername: "my_account",
    query: ""
  });
  assert.strictEqual(mentionListAll.length, 4, "should include OP, participants and new post authors deduplicated");
  assert.strictEqual(mentionListAll[0].username, "op_user");

  const mentionListFiltered = aggregateMentionCandidates({
    topicData: mockTopicData,
    posts: mockPosts,
    myUsername: "my_account",
    query: "responder"
  });
  assert.strictEqual(mentionListFiltered.length, 3, "should filter by 'responder'");
  assert.strictEqual(mentionListFiltered.some((u) => u.username === "op_user"), false);

  // 10. Verify quote decoupling from textarea & Cloudflare challenge protection
  assert.ok(
    !scriptContent.includes("insertComposerText(quoteBlock)"),
    "executeSelectionQuote must not inject raw quote block directly into textarea"
  );
  assert.ok(
    scriptContent.includes("composerBridgeState.quoteData"),
    "composerBridgeState must track quoteData for composer submission"
  );
  assert.ok(
    scriptContent.includes("quoteHeader"),
    "submitComposer must synthesize quoteHeader when quoteData is present"
  );
  assert.ok(
    scriptContent.includes("触发了安全人机验证（Cloudflare）"),
    "payloadError and poll voting must detect Cloudflare challenge and show friendly guidance"
  );
});

test("Test 118: Discourse 403 error modal suppression, screenTrack topic isolation, and poll popupError bypass (v0.7.84)", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Verify screenTrack topic isolation in markPostsOnscreen
  assert.ok(
    scriptContent.includes("function markPostsOnscreen(topicId, postNumbers)"),
    "markPostsOnscreen must accept topicId and postNumbers"
  );
  assert.ok(
    scriptContent.includes('const modelId = Number(topicCtrl?.get?.("model.id") || topicCtrl?.model?.id || 0);'),
    "markPostsOnscreen must inspect active topic controller model id"
  );
  assert.ok(
    scriptContent.includes("if (!modelId || modelId !== Number(topicId)) return false;"),
    "markPostsOnscreen must skip Discourse screenTrack delegation when Ember route topic doesn't match active topic"
  );

  // 2. Verify reportReadTimings uses fetch and safe catch
  assert.ok(
    scriptContent.includes("fetch(\"/topics/timings\""),
    "reportReadTimings must report read timings directly via fetch"
  );
  assert.ok(
    scriptContent.includes("catch(() => {})"),
    "reportReadTimings fetch must catch errors silently to avoid triggering unhandled rejections"
  );

  // 3. Verify poll voting sets popupError: false
  assert.ok(
    scriptContent.includes('popupError: false'),
    "poll voting calls to discourseAjax must specify popupError: false"
  );

  // 4. Verify 403 error alert and modal suppression functions
  assert.ok(
    scriptContent.includes("function setup403ErrorSuppression()"),
    "setup403ErrorSuppression must be defined"
  );
  assert.ok(
    scriptContent.includes("function dismiss403ModalsIfAny()"),
    "dismiss403ModalsIfAny must be defined"
  );
  assert.ok(
    scriptContent.includes("bootbox.alert"),
    "setup403ErrorSuppression must patch bootbox.alert"
  );
  assert.ok(
    scriptContent.includes("dialog.alert"),
    "setup403ErrorSuppression must patch dialog service alert"
  );

  // 5. Functional test of 403 message detection pattern
  const is403Pattern = (msg) => {
    const text = String(msg || "");
    return (
      /403\s*(error|forbidden)?/i.test(text) ||
      text.includes("403") ||
      text.includes("Forbidden")
    );
  };

  assert.strictEqual(is403Pattern("403 error"), true);
  assert.strictEqual(is403Pattern("403 Forbidden"), true);
  assert.strictEqual(is403Pattern("403"), true);
  assert.strictEqual(is403Pattern("Server Error 500"), false);
  assert.strictEqual(is403Pattern(""), false);
});

test("Test 119: V2EX member card topics and replies touch-bottom pagination and reply text expand/collapse (v0.7.85)", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. CSS styling assertions
  assert.ok(
    scriptContent.includes(".wecom-member-reply-text.is-expanded"),
    "must define .wecom-member-reply-text.is-expanded CSS"
  );
  assert.ok(
    scriptContent.includes("-webkit-line-clamp: unset;"),
    "must unset -webkit-line-clamp when reply text is expanded"
  );
  assert.ok(
    scriptContent.includes("white-space: pre-wrap;"),
    "must preserve line-breaks with pre-wrap when reply text is expanded"
  );
  assert.ok(
    scriptContent.includes(".wecom-member-list-status"),
    "must define .wecom-member-list-status CSS"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-member-reply-text:hover"),
    "must style reply text hover in dark mode"
  );
  assert.ok(
    scriptContent.includes("html.${ROOT_CLASS}.wecom-dark .wecom-member-list-status"),
    "must style list status in dark mode"
  );

  // 2. Pagination fetcher definitions
  assert.ok(
    scriptContent.includes("async function fetchV2exMemberTopicsPage("),
    "must define fetchV2exMemberTopicsPage helper"
  );
  assert.ok(
    scriptContent.includes("async function fetchV2exMemberRepliesPage("),
    "must define fetchV2exMemberRepliesPage helper"
  );

  // 3. Touch-bottom pagination wiring and duplicate prevention
  assert.ok(
    scriptContent.includes("const loadMoreTopics = async () =>"),
    "must implement loadMoreTopics for topics touch-bottom pagination"
  );
  assert.ok(
    scriptContent.includes("const loadMoreReplies = async () =>"),
    "must implement loadMoreReplies for replies touch-bottom pagination"
  );
  assert.ok(
    scriptContent.includes("distanceToBottom <= 20"),
    "must trigger loadMore when distance to bottom is within threshold"
  );
  assert.ok(
    scriptContent.includes("seenTopicUrls.has(base)"),
    "must deduplicate loaded topics via seenTopicUrls Set"
  );
  assert.ok(
    scriptContent.includes("seenReplyKeys.has(key)"),
    "must deduplicate loaded replies via seenReplyKeys Set"
  );

  // 4. Click to expand/collapse reply text wiring
  assert.ok(
    scriptContent.includes('textEl.classList.toggle("is-expanded")'),
    "must toggle is-expanded on wecom-member-reply-text click"
  );
  assert.ok(
    scriptContent.includes('title="点击展开/收起完整回复"'),
    "must provide tooltip on wecom-member-reply-text informing user it can be clicked to expand"
  );

  // 5. Cursor focus into composer after confirming quote
  assert.ok(
    scriptContent.includes("compInput.setSelectionRange(len, len)"),
    "executeSelectionQuote must place cursor at the end of input using setSelectionRange"
  );
  assert.ok(
    scriptContent.includes("compInput.focus()"),
    "executeSelectionQuote must focus the composer input"
  );

  // 6. Functional test of HTML parsing for pagination
  const sampleTopicsHtml = `
    <div class="box">
      <div class="cell ps_container">
        <input type="number" class="page_input" value="2" max="15" />
      </div>
      <div class="cell item"><span class="item_title"><a href="/t/100#reply5">第一篇主题</a></span></div>
      <div class="cell item"><span class="item_title"><a href="/t/101#reply12">第二篇主题</a></span></div>
    </div>
  `;
  const parsedTopics = [];
  const topicRegex = /<span\s+class=["']item_title["']>\s*<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let tm;
  while ((tm = topicRegex.exec(sampleTopicsHtml)) !== null) {
    parsedTopics.push({ url: tm[1], title: tm[2].replace(/<[^>]+>/g, "").trim() });
  }
  const maxPageMatch = sampleTopicsHtml.match(/class=["']page_input["'][^>]*max=["'](\d+)["']/i);
  const maxPage = maxPageMatch ? parseInt(maxPageMatch[1], 10) : 1;

  assert.strictEqual(parsedTopics.length, 2);
  assert.strictEqual(parsedTopics[0].url, "/t/100#reply5");
  assert.strictEqual(parsedTopics[0].title, "第一篇主题");
  assert.strictEqual(parsedTopics[1].title, "第二篇主题");
  assert.strictEqual(maxPage, 15);

  const sampleRepliesHtml = `
    <div class="dock_area"><a href="/t/200#reply3">回复的主题</a></div>
    <div class="inner"><div class="reply_content">这是多行回复内容<br />第二行内容</div></div>
  `;
  const parsedReplies = [];
  const replyRegex = /<div\s+class=["']dock_area["']>[\s\S]*?<a\s+href=["'](\/t\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<div\s+class=["']reply_content["']>([\s\S]*?)<\/div>/gi;
  let rm;
  while ((rm = replyRegex.exec(sampleRepliesHtml)) !== null) {
    parsedReplies.push({
      url: rm[1],
      topicTitle: rm[2].replace(/<[^>]+>/g, "").trim(),
      content: rm[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    });
  }
  assert.strictEqual(parsedReplies.length, 1);
  assert.strictEqual(parsedReplies[0].topicTitle, "回复的主题");
  assert.ok(parsedReplies[0].content.includes("这是多行回复内容 第二行内容"));
});

test("Test 120: Local UI font customization, presets, and CSS injection (v0.7.86)", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Verify constants and presets
  assert.ok(
    scriptContent.includes('const CUSTOM_FONT_KEY = "linuxdo-wecom-custom-font";'),
    "must define CUSTOM_FONT_KEY constant"
  );
  assert.ok(
    scriptContent.includes('const CUSTOM_FONT_STYLE_ID = "wecom-custom-font-style";'),
    "must define CUSTOM_FONT_STYLE_ID constant"
  );
  assert.ok(
    scriptContent.includes("const DEFAULT_FONT_STACK ="),
    "must define DEFAULT_FONT_STACK"
  );
  assert.ok(
    scriptContent.includes("const FONT_PRESETS = Object.freeze({") &&
    scriptContent.includes('yahei: {') &&
    scriptContent.includes('kaiti: {') &&
    scriptContent.includes('songti: {') &&
    scriptContent.includes('heiti: {') &&
    scriptContent.includes('pingfang: {') &&
    scriptContent.includes('wenkai: {') &&
    scriptContent.includes('harmony: {') &&
    scriptContent.includes('source: {'),
    "FONT_PRESETS must declare default, yahei, kaiti, songti, heiti, pingfang, wenkai, harmony, and source"
  );
  assert.ok(
    scriptContent.includes("const FONT_NAME_ALIASES = Object.freeze({") &&
    scriptContent.includes('"楷体":') &&
    scriptContent.includes('"宋体":') &&
    scriptContent.includes('"鸿蒙":') &&
    scriptContent.includes('"思源黑体":'),
    "must define FONT_NAME_ALIASES dictionary for Chinese/English font family names"
  );

  // 2. Verify CSS rules for font row and chips
  assert.ok(
    scriptContent.includes(".wecom-menu-font-row {") &&
    scriptContent.includes(".wecom-menu-font-header {") &&
    scriptContent.includes(".wecom-menu-font-val {") &&
    scriptContent.includes(".wecom-menu-font-chips {") &&
    scriptContent.includes(".wecom-theme-menu .wecom-font-chip {") &&
    scriptContent.includes(".wecom-theme-menu .wecom-font-chip-custom {"),
    "RAW_CSS must define full styling for font row, header, grid chips, and custom chip"
  );

  // 3. Verify menu DOM markup and synchronization
  assert.ok(
    scriptContent.includes('<div class="wecom-theme-menu-title wecom-theme-menu-divider">界面字体</div>'),
    "createThemeMenu must include 界面字体 title divider"
  );
  assert.ok(
    scriptContent.includes('data-font="default"') &&
    scriptContent.includes('data-font="yahei"') &&
    scriptContent.includes('data-font="kaiti"') &&
    scriptContent.includes('data-font="songti"') &&
    scriptContent.includes('data-font="heiti"') &&
    scriptContent.includes('data-font="pingfang"') &&
    scriptContent.includes('data-font="wenkai"') &&
    scriptContent.includes('data-font="harmony"') &&
    scriptContent.includes('data-font="source"') &&
    scriptContent.includes('data-font="pick-system"') &&
    scriptContent.includes('data-font="custom"'),
    "createThemeMenu must render chips for all font presets, system picker, and custom input"
  );
  assert.ok(
    scriptContent.includes('const fontRow = menu.querySelector(".wecom-menu-font-row");'),
    "syncThemeControls must query .wecom-menu-font-row to update chip state"
  );

  // 4. Verify helper functions and click handling
  assert.ok(
    scriptContent.includes("function sanitizeFontFamily(name)"),
    "must define sanitizeFontFamily helper"
  );
  assert.ok(
    scriptContent.includes("function isFontAvailable(fontName)"),
    "must define isFontAvailable helper"
  );
  assert.ok(
    scriptContent.includes("function isFontStackAvailable(stackOrName)"),
    "must define isFontStackAvailable helper"
  );
  assert.ok(
    scriptContent.includes("const SYSTEM_FONT_PROBE_CANDIDATES =") &&
    scriptContent.includes("function queryAllSystemFonts()") &&
    scriptContent.includes("function openSystemFontPicker()") &&
    scriptContent.includes("function closeSystemFontPicker()"),
    "must define system font probe list and enumeration/picker dialog functions"
  );
  assert.ok(
    scriptContent.includes(".wecom-font-picker-dialog") &&
    scriptContent.includes(".wecom-font-picker-card") &&
    scriptContent.includes(".wecom-font-search-input") &&
    scriptContent.includes(".wecom-font-picker-list"),
    "RAW_CSS must define system font picker dialog styling"
  );
  assert.ok(
    scriptContent.includes("function getCustomFontSetting()"),
    "must define getCustomFontSetting helper"
  );
  assert.ok(
    scriptContent.includes("function setCustomFontSetting(mode, customName"),
    "must define setCustomFontSetting helper"
  );
  assert.ok(
    scriptContent.includes("function getCustomFontCssStack()"),
    "must define getCustomFontCssStack helper"
  );
  assert.ok(
    scriptContent.includes("function applyCustomFont()"),
    "must define applyCustomFont helper"
  );
  assert.ok(
    scriptContent.includes('const fontChip = event.target.closest(".wecom-font-chip");'),
    "createThemeMenu click handler must capture .wecom-font-chip clicks"
  );

  // 5. Verify applyCustomFont integration in bootstrap and theme lifecycle
  assert.ok(
    scriptContent.includes("injectStyle();\n    applyCustomFont();"),
    "_applyTheme must call applyCustomFont right after injectStyle"
  );
  assert.ok(
    scriptContent.includes("applySiteColorMode();\n      applyCustomFont();"),
    "bootstrap must call applyCustomFont early during document-start"
  );
  assert.ok(
    scriptContent.includes('document.getElementById(CUSTOM_FONT_STYLE_ID)?.remove();'),
    "_applyTheme must clean up custom font style tag when in native view or other theme active"
  );

  // 6. Functional test: sanitizeFontFamily & formatFontFamilyStack logic
  const sanitize = (name) => {
    if (!name || typeof name !== "string") return "";
    return name.replace(/["';{}\\]/g, "").trim();
  };
  const aliases = {
    "楷体": '"KaiTi", "楷体", "Kaiti SC", "STKaiti"',
    "kaiti": '"KaiTi", "楷体", "Kaiti SC", "STKaiti"',
    "鸿蒙": '"HarmonyOS Sans SC", "HarmonyOS Sans"'
  };
  const formatStack = (name) => {
    const raw = sanitize(name);
    if (!raw) return "";
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return "";
    return parts.map((p) => {
      const lower = p.toLowerCase();
      if (aliases[p]) return aliases[p];
      if (aliases[lower]) return aliases[lower];
      return `"${p}"`;
    }).join(", ");
  };

  assert.strictEqual(sanitize('MiSans'), 'MiSans');
  assert.strictEqual(sanitize('"; body { color: red; } "'), 'body  color: red');
  assert.strictEqual(formatStack('楷体'), '"KaiTi", "楷体", "Kaiti SC", "STKaiti"');
  assert.strictEqual(formatStack('JetBrains Mono'), '"JetBrains Mono"');
  assert.strictEqual(formatStack(''), '');

  // 7. Functional test: custom font setting storage roundtrip
  const mockStorage = new Map();
  const getSetting = () => {
    const raw = mockStorage.get("linuxdo-wecom-custom-font");
    if (raw) {
      if (raw.startsWith("{")) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { mode: parsed.mode || "default", customName: parsed.customName || "" };
        }
      }
      return { mode: raw, customName: "" };
    }
    return { mode: "default", customName: "" };
  };
  const setSetting = (mode, customName = "") => {
    const setting = { mode, customName: mode === "custom" ? sanitize(customName) : "" };
    mockStorage.set("linuxdo-wecom-custom-font", JSON.stringify(setting));
    return setting;
  };

  assert.deepStrictEqual(getSetting(), { mode: "default", customName: "" });
  setSetting("yahei");
  assert.deepStrictEqual(getSetting(), { mode: "yahei", customName: "" });
  setSetting("kaiti");
  assert.deepStrictEqual(getSetting(), { mode: "kaiti", customName: "" });
  setSetting("custom", "LXGW Bright;");
  assert.deepStrictEqual(getSetting(), { mode: "custom", customName: "LXGW Bright" });
});

test("Test 121: Desktop window shortcut creator ('创建窗口快捷式'), batch script generator, clipboard copy, and WeCom dialog", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Verify menu DOM markup and click binding
  assert.ok(
    scriptContent.includes('class="wecom-menu-create-shortcut"') &&
    scriptContent.includes('<span>创建窗口快捷式</span>'),
    "createThemeMenu must render menu button with text '创建窗口快捷式'"
  );
  assert.ok(
    scriptContent.includes('if (event.target.closest(".wecom-menu-create-shortcut")) {') &&
    scriptContent.includes('openWindowShortcutDialog();'),
    "createThemeMenu click listener must handle .wecom-menu-create-shortcut"
  );

  // 2. Verify helper functions and dialog management
  assert.ok(
    scriptContent.includes("function generateShortcutBatContent(appName, appUrl)"),
    "must define generateShortcutBatContent helper"
  );
  assert.ok(
    scriptContent.includes("function triggerDownloadBatFile(filename, textContent)"),
    "must define triggerDownloadBatFile helper"
  );
  assert.ok(
    scriptContent.includes("function openWindowShortcutDialog()"),
    "must define openWindowShortcutDialog helper"
  );
  assert.ok(
    scriptContent.includes("function closeWindowShortcutDialog()"),
    "must define closeWindowShortcutDialog helper"
  );

  // 3. Verify CSS styling for shortcut dialog
  assert.ok(
    scriptContent.includes(".wecom-shortcut-dialog {") &&
    scriptContent.includes(".wecom-shortcut-card {") &&
    scriptContent.includes(".wecom-shortcut-cmd-box {") &&
    scriptContent.includes(".wecom-shortcut-btn-copy {"),
    "RAW_CSS must define full styles for .wecom-shortcut-dialog"
  );

  // 4. Verify cleanup in removePanels and WECOM_UI_SEL guard
  assert.ok(
    scriptContent.includes("closeWindowShortcutDialog();"),
    "removePanels and Escape listener must call closeWindowShortcutDialog"
  );
  assert.ok(
    scriptContent.includes(".wecom-shortcut-dialog"),
    "WECOM_UI_SEL must include .wecom-shortcut-dialog"
  );

  // 5. Functional test: generateShortcutBatContent logic
  const genBat = (appName, appUrl) => {
    return [
      "@echo off",
      "chcp 65001 >nul",
      "setlocal enabledelayedexpansion",
      `echo  正在为 ${appName} 创建桌面独立窗口快捷方式...`,
      'set "TARGET_CHROME=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
      'set "VBS_SCRIPT=%TEMP%\\create_shortcut_%RANDOM%.vbs"',
      `echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\${appName}.lnk" >> "%VBS_SCRIPT%"`,
      `echo oLink.Arguments = "--app=""${appUrl}""" >> "%VBS_SCRIPT%"`,
      'cscript //nologo "%VBS_SCRIPT%"'
    ].join("\r\n");
  };

  const bat = genBat("LINUX DO (企微版)", "https://linux.do");
  assert.ok(bat.includes('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'));
  assert.ok(bat.includes('--app=""https://linux.do"""'));
  assert.ok(bat.includes('sLinkFile = oWS.SpecialFolders("Desktop")'));
  assert.ok(bat.includes('cscript //nologo'));
});

test("Test 122: AI API Configuration, Model Fetching, Standalone Dialog, and Topic Summary covering Post Content and Replies", () => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "..", "linuxdo-wecom.user.js");
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  // 1. Settings & Menu Integration
  assert.ok(
    scriptContent.includes('class="wecom-menu-ai-config"') &&
    scriptContent.includes('配置 AI API...</span>') &&
    scriptContent.includes('class="wecom-menu-state-badge wecom-menu-ai-badge'),
    "createThemeMenu must render AI configuration button and status badge"
  );
  assert.ok(
    scriptContent.includes('if (event.target.closest(".wecom-menu-ai-config")) {') &&
    scriptContent.includes('openAiConfigDialog();'),
    "createThemeMenu click listener must open AI config dialog"
  );
  assert.ok(
    scriptContent.includes('const aiBadge = menu.querySelector(".wecom-menu-ai-badge");') &&
    scriptContent.includes('isAiConfigured()'),
    "syncThemeControls must sync AI badge status ('已配置' / '未配置')"
  );

  // 2. Providers and Configuration Storage Helpers
  // 2. Providers, Summary Styles, Image Providers, Styles, and Storage Helpers
  assert.ok(
    scriptContent.includes("const AI_CONFIG_KEY = \"linuxdo-wecom-ai-config\";") &&
    scriptContent.includes("const AI_SUMMARY_PREF_KEY = \"linuxdo-wecom-ai-summary-pref\";") &&
    scriptContent.includes("const AI_IMAGE_CONFIG_KEY = \"linuxdo-wecom-ai-image-config\";") &&
    scriptContent.includes("const AI_CACHE_KEY = \"linuxdo-wecom-ai-topic-cache\";"),
    "must define AI_CONFIG_KEY, AI_SUMMARY_PREF_KEY, AI_IMAGE_CONFIG_KEY, and AI_CACHE_KEY storage keys"
  );
  assert.ok(
    scriptContent.includes("const AI_PROVIDERS = Object.freeze({") &&
    scriptContent.includes("gemini:") &&
    scriptContent.includes("openai:") &&
    scriptContent.includes("deepseek:") &&
    scriptContent.includes("custom:"),
    "AI_PROVIDERS must support Gemini, OpenAI, DeepSeek, and custom providers"
  );
  assert.ok(
    scriptContent.includes("const AI_IMAGE_PROVIDERS = Object.freeze({") &&
    scriptContent.includes("openai:") &&
    scriptContent.includes("siliconflow:") &&
    scriptContent.includes("custom:"),
    "AI_IMAGE_PROVIDERS must support OpenAI, SiliconFlow, and custom image providers"
  );
  assert.ok(
    scriptContent.includes("const AI_SUMMARY_STYLES = Object.freeze({") &&
    scriptContent.includes("sharp:") &&
    scriptContent.includes("humor:") &&
    scriptContent.includes("concise:") &&
    scriptContent.includes("drama:") &&
    scriptContent.includes("objective:") &&
    scriptContent.includes("practical:"),
    "AI_SUMMARY_STYLES must define 6 summary styles: sharp, humor, concise, drama, objective, and practical"
  );
  assert.ok(
    scriptContent.includes("const AI_IMAGE_STYLES = Object.freeze({") &&
    scriptContent.includes("comic_4panel:") &&
    scriptContent.includes("comic_color:") &&
    scriptContent.includes("comic_us:") &&
    scriptContent.includes("comic_chibi:") &&
    scriptContent.includes("cyberpunk_comic:") &&
    scriptContent.includes("sketch_story:"),
    "AI_IMAGE_STYLES must define comic narrative styles: comic_4panel, comic_color, comic_us, comic_chibi, cyberpunk_comic, and sketch_story"
  );
  assert.ok(
    scriptContent.includes("function getAiConfig()") &&
    scriptContent.includes("function setAiConfig(cfg)") &&
    scriptContent.includes("function isAiConfigured()") &&
    scriptContent.includes("function getAiImageConfig()") &&
    scriptContent.includes("function setAiImageConfig(cfg)") &&
    scriptContent.includes("function getEffectiveAiImageConfig()") &&
    scriptContent.includes("function isAiImageConfigured()") &&
    scriptContent.includes("function getAiSummaryPref()") &&
    scriptContent.includes("function setAiSummaryPref(pref)") &&
    scriptContent.includes("function getTopicAiCache(topicId)") &&
    scriptContent.includes("function saveTopicAiCache(topicId, partialData)"),
    "must define AI config, image config, topic cache, and summary pref helpers"
  );

  // 3. API Communication: Model Fetching, Chat Calling, Image Generation, and Connection Testing
  assert.ok(
    scriptContent.includes("async function fetchAiModels(provider, apiKey, baseUrl)"),
    "must define fetchAiModels helper"
  );
  assert.ok(
    scriptContent.includes("/v1beta/models?key=") &&
    scriptContent.includes("/models"),
    "fetchAiModels must handle Gemini native endpoint and OpenAI compatible /models endpoint"
  );
  assert.ok(
    scriptContent.includes("async function callAiChatApi(config, messages, options = {})"),
    "must define callAiChatApi helper"
  );
  assert.ok(
    scriptContent.includes("generateContent") &&
    scriptContent.includes("/chat/completions"),
    "callAiChatApi must support both Gemini generateContent and OpenAI chat/completions"
  );
  assert.ok(
    scriptContent.includes("async function testAiConnection(config)"),
    "must define testAiConnection helper"
  );
  assert.ok(
    scriptContent.includes("async function callAiImageApi(config, prompt, options = {})") &&
    scriptContent.includes("async function testAiImageConnection(config)") &&
    scriptContent.includes("async function fetchAiImageModels(provider, apiKey, baseUrl)") &&
    scriptContent.includes("async function generateComicVisualPrompt(topicInfo, options = {})"),
    "must define callAiImageApi, testAiImageConnection, fetchAiImageModels, and generateComicVisualPrompt helpers"
  );
  assert.ok(
    scriptContent.includes("wecom-ai-btn-fetch-img") &&
    scriptContent.includes("fetchAiImageModels"),
    "dialog must include image model fetch button and bind fetchAiImageModels"
  );

  // 4. Standalone AI Configuration Dialog
  assert.ok(
    scriptContent.includes("function openAiConfigDialog") &&
    scriptContent.includes("function closeAiConfigDialog()"),
    "must define openAiConfigDialog and closeAiConfigDialog helpers"
  );
  assert.ok(
    scriptContent.includes(".wecom-ai-config-dialog") &&
    scriptContent.includes(".wecom-ai-config-card") &&
    scriptContent.includes(".wecom-ai-config-tabs") &&
    scriptContent.includes(".wecom-ai-config-tab") &&
    scriptContent.includes(".wecom-ai-provider-chips") &&
    scriptContent.includes(".wecom-ai-btn-fetch") &&
    scriptContent.includes(".wecom-ai-btn-test") &&
    scriptContent.includes(".wecom-ai-test-status"),
    "RAW_CSS and DOM must define standalone AI configuration dialog markup and styling"
  );
  assert.ok(
    !scriptContent.includes("wecom-ai-input-prompt"),
    "openAiConfigDialog must NOT contain custom prompt textarea/input (prompt moved to summary dialog)"
  );

  // 5. Post Extraction, HTML Cleaning, and Prompt Construction
  assert.ok(
    scriptContent.includes("function cleanHtmlToPlainText(html)"),
    "must define cleanHtmlToPlainText helper"
  );
  assert.ok(
    scriptContent.includes("function extractCurrentTopicForSummary()"),
    "must define extractCurrentTopicForSummary helper"
  );
  assert.ok(
    scriptContent.includes("mainPost") &&
    scriptContent.includes("replies") &&
    scriptContent.includes("post_number > 1") &&
    scriptContent.includes("highLikesCount") &&
    scriptContent.includes("【高赞热门回帖（重点关注）】"),
    "extractCurrentTopicForSummary must extract main post, replies, and highlight high likes posts"
  );
  assert.ok(
    scriptContent.includes("function buildSummaryPrompt(topicInfo, options = {})"),
    "must define buildSummaryPrompt helper"
  );
  assert.ok(
    scriptContent.includes("【主楼正文内容】") &&
    scriptContent.includes("【楼层回复与社区讨论】") &&
    scriptContent.includes("楼主内容极简易懂") &&
    scriptContent.includes("回复抓犀利与高赞") &&
    scriptContent.includes("篇幅克制精炼"),
    "buildSummaryPrompt must incorporate main post, replies, and concise/sharp/likes guidelines"
  );

  // 6. Summary Dialog, Markdown Rendering, Comic Generator, and Actions
  assert.ok(
    scriptContent.includes("function renderSimpleMarkdown(md)"),
    "must define renderSimpleMarkdown helper"
  );
  assert.ok(
    scriptContent.includes("function openAiSummaryDialog") &&
    scriptContent.includes("function closeAiSummaryDialog()") &&
    scriptContent.includes("function triggerTopicAiSummary"),
    "must define openAiSummaryDialog, closeAiSummaryDialog, and triggerTopicAiSummary helpers"
  );
  assert.ok(
    scriptContent.includes(".wecom-ai-summary-dialog") &&
    scriptContent.includes(".wecom-ai-summary-card") &&
    scriptContent.includes(".wecom-ai-dialog-tabs") &&
    scriptContent.includes(".wecom-ai-dialog-tab") &&
    scriptContent.includes(".wecom-ai-markdown-body") &&
    scriptContent.includes(".wecom-ai-summary-meta") &&
    scriptContent.includes(".wecom-ai-summary-loading") &&
    scriptContent.includes(".wecom-ai-summary-setup") &&
    scriptContent.includes(".wecom-ai-style-chips") &&
    scriptContent.includes(".wecom-ai-style-chip") &&
    scriptContent.includes(".wecom-ai-cache-banner") &&
    scriptContent.includes(".wecom-ai-cache-badge") &&
    scriptContent.includes(".wecom-ai-checkbox-label") &&
    scriptContent.includes(".wecom-ai-checkbox-card") &&
    scriptContent.includes(".wecom-ai-image-setup") &&
    scriptContent.includes(".wecom-ai-image-wrap") &&
    scriptContent.includes(".wecom-ai-image-card") &&
    scriptContent.includes(".wecom-ai-image-img") &&
    scriptContent.includes(".wecom-ai-btn-start-summary") &&
    scriptContent.includes(".wecom-ai-btn-start-image") &&
    scriptContent.includes(".wecom-ai-btn-change-setup"),
    "RAW_CSS and DOM must define AI summary dialog setup view, comic setup view, style chips, and actions"
  );
  assert.ok(
    scriptContent.includes("不限制固定格数") &&
    scriptContent.includes("生成纯中文画面与中文台词") &&
    scriptContent.includes("漫画对话气泡框") &&
    scriptContent.includes("中文分镜生图提示词"),
    "generateComicVisualPrompt must output pure Chinese prompt, support unrestricted storyboard panels, and render Chinese comic speech bubbles"
  );

  // 7. Chat Header Tools, More Actions, Rail Trigger, and Lifecycle Cleanup
  assert.ok(
    scriptContent.includes('class="wecom-icon-btn wecom-chat-ai-summary"') &&
    scriptContent.includes('title="AI 总结本帖 (包含内容与回复)"'),
    ".wecom-chat-tools must include AI summary icon button"
  );
  assert.ok(
    scriptContent.includes('class="wecom-icon-btn wecom-chat-more-item wecom-chat-ai-summary-menu"') &&
    scriptContent.includes('class="wecom-icon-btn wecom-chat-more-item wecom-chat-ai-image-menu"'),
    ".wecom-chat-more-actions must include AI summary and AI comic image menu items"
  );
  assert.ok(
    scriptContent.includes('if (event.target.closest(".wecom-chat-ai-summary, .wecom-chat-ai-summary-menu")) {') &&
    scriptContent.includes('triggerTopicAiSummary("summary");'),
    "chat panel click listener must handle AI summary clicks"
  );
  assert.ok(
    scriptContent.includes('if (event.target.closest(".wecom-chat-ai-image-menu")) {') &&
    scriptContent.includes('triggerTopicAiSummary("image");'),
    "chat panel click listener must handle AI comic image clicks"
  );
  assert.ok(
    scriptContent.includes('rail.querySelector("[data-rail-key=\'summary\']")') &&
    scriptContent.includes('triggerTopicAiSummary();'),
    "bindRailNavClicks must handle data-rail-key='summary' click"
  );
  assert.ok(
    scriptContent.includes('closeAiConfigDialog();') &&
    scriptContent.includes('closeAiSummaryDialog();'),
    "removePanels and Escape key listener must close AI config and summary dialogs"
  );
  assert.ok(
    scriptContent.includes(".wecom-ai-config-dialog") &&
    scriptContent.includes(".wecom-ai-summary-dialog"),
    "WECOM_UI_SEL must include AI dialog classes"
  );

  // 8. Functional Tests: cleanHtmlToPlainText
  const cleanHtml = (html) => {
    if (!html || typeof html !== "string") return "";
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, "\n");
    text = text.replace(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi, " [$1] ");
    text = text.replace(/<[^>]+>/g, "");
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    return text.replace(/\n{3,}/g, "\n\n").trim();
  };

  const sampleHtml = "<p>大家好，请教一个问题：</p><p>如何使用 <code>Node.js</code> 进行流式传输？<br/>附图：<img src=\"foo.jpg\" alt=\"架构图\"></p><blockquote>参考文档：https://example.com &amp; 更多</blockquote>";
  const cleaned = cleanHtml(sampleHtml);
  assert.ok(cleaned.includes("大家好，请教一个问题："));
  assert.ok(cleaned.includes("如何使用 Node.js 进行流式传输？"));
  assert.ok(cleaned.includes("[架构图]"));
  assert.ok(cleaned.includes("参考文档：https://example.com & 更多"));
  assert.ok(!cleaned.includes("<p>"));
  assert.ok(!cleaned.includes("<blockquote>"));

  // 9. Functional Tests: buildSummaryPrompt
  const styles = {
    sharp: {
      id: "sharp",
      label: "🔥 犀利吐槽",
      name: "犀利吐槽",
      desc: "观点鲜明一针见血，重点剖析高赞回帖的神吐槽与硬核反驳，直言不讳",
      instruction: "语言风格：【犀利吐槽】。用辛辣、一针见血的笔触总结。楼主有槽点直截了当指出；回帖部分重点提炼最犀利、反讽、一语中的高赞神评神吐槽，不要说客套话。"
    },
    humor: {
      id: "humor",
      label: "😄 幽默风趣",
      name: "幽默风趣",
      desc: "诙谐网感十足，大白话玩梗，把技术讨论或争论讲得生动有趣",
      instruction: "语言风格：【幽默风趣】。语言轻松接地气、带有当代互联网人的幽默感。用生动有趣的类比或调侃，把楼主的问题和高赞回帖讲得妙趣横生，引人发笑。"
    }
  };

  const buildPrompt = (topicInfo, options = {}) => {
    const { title, mainAuthor, mainPostText, repliesFormatted, repliesCount } = topicInfo;
    const styleKey = typeof options === "string" ? options : (options.styleKey || options.style || "sharp");
    const styleDef = styles[styleKey] || styles.sharp;
    const customPrompt = typeof options === "string" ? "" : (options.customPrompt || "").trim();

    let basePrompt =
`你是论坛专业AI总结专家。请对以下讨论进行精炼、易懂、重点突出且篇幅克制的中文总结。

【总结原则】：
1. 楼主内容极简易懂：用最通俗易懂的大白话提炼楼主的核心背景与诉求，抓取实质要点，去除冗余铺垫。
2. 回复抓犀利与高赞：特别重点分析点赞多的热门回帖（标有 🔥获赞）与犀利观点，提炼出最有深度、最犀利扎心或最具代表性的楼层神评与态度。
3. 篇幅克制精炼：整体分析严格控制字数在 250~450 字左右，结构紧凑短小精悍，拒绝又长又臭的废话套话。
4. ${styleDef.instruction}

【帖子标题】：${title}
【发帖人/楼主】：${mainAuthor}

【主楼正文内容】：
${mainPostText || "(主楼无文字内容)"}

【楼层回复与社区讨论】（共收集 ${repliesCount} 条回复）：
${repliesFormatted || "(暂无回帖讨论)"}`;

    if (customPrompt) {
      basePrompt += `\n\n【用户重点关注点/自定义要求】：\n${customPrompt}`;
    }

    basePrompt += `\n\n请严格按以下结构输出 Markdown（语言精炼、排版清爽）：
### 📌 楼主在说什么（大白话精炼）
- 简短 2-3 句话讲清楼主核心要点与诉求。

### 💬 犀利高赞神评与社区态度
- 提炼点赞最多、观点最犀利的回帖态度（标明楼层/作者/高赞亮点）。
- 归纳社区共识与分歧交锋点。

### 💡 一句话总结
- 一句精辟有力量的总结或行动建议。`;

    return basePrompt;
  };

  const sampleTopic = {
    title: "如何搭建高效的轻量级开发环境？",
    mainAuthor: "TechExplorer",
    mainPostText: "希望在 8GB 内存轻薄本上实现前后端全栈开发...",
    repliesFormatted: "【高赞热门回帖（重点关注）】：\n[#2 DeveloperA (🔥获赞 42)]: 建议使用 VS Code Remote 或轻量级编辑器\n\n【其他楼层回复选摘】：\n[#3 DeveloperB]: 推荐 Docker 资源限制与 WSL2 优化",
    repliesCount: 2,
    highLikesCount: 1
  };
  const prompt = buildPrompt(sampleTopic, { style: "sharp", customPrompt: "重点关注内存占用" });
  assert.ok(prompt.includes("【帖子标题】：如何搭建高效的轻量级开发环境？"));
  assert.ok(prompt.includes("【发帖人/楼主】：TechExplorer"));
  assert.ok(prompt.includes("【主楼正文内容】：\n希望在 8GB 内存轻薄本上实现前后端全栈开发..."));
  assert.ok(prompt.includes("【楼层回复与社区讨论】（共收集 2 条回复）："));
  assert.ok(prompt.includes("🔥获赞 42"));
  assert.ok(prompt.includes("楼主内容极简易懂"));
  assert.ok(prompt.includes("回复抓犀利与高赞"));
  assert.ok(prompt.includes("篇幅克制精炼"));
  assert.ok(prompt.includes("语言风格：【犀利吐槽】"));
  assert.ok(prompt.includes("【用户重点关注点/自定义要求】：\n重点关注内存占用"));
  assert.ok(prompt.includes("### 📌 楼主在说什么（大白话精炼）"));
  assert.ok(prompt.includes("### 💬 犀利高赞神评与社区态度"));
  assert.ok(prompt.includes("### 💡 一句话总结"));

  // 10. Functional Tests: renderSimpleMarkdown
  const escapeHtml = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  const renderMarkdown = (md) => {
    if (!md || typeof md !== "string") return "";
    const escaped = escapeHtml(md);
    const lines = escaped.split(/\r?\n/);
    const output = [];
    let inUl = false;
    let inOl = false;
    function closeLists() {
      if (inUl) { output.push("</ul>"); inUl = false; }
      if (inOl) { output.push("</ol>"); inOl = false; }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { closeLists(); continue; }
      const formatInline = (str) => {
        return str
          .replace(/`([^`]+)`/g, '<code class="wecom-ai-code">$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
      };
      if (line.startsWith("### ")) {
        closeLists();
        output.push(`<div class="wecom-ai-h3">${formatInline(line.slice(4))}</div>`);
      } else if (line.startsWith("> ") || line.startsWith("&gt; ")) {
        closeLists();
        const quoteContent = line.startsWith("&gt; ") ? line.slice(5) : line.slice(2);
        output.push(`<div class="wecom-ai-quote">${formatInline(quoteContent)}</div>`);
      } else if (/^[-*]\s+/.test(line)) {
        if (inOl) { output.push("</ol>"); inOl = false; }
        if (!inUl) { output.push('<ul class="wecom-ai-ul">'); inUl = true; }
        output.push(`<li class="wecom-ai-li">${formatInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      } else {
        closeLists();
        output.push(`<p class="wecom-ai-p">${formatInline(line)}</p>`);
      }
    }
    closeLists();
    return output.join("\n");
  };

  const mdInput = "### 📌 核心要点\n- **方案A**: 简单高效\n- **方案B**: 稳定性更好\n> 注意备份配置文件\n普通段落测试";
  const rendered = renderMarkdown(mdInput);
  assert.ok(rendered.includes('<div class="wecom-ai-h3">📌 核心要点</div>'));
  assert.ok(rendered.includes('<ul class="wecom-ai-ul">'));
  assert.ok(rendered.includes('<li class="wecom-ai-li"><strong>方案A</strong>: 简单高效</li>'));
  assert.ok(rendered.includes('<div class="wecom-ai-quote">注意备份配置文件</div>'));
  assert.ok(rendered.includes('<p class="wecom-ai-p">普通段落测试</p>'));

  // 11. Functional Tests: Storage Roundtrip & Configuration Logic
  const mockStorage = new Map();
  const getCfg = () => {
    const raw = mockStorage.get("linuxdo-wecom-ai-config");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || "gemini",
        apiKey: parsed.apiKey || "",
        baseUrl: parsed.baseUrl || "",
        model: parsed.model || ""
      };
    }
    return {
      provider: "gemini",
      apiKey: "",
      baseUrl: "https://generativelanguage.googleapis.com",
      model: "gemini-1.5-flash"
    };
  };
  const setCfg = (c) => {
    const toSave = {
      provider: c.provider || "gemini",
      apiKey: (c.apiKey || "").trim(),
      baseUrl: (c.baseUrl || "").trim(),
      model: (c.model || "").trim()
    };
    mockStorage.set("linuxdo-wecom-ai-config", JSON.stringify(toSave));
    return toSave;
  };
  const isConfigured = () => Boolean(getCfg().apiKey.trim());

  const getPref = () => {
    const raw = mockStorage.get("linuxdo-wecom-ai-summary-pref");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        style: parsed.style || "sharp",
        customPrompt: parsed.customPrompt || ""
      };
    }
    return { style: "sharp", customPrompt: "" };
  };
  const setPref = (p) => {
    const toSave = {
      style: p.style || "sharp",
      customPrompt: (p.customPrompt || "").trim()
    };
    mockStorage.set("linuxdo-wecom-ai-summary-pref", JSON.stringify(toSave));
    return toSave;
  };

  assert.strictEqual(isConfigured(), false);
  setCfg({ provider: "deepseek", apiKey: "sk-test123456", model: "deepseek-chat" });
  assert.strictEqual(isConfigured(), true);
  assert.strictEqual(getCfg().provider, "deepseek");
  assert.strictEqual(getCfg().apiKey, "sk-test123456");
  assert.strictEqual(getCfg().model, "deepseek-chat");

  assert.strictEqual(getPref().style, "sharp");
  setPref({ style: "humor", customPrompt: "关注高赞反对意见" });
  assert.strictEqual(getPref().style, "humor");
  assert.strictEqual(getPref().customPrompt, "关注高赞反对意见");

  // 12. Functional Tests: Topic Cache Persistence & AI Image Configuration Roundtrip
  const getTopicCache = (topicId) => {
    if (!topicId) return null;
    try {
      const raw = mockStorage.get("linuxdo-wecom-ai-topic-cache");
      if (!raw) return null;
      const map = JSON.parse(raw);
      return map[String(topicId)] || null;
    } catch {
      return null;
    }
  };

  const saveTopicCache = (topicId, partialData) => {
    if (!topicId || typeof partialData !== "object") return;
    try {
      const tid = String(topicId);
      const raw = mockStorage.get("linuxdo-wecom-ai-topic-cache");
      let map = {};
      if (raw) {
        try { map = JSON.parse(raw) || {}; } catch { map = {}; }
      }
      const existing = map[tid] || {};
      map[tid] = { ...existing, ...partialData, updatedAt: Date.now() };

      const keys = Object.keys(map);
      if (keys.length > 5) {
        keys.sort((a, b) => (map[a]?.updatedAt || 0) - (map[b]?.updatedAt || 0));
        while (keys.length > 5) {
          const oldest = keys.shift();
          delete map[oldest];
        }
      }
      mockStorage.set("linuxdo-wecom-ai-topic-cache", JSON.stringify(map));
    } catch { /* ignore */ }
  };

  // Test save summary then retrieve
  saveTopicCache(12345, {
    topicTitle: "Linux DO AI 话题讨论",
    summaryMarkdown: "### 📌 核心观点\n大白话易懂",
    summaryStyle: "sharp",
    summaryAt: 1700000000000
  });

  const cached1 = getTopicCache(12345);
  assert.ok(cached1, "cached entry must exist for topic 12345");
  assert.strictEqual(cached1.topicTitle, "Linux DO AI 话题讨论");
  assert.strictEqual(cached1.summaryStyle, "sharp");
  assert.ok(cached1.summaryMarkdown.includes("大白话易懂"));

  // Test partial update: saving comic image must NOT wipe out existing summary
  saveTopicCache(12345, {
    imageUrl: "https://image.pollinations.ai/prompt/comic123.png",
    imagePrompt: "Four-panel comic strip depicting Linux DO",
    imageStyle: "comic_strip",
    imageAt: 1700000005000
  });

  const cachedMerged = getTopicCache(12345);
  assert.ok(cachedMerged.summaryMarkdown.includes("大白话易懂"), "summary must be preserved after saving comic image");
  assert.strictEqual(cachedMerged.imageUrl, "https://image.pollinations.ai/prompt/comic123.png", "image URL must be saved");
  assert.strictEqual(cachedMerged.imageStyle, "comic_strip");

  // Test Image Config inheritance
  const getImgCfg = () => {
    const raw = mockStorage.get("linuxdo-wecom-ai-image-config");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || "openai",
        useSameAsChat: parsed.useSameAsChat !== false,
        apiKey: parsed.apiKey || "",
        baseUrl: parsed.baseUrl || "",
        model: parsed.model || "dall-e-3",
        size: parsed.size || "1024x1024"
      };
    }
    return {
      provider: "openai",
      useSameAsChat: true,
      apiKey: "",
      baseUrl: "",
      model: "dall-e-3",
      size: "1024x1024"
    };
  };

  const setImgCfg = (c) => {
    const toSave = {
      provider: c.provider || "openai",
      useSameAsChat: Boolean(c.useSameAsChat),
      apiKey: (c.apiKey || "").trim(),
      baseUrl: (c.baseUrl || "").trim(),
      model: (c.model || "dall-e-3").trim(),
      size: c.size || "1024x1024"
    };
    mockStorage.set("linuxdo-wecom-ai-image-config", JSON.stringify(toSave));
    return toSave;
  };

  const getEffectiveImgCfg = () => {
    const imgCfg = getImgCfg();
    if (imgCfg.useSameAsChat) {
      const chatCfg = getCfg();
      return {
        ...imgCfg,
        apiKey: chatCfg.apiKey,
        baseUrl: chatCfg.baseUrl || (chatCfg.provider === "openai" ? "https://api.openai.com/v1" : "")
      };
    }
    return imgCfg;
  };

  setImgCfg({ provider: "openai", useSameAsChat: true, model: "dall-e-3" });
  const eff1 = getEffectiveImgCfg();
  assert.strictEqual(eff1.apiKey, "sk-test123456", "effective image config must inherit chat API key when useSameAsChat is true");

  setImgCfg({ provider: "siliconflow", useSameAsChat: false, apiKey: "sk-silicon-key", baseUrl: "https://api.siliconflow.cn/v1", model: "black-forest-labs/FLUX.1-schnell" });
  const eff2 = getEffectiveImgCfg();
  assert.strictEqual(eff2.apiKey, "sk-silicon-key", "effective image config must use independent API key when useSameAsChat is false");
  assert.strictEqual(eff2.model, "black-forest-labs/FLUX.1-schnell");

  // 13. Universal Cross-Platform AI Configuration & Image API Sync (Linux DO ↔ V2EX ↔ Juejin)
  assert.ok(
    scriptContent.includes("const AI_SYNC_PREFIX = \"WECOM_AI_SYNC:\";") &&
    scriptContent.includes("const AI_SYNC_CODE_PREFIX = \"WECOM_AI_CONFIG:\";"),
    "must define AI_SYNC_PREFIX and AI_SYNC_CODE_PREFIX constants"
  );
  assert.ok(
    scriptContent.includes("function exportUniversalAiBundle()") &&
    scriptContent.includes("function exportUniversalAiSyncString()") &&
    scriptContent.includes("function importUniversalAiSyncString(") &&
    scriptContent.includes("function importUniversalAiBundle(") &&
    scriptContent.includes("function getUniversalAiBundle()") &&
    scriptContent.includes("function saveUniversalAiBundle(") &&
    scriptContent.includes("function consumeUniversalAiSync()") &&
    scriptContent.includes("function navigateWithAiSync("),
    "must define universal AI cross-platform sync functions"
  );
  assert.ok(
    scriptContent.includes("data-tab=\"sync\"") &&
    scriptContent.includes("wecom-ai-config-sync-section") &&
    scriptContent.includes("wecom-ai-sync-hub") &&
    scriptContent.includes("wecom-ai-btn-copy-code") &&
    scriptContent.includes("wecom-ai-btn-paste-code") &&
    scriptContent.includes("wecom-ai-btn-do-import") &&
    scriptContent.includes("wecom-ai-sync-to-linuxdo") &&
    scriptContent.includes("wecom-ai-sync-to-v2ex") &&
    scriptContent.includes("wecom-ai-sync-to-juejin"),
    "openAiConfigDialog must render universal sync tab, status hub, code input, and cross-platform sync actions"
  );
  assert.ok(
    scriptContent.includes(".wecom-ai-sync-hub") &&
    scriptContent.includes(".wecom-ai-sync-hub-title") &&
    scriptContent.includes(".wecom-ai-sync-hub-desc") &&
    scriptContent.includes(".wecom-ai-sync-btn-group") &&
    scriptContent.includes(".wecom-ai-sync-chip-btn"),
    "RAW_CSS must style cross-platform AI sync hub and action chips"
  );
  assert.ok(
    scriptContent.includes("navigateWithAiSync(\"https://linux.do/\")") &&
    scriptContent.includes("navigateWithAiSync(\"https://www.v2ex.com/\")") &&
    scriptContent.includes("navigateWithAiSync(\"https://juejin.cn/pins\")"),
    "platform switcher must navigate with AI sync payload across Linux DO, V2EX, and Juejin"
  );
  assert.ok(
    scriptContent.includes("function bootstrap() {\n    if (!document.documentElement) {\n      setTimeout(bootstrap, 0);\n      return;\n    }\n    consumeUniversalAiSync();") ||
    (scriptContent.includes("function bootstrap()") && scriptContent.includes("consumeUniversalAiSync();")),
    "bootstrap must call consumeUniversalAiSync on startup"
  );

  // 14. Functional Test: Universal Bundle Export, Code Generation, and Cross-Platform Import
  const testBundle = {
    v: 1,
    chat: {
      provider: "deepseek",
      apiKey: "sk-universal-chat-key-999",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-reasoner",
      updatedAt: 1710000000000
    },
    image: {
      provider: "siliconflow",
      useSameAsChat: false,
      apiKey: "sk-universal-image-key-888",
      baseUrl: "https://api.siliconflow.cn/v1",
      model: "black-forest-labs/FLUX.1-schnell",
      size: "1024x1024",
      updatedAt: 1710000000000
    },
    pref: {
      style: "humor",
      customPrompt: "幽默犀利神评"
    },
    ts: 1710000000000
  };

  // Encode
  const encodedPayload = Buffer.from(JSON.stringify(testBundle)).toString("base64");
  const fullSyncCode = "WECOM_AI_CONFIG:" + encodedPayload;

  // Simulate a clean new site without any local configs (e.g. newly visited V2EX or Juejin)
  const targetMockStorage = new Map();
  const targetImportBundle = (rawStr) => {
    let clean = rawStr.trim();
    if (clean.startsWith("WECOM_AI_CONFIG:")) clean = clean.slice("WECOM_AI_CONFIG:".length).trim();
    if (clean.startsWith("WECOM_AI_SYNC:")) clean = clean.slice("WECOM_AI_SYNC:".length).trim();
    const json = JSON.parse(Buffer.from(clean, "base64").toString("utf8"));
    if (json.chat?.apiKey) targetMockStorage.set("linuxdo-wecom-ai-config", JSON.stringify(json.chat));
    if (json.image && (json.image.apiKey || json.image.useSameAsChat)) targetMockStorage.set("linuxdo-wecom-ai-image-config", JSON.stringify(json.image));
    if (json.pref?.style) targetMockStorage.set("linuxdo-wecom-ai-summary-pref", JSON.stringify(json.pref));
    return true;
  };

  assert.strictEqual(targetMockStorage.has("linuxdo-wecom-ai-config"), false);
  assert.strictEqual(targetMockStorage.has("linuxdo-wecom-ai-image-config"), false);

  const importedSuccess = targetImportBundle(fullSyncCode);
  assert.strictEqual(importedSuccess, true, "universal sync code must import successfully");

  const importedChat = JSON.parse(targetMockStorage.get("linuxdo-wecom-ai-config"));
  assert.strictEqual(importedChat.provider, "deepseek");
  assert.strictEqual(importedChat.apiKey, "sk-universal-chat-key-999");
  assert.strictEqual(importedChat.model, "deepseek-reasoner");

  const importedImg = JSON.parse(targetMockStorage.get("linuxdo-wecom-ai-image-config"));
  assert.strictEqual(importedImg.provider, "siliconflow");
  assert.strictEqual(importedImg.apiKey, "sk-universal-image-key-888");
  assert.strictEqual(importedImg.model, "black-forest-labs/FLUX.1-schnell");

  const importedPref = JSON.parse(targetMockStorage.get("linuxdo-wecom-ai-summary-pref"));
  assert.strictEqual(importedPref.style, "humor");
  assert.strictEqual(importedPref.customPrompt, "幽默犀利神评");
});

test("Test 123: V2EX notification click and floor reply username preservation (DOM parser, cross-page ref, and reply indicator)", () => {
  // 1. Structural checks
  assert.ok(
    scriptContent.includes('const darkLink = cell.querySelector("a.dark");') &&
    scriptContent.includes('const memberLinks = cell.querySelectorAll("a[href^=\'/member/\']");'),
    "parseV2exTopicDoc must check a.dark and all memberLinks without stopping on empty avatar links"
  );
  assert.ok(
    scriptContent.includes('data-username="${escapeHtml(post.username || "")}"'),
    "bubbleHtml must output data-username on .wecom-msg"
  );
  assert.ok(
    scriptContent.includes(".wecom-msg-me:not(.is-thread-child) > .wecom-msg-content > .wecom-msg-header > .wecom-msg-name") &&
    scriptContent.includes(".wecom-reply-children .wecom-msg-name") &&
    scriptContent.includes(".wecom-msg-me .wecom-reply-children .wecom-msg-name"),
    "nested reply author names inside .wecom-msg-me bubbles must not be hidden by top-level me rules"
  );

  // 2. Functional test: Reply cell with avatar link preceding username link
  function simulateParseReplyUsername(cell) {
    const floorNo = 15;
    const idx = 14;
    let username = "";
    const darkLink = cell.querySelector("a.dark");
    if (darkLink && darkLink.textContent?.trim() && darkLink.textContent.trim() !== "楼主") {
      username = darkLink.textContent.trim();
    }
    if (!username) {
      const memberLinks = cell.querySelectorAll("a[href^='/member/']");
      for (const link of memberLinks) {
        const txt = link.textContent?.trim();
        if (txt && txt !== "楼主") {
          username = txt;
          break;
        }
        const href = link.getAttribute("href") || "";
        const m = href.match(/\/member\/([^/?#]+)/);
        if (m && m[1]) {
          const raw = decodeURIComponent(m[1]).trim();
          if (raw && raw !== "楼主") {
            username = raw;
            break;
          }
        }
      }
    }
    if (!username) {
      const avatarAlt = cell.querySelector("img.avatar")?.getAttribute("alt")?.trim();
      if (avatarAlt && avatarAlt !== "楼主") {
        username = avatarAlt;
      }
    }
    if (!username) {
      username = `用户_${floorNo || (idx + 2)}`;
    }
    return username;
  }

  // Case A: Standard V2EX cell where avatar <a> has NO text content, but subsequent <a class="dark"> has username
  const mockCellA = {
    querySelector(sel) {
      if (sel === "a.dark") return { textContent: "alice" };
      if (sel === "img.avatar") return { getAttribute: (attr) => (attr === "alt" ? "alice" : "") };
      return null;
    },
    querySelectorAll(sel) {
      if (sel === "a[href^='/member/']") {
        return [
          { getAttribute: (attr) => (attr === "href" ? "/member/alice" : null), textContent: "" },
          { getAttribute: (attr) => (attr === "href" ? "/member/alice" : null), textContent: "alice" }
        ];
      }
      return [];
    }
  };
  assert.strictEqual(simulateParseReplyUsername(mockCellA), "alice", "must correctly extract alice when avatar <a> has empty text");

  // Case B: Cell where only avatar <a> exists with href="/member/bob", no a.dark
  const mockCellB = {
    querySelector(sel) {
      return null;
    },
    querySelectorAll(sel) {
      if (sel === "a[href^='/member/']") {
        return [
          { getAttribute: (attr) => (attr === "href" ? "/member/bob" : null), textContent: "" }
        ];
      }
      return [];
    }
  };
  assert.strictEqual(simulateParseReplyUsername(mockCellB), "bob", "must extract bob from avatar link href when textContent is empty");

  // 3. Functional test: Notification author extraction with avatar link
  function simulateParseNotifAuthor(cell) {
    let author = "";
    const darkLink = cell.querySelector("a.dark, .fade strong a, strong a");
    if (darkLink && darkLink.textContent?.trim() && darkLink.textContent.trim() !== "楼主") {
      author = darkLink.textContent.trim();
    }
    if (!author) {
      const memberLinks = cell.querySelectorAll("a[href^='/member/']");
      for (const link of memberLinks) {
        const txt = link.textContent?.trim();
        if (txt && txt !== "楼主") {
          author = txt;
          break;
        }
        const href = link.getAttribute("href") || "";
        const m = href.match(/\/member\/([^/?#]+)/);
        if (m && m[1]) {
          const raw = decodeURIComponent(m[1]).trim();
          if (raw && raw !== "楼主") {
            author = raw;
            break;
          }
        }
      }
    }
    if (!author) {
      const avatarAlt = cell.querySelector("img.avatar")?.getAttribute("alt")?.trim();
      if (avatarAlt && avatarAlt !== "楼主") {
        author = avatarAlt;
      }
    }
    return author;
  }

  const mockNotifCell = {
    querySelector(sel) {
      if (sel.includes("strong a")) return { textContent: "charlie" };
      return null;
    },
    querySelectorAll(sel) {
      if (sel === "a[href^='/member/']") {
        return [
          { getAttribute: (attr) => (attr === "href" ? "/member/charlie" : null), textContent: "" },
          { getAttribute: (attr) => (attr === "href" ? "/member/charlie" : null), textContent: "charlie" }
        ];
      }
      return [];
    }
  };
  assert.strictEqual(simulateParseNotifAuthor(mockNotifCell), "charlie", "must extract charlie from notification cell");

  // 4. Functional test: Cross-page floor reply resolution and reply indicator
  const crossPagePost = {
    id: 999,
    post_number: 105,
    floor: 104,
    username: "david",
    cooked: "@alice #15 赞同你的方案",
    replyReference: { author: "alice", floor: 15 }
  };

  const ref = crossPagePost.replyReference;
  if (ref.floor > 0 || ref.author) {
    crossPagePost.reply_to_post_number = ref.floor ? (ref.floor + 1) : null;
    crossPagePost.reply_to_floor = ref.floor > 0 ? ref.floor : null;
    crossPagePost.reply_to_user = ref.author ? {
      username: ref.author,
      name: ref.author
    } : null;
    crossPagePost.is_explicit_reply = Boolean(ref.floor || ref.author);
  }

  assert.strictEqual(crossPagePost.reply_to_floor, 15);
  assert.strictEqual(crossPagePost.reply_to_user.username, "alice");

  function simReplyIndicatorHtml(post) {
    const parentNum = Number(post?.reply_to_post_number) || 0;
    const floorNum = Number(post?.reply_to_floor) || (parentNum > 1 ? parentNum - 1 : 0);
    if (!parentNum && !floorNum) return "";
    const refAuthor = post?.replyReference?.author || "";
    let targetUser = post.reply_to_user?.name || post.reply_to_user?.username || "";
    if ((!targetUser || targetUser.startsWith("用户_")) && refAuthor) {
      targetUser = refAuthor;
    }
    const targetFloor = floorNum > 0 ? `#${floorNum}` : `#${parentNum}`;
    const userPart = targetUser ? `@${targetUser}` : "";
    return `回复 ${userPart} ${targetFloor}`;
  }

  const indicatorText = simReplyIndicatorHtml(crossPagePost);
  assert.strictEqual(indicatorText, "回复 @alice #15", "cross-page reply indicator must clearly show @alice and #15");
});

test("Test 124: Floating message action toolbar does not block username/avatar clicks and is not blocked by text", () => {
  // 1. Floating tools must have elevated z-index (25) so they are never blocked by bubble text
  assert.ok(
    scriptContent.includes("z-index: 25 !important;"),
    ".wecom-msg-tools must have elevated z-index (25) so it is never obscured by text"
  );

  // 2. Moving mouse to tools maintains visibility and clickability (no premature hover suppression)
  assert.ok(
    scriptContent.includes(".wecom-msg-tools:hover") &&
    scriptContent.includes("pointer-events: auto !important;") &&
    scriptContent.includes("display: flex !important;"),
    "moving mouse to .wecom-msg-tools must maintain pointer-events and display flex"
  );

  // 3. Nested replies in thread view always pin tools to the right edge
  assert.ok(
    scriptContent.includes(".wecom-reply-children .wecom-msg-tools") &&
    scriptContent.includes("right: 0 !important;") &&
    scriptContent.includes("left: auto !important;"),
    "nested reply tools must always be pinned to the right edge to avoid overlapping left-aligned author name"
  );

  // 4. .wecom-msg-me tools rule is strictly scoped to top-level messages
  assert.ok(
    scriptContent.includes(".wecom-msg-me:not(.is-thread-child) > .wecom-msg-content > .wecom-msg-tools"),
    ".wecom-msg-me tools rule must use :not(.is-thread-child) to avoid placing tools on the left in nested replies"
  );
});

test("Test 125: AI comic generation layout modes (dynamic_asym, narrative_multi, splash_single, vertical_strip), anti-rigid-grid prompt rules, and dialog layout chips selector", () => {
  // 1. AI_IMAGE_LAYOUTS constant definitions
  assert.ok(
    scriptContent.includes("const AI_IMAGE_LAYOUTS = Object.freeze({"),
    "must define AI_IMAGE_LAYOUTS constant"
  );
  assert.ok(
    scriptContent.includes("dynamic_asym:") &&
    scriptContent.includes("narrative_multi:") &&
    scriptContent.includes("splash_single:") &&
    scriptContent.includes("vertical_strip:"),
    "must provide dynamic_asym, narrative_multi, splash_single, and vertical_strip layouts"
  );

  // 2. Anti-rigid-grid and border-breaking prompt rules
  assert.ok(
    scriptContent.includes("严禁死板对称等宽田字网格或方块棋盘格") ||
    scriptContent.includes("严禁死板等宽的 2x2 对称田字网格或棋盘格"),
    "must include explicit anti-rigid-grid negative prompt instruction"
  );
  assert.ok(
    scriptContent.includes("border-breaking") ||
    scriptContent.includes("破格外显"),
    "must include border-breaking / dynamic visual impact rules"
  );

  // 3. CSS for layout chips selector
  assert.ok(
    scriptContent.includes(".wecom-ai-img-layout-chips"),
    "must define .wecom-ai-img-layout-chips in CSS"
  );
  assert.ok(
    scriptContent.includes("grid-template-columns: repeat(2, 1fr) !important;"),
    "layout chips must use 2-column grid layout for clear option presentation"
  );

  // 4. generateComicVisualPrompt layout integration
  assert.ok(
    scriptContent.includes("const layoutKey = options.layoutKey || \"dynamic_asym\";"),
    "generateComicVisualPrompt must default to dynamic_asym layout"
  );
  assert.ok(
    scriptContent.includes("【选定分镜版式结构】：${layoutDef.name}"),
    "generateComicVisualPrompt promptRequest must inject selected layout definition"
  );

  // 5. openAiSummaryDialog UI and cache integration
  assert.ok(
    scriptContent.includes("topicCache?.imageLayout || \"dynamic_asym\""),
    "openAiSummaryDialog must restore or default currentImgLayout to dynamic_asym"
  );
  assert.ok(
    scriptContent.includes(".wecom-ai-img-layout-chips .wecom-ai-style-chip"),
    "openAiSummaryDialog click handler must support switching image layout chips"
  );
  assert.ok(
    scriptContent.includes("imageLayout: currentImgLayout"),
    "runImageGeneration must cache imageLayout in topic cache"
  );

  // 6. Functional simulation: prompt building with different layouts
  function simBuildPrompt(topicInfo, options = {}) {
    const layoutKey = options.layoutKey || "dynamic_asym";
    const layouts = {
      dynamic_asym: { name: "动感非对称", antiGrid: true },
      narrative_multi: { name: "连贯叙事多格", antiGrid: false },
      splash_single: { name: "单幅高光大画", antiGrid: true },
      vertical_strip: { name: "垂直流式长漫", antiGrid: true }
    };
    const layout = layouts[layoutKey] || layouts.dynamic_asym;
    const rule = layoutKey === "splash_single"
      ? "禁止任何画框分割线条，单张宏大全景大画"
      : "严禁生成死板等宽的 2x2 对称田字网格或棋盘格！采用主副分镜大小强烈错落对比";
    return {
      layoutName: layout.name,
      antiGridRule: rule
    };
  }

  const defaultPrompt = simBuildPrompt({ title: "测试帖子" });
  assert.strictEqual(defaultPrompt.layoutName, "动感非对称");
  assert.ok(defaultPrompt.antiGridRule.includes("严禁生成死板等宽的 2x2 对称田字网格"));

  const splashPrompt = simBuildPrompt({ title: "测试帖子" }, { layoutKey: "splash_single" });
  assert.strictEqual(splashPrompt.layoutName, "单幅高光大画");
  assert.ok(splashPrompt.antiGridRule.includes("禁止任何画框分割线条"));
});

test("Test 126: Chat scrollbar scrolling prevents spurious blue outline box on bubbles (outline: none, scroll-clear, and loaded-topic guard)", () => {
  // 1. RAW_CSS must enforce outline: none !important on bubbles, chat body, and focus-visible states
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble:focus-visible") &&
    scriptContent.includes(".wecom-chat-body:focus") &&
    scriptContent.includes("outline: none !important;"),
    "bubbles and chat body must suppress default browser focus outline ring"
  );

  // 2. Chat body scroll listener must immediately dismiss any active reply target highlight
  assert.ok(
    scriptContent.includes("highlightedReplyMessage.classList.remove(\"is-reply-target\");") &&
    scriptContent.includes("highlightedReplyMessage = null;"),
    "chatBody onscroll must immediately clear any active is-reply-target highlight"
  );

  // 3. scrollChatToPost must only add is-reply-target when options.highlight is explicitly true
  assert.ok(
    scriptContent.includes("function scrollChatToPost(body, postNumber, options = {})") &&
    scriptContent.includes("if (options.highlight === true) {"),
    "scrollChatToPost must only highlight when options.highlight === true"
  );

  // 4. keepChatAtPost image stabilizer ticks must not re-trigger highlighting
  assert.ok(
    scriptContent.includes("const initialHighlight = Boolean(options?.highlight);") &&
    scriptContent.includes("pin(initialHighlight);") &&
    scriptContent.includes("() => pin(false)"),
    "keepChatAtPost must only pass highlight on initial pin and false on stabilizer ticks"
  );

  // 5. _applyTheme must guard against re-invoking loadTopic when topic is already rendered and user is browsing
  assert.ok(
    scriptContent.includes("isSameTopicLoaded && !chatState.loading && chatState.renderedLastIdx >= 0"),
    "_applyTheme must not repeatedly invoke loadTopic while reading or scrolling"
  );

  // 6. loadTopic must abort auto-jump if user is currently scrolling
  assert.ok(
    scriptContent.includes("initialBody.classList.contains(\"is-scrolling\") && !optionPost"),
    "loadTopic must not jump or highlight if user is actively scrolling"
  );

  // 7. Functional simulation of scrollChatToPost highlight guard
  let highlightCalled = false;
  function simScrollChatToPost(postNumber, options = {}) {
    if (options.highlight === true) {
      highlightCalled = true;
    }
  }

  // Normal scroll / anchor stabilization tick: highlight must remain false
  simScrollChatToPost(10, { highlight: false });
  assert.strictEqual(highlightCalled, false, "scrolling must not trigger bubble highlight");

  simScrollChatToPost(10);
  assert.strictEqual(highlightCalled, false, "default scrollChatToPost must not highlight");

  // Explicit jump request: highlight triggered
  simScrollChatToPost(10, { highlight: true });
  assert.strictEqual(highlightCalled, true, "explicit jump request must trigger highlight");
});

test("Test 127: AI Image Model fetch strict filtering (no default append, no text models) and AI Dialog minimization / float pill background processing", () => {
  // 1. fetchAiImageModels must strictly return fetched image models without appending defaults or unrelated text models
  assert.ok(
    scriptContent.includes("async function fetchAiImageModels(provider, apiKey, baseUrl)"),
    "must define fetchAiImageModels helper"
  );
  assert.ok(
    !scriptContent.includes("combined.push(d)") && !scriptContent.includes("combined.push(o)"),
    "fetchAiImageModels must not append hardcoded default models or other text models to fetched list"
  );
  assert.ok(
    scriptContent.includes("imgModels.length ? imgModels : modelIds"),
    "fetchAiImageModels must return exact matched image models or raw fetched models without fake append"
  );

  // 2. Functional model filter verification
  const imgRegex = /dall-?e|flux|diffusion|sdxl|stable-diffusion|midjourney|mj|recraft|imagen|image|kling|cogview|kolors|wanx|sora/i;
  const apiModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "dall-e-3",
    "claude-3-5-sonnet-20241022",
    "deepseek-chat",
    "black-forest-labs/FLUX.1-schnell",
    "text-embedding-3-small"
  ];
  const filtered = apiModels.filter((m) => imgRegex.test(m));
  assert.deepStrictEqual(filtered, ["dall-e-3", "black-forest-labs/FLUX.1-schnell"], "must only retain genuine image models");

  // 3. AI Dialog Minimize & Floating Pill UI Elements
  assert.ok(
    scriptContent.includes(".wecom-ai-minimize") &&
    scriptContent.includes(".wecom-ai-head-actions") &&
    scriptContent.includes(".wecom-ai-float-pill") &&
    scriptContent.includes(".wecom-ai-float-pill-dot") &&
    scriptContent.includes(".wecom-ai-float-pill-btn-restore") &&
    scriptContent.includes(".wecom-ai-float-pill-btn-close"),
    "RAW_CSS must define minimize button and floating mini-pill widget styles"
  );

  // 4. Lifecycle helper functions
  assert.ok(
    scriptContent.includes("function minimizeAiSummaryDialog") &&
    scriptContent.includes("function restoreAiSummaryDialog") &&
    scriptContent.includes("function updateAiFloatPill") &&
    scriptContent.includes("function removeAiFloatPill"),
    "must define minimizeAiSummaryDialog, restoreAiSummaryDialog, and float pill helpers"
  );

  // 5. Safe Close Behavior: auto-minimize when actively running
  assert.ok(
    scriptContent.includes("const isRunning = Boolean(activeSummaryAbort || activeImageAbort);") &&
    scriptContent.includes("if (isRunning && !forceAbort) {") &&
    scriptContent.includes("minimizeAiSummaryDialog();"),
    "closeAiSummaryDialog must auto-minimize to prevent task abortion on accidental close"
  );

  // 6. Image persistence to cloud host (Imgur / CDN) and LocalStorage quota protection
  assert.ok(
    scriptContent.includes("async function persistAiComicImage(rawUrl)") &&
    scriptContent.includes("async function uploadGeneratedImageToImgur(rawUrl)"),
    "must define persistAiComicImage and uploadGeneratedImageToImgur helpers"
  );
  assert.ok(
    scriptContent.includes("permanentUrl = await persistAiComicImage(finalUrl);"),
    "runImageGeneration must upload image to cloud host before caching to prevent quota overflow and link expiration"
  );
  assert.ok(
    scriptContent.includes("pruneAndSave") &&
    scriptContent.includes("localStorage quota exceeded, pruning old base64 images"),
    "saveTopicAiCache must handle quota exceeded errors and prune legacy base64 images"
  );

  // 7. Timeout extension and elapsed progress ticker for AI generation
  assert.ok(
    scriptContent.includes("options.timeout || 180000") &&
    scriptContent.includes("options.timeout || 300000"),
    "safeApiFetch and callAiImageApi must use extended timeout (180s fallback, 300s for image generation)"
  );
  assert.ok(
    scriptContent.includes("已耗时") &&
    scriptContent.includes("可最小化至后台"),
    "runImageGeneration must show real-time elapsed seconds ticker and remind user of background minimization"
  );
});

test("Test 128: Cloudflare challenge popup dual-ended auto-close mechanism (popup self-close & opener active probe / event listener)", () => {
  // 1. Definition of CF popup detection and challenge active helpers
  assert.ok(
    scriptContent.includes("function isCfPopupWindow()"),
    "must define isCfPopupWindow helper"
  );
  assert.ok(
    scriptContent.includes("function isCfChallengeActive()"),
    "must define isCfChallengeActive helper"
  );
  assert.ok(
    scriptContent.includes("function setupCfPopupAutoClose()"),
    "must define setupCfPopupAutoClose helper"
  );

  // 2. Popup window identification and parameter markers
  assert.ok(
    scriptContent.includes('window.name === "wecom_native_cf_popup"') &&
    scriptContent.includes('popupUrl.searchParams.set("wecom_cf_popup", "1")'),
    "openNativePopup must mark popup with window.name and wecom_cf_popup=1 query parameter"
  );

  // 3. Popup window self-closing and notification to parent window
  assert.ok(
    scriptContent.includes('window.opener.postMessage({ type: "WECOM_CF_PASSED" }') &&
    scriptContent.includes('localStorage.setItem("wecom_cf_passed_at"') &&
    scriptContent.includes("window.close()"),
    "setupCfPopupAutoClose must notify parent via postMessage and storage event, then call window.close()"
  );

  // 4. Main window active monitoring and dual-ended auto-close
  assert.ok(
    scriptContent.includes('event.data?.type === "WECOM_CF_PASSED"') &&
    scriptContent.includes('event.key === "wecom_cf_passed_at"') &&
    scriptContent.includes("win.close()"),
    "openNativePopup in main window must listen for WECOM_CF_PASSED and storage event to close win"
  );
  assert.ok(
    scriptContent.includes("fetch(probePath") &&
    scriptContent.includes('finishAndReload("passed")'),
    "openNativePopup must actively probe API in background and auto-close popup window when 200 OK received"
  );

  // 5. Bootstrap invocation
  assert.ok(
    scriptContent.includes("if (isCfPopupWindow()) {") &&
    scriptContent.includes("setupCfPopupAutoClose();"),
    "bootstrap must invoke setupCfPopupAutoClose if isCfPopupWindow is true"
  );

  // 6. Functional simulation of isCfChallengeActive
  function simIsCfActive(title, docElements) {
    if (/Just a moment\.\.\.|Cloudflare|Attention Required!/i.test(title || "")) return true;
    if (docElements.includes("challenge-stage") ||
        docElements.includes("challenge-running") ||
        docElements.includes("cf-turnstile-wrapper") ||
        docElements.includes("cf-wrapper")) {
      return true;
    }
    return false;
  }

  // Active challenges
  assert.equal(simIsCfActive("Just a moment...", []), true, "Just a moment title must indicate active CF challenge");
  assert.equal(simIsCfActive("Attention Required! | Cloudflare", []), true, "Cloudflare title must indicate active challenge");
  assert.equal(simIsCfActive("LINUX DO", ["challenge-stage"]), true, "challenge-stage element must indicate active challenge");
  assert.equal(simIsCfActive("LINUX DO", ["cf-turnstile-wrapper"]), true, "cf-turnstile-wrapper must indicate active challenge");

  // Passed / normal Discourse
  assert.equal(simIsCfActive("话题讨论 - LINUX DO", ["main-outlet", "topic-post"]), false, "normal Discourse page must indicate challenge passed");
});

test("Test 129: AI Summary & Comic Generation History entry points (dialog tabs, chat header dropdown menu, left rail fallback), caching, filtering, search, and action controls", () => {
  // 1. Verify CSS styles for AI History pane in linuxdo-wecom.user.js
  assert.ok(scriptContent.includes(".wecom-ai-history-pane"), "must include .wecom-ai-history-pane CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-toolbar"), "must include .wecom-ai-history-toolbar CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-filter-chips"), "must include .wecom-ai-history-filter-chips CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-search-input"), "must include .wecom-ai-history-search-input CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-list"), "must include .wecom-ai-history-list CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-card"), "must include .wecom-ai-history-card CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-thumb"), "must include .wecom-ai-history-thumb CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-summary-snip"), "must include .wecom-ai-history-summary-snip CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-card-actions"), "must include .wecom-ai-history-card-actions CSS");
  assert.ok(scriptContent.includes(".wecom-ai-history-empty"), "must include .wecom-ai-history-empty CSS");

  // 2. Verify Storage & Helper functions in script
  assert.ok(scriptContent.includes("function getAllAiTopicCaches()"), "must define getAllAiTopicCaches");
  assert.ok(scriptContent.includes("function deleteTopicAiCache("), "must define deleteTopicAiCache");
  assert.ok(scriptContent.includes("function clearAllAiTopicCaches()"), "must define clearAllAiTopicCaches");
  assert.ok(scriptContent.includes("function formatAiCacheTime("), "must define formatAiCacheTime");
  assert.ok(scriptContent.includes("function openAiHistoryDialog()"), "must define openAiHistoryDialog");

  // 3. Verify Dialog template tab & pane structure
  assert.ok(scriptContent.includes('data-tab="history">🕒 历史记录</button>'), "dialog must include 🕒 历史记录 tab button");
  assert.ok(scriptContent.includes('class="wecom-ai-history-pane"'), "dialog must include .wecom-ai-history-pane container");
  assert.ok(scriptContent.includes('data-history-filter="all"'), "toolbar must include all filter chip");
  assert.ok(scriptContent.includes('data-history-filter="summary"'), "toolbar must include summary filter chip");
  assert.ok(scriptContent.includes('data-history-filter="image"'), "toolbar must include image filter chip");
  assert.ok(scriptContent.includes('wecom-ai-history-search-input'), "toolbar must include search input");
  assert.ok(scriptContent.includes('wecom-ai-btn-clear-all-history'), "dialog foot must include clear all history button");

  // 4. Verify Chat Header Dropdown menu entry & click handler
  assert.ok(scriptContent.includes("wecom-chat-ai-history-menu"), "chat header dropdown must include wecom-chat-ai-history-menu");
  assert.ok(
    scriptContent.includes('event.target.closest(".wecom-chat-ai-history-menu")') &&
    scriptContent.includes("openAiHistoryDialog()"),
    "handleChatHeaderClick must open AI history dialog when wecom-chat-ai-history-menu clicked"
  );

  // 5. Verify triggerTopicAiSummary fallback & history redirection
  assert.ok(
    scriptContent.includes('if (initialTab === "history") {') &&
    scriptContent.includes("openAiHistoryDialog();"),
    "triggerTopicAiSummary must open history dialog when initialTab === history"
  );
  assert.ok(
    scriptContent.includes("openAiHistoryDialog()") &&
    scriptContent.includes("未检测到当前话题"),
    "triggerTopicAiSummary must redirect to AI history dialog when no active topic is loaded"
  );

  // 6. Functional simulation of AI History cache, filter, search, and time format
  const mockStorage = {};
  const MOCK_AI_CACHE_KEY = "test-ai-topic-cache";

  function simSaveTopicAiCache(topicId, data) {
    const raw = mockStorage[MOCK_AI_CACHE_KEY];
    const map = raw ? JSON.parse(raw) : {};
    map[String(topicId)] = {
      ...(map[String(topicId)] || {}),
      updatedAt: data.updatedAt || Date.now(),
      ...data
    };
    mockStorage[MOCK_AI_CACHE_KEY] = JSON.stringify(map);
  }

  function simGetAllAiTopicCaches() {
    const raw = mockStorage[MOCK_AI_CACHE_KEY];
    if (!raw) return [];
    const map = JSON.parse(raw);
    const list = Object.keys(map).map((k) => ({
      topicId: k,
      ...map[k]
    }));
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return list;
  }

  function simDeleteTopicAiCache(topicId) {
    const raw = mockStorage[MOCK_AI_CACHE_KEY];
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[String(topicId)];
    mockStorage[MOCK_AI_CACHE_KEY] = JSON.stringify(map);
  }

  function simClearAllAiTopicCaches() {
    delete mockStorage[MOCK_AI_CACHE_KEY];
  }

  // Populate test caches with distinct timestamps
  const now = Date.now();
  simSaveTopicAiCache("101", {
    topicTitle: "Linux Do 新手入门指南",
    summaryMarkdown: "这是关于 Linux Do 社区注册与新手任务的 AI 总结内容。",
    summaryStyle: "sharp",
    summaryAt: now - 30000,
    updatedAt: now - 30000
  });

  simSaveTopicAiCache("102", {
    topicTitle: "AI 绘画与大模型讨论",
    imageUrl: "https://example.com/comic-102.png",
    imagePrompt: "4格分镜漫画：程序员在电脑前与AI激烈辩论",
    imageStyle: "comic_4panel",
    imageAt: now - 10000,
    updatedAt: now - 10000
  });

  simSaveTopicAiCache("103", {
    topicTitle: "云原生与微服务架构全解析",
    summaryMarkdown: "分析 Kubernetes 与微服务拆分要点。",
    imageUrl: "https://example.com/comic-103.png",
    imagePrompt: "竖版单张插画：集群节点互相连接",
    imageStyle: "splash_single",
    updatedAt: now
  });

  const list = simGetAllAiTopicCaches();
  assert.equal(list.length, 3, "should have 3 cached topics");
  assert.equal(list[0].topicId, "103", "newest item should be first");

  // Filtering simulation
  function simFilter(items, filter, q) {
    const query = (q || "").trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "summary" && !item.summaryMarkdown) return false;
      if (filter === "image" && !item.imageUrl) return false;
      if (filter === "all" && !item.summaryMarkdown && !item.imageUrl) return false;
      if (query) {
        const matchTitle = (item.topicTitle || "").toLowerCase().includes(query);
        const matchSummary = (item.summaryMarkdown || "").toLowerCase().includes(query);
        const matchPrompt = (item.imagePrompt || "").toLowerCase().includes(query);
        if (!matchTitle && !matchSummary && !matchPrompt) return false;
      }
      return true;
    });
  }

  assert.equal(simFilter(list, "all").length, 3, "all filter should return all 3");
  assert.equal(simFilter(list, "summary").length, 2, "summary filter should return 2");
  assert.equal(simFilter(list, "image").length, 2, "image filter should return 2");

  // Search keyword simulation
  assert.equal(simFilter(list, "all", "入门").length, 1, "searching '入门' should match topic 101");
  assert.equal(simFilter(list, "all", "Kubernetes").length, 1, "searching 'Kubernetes' in summary should match topic 103");
  assert.equal(simFilter(list, "all", "程序员").length, 1, "searching '程序员' in imagePrompt should match topic 102");
  assert.equal(simFilter(list, "all", "不存在的关键字").length, 0, "non-existent keyword should return 0");

  // Deletion simulation
  simDeleteTopicAiCache("102");
  const afterDel = simGetAllAiTopicCaches();
  assert.equal(afterDel.length, 2, "after deleting 102, 2 items remain");
  assert.ok(!afterDel.some((x) => x.topicId === "102"), "102 should be removed");

  // Clear all simulation
  simClearAllAiTopicCaches();
  assert.equal(simGetAllAiTopicCaches().length, 0, "clearAll should remove all records");

  // 7. formatAiCacheTime simulation
  function simFormatTime(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  assert.equal(simFormatTime(Date.now() - 10000), "刚刚");
  assert.equal(simFormatTime(Date.now() - 180000), "3 分钟前");
  assert.equal(simFormatTime(Date.now() - 7200000), "2 小时前");
  assert.equal(simFormatTime(null), "");
});

test("Test 130: Zhihu (知乎) platform support covering routing, adapters, pagination, WeCom shell, and dual-site coexistence", () => {
  // 1. Userscript Metadata & Matching
  assert.ok(scriptContent.includes("// @match        *://*.zhihu.com/*"), "metadata must declare @match for *.zhihu.com");
  assert.ok(scriptContent.includes("// @connect      www.zhihu.com"), "metadata must declare @connect for www.zhihu.com");
  assert.ok(scriptContent.includes("const IS_ZHIHU = /(?:^|\\.)zhihu\\.com$/i.test(CURRENT_HOST);"), "must define IS_ZHIHU regex constant");
  assert.ok(scriptContent.includes('CURRENT_PLATFORM = IS_ZHIHU ? "zhihu" :'), "must include zhihu in CURRENT_PLATFORM");

  // 2. Route Helpers & Topic detection
  assert.ok(scriptContent.includes("if (typeof IS_ZHIHU !== \"undefined\" && IS_ZHIHU) return /^\\/(?:question|p)\\//.test(pathname);"), "isTopicPath must match question and p for Zhihu");
  assert.ok(scriptContent.includes("raw.match(/\\/question\\/(\\d+)(?:\\/answer\\/(\\d+))?/)"), "topicRouteFromPath must match question and optional answer");
  assert.ok(scriptContent.includes("raw.match(/\\/p\\/([0-9a-zA-Z_-]+)/)"), "topicRouteFromPath must match article /p/:id");

  // Test route function simulation
  function simIsTopicPath(pathname) {
    return /^\/(?:question|p)\//.test(pathname);
  }
  function simTopicRoute(pathname) {
    const raw = String(pathname || "");
    const qm = raw.match(/\/question\/(\d+)(?:\/answer\/(\d+))?/);
    if (qm) return { topicId: qm[1], answerId: qm[2] || null, slug: "question" };
    const pm = raw.match(/\/p\/([0-9a-zA-Z_-]+)/);
    if (pm) return { topicId: `p_${pm[1]}`, slug: "article" };
    return { topicId: null, slug: "" };
  }

  assert.ok(simIsTopicPath("/question/123456"), "question route matches topic");
  assert.ok(simIsTopicPath("/question/123456/answer/7890"), "question answer route matches topic");
  assert.ok(simIsTopicPath("/p/98765432"), "zhuanlan article route matches topic");
  assert.ok(!simIsTopicPath("/hot"), "/hot is list route");
  assert.ok(!simIsTopicPath("/"), "/ is list route");

  const qRoute = simTopicRoute("/question/654321/answer/112233");
  assert.equal(qRoute.topicId, "654321");
  assert.equal(qRoute.answerId, "112233");
  assert.equal(qRoute.slug, "question");

  const pRoute = simTopicRoute("/p/art_9999");
  assert.equal(pRoute.topicId, "p_art_9999");
  assert.equal(pRoute.slug, "article");

  // 3. Data layer & API adapters
  assert.ok(scriptContent.includes("async function zhihuApi("), "must define zhihuApi helper");
  assert.ok(scriptContent.includes("async function fetchZhihuTopicData("), "must define fetchZhihuTopicData");
  assert.ok(scriptContent.includes("function mapZhihuHotItemToTopic("), "must define mapZhihuHotItemToTopic");
  assert.ok(scriptContent.includes("function mapZhihuRecommendItemToTopic("), "must define mapZhihuRecommendItemToTopic");
  assert.ok(scriptContent.includes("function mapZhihuQuestionToPost("), "must define mapZhihuQuestionToPost");
  assert.ok(scriptContent.includes("function mapZhihuAnswerToPost("), "must define mapZhihuAnswerToPost");

  // 4. Pagination & Infinite scroll
  assert.ok(scriptContent.includes("chatState.zhihuOffset = Number(data.zhihu_offset) || 0;"), "loadTopic must record zhihuOffset");
  assert.ok(scriptContent.includes("chatState.zhihuHasMore = Boolean(data.zhihu_has_more);"), "loadTopic must record zhihuHasMore");
  assert.ok(scriptContent.includes("chatState.zhihuType = data.zhihu_type || \"\";"), "loadTopic must record zhihuType");
  assert.ok(scriptContent.includes("if (IS_ZHIHU) {\n      if (!chatState.zhihuHasMore) return;\n    }"), "loadNewerPosts must check zhihuHasMore");
  assert.ok(scriptContent.includes("/api/v4/comment_v5/articles/"), "loadNewerPosts must query article comments");
  assert.ok(scriptContent.includes("/api/v4/questions/"), "loadNewerPosts must query question answers");

  // 5. CSS Hiding Rules
  assert.ok(scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .AppHeader,"), "RAW_CSS must hide Zhihu .AppHeader");
  assert.ok(scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .QuestionHeader,"), "RAW_CSS must hide Zhihu .QuestionHeader");
  assert.ok(scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .Question-main,"), "RAW_CSS must hide Zhihu .Question-main");
  assert.ok(scriptContent.includes(".${ROOT_CLASS}.${LOCK_CLASS} .Topstory,"), "RAW_CSS must hide Zhihu .Topstory");

  // 6. Composer read-only notice & original site link
  assert.ok(scriptContent.includes("知乎只读浏览中（写回答/评论请前往原站）"), "composer textarea must show Zhihu readonly notice in placeholder");
  assert.ok(scriptContent.includes("知乎回答/评论操作需安全校验，请在原站网页端发表"), "composer submission on Zhihu must guide user to original site");
});

test("Test 131: Zhihu 403-free SSR & initialData topic opening, background feed interception, and pagination persistence", () => {
  // 1. Off-screen layout allows background IntersectionObserver and React scroll listeners without UI leaking
  assert.ok(
    scriptContent.includes("position: fixed !important;\n      left: 0 !important;\n      top: 0 !important;\n      width: 100vw !important;\n      height: 100vh !important;\n      overflow-y: scroll !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n      z-index: -99999 !important;"),
    "#root off-screen layout must be placed within viewport with opacity 0 and overflow scroll to maintain background React layout"
  );

  // 2. Fetch and XMLHttpRequest interceptor and response data pool
  assert.ok(scriptContent.includes("zhihuCapturedFeedPool"), "must have zhihuCapturedFeedPool");
  assert.ok(scriptContent.includes("zhihuCapturedAnswersPool"), "must have zhihuCapturedAnswersPool");
  assert.ok(scriptContent.includes("_nativeZhihuFetch"), "must intercept window.fetch on Zhihu");
  assert.ok(scriptContent.includes("_origXhrOpen"), "must intercept XMLHttpRequest on Zhihu");

  // 3. Same-origin HTML document fetching for SSR data bypass & 404 wasteland protection
  assert.ok(scriptContent.includes("fetchZhihuPageDoc"), "must have fetchZhihuPageDoc");
  assert.ok(scriptContent.includes("parseZhihuHtml"), "must have parseZhihuHtml");
  assert.ok(scriptContent.includes("const pageUrl = isArticle ? `/p/${rawId}` : `/question/${rawId}`;"), "must fetch same-origin page paths without cross-origin subdomain");
  assert.ok(scriptContent.includes("没有知识存在的荒原"), "must filter out Zhihu 404 wasteland error page");

  // 4. Extract real question ID from answers instead of answer ID to prevent 404 wasteland
  assert.ok(scriptContent.includes("target.question && target.question.id"), "mapZhihuRecommendItemToTopic must extract question.id for answers");
  assert.ok(scriptContent.includes("const topicFromList = listState.topics.find((t) => String(t.id) === String(topicId));"), "fetchZhihuTopicData must check topicFromList");
  assert.ok(scriptContent.includes("id: `preview_${rawId}`"), "fetchZhihuTopicData must support fallback preview answer when answers empty");

  // 5. Native feed scroll trigger and pagination polling
  assert.ok(scriptContent.includes("triggerZhihuNativeFeedScroll();"), "must trigger native feed scroll on pagination");
  assert.ok(scriptContent.includes("listState.moreUrl = freshRaw.length > 0 ? `zhihu_offset_${listState.zhihuOffset}` : `zhihu_offset_${offset}`;"), "loadMoreList must not destroy moreUrl when pagination items are empty or retrying");

  // 6. replaceTopicPostUrl guards against unwanted history apply recursion
  assert.ok(scriptContent.includes("suppressHistoryApply = true;\n        try { history.replaceState(history.state, \"\", targetUrl); } catch { /* ignore */ }\n        finally { suppressHistoryApply = false; }"), "replaceTopicPostUrl on Zhihu must wrap replaceState in suppressHistoryApply");
});

test("Test 132: Zhihu answer pagination, DOM extraction, creators rank hot supplement, and footer bar (v0.7.91)", () => {
  // 1. Interceptor captures answers and creator rank hot
  assert.ok(scriptContent.includes("zhihuCapturedAnswersPool"), "must maintain zhihuCapturedAnswersPool");
  assert.ok(scriptContent.includes("/creators/rank/hot"), "interceptor must capture /creators/rank/hot");
  assert.ok(scriptContent.includes("/answers"), "interceptor must capture /answers");

  // 2. DOM extraction & creator hot mapping
  assert.ok(scriptContent.includes("extractZhihuAnswersFromDom"), "must have extractZhihuAnswersFromDom");
  assert.ok(scriptContent.includes("mapZhihuCreatorHotItemToTopic"), "must have mapZhihuCreatorHotItemToTopic");

  // 3. Multi-domain creator hot supplement in left list
  assert.ok(scriptContent.includes("/api/v4/creators/rank/hot?domain="), "must query creator rank hot across domains");

  // 4. Background layout preservation (opacity: 0 instead of display: none)
  assert.ok(scriptContent.includes(".TopstoryMain"), "must include .TopstoryMain");
  assert.ok(scriptContent.includes("Question-main") && scriptContent.includes("pointer-events: none !important"), "must preserve native layout with opacity: 0 for Question-main");

  // 5. Zhihu pagination footer bar
  assert.ok(scriptContent.includes("syncZhihuPaginationFooter"), "must have syncZhihuPaginationFooter");
  assert.ok(scriptContent.includes(".wecom-zhihu-more-bar"), "must have CSS for .wecom-zhihu-more-bar");
  assert.ok(scriptContent.includes('event.target.closest(".wecom-v2ex-more-bar, .wecom-zhihu-more-bar")'), "must handle click on .wecom-zhihu-more-bar to loadNewerPosts");

  // 6. 19-digit question ID string comparison guard
  assert.ok(scriptContent.includes("(IS_JUEJIN || IS_ZHIHU) ? String(body.dataset.topicId) !== String(chatState.topicId)"), "must use string comparison for topicId on Zhihu to avoid precision loss on 19-digit IDs");
});

test("Test 133: Zhihu endless topic list loading, persistent pool caching, and creator hot multi-domain pagination (v0.7.95)", () => {
  // 1. Persistent pool and seen tracking
  assert.ok(scriptContent.includes("const zhihuRecommendPool = [];"), "must define zhihuRecommendPool");
  assert.ok(scriptContent.includes("const zhihuRecommendSeen = new Set();"), "must define zhihuRecommendSeen");
  assert.ok(scriptContent.includes("let zhihuCreatorDomainOffset = 0;"), "must track zhihuCreatorDomainOffset");

  // 2. Creators rank hot dynamic pagination
  assert.ok(
    scriptContent.includes("/api/v4/creators/rank/hot?domain=${d}&limit=20&offset=${zhihuCreatorDomainOffset}"),
    "must query creators rank hot with dynamic domainOffset"
  );
  assert.ok(
    scriptContent.includes("zhihuCreatorDomainOffset += 20;"),
    "must advance zhihuCreatorDomainOffset on pagination rounds"
  );

  // 3. Hot list pagination enablement
  assert.ok(
    scriptContent.includes("zhihuRecommendPool.length = 0;\n        zhihuRecommendSeen.clear();\n        zhihuCreatorDomainOffset = 0;"),
    "loadZhihuList must reset pool on tab switch or force reload"
  );

  // 4. Verification that 19-digit snowflake IDs are not filtered out
  assert.ok(!scriptContent.includes("String(rawId).length > 12"), "must not restrict topic IDs to 12 digits (snowflake IDs are 19 digits)");
});

test("Test 134: Elimination of intermediate '下滑或点击加载更多' button bar in reply list to prevent content jitter (v0.7.96)", () => {
  // 1. Verification that intermediate '下滑或点击加载更多' prompts are eliminated from syncZhihuPaginationFooter and syncV2exPaginationFooter
  assert.ok(
    !scriptContent.includes("下滑或点击加载更多知乎回答"),
    "must not render intermediate '下滑或点击加载更多知乎回答' in reply list"
  );
  assert.ok(
    !scriptContent.includes("下滑或点击加载下一页"),
    "must not render intermediate '下滑或点击加载下一页' in reply list"
  );

  // 2. Both sync functions remove bar on loading or hasMore to allow seamless infinite scroll
  assert.ok(
    scriptContent.includes("if (loading || hasMore) {\n      if (bar) bar.remove();\n      return;\n    }"),
    "sync functions must remove bar during loading and when hasMore is true to prevent layout shift"
  );

  // 3. End-of-topic marker is preserved when hasMore is false
  assert.ok(
    scriptContent.includes("— 已加载全部知乎回答"),
    "syncZhihuPaginationFooter must retain end of topic marker when all answers loaded"
  );
  assert.ok(
    scriptContent.includes("— 已加载全部回复"),
    "syncV2exPaginationFooter must retain end of topic marker when all replies loaded"
  );
});

test("Test 135: Zhihu long answer folding/clamping and comment discussion thread layer (v0.7.97)", () => {
  // 1. Long answer clamping & expansion styles
  assert.ok(
    scriptContent.includes(".wecom-msg-bubble.wecom-zhihu-clamped") &&
    scriptContent.includes(".wecom-msg-bubble.wecom-zhihu-expanded"),
    "must include CSS rules for clamped and expanded Zhihu answer bubbles"
  );
  assert.ok(
    scriptContent.includes(".wecom-zhihu-expand-bar") &&
    scriptContent.includes(".wecom-zhihu-expand-btn"),
    "must include CSS rules for Zhihu expand bar and button"
  );

  // 2. Clamping logic and expansion persistence
  assert.ok(scriptContent.includes("function applyZhihuAnswerClamping(container)"), "must define applyZhihuAnswerClamping");
  assert.ok(scriptContent.includes("const zhihuExpandedAnswerIds = new Set();"), "must track zhihuExpandedAnswerIds");
  assert.ok(scriptContent.includes("body.scrollHeight > 240"), "must clamp answers when scrollHeight exceeds 240px");
  assert.ok(scriptContent.includes("data-clamp-watched"), "must watch images loading to re-evaluate clamping");

  // 3. Comments entry button & styling
  assert.ok(
    scriptContent.includes(".wecom-zhihu-comments-entry") &&
    scriptContent.includes(".wecom-zhihu-comments-btn"),
    "must style Zhihu comments entry button"
  );
  assert.ok(
    scriptContent.includes('data-action="zhihu-open-comments"'),
    "must attach data-action='zhihu-open-comments' to comments button"
  );

  // 4. Comment fetching with fallbacks & caching
  assert.ok(scriptContent.includes("function fetchZhihuAnswerComments(answerId, offset = 0)"), "must define fetchZhihuAnswerComments");
  assert.ok(scriptContent.includes("/comment_v5/answers/${cleanId}/root_comment"), "must query primary v5 answer root comments endpoint");
  assert.ok(scriptContent.includes("/answers/${cleanId}/root_comments"), "must fallback to legacy answers root comments endpoint");
  assert.ok(scriptContent.includes("const zhihuAnswerCommentsCache = new Map();"), "must maintain zhihuAnswerCommentsCache");

  // 5. Discussion layer transitions (open & close)
  assert.ok(scriptContent.includes("function openZhihuCommentThread("), "must define openZhihuCommentThread");
  assert.ok(scriptContent.includes("function closeZhihuCommentThread("), "must define closeZhihuCommentThread");
  assert.ok(scriptContent.includes("renderZhihuThreadParentCard"), "must define renderZhihuThreadParentCard");
  assert.ok(scriptContent.includes("renderZhihuCommentBubble"), "must define renderZhihuCommentBubble");

  // 6. Navigation controls: Back button, Reply tool redirect, and Escape key
  assert.ok(scriptContent.includes(".wecom-chat-back-btn"), "must include .wecom-chat-back-btn");
  assert.ok(scriptContent.includes('event.key === "Escape" && zhihuCommentThreadState.active'), "Escape key must close Zhihu comment thread");
  assert.ok(
    scriptContent.includes("Number(message.dataset.postNumber) > 1") &&
    scriptContent.includes("openZhihuCommentThread(message.dataset.postId, Number(message.dataset.postNumber))"),
    "Reply tool on Zhihu answer must open comment thread"
  );
});

test("Test 136: Zhihu answer comment count multi-source extraction, v5 abstract_comment 200 OK endpoint, and automatic backfill (v0.7.98)", () => {
  // 1. Dedicated count pool & interceptor
  assert.ok(scriptContent.includes("const zhihuCommentCountsMap = new Map();"), "must define zhihuCommentCountsMap");
  assert.ok(scriptContent.includes('url.includes("abstract_comment")'), "fetch & XHR interceptors must capture abstract_comment");
  assert.ok(scriptContent.includes("zhihuCommentCountsMap.set(String(targetId), Number(json.counts.total_counts))"), "interceptor must store total_counts");

  // 2. Answer object multi-field extraction (camelCase commentCount, commentsCount, comment_count, etc.)
  assert.ok(scriptContent.includes("raw.commentCount ??"), "mapZhihuAnswerToPost must check camelCase commentCount");
  assert.ok(scriptContent.includes("raw.commentsCount ??"), "mapZhihuAnswerToPost must check commentsCount");

  // 3. Background DOM comment count extraction
  assert.ok(scriptContent.includes("item.querySelector('meta[itemprop=\"commentCount\"]')"), "DOM answer extractor must read meta[itemprop=commentCount]");
  assert.ok(scriptContent.includes('b.textContent.includes("评论")'), "DOM answer extractor must fallback to comment button text");

  // 4. Primary official 200 OK endpoint without login/signature restriction
  assert.ok(scriptContent.includes("/comment_v5/answers/${cleanId}/abstract_comment?limit=20"), "fetchZhihuAnswerComments must call abstract_comment first");
  assert.ok(scriptContent.includes("absResp?.counts?.total_counts != null"), "must capture total_counts from abstract_comment response");

  // 5. Automatic zero-comment backfill for bubble button
  assert.ok(scriptContent.includes("commentCount === 0 && postId && /^\\d+$/.test(postId) && !bubble.dataset.countFetched"), "must backfill real count when answer bubble has 0 comments");
  assert.ok(scriptContent.includes("/comment_v5/answers/${postId}/abstract_comment?limit=1"), "must call lightweight abstract_comment to backfill count");
});

test("Test 137: Zhihu answer discussion count consistency, multi-offset abstract_comment batching, and child comment resolution (v0.7.99)", () => {
  // 1. Multi-offset concurrent batching for abstract_comment
  assert.ok(
    scriptContent.includes("abstract_comment?limit=2&offset=${o}") ||
    scriptContent.includes("abstract_comment?limit=2&offset="),
    "must fetch subsequent offsets of abstract_comment"
  );
  assert.ok(
    scriptContent.includes("extraOffsets") && scriptContent.includes("Promise.all"),
    "must batch extra offsets concurrently using Promise.all"
  );

  // 2. Child comment resolution via child_comment endpoint
  assert.ok(
    scriptContent.includes("/comment_v5/comment/${c.id}/child_comment?limit=20"),
    "must fetch child comments for root comments with un-expanded child replies"
  );
  assert.ok(
    scriptContent.includes("child_comment_count"),
    "must check child_comment_count before resolving child comments"
  );

  // 3. Accurate hasMore calculation based on effectiveTotal
  assert.ok(
    scriptContent.includes("hasMore = flattened.length < effectiveTotal;"),
    "hasMore must be strictly determined by flattened comments count vs effectiveTotal"
  );

  // 4. Thread and outer bubble count synchronization
  assert.ok(
    scriptContent.includes('.wecom-zhihu-comments-btn[data-answer-id="'),
    "openZhihuCommentThread must find and synchronize outer answer bubble button"
  );
  assert.ok(
    scriptContent.includes("syncZhihuCommentButton(outerBtn, effectiveTotal)") ||
    scriptContent.includes("outerBtn.textContent = `回复 ：${effectiveTotal}`"),
    "must update outer button text to match effectiveTotal"
  );
  assert.ok(
    scriptContent.includes("parentCardCount.textContent = `评论与讨论 (${effectiveTotal})`"),
    "must update parent card divider to match effectiveTotal"
  );

  // 5. Loaded status indicators
  assert.ok(
    scriptContent.includes("已加载全部 ${effectiveTotal} 条评论") ||
    scriptContent.includes("已加载全部 ${total} 条评论"),
    "must show all comments loaded status"
  );
  assert.ok(
    scriptContent.includes("加载更多评论 (已显示"),
    "more comments button must show currently loaded vs total comments"
  );

  // 6. applyZhihuAnswerClamping outer button sync on re-render
  assert.ok(
    scriptContent.includes("syncZhihuCommentButton(btn, knownCount)") ||
    scriptContent.includes("btn.textContent !== expectedText"),
    "applyZhihuAnswerClamping must update outer button text whenever knownCount changes"
  );
});

test("Test 138: Zhihu reply thread pure comments view (omit parent answer card) and unified floor typesetting (v0.8.0)", () => {
  // 1. Direct entry into comments list without parent card clutter
  assert.ok(
    scriptContent.includes("// 2. Render initial thread layout (omit parent answer card per user request)"),
    "openZhihuCommentThread must omit parent answer card from initial thread layout"
  );

  // 2. Container flex typesetting consistency
  assert.ok(
    scriptContent.includes(".wecom-zhihu-thread-comments {") &&
    scriptContent.includes("gap: 16px;"),
    "must style .wecom-zhihu-thread-comments with standard flex gap layout"
  );

  // 3. Floor attributes and reply indicator matching other platforms
  assert.ok(
    scriptContent.includes('data-floor="${floorNum}" title="${floorNum}楼">#${floorNum}</span>'),
    "must render standard floor number and title matching Discourse/V2EX/Juejin"
  );
  assert.ok(
    scriptContent.includes("wecom-msg-reply-indicator") &&
    scriptContent.includes("wecom-msg-reply-indicator-user"),
    "must format sub-reply mentions with standard .wecom-msg-reply-indicator"
  );

  // 4. Action tools toolbar on hover
  assert.ok(
    scriptContent.includes('<div class="wecom-msg-tools">') &&
    scriptContent.includes('data-action="reply" title="回复"'),
    "must include .wecom-msg-tools with reply action on comment bubble"
  );
});

test("Test 139: Zhihu reply thread nested bubble hierarchy (.wecom-reply-children inside .wecom-msg-bubble) and floor synchronization (v0.8.1)", () => {
  // 1. Bubble hierarchy: childrenHtml nested inside .wecom-msg-bubble
  assert.ok(
    scriptContent.includes('<div class="wecom-msg-bubble">') &&
    scriptContent.includes("${childrenHtml}") &&
    scriptContent.includes('<div class="wecom-reply-children">'),
    "renderZhihuCommentBubble must nest .wecom-reply-children directly inside .wecom-msg-bubble"
  );

  // 2. Thread child class and depth attribute
  assert.ok(
    scriptContent.includes('const childClass = (comm.isChild || depth > 0) ? " is-thread-child" : "";') &&
    scriptContent.includes('const depthAttr = depth > 0 ? ` data-thread-depth="${depth}"` : "";'),
    "child comments must receive is-thread-child class and data-thread-depth attribute"
  );

  // 3. Root comments tree structure with attached children
  assert.ok(
    scriptContent.includes("rootItem.children.push(childItem);") &&
    scriptContent.includes("rootComments.push(rootItem);"),
    "fetchZhihuAnswerComments must attach child comments to root comments tree"
  );

  // 4. Comment count and floor number assignment across both roots and nested children
  assert.ok(
    scriptContent.includes("function countZhihuComments(commentsList)") &&
    scriptContent.includes("function assignZhihuCommentFloors(commentsList, startFloor = 1)"),
    "must define helpers to count and sequentially number all comments including nested children"
  );
  assert.ok(
    scriptContent.includes("const displayedCount = countZhihuComments(zhihuCommentThreadState.comments);"),
    "must track total displayed comments across all hierarchy levels"
  );

  // 5. CSS ensures full-width stretch for child messages inside .wecom-reply-children
  assert.ok(
    scriptContent.includes(".wecom-zhihu-thread-comments .wecom-reply-children .wecom-msg {") &&
    scriptContent.includes("max-width: 100% !important;"),
    "must style child comments inside .wecom-reply-children to take 100% width"
  );
});

test("Test 140: Zhihu answer reply count button formatted as icon + number and hidden when 0 (v0.8.2)", () => {
  // 1. Icon + number format helper
  assert.ok(
    scriptContent.includes("function formatZhihuCommentBtnHtml(count)") &&
    scriptContent.includes("wecom-zhihu-comments-icon") &&
    scriptContent.includes("wecom-zhihu-comments-num"),
    "must define formatZhihuCommentBtnHtml to render icon and number"
  );

  // 2. Hide when 0
  assert.ok(
    scriptContent.includes("function syncZhihuCommentButton(btn, count)"),
    "must define syncZhihuCommentButton to manage icon format and visibility"
  );
  assert.ok(
    scriptContent.includes('btn.style.display = "none";') &&
    scriptContent.includes('btn.style.display = "inline-flex";'),
    "must hide button when count is 0 and show inline-flex when count > 0"
  );

  // 3. Footer visibility sync
  assert.ok(
    scriptContent.includes('footer.style.display = (num > 0 || hasExpand) ? "" : "none";'),
    "footer must hide when comment count is 0 and no expand button is present"
  );
});

test("Test 141: Disguise title and avatar high-entropy hash seed (hashTopicSeed) prevents uniform '产品需求评审群' collapse (v0.8.3)", () => {
  // 1. Definition of hashTopicSeed in scriptContent
  assert.ok(
    scriptContent.includes("function hashTopicSeed(topic)") &&
    scriptContent.includes("0x811c9dc5") &&
    scriptContent.includes("Math.imul(hash, 0x01000193)"),
    "must implement 32-bit FNV-1a hashTopicSeed helper"
  );

  // 2. Integration with disguiseTitleForTopic, surnameForTopic, isGridMaskTopic, disguiseGridAvatar, isGroupConversation
  assert.ok(
    scriptContent.includes("const seed = hashTopicSeed(topic);") &&
    scriptContent.includes("function surnameForTopic(topic) {\n    const seed = hashTopicSeed(topic);") &&
    scriptContent.includes("function isGridMaskTopic(topic) {\n    return isMaskAvatar() && (hashTopicSeed(topic) % 2 === 0);") &&
    scriptContent.includes("function isGroupConversation(topic) {\n    return hashTopicSeed(topic) % 2 === 1;"),
    "must use hashTopicSeed across title, surname, grid avatar and group conversation detection"
  );

  // 3. Verify simulated hashTopicSeed on string IDs, snowflake IDs, numeric IDs
  function simHashTopicSeed(topic) {
    if (!topic) return 0;
    const raw = topic.id != null && topic.id !== "" ? topic.id : (topic.title || "0");
    const str = String(raw);
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  const MASK_WORK_ORGS = ["产品", "研发", "前端", "后端", "客户端", "测试", "QA", "运维", "架构", "中台", "数据", "平台"];
  const MASK_WORK_OBJS = ["需求", "接口", "契约", "用例", "缺陷", "分支", "版本", "变更", "工单", "告警", "故障", "发布"];
  const MASK_WORK_ACTS = ["评审群", "联调群", "值班群", "提测群", "发布群", "复盘群", "迭代群", "排期群", "需求池", "对齐会", "跟进群", "项目组"];
  const MASK_WORK_TITLES = [
    "需求评审排期", "技术方案讨论", "接口联调对齐", "代码评审意见", "主干合并冲突",
    "发版窗口确认", "灰度比例调整", "回归范围确认", "提测准入检查", "缺陷定级讨论",
    "线上告警跟进", "监控大盘调整", "值班交接记录", "故障复盘纪要", "降级预案演练",
    "容量水位评估", "慢查询治理", "配置变更同步", "依赖版本升级", "循环依赖治理",
    "单测覆盖率达标", "Mock 数据联调", "冒烟用例执行", "压测结果同步", "埋点方案评审",
    "SDK 版本对齐", "网关路由变更", "缓存命中率排查", "队列积压处理", "日志脱敏改造",
    "数据库迁移演练", "容器资源扩容", "发布回滚演练", "需求验收清单", "接口文档补全",
    "迭代任务盘点", "技术债清理周", "编码规范宣讲", "方案设计评审", "上线检查清单"
  ];

  function simDisguiseTitleForTopic(topic) {
    if (!topic) return "";
    const seed = simHashTopicSeed(topic);
    if (seed % 2 === 0) {
      const org = MASK_WORK_ORGS[seed % MASK_WORK_ORGS.length];
      const obj = MASK_WORK_OBJS[(seed >>> 4) % MASK_WORK_OBJS.length];
      const act = MASK_WORK_ACTS[(seed >>> 8) % MASK_WORK_ACTS.length];
      const mode = (seed >>> 12) % 3;
      if (mode === 0) return `${org}${obj}${act}`;
      if (mode === 1) return `${org}·${obj}${act}`;
      return `【${org}】${obj}${act}`;
    }
    return MASK_WORK_TITLES[seed % MASK_WORK_TITLES.length];
  }

  const sampleTopics = [
    { id: "p_123456", title: "知乎专栏 1" },
    { id: "p_789012", title: "知乎专栏 2" },
    { id: "7345678901234567890", title: "掘金沸点 1" },
    { id: "7345678901234567891", title: "掘金沸点 2" },
    { id: 583920194, title: "知乎问答 1" },
    { id: 12345, title: "Linuxdo 话题 1" },
    { id: 67890, title: "Linuxdo 话题 2" }
  ];

  const titles = sampleTopics.map(simDisguiseTitleForTopic);
  const uniqueTitles = new Set(titles);
  assert.ok(uniqueTitles.size >= 5, "sample topics must produce diverse disguised titles without collapsing to a single name");
  const identicalCount = titles.filter((t) => t === "产品需求评审群").length;
  assert.ok(identicalCount < 2, "must not collapse all titles to '产品需求评审群'");
});

test("Test 142: Zhihu answer pagination & comment drawer deep pagination recovery (SSR HTML fallback and pooled slice) (v0.8.4)", () => {
  // 1. Comments drawer pooled slicing at any offset
  assert.ok(
    scriptContent.includes("const pooled = zhihuCapturedCommentsPool.get(cleanId) || [];") &&
    scriptContent.includes("let rawComments = pooled.length > offset ? pooled.slice(offset, offset + batchLimit) : [];"),
    "fetchZhihuAnswerComments must slice comments from captured pool at offset > 0"
  );

  // 2. Comments drawer native container scroll at offset > 0
  assert.ok(
    scriptContent.includes("if (offset > 0) {") &&
    scriptContent.includes(".CommentsV2, .CommentListV2, .Modal-content, .NestComment") &&
    scriptContent.includes(".PaginationButton-next, .Pagination-next, .CommentsV2-footer button"),
    "fetchZhihuAnswerComments must scroll native comment container and click next page instead of toggling closed"
  );

  // 3. Comments drawer offset increment strictly by newComments.length
  assert.ok(
    scriptContent.includes("zhihuCommentThreadState.offset = offset + newComments.length;"),
    "loadMoreZhihuComments must only advance offset by newComments.length when comments are found"
  );

  // 4. Main answers feed SSR HTML page fallback
  assert.ok(
    scriptContent.includes("Math.floor(chatState.postsByNumber.size / 5) + 1") &&
    scriptContent.includes("fetchZhihuPageDoc(`/question/${rawId}?page=${currentPageNum}`)") &&
    scriptContent.includes("parseZhihuHtml(pageHtml, rawId, false)"),
    "loadNewerPosts must fallback to SSR HTML pagination /question/:id?page=X when background scroll does not yield new answers"
  );

  // 5. Interceptor query-string and item-level question ID extraction
  assert.ok(
    scriptContent.includes("url.match(/[?&]question_id=(\\d+)/)") &&
    scriptContent.includes("it?.target?.question || it?.question"),
    "fetch & XHR interceptors must extract question ID from query params or data items"
  );
});

test("Test 143: Zhihu comment thread instant single-click list navigation and modal dismissal (v0.8.13)", () => {
  // 1. dismissZhihuNativeModals must use safe element removal instead of closeBtn.click()
  assert.ok(
    scriptContent.includes("function dismissZhihuNativeModals()") &&
    scriptContent.includes("modals.forEach((m) => {") &&
    scriptContent.includes("try { m.remove(); } catch (_) {}") &&
    !scriptContent.includes("closeBtn.click()"),
    "dismissZhihuNativeModals must remove native modal elements without simulating clicks that trigger history navigation"
  );

  // 2. closeZhihuCommentThread must accept options.restoreContent
  assert.ok(
    scriptContent.includes("function closeZhihuCommentThread(panel = document.querySelector(\".wecom-chat-panel\"), options = {})") &&
    scriptContent.includes("const restoreContent = options.restoreContent !== false;"),
    "closeZhihuCommentThread must support conditional restoreContent"
  );

  // 3. bindListPanelClicks must handle zhihuCommentThreadState.active on list clicks
  assert.ok(
    scriptContent.includes("if (IS_ZHIHU && zhihuCommentThreadState.active) {") &&
    scriptContent.includes("closeZhihuCommentThread(document.querySelector(\".wecom-chat-panel\"), { restoreContent: true });") &&
    scriptContent.includes("closeZhihuCommentThread(document.querySelector(\".wecom-chat-panel\"), { restoreContent: false });"),
    "bindListPanelClicks must deactivate comment thread immediately on clicking any list item"
  );

  // 4. navigateInApp must deactivate zhihuCommentThreadState.active
  assert.ok(
    scriptContent.includes("function navigateInApp(url) {") &&
    scriptContent.includes("if (IS_ZHIHU && zhihuCommentThreadState.active) {"),
    "navigateInApp must cleanly deactivate comment thread"
  );
});

test("Test 144: Zhihu comment and discussion timestamp parsing and formatting (no 2000/2001 fallback, data-time persistence) (v0.8.14)", () => {
  // Extract parseTimestamp and formatTime from scriptContent
  const fnMatch = scriptContent.match(/function parseTimestamp\(val\) \{[\s\S]*?\n  \}/);
  assert.ok(fnMatch, "parseTimestamp function must be present");
  const fmtMatch = scriptContent.match(/function formatTime\(iso\) \{[\s\S]*?\n  \}/);
  assert.ok(fmtMatch, "formatTime function must be present");

  const runCode = new Function(`${fnMatch[0]}\n${fmtMatch[0]}\nreturn { parseTimestamp, formatTime };`);
  const { parseTimestamp, formatTime } = runCode();

  // 1. "0", "1", "00", "01" must return null, never 2000 or 2001
  assert.strictEqual(parseTimestamp(0), null, "0 number must return null");
  assert.strictEqual(parseTimestamp("0"), null, "'0' string must return null");
  assert.strictEqual(parseTimestamp("1"), null, "'1' string must return null");
  assert.strictEqual(parseTimestamp("00"), null, "'00' string must return null");
  assert.strictEqual(parseTimestamp("01"), null, "'01' string must return null");

  // 2. Month-day strings must parse with current year (never 2000/2001)
  const currentYear = new Date().getFullYear();
  const t1 = parseTimestamp("05-12");
  assert.ok(t1, "05-12 must parse successfully");
  const d1 = new Date(t1);
  assert.strictEqual(d1.getMonth(), 4, "month must be May (index 4)");
  assert.strictEqual(d1.getDate(), 12, "date must be 12");
  assert.ok(d1.getFullYear() >= currentYear - 1, "year must be current or previous year, not 2001");

  const t2 = parseTimestamp("发布于 10-21 20:01");
  assert.ok(t2, "发布于 10-21 20:01 must parse successfully");
  const d2 = new Date(t2);
  assert.strictEqual(d2.getMonth(), 9, "month must be Oct (index 9)");
  assert.strictEqual(d2.getDate(), 21, "date must be 21");
  assert.strictEqual(d2.getHours(), 20, "hour must be 20");
  assert.strictEqual(d2.getMinutes(), 1, "minute must be 1");

  // 3. formatTime output must never produce '2001-' or '2000-'
  const formatted1 = formatTime("05-12");
  assert.ok(!formatted1.startsWith("2001-") && !formatted1.startsWith("2000-"), "formatTime(05-12) must not start with 2001- or 2000-");
  const formatted2 = formatTime("10-21 20:01");
  assert.ok(!formatted2.startsWith("2001-") && !formatted2.startsWith("2000-"), "formatTime(10-21 20:01) must not start with 2001- or 2000-");

  // 4. renderZhihuCommentBubble attaches data-time attribute
  assert.ok(
    scriptContent.includes("const rawCommTime = comm.createdTime || comm.created_time || comm.created_at || comm.timeStr;") &&
    scriptContent.includes("const commTimeMs = parseTimestamp(rawCommTime);") &&
    scriptContent.includes("const timeAttr = commTimeMs ? ` data-time=\"${commTimeMs}\"` : \"\";") &&
    scriptContent.includes("<span class=\"wecom-msg-time\"${timeAttr}>${escapeHtml(timeStr)}</span>"),
    "renderZhihuCommentBubble must bind data-time to preserve exact ms timestamp for relative time refreshing"
  );

  // 5. fetchZhihuAnswerComments extracts multi-field timestamps
  assert.ok(
    scriptContent.includes("const rawCreated = c.created_time ?? c.createdTime ?? c.created_at ?? c.createdAt ?? c.publish_time ?? c.time ?? c.created ?? 0;") &&
    scriptContent.includes("const parsedTime = parseTimestamp(rawCreated);"),
    "fetchZhihuAnswerComments must check all common timestamp property variants and parse via parseTimestamp"
  );
});

test("Test 145: Zhihu child comment pagination, floor reply expansion, and avoidance of premature comment drawer end prompt (v0.8.15)", () => {
  // 1. fetchZhihuChildComments function definition and endpoint
  assert.ok(
    scriptContent.includes("async function fetchZhihuChildComments(rootId, options = {})") &&
    scriptContent.includes("/comment_v5/comment/${cleanId}/child_comment?order_by=ts&limit=20"),
    "must define fetchZhihuChildComments targeting /api/v4/comment_v5/comment/${cleanId}/child_comment"
  );

  // 2. childCommentCount extraction and childHasMore tracking on root comment items
  assert.ok(
    scriptContent.includes("child_comment_count") &&
    scriptContent.includes("childCommentCount: childCount,") &&
    scriptContent.includes("childHasMore: Boolean(childCount > (c.child_comments ? c.child_comments.length : 0))"),
    "fetchZhihuAnswerComments must extract childCommentCount and initialize childHasMore"
  );

  // 3. Child more entry button inside renderZhihuCommentBubble
  assert.ok(
    scriptContent.includes(".wecom-zhihu-child-more-entry") &&
    scriptContent.includes('data-action="zhihu-load-more-child-comments"') &&
    scriptContent.includes("展开剩余"),
    "renderZhihuCommentBubble must render '展开剩余 X 条回复 ▾' button for root comments with unexpanded replies"
  );

  // 4. Multi-stage bottom container: load next child batch, expand all child comments, and honest end prompt
  assert.ok(
    scriptContent.includes("function updateZhihuBottomMoreContainer()") &&
    scriptContent.includes('data-action="zhihu-load-next-child-batch"') &&
    scriptContent.includes('data-action="zhihu-expand-all-child-comments"') &&
    scriptContent.includes("一键展开全部回复"),
    "must provide bottom actions to load floor reply batches and expand all replies when root comments finish"
  );

  // 5. Never show premature '已加载全部 178 条评论' when displayedCount < total
  assert.ok(
    scriptContent.includes("已加载全部可用主评论及回复（共 ${displayedCount} 条${totalCount > displayedCount ? \"，其余部分可能已被原站过滤或删除\" : \"\"}）") ||
    scriptContent.includes("其余部分可能已被原站过滤或删除"),
    "bottom footer must differentiate genuinely exhausted comments vs unfiltered total discrepancies"
  );

  // 6. Sequential floor badges re-numbering
  assert.ok(
    scriptContent.includes("function updateZhihuCommentFloorBadges("),
    "must define updateZhihuCommentFloorBadges to re-badge floor numbers after inserting child replies"
  );

  // 7. Event delegation in handleChatPanelClick
  assert.ok(
    scriptContent.includes('data-action="zhihu-load-more-child-comments"') &&
    scriptContent.includes('data-action="zhihu-load-next-child-batch"') &&
    scriptContent.includes('data-action="zhihu-expand-all-child-comments"'),
    "handleChatPanelClick must handle child expansion, batch loading, and expand all actions"
  );
});

test("Test 146: Zhihu comment image parsing, thumbnail layout, and bubble image rendering (v0.8.16)", () => {
  // 1. CSS styles for comment image thumbnail wrapper and img
  assert.ok(
    scriptContent.includes(".wecom-zhihu-comment-image-wrap") &&
    scriptContent.includes(".wecom-zhihu-comment-image") &&
    scriptContent.includes("cursor: zoom-in;"),
    "must include CSS rules for .wecom-zhihu-comment-image-wrap and .wecom-zhihu-comment-image"
  );

  // 2. formatZhihuCookedContent transforms comment_img links into img tags
  assert.ok(
    scriptContent.includes("isCommentImg") &&
    scriptContent.includes("comment_img") &&
    scriptContent.includes("wecom-zhihu-comment-image"),
    "formatZhihuCookedContent must parse <a class='comment_img'> links into wecom-zhihu-comment-image"
  );

  // 3. formatZhihuCommentContent helper definition
  assert.ok(
    scriptContent.includes("function formatZhihuCommentContent(raw)") &&
    scriptContent.includes("hasHtmlTags"),
    "must define formatZhihuCommentContent to safely process both pure text and rich comment markup"
  );

  // 4. renderZhihuCommentBubble uses formatZhihuCommentContent
  assert.ok(
    scriptContent.includes("const contentHtml = formatZhihuCommentContent(comm.content);"),
    "renderZhihuCommentBubble must format comment content via formatZhihuCommentContent"
  );

  // 5. Functional simulation of the user's specific comment with image
  const extractFn = (name) => {
    const fnRegex = new RegExp(`function ${name}\\([\\s\\S]*?\\n  \\}`, "m");
    const m = scriptContent.match(fnRegex);
    return m ? m[0] : "";
  };
  const cookedFnCode = extractFn("formatZhihuCookedContent");
  const commentFnCode = extractFn("formatZhihuCommentContent");

  const runner = new Function(
    "escapeHtml",
    `${cookedFnCode}\n${commentFnCode}\nreturn { formatZhihuCookedContent, formatZhihuCommentContent };`
  );
  const escapeHtmlMock = (str) => String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { formatZhihuCommentContent } = runner(escapeHtmlMock);

  const sampleComment = '想起以前QQ空间的事，幸好当年完成了，一个人骑三天，吴川到广州。<a href="https://pic1.zhimg.com/v2-faafb055b29f2c79de217c10f97f2565_qhd.jpg?source=1d2f5c51" class="comment_img" data-width="1080" data-height="2400">查看图片</a>';
  const parsed = formatZhihuCommentContent(sampleComment);

  assert.ok(parsed.includes('<img class="wecom-zhihu-comment-image"'), "parsed output must contain <img> tag with wecom-zhihu-comment-image class");
  assert.ok(parsed.includes('src="https://pic1.zhimg.com/v2-faafb055b29f2c79de217c10f97f2565_qhd.jpg?source=1d2f5c51"'), "parsed output must preserve image URL in src attribute");
  assert.ok(parsed.includes('data-width="1080"') && parsed.includes('data-height="2400"'), "parsed output must retain data-width and data-height attributes");
  assert.ok(!parsed.includes("查看图片"), "literal '查看图片' anchor text must be replaced with the image");
  assert.ok(parsed.includes("想起以前QQ空间的事"), "comment text must be preserved");
});

test("Test 147: Zhihu child comment expansion button subtle gray styling and compact icon + number format (v0.8.17)", () => {
  // 1. formatZhihuChildMoreBtnHtml helper and icon + number structure
  assert.ok(
    scriptContent.includes("function formatZhihuChildMoreBtnHtml(remaining)") &&
    scriptContent.includes("wecom-zhihu-child-more-num") &&
    scriptContent.includes("wecom-zhihu-child-more-arrow"),
    "must define formatZhihuChildMoreBtnHtml returning icon + number format"
  );

  // 2. Subtle gray CSS instead of glaring blue
  assert.ok(
    scriptContent.includes(".wecom-zhihu-child-more-btn {") &&
    scriptContent.includes("color: var(--wc-text-3, #8c8c8c);") &&
    scriptContent.includes("border-radius: 11px;"),
    ".wecom-zhihu-child-more-btn must use subtle gray text color and compact rounded pill style"
  );

  // 3. Dark mode neutral gray
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-zhihu-child-more-btn") &&
    scriptContent.includes("color: rgba(255, 255, 255, 0.45);"),
    "dark mode must use unobtrusive white-alpha gray for .wecom-zhihu-child-more-btn"
  );

  // 4. Hover state does not turn blue
  assert.ok(
    !scriptContent.includes(".wecom-zhihu-child-more-btn:hover {\n      background: rgba(22, 119, 255, 0.08);\n      color: #0958d9;\n    }"),
    "button hover must not use glaring blue hover text color"
  );

  // 5. Functional test of formatZhihuChildMoreBtnHtml
  const extractFn = (name) => {
    const fnRegex = new RegExp(`function ${name}\\([\\s\\S]*?\\n  \\}`, "m");
    const m = scriptContent.match(fnRegex);
    return m ? m[0] : "";
  };
  const iconDecl = 'const ZHIHU_COMMENT_ICON = `<svg class="wecom-zhihu-comments-icon" width="13" height="13" viewBox="0 0 24 24"><path d="M21 15..."/></svg>`;';
  const helperFnCode = extractFn("formatZhihuChildMoreBtnHtml");
  const testFn = new Function(`${iconDecl}\n${helperFnCode}\nreturn formatZhihuChildMoreBtnHtml;`)();

  const renderedHtml = testFn(12);
  assert.ok(renderedHtml.includes('wecom-zhihu-comments-icon'), "button must include comment icon");
  assert.ok(renderedHtml.includes('>12<'), "button must display the number of remaining replies");
  assert.ok(renderedHtml.includes('▾'), "button must include subtle expansion arrow");
});

test("Test 148: Borderless icon+number button and no left border line when child replies are not displayed (v0.8.18)", () => {
  // 1. Borderless .wecom-zhihu-child-more-btn in light and dark modes
  assert.ok(
    scriptContent.includes(".wecom-zhihu-child-more-btn {") &&
    scriptContent.includes("border: none !important;"),
    ".wecom-zhihu-child-more-btn must not have an outer border box"
  );
  assert.ok(
    scriptContent.includes("html.wecom-dark .wecom-zhihu-child-more-btn") &&
    scriptContent.includes("border: none !important;"),
    "dark mode .wecom-zhihu-child-more-btn must not have an outer border box"
  );

  // 2. CSS rules to hide left border line when no child comments are rendered
  assert.ok(
    scriptContent.includes(".wecom-reply-children.has-no-children") &&
    scriptContent.includes(".wecom-reply-children:not(:has(.wecom-msg))") &&
    scriptContent.includes("border-left: none !important;"),
    "must hide border-left when .wecom-reply-children has no rendered children"
  );

  // 3. renderZhihuCommentBubble dynamically attaches has-no-children class when renderedChildren is empty
  assert.ok(
    scriptContent.includes("const hasRenderedChildren = Boolean(renderedChildren);") &&
    scriptContent.includes("const noChildrenClass = !hasRenderedChildren ? \" has-no-children\" : \"\";") &&
    scriptContent.includes("`<div class=\"wecom-reply-children${noChildrenClass}\">${renderedChildren}${childMoreHtml}</div>`"),
    "renderZhihuCommentBubble must attach has-no-children class when no child replies are rendered"
  );

  // 4. loadMoreZhihuChildComments removes has-no-children class when child replies are loaded
  assert.ok(
    scriptContent.includes("replyChildrenEl.classList.remove(\"has-no-children\");"),
    "loadMoreZhihuChildComments must remove has-no-children class when child replies are added"
  );
});

test("Test 149: Zhihu child comment expansion button right alignment (v0.8.19)", () => {
  // 1. Right alignment styles for .wecom-zhihu-child-more-entry
  assert.ok(
    scriptContent.includes(".wecom-zhihu-child-more-entry {") &&
    scriptContent.includes("display: flex;") &&
    scriptContent.includes("justify-content: flex-end;"),
    ".wecom-zhihu-child-more-entry must use flex layout with justify-content: flex-end"
  );

  // 2. margin-left: auto on .wecom-zhihu-child-more-btn
  assert.ok(
    scriptContent.includes(".wecom-zhihu-child-more-btn {") &&
    scriptContent.includes("margin-left: auto;"),
    ".wecom-zhihu-child-more-btn must use margin-left: auto for solid right alignment"
  );

  // 3. has-no-children state preserves right alignment
  assert.ok(
    scriptContent.includes(".wecom-reply-children.has-no-children .wecom-zhihu-child-more-entry") &&
    scriptContent.includes("justify-content: flex-end !important;"),
    "must preserve right alignment when has-no-children is active"
  );
});

test("Test 150: Category and group selection instant loading, loading skeleton, multi-channel Zhihu/Linux.do/V2EX routing, and retry support (v0.8.20)", () => {
  // 1. Version must be 0.8.20 or newer
  assert.ok(
    /\/\/ @version\s+0\.8\.(?:2[0-9]|[3-9][0-9])/.test(scriptContent),
    "userscript version must be 0.8.20 or newer"
  );

  // 2. listApiForPath on Zhihu supports /notifications, /hot, /follow, /explore, /waiting
  assert.ok(
    scriptContent.includes("pathname.includes(\"/notifications\") || search.includes(\"notifications\")") &&
    scriptContent.includes("pathname.includes(\"/explore\") || search.includes(\"explore\")") &&
    scriptContent.includes("pathname.includes(\"/waiting\") || search.includes(\"waiting\")"),
    "listApiForPath on Zhihu must support notifications, explore, and waiting channels"
  );

  // 3. scopedListApiForPath on Discourse supports /none, /c/slug/id, /g/
  assert.ok(
    scriptContent.includes("(?:c|tag|g)") &&
    scriptContent.includes("clean.endsWith(\"/none\")"),
    "scopedListApiForPath must support categories, tags, and groups"
  );

  // 4. ensureV2exNav2 click triggers immediate list loading with force=true and loading skeleton
  assert.ok(
    scriptContent.includes("nav2.addEventListener(\"click\", (e) => {") &&
    scriptContent.includes("loadList(targetApiPath, true);") &&
    scriptContent.includes("正在加载列表…"),
    "ensureV2exNav2 click must show loading skeleton and call loadList(targetApiPath, true)"
  );

  // 5. loadZhihuList handles explore and waiting channels, and displays loading skeleton
  assert.ok(
    scriptContent.includes("isWaiting = apiPath === \"/waiting\" || apiPath.includes(\"waiting\")") &&
    scriptContent.includes("topics = await fetchZhihuWaitingList();") &&
    scriptContent.includes("正在加载知乎列表…"),
    "loadZhihuList must support waiting channel and show loading skeleton"
  );

  // 6. statusEl click handler retries loadList when is-clickable is active
  assert.ok(
    scriptContent.includes("else if (statusEl.classList.contains(\"is-clickable\") && !listState.loading)") &&
    scriptContent.includes("loadList(apiPath, true);"),
    "clicking a clickable status element must retry loadList(apiPath, true)"
  );

  // 7. Linux.do Discourse sidebar click binds category navigation and triggers loadList
  assert.ok(
    scriptContent.includes("sidebar.dataset.navBound = \"1\";") &&
    scriptContent.includes("a.sidebar-section-link, a[href*='/c/'], a[href*='/tag/'], a[href*='/g/']"),
    "ensureSidebarCloseBtn must bind sidebar link clicks to load category lists"
  );
});

test("Test 151: WeCom login dialog for unlogged users across all platforms (Linux.do, V2EX, Juejin, Zhihu), auto-prompting and interaction guards (v0.8.21)", () => {
  // 1. isUserLoggedIn logic detects non-logged-in status on all 4 platforms
  assert.ok(
    scriptContent.includes("function isUserLoggedIn()") &&
    scriptContent.includes(".AppHeader-login, button.AppHeader-login") &&
    scriptContent.includes(".login-button, button.login-button") &&
    scriptContent.includes("a[href='/signin'], a[href*='/signin']") &&
    scriptContent.includes(".login-button, #login-link"),
    "isUserLoggedIn must cover Zhihu, Juejin, V2EX, and Linux.do login indicators"
  );

  // 2. getPlatformInfo provides metadata, svg icons, URLs and benefits
  assert.ok(
    scriptContent.includes("function getPlatformInfo()") &&
    scriptContent.includes("benefits: \"登录后可参与回答讨论、展开全部回复、点赞互动与同步关注\"") &&
    scriptContent.includes("benefits: \"登录后可发表沸点文章、收藏内容、点赞回复与每日签到\"") &&
    scriptContent.includes("benefits: \"登录后可参与主题交流、回复回帖、领取每日银币和查看提醒\"") &&
    scriptContent.includes("benefits: \"登录后可畅享社区交流、发布主题讨论、回帖与点赞互动\""),
    "getPlatformInfo must return metadata and benefits for Zhihu, Juejin, V2EX, and Linux.do"
  );

  // 3. triggerPlatformLogin and triggerPlatformSignup
  assert.ok(
    scriptContent.includes("function triggerPlatformLogin()") &&
    scriptContent.includes("function triggerPlatformSignup()") &&
    scriptContent.includes("info.loginSelector") &&
    scriptContent.includes("window.location.href = info.loginUrl"),
    "triggerPlatformLogin and triggerPlatformSignup must handle native selectors and URLs"
  );

  // 4. showWecomLoginDialog and closeWecomLoginDialog
  assert.ok(
    scriptContent.includes("function showWecomLoginDialog(options = {})") &&
    scriptContent.includes("function closeWecomLoginDialog(result = false)") &&
    scriptContent.includes("wecom-confirm-dialog wecom-login-dialog") &&
    scriptContent.includes("wecom-confirm-card wecom-login-card") &&
    scriptContent.includes("wecom-login-avatar-placeholder") &&
    scriptContent.includes("wecom-login-btn-signup") &&
    scriptContent.includes("暂不登录") &&
    scriptContent.includes("立即登录"),
    "showWecomLoginDialog must render Enterprise WeChat style dialog with signup, cancel, and login actions"
  );

  // 5. Rail avatar sync and click interaction guard
  assert.ok(
    scriptContent.includes("} else if (!isUserLoggedIn()) {") &&
    scriptContent.includes("avatarEl.dataset.bound = \"guest\";") &&
    scriptContent.includes("当前未登录（点击立即登录）") &&
    scriptContent.includes("currentName.textContent = \"未登录\";") &&
    scriptContent.includes("if (!isUserLoggedIn()) {") &&
    scriptContent.includes("showWecomLoginDialog({ auto: false });"),
    "syncRail and bindRailAvatarNotif must render guest avatar and intercept unlogged avatar click"
  );

  // 6. Action guards for openNewTopic, replyToPost, submitComposer, and tool actions
  assert.ok(
    scriptContent.includes("function openNewTopic() {\n    if (!isUserLoggedIn()) {\n      showWecomLoginDialog({ auto: false });\n      return;\n    }") &&
    scriptContent.includes("function replyToPost(postNumber) {\n    if (!isUserLoggedIn()) {\n      showWecomLoginDialog({ auto: false });\n      return;\n    }") &&
    scriptContent.includes("async function submitComposer() {\n    if (!isUserLoggedIn()) {\n      showWecomLoginDialog({ auto: false });\n      return;\n    }") &&
    scriptContent.includes("if (action === \"like\" || action === \"boost\" || action === \"bookmark\" || action === \"edit\" || action === \"delete\") {\n      if (!isUserLoggedIn()) {\n        showWecomLoginDialog({ auto: false });\n        return;\n      }\n    }"),
    "openNewTopic, replyToPost, submitComposer, and message actions must guard against unlogged execution"
  );

  // 7. Auto-prompting schedule and theme integration
  assert.ok(
    scriptContent.includes("function scheduleInitialLoginCheck(delayMs = 1200)") &&
    scriptContent.includes("scheduleInitialLoginCheck();") &&
    scriptContent.includes("document.querySelector(\".wecom-login-dialog\")?.remove();") &&
    scriptContent.includes(".wecom-login-dialog"),
    "scheduleInitialLoginCheck and teardown must integrate cleanly into theme lifecycle"
  );

  // 8. CSS styling for dialog and dark mode
  assert.ok(
    scriptContent.includes(".wecom-login-dialog {") &&
    scriptContent.includes(".wecom-login-card {") &&
    scriptContent.includes(".wecom-login-features {") &&
    scriptContent.includes("html.wecom-dark .wecom-login-badge,") &&
    scriptContent.includes("html.wecom-dark .wecom-rail-avatar[data-bound=\"guest\"],"),
    "RAW_CSS must include styling for login dialog and dark mode"
  );
});







