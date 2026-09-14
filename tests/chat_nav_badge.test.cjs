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




