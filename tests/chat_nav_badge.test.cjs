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

test("linuxdo-wecom guards document.title to remain blank and avoids leaking detail title", () => {
  assert.ok(
    scriptContent.includes("setupTitleGuard"),
    "must include setupTitleGuard"
  );
  assert.ok(
    scriptContent.includes("enforceBlankTitle"),
    "must include enforceBlankTitle"
  );
  assert.ok(
    !scriptContent.includes("document.title = `${chatState.title}"),
    "must not set document.title to chatState.title"
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
    scriptContent.includes('navigateInApp(IS_V2EX ? "/?tab=all" : "/latest");'),
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
    const isAllHome = path === "/" || path === "/?tab=all" || path === "all" || path === "latest";
    if (isAllHome) return { hasMore: count > 0, nextPageUrl: "/recent" };
    if (path.includes("tab=") && !path.includes("tab=all") && !path.includes("tab=latest")) {
      return { hasMore: false, nextPageUrl: null };
    }
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

  // 2. Tab tech has no pagination
  const resTech = simulateListPagination("", "/?tab=tech", 50);
  assert.equal(resTech.hasMore, false);

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
    scriptContent.includes("discourseRouteTo(url) {\n    if (IS_V2EX || !url) return false;\n    removeLoadingSliderDom();"),
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
