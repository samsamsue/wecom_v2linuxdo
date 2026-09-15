// ==UserScript==
// @name         Linux DO · 企业微信 IM 外观
// @namespace    https://linux.do/
// @version      0.7.26
// @description  将 Linux DO 换成企业微信 5.x 桌面端风格；支持浅色/深色/跟随系统，并保留原站交互。
// @author       Richy
// @match        *://linux.do/*
// @match        https://linux.do/*
// @match        *://*.v2ex.com/*
// @match        https://*.v2ex.com/*
// @match        *://v2ex.com/*
// @match        https://v2ex.com/*
// @connect      api.imgur.com
// @connect      imgur.com
// @icon         https://linux.do/favicon.ico
// @homepageURL  https://github.com/samsamsue/wecom_v2linuxdo
// @updateURL    https://raw.githubusercontent.com/samsamsue/wecom_v2linuxdo/main/linuxdo-wecom.meta.js
// @downloadURL  https://raw.githubusercontent.com/samsamsue/wecom_v2linuxdo/main/linuxdo-wecom.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  /* ============================== 常量 ============================== */

  const STYLE_ID = "linuxdo-wecom-theme";
  const FAVICON_ID = "wecom-favicon";
  const ROOT_CLASS = "wecom-im-theme";
  const LOCK_CLASS = "wecom-locked"; // 仅三栏路由挂载：隐藏原生主内容
  const VIEW_KEY = "linuxdo-wecom-view"; // "im" | "native"
  const LAST_READ_KEY = "linuxdo-wecom-last-read";
  const LAST_READ_MAX_TOPICS = 200;
  const TOPIC_HISTORY_KEY = "linuxdo-wecom-topic-history";
  const TOPIC_HISTORY_MAX = 200;

  const RAIL_WIDTH = 56; // 企业微信 PC 端标准 56px 侧边停靠栏
  const NAV2_WIDTH = 240; // 展开栏（原生侧栏原样搬入，默认收起）
  const STRIP_WIDTH = 0; // 企业微信布局无窄条
  const LIST_WIDTH = 280; // 会话列表
  const MEMBER_WIDTH = 210; // 群成员/公告栏
  const TITLEBAR_HEIGHT = 0; // 企业微信经典布局无全局顶栏
  const CURRENT_HOST = typeof location !== "undefined" ? location.hostname : "";
  const IS_V2EX = /(?:^|\.)v2ex\.com$/i.test(CURRENT_HOST);
  const IS_LINUXDO = !IS_V2EX;
  const CURRENT_PLATFORM = IS_V2EX ? "v2ex" : "linuxdo";

  const WATERMARK_ENABLED_KEY = "linuxdo-wecom-watermark-enabled";
  const WATERMARK_TEXT_KEY = "linuxdo-wecom-watermark-text";
  const DEFAULT_WATERMARK_TEXT = IS_V2EX ? "v2ex.com · 内部资料" : "linux.do · 内部资料";
  const WATERMARK_MAX_LENGTH = 48;
  const WATERMARK_TILE_WIDTH = 300;
  const WATERMARK_TILE_HEIGHT = 160;
  const AVATAR_SOURCE_SIZE = 96;
  const THEME_MODE_KEY = "linuxdo-wecom-theme-mode";
  const BOOST_ENABLED_KEY = "linuxdo-wecom-boost-enabled";
  const HIDE_CHAT_AVATAR_KEY = "linuxdo-wecom-hide-chat-avatar";
  const BASE64_DECODE_KEY = "linuxdo-wecom-base64-decode";
  const IMAGE_AUTO_LAYOUT_KEY = "linuxdo-wecom-image-auto-layout";
  const IMAGE_AUTO_LAYOUT_SIZE_KEY = "linuxdo-wecom-image-layout-size";
  const DEFAULT_IMAGE_AUTO_LAYOUT_SIZE = 100;
  const MIN_IMAGE_AUTO_LAYOUT_SIZE = 50;
  const MAX_IMAGE_AUTO_LAYOUT_SIZE = 400;
  const IMAGE_AUTO_LAYOUT_ASPECT_KEY = "linuxdo-wecom-image-layout-aspect";
  const DEFAULT_IMAGE_AUTO_LAYOUT_ASPECT = "1:1";
  const SUPPORTED_IMAGE_AUTO_LAYOUT_ASPECTS = Object.freeze(["4:3", "1:1", "16:9"]);
  const THEME_MODE_VALUES = Object.freeze(["light", "dark", "system"]);
  const DEFAULT_THEME_MODE = "light";
  const IMAGE_VIEWER_DEFAULT_SCALE = 1;
  const IMAGE_VIEWER_MIN_SCALE = 0.25;
  const IMAGE_VIEWER_MAX_SCALE = 5;
  const IMAGE_VIEWER_WHEEL_SENSITIVITY = 0.0015;
  const IMAGE_VIEWER_LINE_HEIGHT_PX = 16;
  const IMAGE_VIEWER_PERCENT_MULTIPLIER = 100;
  const WHEEL_DELTA_LINE_MODE = 1;
  const WHEEL_DELTA_PAGE_MODE = 2;
  const COMPOSER_READY_TIMEOUT_MS = 5000;
  const COMPOSER_SUBMIT_TIMEOUT_MS = 20000;
  const COMPOSER_INPUT_SETTLE_MS = 80;
  const COMPOSER_POLL_INTERVAL_MS = 50;
  const COMPOSER_STATUS_DURATION_MS = 3200;
  const POST_SYNC_RETRY_DELAYS_MS = [0, 240, 900];
  const POST_SYNC_BATCH_SIZE = 20;
  const REPLY_PREVIEW_LENGTH = 72;
  const REPLY_HIGHLIGHT_DURATION_MS = 1800;
  const UPLOAD_ENDPOINTS = ["/uploads.json", "/uploads"];
  const V2EX_IMGUR_CLIENT_ID = "60605aad4a62882";
  const V2EX_IMGUR_UPLOAD_URL = "https://api.imgur.com/3/upload";
  const POST_ENDPOINTS = ["/posts.json", "/posts"];
  const RETRYABLE_ENDPOINT_STATUS = new Set([404, 405, 415]);
  const COMPOSER_ERROR_PREVIEW_LENGTH = 240;
  const NATIVE_COMPOSER_TEXTAREA = "#reply-control textarea.d-editor-input, #reply-control textarea";
  const NATIVE_COMPOSER_SUBMIT = [
    "#reply-control .save-or-cancel button.create",
    "#reply-control .save-or-cancel button.btn-primary",
    "#reply-control button.create.btn-primary"
  ].join(", ");
  const NATIVE_COMPOSER_ERROR = [
    "#reply-control .alert-error",
    "#reply-control .alert.alert-error",
    "#reply-control .composer-error",
    "#reply-control .validation-error",
    "#reply-control .popup-tip.bad",
    "#reply-control [role='alert']"
  ].join(", ");

  const AVATAR_COLORS = [
    "#267EF0", "#07C160", "#5B8FF9", "#8B6CFF",
    "#10B981", "#E6A23C", "#61758A", "#E85D5D"
  ];

  /* ============================== 内联 SVG 图标 ============================== */

  const ICONS = {
    // 停靠栏填充型图标 (Tabler filled 规范)
    msg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 3a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-4.724l-4.762 2.857a1 1 0 0 1 -1.508 -.743l-.006 -.114v-2h-1a4 4 0 0 1 -3.995 -3.8l-.005 -.2v-8a4 4 0 0 1 4 -4zm-4 9h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m2 -4h-8a1 1 0 1 0 0 2h8a1 1 0 0 0 0 -2" /></svg>`,
    history: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -1 1v5a1 1 0 0 0 .293 .707l3 3a1 1 0 0 0 1.414 -1.414l-2.707 -2.707v-4.586a1 1 0 0 0 -1 -1z" /></svg>`,
    doc: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm3 14h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m-5 -4h-1a1 1 0 1 0 0 2h1a1 1 0 0 0 0 -2" /><path d="M19 7h-4l-.001 -4.001z" /></svg>`,
    work: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 3a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" /><path d="M19 3a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" /><path d="M9 13a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" /><path d="M19 13a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" /></svg>`,
    book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M2 16.667a2.667 2.667 0 0 1 2.667 -2.667h2.666a2.667 2.667 0 0 1 2.667 2.667v2.666a2.667 2.667 0 0 1 -2.667 2.667h-2.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M14 16.667a2.667 2.667 0 0 1 2.667 -2.667h2.666a2.667 2.667 0 0 1 2.667 2.667v2.666a2.667 2.667 0 0 1 -2.667 2.667h-2.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M8 4.667a2.667 2.667 0 0 1 2.667 -2.667h2.666a2.667 2.667 0 0 1 2.667 2.667v2.666a2.667 2.667 0 0 1 -2.667 2.667h-2.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M12 8a1 1 0 0 0 -1 1v2h-3c-1.645 0 -3 1.355 -3 3v1a1 1 0 0 0 1 1a1 1 0 0 0 1 -1v-1c0 -.564 .436 -1 1 -1h8c.564 0 1 .436 1 1v1a1 1 0 0 0 1 1a1 1 0 0 0 1 -1v-1c0 -1.645 -1.355 -3 -3 -3h-3v-2a1 1 0 0 0 -1 -1z" /></svg>`,
    meet: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.117 7.625a1 1 0 0 0 -.564 .1l-4.553 2.275v4l4.553 2.275a1 1 0 0 0 1.447 -.892v-6.766a1 1 0 0 0 -.883 -.992z" /><path d="M5 5c-1.645 0 -3 1.355 -3 3v8c0 1.645 1.355 3 3 3h8c1.645 0 3 -1.355 3 -3v-8c0 -1.645 -1.355 -3 -3 -3z" /></svg>`,
    disk: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10.04 4.305c2.195 -.667 4.615 -.224 6.36 1.176c1.386 1.108 2.188 2.686 2.252 4.34l.003 .212l.091 .003c2.3 .107 4.143 1.961 4.25 4.27l.004 .211c0 2.407 -1.885 4.372 -4.255 4.482l-.21 .005h-11.878l-.222 -.008c-2.94 -.11 -5.317 -2.399 -5.43 -5.263l-.005 -.216c0 -2.747 2.08 -5.01 4.784 -5.417l.114 -.016l.07 -.181c.663 -1.62 2.056 -2.906 3.829 -3.518l.244 -.08z" /></svg>`,
    cal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16v-9.625z" /><path d="M12 12a1 1 0 0 1 .993 .883l.007 .117v3a1 1 0 0 1 -1.993 .117l-.007 -.117v-2a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /></svg>`,
    todo: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" /></svg>`,
    smartdoc: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 3h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" /><path d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" /><path d="M19 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" /><path d="M17 3a1 1 0 0 1 .993 .883l.007 .117v2h2a1 1 0 0 1 .117 1.993l-.117 .007h-2v2a1 1 0 0 1 -1.993 .117l-.007 -.117v-2h-2a1 1 0 0 1 -.117 -1.993l.117 -.007h2v-2a1 1 0 0 1 1 -1z" /></svg>`,
    summary: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M16 19a1 1 0 0 1 0 -2a1 1 0 0 0 1 -1c0 -1.333 2 -1.333 2 0a1 1 0 0 0 1 1c1.333 0 1.333 2 0 2a1 1 0 0 0 -1 1c0 1.333 -2 1.333 -2 0a1 1 0 0 0 -1 -1" /><path d="M3 11a5 5 0 0 0 5 -5c0 -1.333 2 -1.333 2 0a5 5 0 0 0 5 5c1.333 0 1.333 2 0 2a5 5 0 0 0 -5 5a1 1 0 0 1 -2 0a5 5 0 0 0 -5 -5c-1.333 0 -1.333 -2 0 -2" /><path d="M16 7a1 1 0 0 1 0 -2a1 1 0 0 0 1 -1c0 -1.333 2 -1.333 2 0a1 1 0 0 0 1 1c1.333 0 1.333 2 0 2a1 1 0 0 0 -1 1c0 1.333 -2 1.333 -2 0a1 1 0 0 0 -1 -1" /></svg>`,
    advanced: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.894 13.553a1 1 0 0 1 -.447 1.341l-8 4a1 1 0 0 1 -.894 0l-8 -4a1 1 0 0 1 .894 -1.788l7.553 3.774l7.554 -3.775a1 1 0 0 1 1.341 .447m-8.887 -8.552q .056 0 .111 .007l.111 .02l.086 .024l.012 .006l.012 .002l.029 .014l.05 .019l.016 .009l.012 .005l8 4a1 1 0 0 1 0 1.788l-8 4a1 1 0 0 1 -.894 0l-8 -4a1 1 0 0 1 0 -1.788l8 -4l.011 -.005l.018 -.01l.078 -.032l.011 -.002l.013 -.006l.086 -.024l.11 -.02l.056 -.005z" /></svg>`,
    group: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" /></svg>`,
    pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" /></svg>`,
    gear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14.647 4.081a.724 .724 0 0 0 1.08 .448c2.439 -1.485 5.23 1.305 3.745 3.744a.724 .724 0 0 0 .447 1.08c2.775 .673 2.775 4.62 0 5.294a.724 .724 0 0 0 -.448 1.08c1.485 2.439 -1.305 5.23 -3.744 3.745a.724 .724 0 0 0 -1.08 .447c-.673 2.775 -4.62 2.775 -5.294 0a.724 .724 0 0 0 -1.08 -.448c-2.439 1.485 -5.23 -1.305 -3.745 -3.744a.724 .724 0 0 0 -.447 -1.08c-2.775 -.673 -2.775 -4.62 0 -5.294a.724 .724 0 0 0 .448 -1.08c-1.485 -2.439 1.305 -5.23 3.744 -3.745a.722 .722 0 0 0 1.08 -.447c.673 -2.775 4.62 -2.775 5.294 0zm-2.647 4.919a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z" /></svg>`,
    sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" /><path d="M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z" /><path d="M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" /><path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /><path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /><path d="M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z" /><path d="M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" /><path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" /><path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z" /></svg>`,

    // 常用操作与工具条图标 (Tabler 线条规范)
    ding: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>`,
    proj: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></svg>`,
    mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>`,
    apps: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /></svg>`,
    build: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l5 5v7h-5v-4m0 4h-5v-7l5 -5m1 1v-6a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v12h-4" /><path d="M13 7h4" /><path d="M13 11h4" /></svg>`,
    more: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>`,
    grid: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M14 14h6v6h-6z" /></svg>`,
    spark: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" /></svg>`,
    phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 1 1 16 0v3" /><path d="M18 19c0 1.657 -2.686 3 -6 3" /><path d="M4 14a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2v-3z" /><path d="M15 14a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2v-3z" /></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>`,
    mute: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18" /><path d="M17 17h-13a4 4 0 0 0 2 -3v-3a7 7 0 0 1 1.279 -3.716m2.072 -1.964c.812 -.215 1.686 -.32 2.649 -.32a7 7 0 0 1 7 7v1" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>`,
    bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>`,
    win: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="12" rx="2" /><path d="M5 10h14" /></svg>`,
    emoji: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 10l.01 0" /><path d="M15 10l.01 0" /><path d="M9.5 15a3.5 3.5 0 0 0 5 0" /></svg>`,
    like: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg>`,
    heart: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>`,
    cut: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M8.6 8.6l10.4 10.4" /><path d="M8.6 15.4l10.4 -10.4" /></svg>`,
    folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" /></svg>`,
    pic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" /></svg>`,
    collect: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>`,
    file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></svg>`,
    bolt: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0z" /></svg>`,
    cam: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10l4.553 -2.276a1 1 0 0 1 1.447 .894v6.764a1 1 0 0 1 -1.447 .894l-4.553 -2.276v-4z" /><path d="M3 6m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /></svg>`,
    redpack: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19v-7l-5 -7h3l3.5 5l3.5 -5h3l-5 7v7" /><path d="M8 17l8 0" /><path d="M8 13l8 0" /></svg>`,
    dots: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>`,
    expand: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>`,
    refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>`,
    external: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>`,
    reply: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 18v-6a3 3 0 0 0 -3 -3h-10l4 -4m0 8l-4 -4" /></svg>`,
    edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" /><path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" /><path d="M16 5l3 3" /></svg>`,
    bookmark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" /></svg>`,
    boost: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 1 7 7 6 6 0 0 0 3-5 9 9 0 0 0 6-8 3 3 0 0 0-3-3 9 9 0 0 0-8 6 6 6 0 0 0-5 3"/><path d="m9 15 3 3"/><path d="m15 9 3 3"/><path d="M9.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>`,
    menu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg>`,
    chevronDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6" /></svg>`,
    chevronUp: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6 -6l6 6" /></svg>`,
    chevronRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6l-6 6" /></svg>`,
    compose: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>`,
    filter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>`,
    disguise: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" /></svg>`,
    aitable: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" /><path d="M3 10h18" /><path d="M10 3v18" /></svg>`,
    aimic: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M8 21l8 0" /><path d="M12 17l0 4" /></svg>`,
    monitor: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10z" /><path d="M7 20h10" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>`,
    at: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0v-1.5a9 9 0 1 0 -5.5 8.28" /></svg>`,
    monitorSmall: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10z" /><path d="M7 20h10" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>`,
    checklist: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 11.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 17.5l1.5 1.5l2.5 -2.5" /><path d="M11 6l9 0" /><path d="M11 12l9 0" /><path d="M11 18l9 0" /></svg>`,
    historyChat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" /><path d="M12 11l0 .01" /><path d="M8 11l0 .01" /><path d="M16 11l0 .01" /></svg>`,
    userPlus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4c.342 0 .674 .043 .99 .124" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>`,
    watermark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18.5h14" /><path d="M8 16l4 -10l4 10" /><path d="M9.4 12.5h5.2" /></svg>`,
    circleOff: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><line x1="5.7" y1="5.7" x2="18.3" y2="18.3" /></svg>`,
    docLine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="12" y2="16" /></svg>`,
    todoLine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2" /><line x1="8" y1="2.5" x2="8" y2="5.5" /><line x1="16" y1="2.5" x2="16" y2="5.5" /><path d="M8 12.5l2.5 2.5l5.5 -5.5" /></svg>`,
    phoneReceiver: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /></svg>`,
    appsGrid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><line x1="14" y1="15.5" x2="20" y2="15.5" /><line x1="14" y1="19" x2="20" y2="19" /></svg>`,
    historySearch: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19v-11a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v4" /><path d="M4 19l3 -2h4" /><circle cx="8" cy="11" r=".6" fill="currentColor" /><circle cx="12" cy="11" r=".6" fill="currentColor" /><circle cx="16" cy="11" r=".6" fill="currentColor" /><circle cx="15.5" cy="15.5" r="3" /><line x1="17.8" y1="17.8" x2="20.5" y2="20.5" /></svg>`,
    scrollTop: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6" /><path d="M6 12l6-6 6 6" /><path d="M4 3h16" /></svg>`,
    platformSwitch: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16m-4 -4l4 4l-4 4" /><path d="M20 15h-16m4 -4l-4 4l4 4" /></svg>`,
    winMin: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><line x1="1.5" y1="6" x2="10.5" y2="6" /></svg>`,
    winMax: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" /></svg>`,
    winRestore: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="3.5" y="1.5" width="7" height="7" rx="1" /><path d="M1.5 4.5v6a1 1 0 0 0 1 1h6" /></svg>`,
    winClose: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M2.2 2.2l7.6 7.6m0-7.6l-7.6 7.6" /></svg>`,
    layoutOriginal: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><line x1="9" y1="9" x2="10" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>`,
    layoutAuto: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>`,
    userOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.18 4.171a4 4 0 0 1 5.649 5.66m-1.829 2.169a4 4 0 0 1 -3.82 -3.83" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4c.412 0 .81 .062 1.183 .178m2.633 2.642c.12 .38 .184 .785 .184 1.18v2" /><path d="M3 3l18 18" /></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>`,
    code: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8l-4 4l4 4" /><path d="M17 8l4 4l-4 4" /><path d="M14 4l-4 16" /></svg>`
  };
  ICONS.chat = ICONS.msg;
  ICONS.list = ICONS.msg;
  ICONS.calendar = ICONS.cal;
  ICONS.worktable = ICONS.work;
  ICONS.cloud = ICONS.doc;
  ICONS.wiki = ICONS.doc;
  ICONS.task = ICONS.todo;
  ICONS.contacts = ICONS.book;
  ICONS.project = ICONS.proj;
  ICONS.watermark = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 18.5h14M8 16l4-10 4 10M9.4 12.5h5.2" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 5.5l1 1 2-2" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const FAVICON_URI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iOCIgeTE9IjQiIHgyPSI1NiIgeTI9IjYwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQwOTZmZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzE3NjlkMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE1IiBmaWxsPSJ1cmwoI2EpIi8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTExIDI3LjVDMTEgMTguOTQgMTguODQgMTIgMjguNSAxMlM0NiAxOC45NCA0NiAyNy41IDM4LjE2IDQzIDI4LjUgNDNjLTIuMTMgMC00LjE3LS4zNC02LjA2LS45NUwxNCA0N2wyLjQ4LTcuMTZDMTMuMSAzNi45MSAxMSAzMi41NSAxMSAyNy41WiIvPjxwYXRoIGZpbGw9IiMxOWM4NzgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIGQ9Ik0zNCAzNy41QzM0IDMwLjYgNDAuMjcgMjUgNDggMjVzMTQgNS42IDE0IDEyLjVTNTUuNzMgNTAgNDggNTBjLTEuNTUgMC0zLjA0LS4yMy00LjQzLS42NUwzNyA1M2wxLjg0LTUuMjNDMzUuODcgNDUuMzkgMzQgNDEuNzMgMzQgMzcuNVoiLz48Y2lyY2xlIGN4PSIyMyIgY3k9IjI3IiByPSIyIiBmaWxsPSIjMjY3ZWYwIi8+PGNpcmNsZSBjeD0iMzMiIGN5PSIyNyIgcj0iMiIgZmlsbD0iIzI2N2VmMCIvPjxjaXJjbGUgY3g9IjQ0IiBjeT0iMzcuNSIgcj0iMS43IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNTIiIGN5PSIzNy41IiByPSIxLjciIGZpbGw9IiNmZmYiLz48L3N2Zz4=";


  /* ============================== 工具函数 ============================== */

  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function avatarColor(name) {
    let hash = 0;
    const s = String(name || "?");
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function avatarLetter(name) {
    const s = String(name || "?").trim();
    const ch = [...s][0] || "?";
    return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
  }

  /** 优先用户显示名（name），再退回 username */
  function userDisplayName(user, fallback) {
    const name = user && String(user.name || "").trim();
    if (name) return name;
    const uname = user && String(user.username || "").trim();
    if (uname) return uname;
    return String(fallback || "?").trim() || "?";
  }

  function userCardIdentity(user) {
    const username = String(user?.username || "").trim();
    if (!username) return null;
    const label = `查看 ${userDisplayName(user, username)} 的资料`;
    return Object.freeze({ username, label });
  }

  function userCardAttributes(user) {
    const identity = userCardIdentity(user);
    if (!identity) return "";
    return ` data-user-card="${escapeHtml(identity.username)}" role="button" tabindex="0"` +
      ` aria-label="${escapeHtml(identity.label)}" title="${escapeHtml(identity.label)}"`;
  }

  /* ---------- 左上角侧栏伪装头像（企业高管/职员商务剪影） ---------- */
  const RAIL_AVATAR_DISGUISE_KEY = "linuxdo-wecom-rail-avatar-disguise";

  const RAIL_DISGUISE_AVATARS = [
    {
      id: "wecom-blue",
      name: "企微商务蓝",
      svg: '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#267EF0"/><circle cx="18" cy="12.5" r="5.2" fill="#FFFFFF"/><path d="M7.5 29c0-5.247 4.701-9.5 10.5-9.5s10.5 4.253 10.5 9.5v2a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-2z" fill="#FFFFFF"/><path d="M16 19.5l2 3.5 2-3.5" stroke="#267EF0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: "wecom-green",
      name: "企业办公绿",
      svg: '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#07C160"/><circle cx="18" cy="12.5" r="5.2" fill="#FFFFFF"/><path d="M7.5 29c0-5.247 4.701-9.5 10.5-9.5s10.5 4.253 10.5 9.5v2a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-2z" fill="#FFFFFF"/><path d="M16 19.5l2 3.5 2-3.5" stroke="#07C160" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: "wecom-navy",
      name: "行政深蓝",
      svg: '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#1B5EBF"/><circle cx="18" cy="12.5" r="5.2" fill="#FFFFFF"/><path d="M7.5 29c0-5.247 4.701-9.5 10.5-9.5s10.5 4.253 10.5 9.5v2a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-2z" fill="#FFFFFF"/><path d="M16 19.5l2 3.5 2-3.5" stroke="#1B5EBF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: "wecom-slate",
      name: "稳重灰蓝",
      svg: '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#4B6B94"/><circle cx="18" cy="12.5" r="5.2" fill="#FFFFFF"/><path d="M7.5 29c0-5.247 4.701-9.5 10.5-9.5s10.5 4.253 10.5 9.5v2a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-2z" fill="#FFFFFF"/><path d="M16 19.5l2 3.5 2-3.5" stroke="#4B6B94" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: "wecom-orange",
      name: "活力暖橙",
      svg: '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#FA8C16"/><circle cx="18" cy="12.5" r="5.2" fill="#FFFFFF"/><path d="M7.5 29c0-5.247 4.701-9.5 10.5-9.5s10.5 4.253 10.5 9.5v2a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-2z" fill="#FFFFFF"/><path d="M16 19.5l2 3.5 2-3.5" stroke="#FA8C16" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    }
  ];

  function getRailDisguiseAvatarId() {
    try {
      const val = localStorage.getItem(RAIL_AVATAR_DISGUISE_KEY);
      return val || "wecom-blue";
    } catch {
      return "wecom-blue";
    }
  }

  function setRailDisguiseAvatarId(id) {
    try {
      localStorage.setItem(RAIL_AVATAR_DISGUISE_KEY, id);
    } catch { /* ignore */ }
    syncRail();
  }

  function cycleRailDisguiseAvatar() {
    const curId = getRailDisguiseAvatarId();
    const ids = [...RAIL_DISGUISE_AVATARS.map((a) => a.id), "native"];
    const nextIdx = (ids.indexOf(curId) + 1) % ids.length;
    const nextId = ids[nextIdx];
    setRailDisguiseAvatarId(nextId);
    return nextId;
  }

  /* ---------- 会话伪装头像（圆角矩形单字） ---------- */
  const MASK_AVATAR_KEY = "linuxdo-wecom-mask-avatar"; // "1" = 开

  /* ---------- 标题/会话伪装模式（企业工作流拟真） ---------- */
  const MASK_TITLE_KEY = "linuxdo-wecom-mask-title";
  const MASK_TITLE_MODE_KEY = "linuxdo-wecom-mask-title-mode"; // "all" | "list" | "detail" | "off"
  const MASK_TITLE_MODES = ["all", "list", "detail", "off"];

  function getMaskTitleMode() {
    try {
      const val = localStorage.getItem(MASK_TITLE_MODE_KEY);
      if (val && MASK_TITLE_MODES.includes(val)) return val;
      const legacy = localStorage.getItem(MASK_TITLE_KEY);
      if (legacy === "1") return "all";
      if (legacy === "0") return "off";
      return "off";
    } catch {
      return "off";
    }
  }

  function isMaskTitle() {
    return getMaskTitleMode() !== "off";
  }

  function isMaskTitleList() {
    const mode = getMaskTitleMode();
    return mode === "all" || mode === "list";
  }

  function isMaskTitleDetail() {
    const mode = getMaskTitleMode();
    return mode === "all" || mode === "detail";
  }

  function setMaskTitleMode(mode) {
    const next = MASK_TITLE_MODES.includes(mode) ? mode : "off";
    try {
      localStorage.setItem(MASK_TITLE_MODE_KEY, next);
      localStorage.setItem(MASK_TITLE_KEY, next !== "off" ? "1" : "0");
    } catch { /* ignore */ }
    const panel = document.querySelector(".wecom-list-panel");
    ensureMaskTitleToggle(panel);
    if (listState.topics && listState.topics.length) {
      renderListRows();
    } else if (panel) {
      loadList(listState.apiPath || listApiForPath(location.pathname, location.search), true);
    }
    refreshMaskedChatTitle();
    syncThemeControls();
  }

  function setMaskTitle(on) {
    setMaskTitleMode(on ? "all" : "off");
  }

  function cycleMaskTitleMode() {
    const cur = getMaskTitleMode();
    const cycleOrder = ["all", "list", "detail", "off"];
    const nextIdx = (cycleOrder.indexOf(cur) + 1) % cycleOrder.length;
    setMaskTitleMode(cycleOrder[nextIdx]);
  }

  const MASK_WORK_ORGS = ["产品", "研发", "前端", "后端", "客户端", "测试", "QA", "运维", "架构", "中台", "数据", "平台"];
  const MASK_WORK_OBJS = ["需求", "接口", "契约", "用例", "缺陷", "分支", "版本", "变更", "工单", "告警", "故障", "发布"];
  const MASK_WORK_ACTS = ["评审群", "联调群", "值班群", "提测群", "发布群", "复盘群", "迭代群", "排期群", "需求池", "对齐会", "跟进群", "项目组"];
  const MASK_WORK_TITLES = [
    "需求评审排期",
    "技术方案讨论",
    "接口联调对齐",
    "代码评审意见",
    "主干合并冲突",
    "发版窗口确认",
    "灰度比例调整",
    "回归范围确认",
    "提测准入检查",
    "缺陷定级讨论",
    "线上告警跟进",
    "监控大盘调整",
    "值班交接记录",
    "故障复盘纪要",
    "降级预案演练",
    "容量水位评估",
    "慢查询治理",
    "配置变更同步",
    "依赖版本升级",
    "循环依赖治理",
    "单测覆盖率达标",
    "Mock 数据联调",
    "冒烟用例执行",
    "压测结果同步",
    "埋点方案评审",
    "SDK 版本对齐",
    "网关路由变更",
    "缓存命中率排查",
    "队列积压处理",
    "日志脱敏改造",
    "数据库迁移演练",
    "容器资源扩容",
    "发布回滚演练",
    "需求验收清单",
    "接口文档补全",
    "迭代任务盘点",
    "技术债清理周",
    "编码规范宣讲",
    "方案设计评审",
    "上线检查清单"
  ];

  function disguiseTitleForTopic(topic) {
    const tid = Math.abs(Number(topic && topic.id) || 0);
    const seed = tid * 2654435761 >>> 0;
    if (seed % 2 === 0) {
      const org = MASK_WORK_ORGS[seed % MASK_WORK_ORGS.length];
      const obj = MASK_WORK_OBJS[(seed >>> 3) % MASK_WORK_OBJS.length];
      const act = MASK_WORK_ACTS[(seed >>> 7) % MASK_WORK_ACTS.length];
      const mode = (seed >>> 11) % 3;
      if (mode === 0) return `${org}${obj}${act}`;
      if (mode === 1) return `${org}·${obj}${act}`;
      return `【${org}】${obj}${act}`;
    }
    return MASK_WORK_TITLES[seed % MASK_WORK_TITLES.length];
  }

  function convDisplayTitleList(topic) {
    if (!topic) return "";
    return isMaskTitleList() ? disguiseTitleForTopic(topic) : String(topic.title || "");
  }

  function convDisplayTitleDetail(topic) {
    if (!topic) return "";
    return isMaskTitleDetail() ? disguiseTitleForTopic(topic) : String(topic.title || "");
  }

  function convDisplayTitle(topic) {
    return convDisplayTitleList(topic);
  }

  function isMaskAvatar() {
    try { return localStorage.getItem(MASK_AVATAR_KEY) === "1"; } catch { return false; }
  }

  function setMaskAvatar(on) {
    try { localStorage.setItem(MASK_AVATAR_KEY, on ? "1" : "0"); } catch { /* ignore */ }
    const panel = document.querySelector(".wecom-list-panel");
    ensureMaskAvatarToggle(panel);
    // 列表若还没数据，先别空转；有数据则立刻重绘头像
    if (listState.topics && listState.topics.length) {
      renderListRows();
    } else if (panel) {
      // 兜底：按当前路由拉一次列表再绘
      loadList(listState.apiPath || listApiForPath(location.pathname, location.search), true);
    }
    syncThemeControls();
    syncRail();
  }


  const SURNAMES = [
    "赵","钱","孙","李","周","吴","郑","王","冯","陈","褚","卫","蒋","沈","韩","杨","朱","秦","尤","许",
    "何","吕","施","张","孔","曹","严","华","金","魏","陶","姜","戚","谢","邹","喻","柏","水","窦","章",
    "云","苏","潘","葛","奚","范","彭","郎","鲁","韦","昌","马","苗","凤","花","方","俞","任","袁","柳",
    "酆","鲍","史","唐","费","廉","岑","薛","雷","贺","倪","汤","滕","殷","罗","毕","郝","邬","安","常",
    "乐","于","时","傅","皮","卞","齐","康","伍","余","元","卜","顾","孟","平","黄","和","穆","萧","尹"
  ];

  function surnameForTopic(topic) {
    const idx = Math.abs(Number(topic.id) || 0) % SURNAMES.length;
    return SURNAMES[idx];
  }

  /**
   * 伪装头像：圆角矩形 + 百家姓单字
   * @returns {{ html: string, bg: string, className: string, styleExtra: string }}
   */
  function disguiseAvatarForTopic(topic) {
    const ch = surnameForTopic(topic);
    const color = avatarColor(ch + String(topic.id || 0));
    return {
      html: `<span class="wecom-avatar-text" data-len="1">${escapeHtml(ch)}</span>`,
      bg: color,
      className: "is-text-avatar is-solid",
      styleExtra: "color:#fff;"
    };
  }

  /** 隐私模式下随机一半话题使用九宫格姓氏头像 */
  function isGridMaskTopic(topic) {
    return isMaskAvatar() && (Math.abs(Number(topic.id) || 0) % 2 === 0);
  }

  const MASK_GRID_BLUES = [
    "#0A6FE0", "#1A87FF", "#2F88FF", "#3B92FF", "#4B7CFF",
    "#5B8FFF", "#6BA0FF", "#7CB1FF", "#8DC2FF"
  ];

  function disguiseGridAvatar(topic) {
    const cells = [];
    const seed = Math.abs(Number(topic.id) || 0);
    for (let i = 0; i < 9; i++) {
      const ch = SURNAMES[(seed + i * 17) % SURNAMES.length];
      const color = MASK_GRID_BLUES[(seed + i) % MASK_GRID_BLUES.length];
      cells.push(`<span style="background:${color}">${escapeHtml(ch)}</span>`);
    }
    return `<span class="wecom-conv-avatar is-grid-mask" style="background:transparent">${cells.join("")}</span>`;
  }


  function ensureMaskAvatarToggle(panel) {
    if (!panel) return;
    const actions = panel.querySelector(".wecom-list-actions");
    if (!actions) return;
    let btn = actions.querySelector(".wecom-mask-avatar-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wecom-icon-btn wecom-mask-avatar-toggle";
      btn.innerHTML = ICONS.disguise;
      actions.insertBefore(btn, actions.firstChild);
    }
    // 直接绑在按钮上，避免旧面板 linkBound 已占用导致点不到
    if (btn.dataset.bound !== "1") {
      btn.dataset.bound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        setMaskAvatar(!isMaskAvatar());
      });
    }
    const on = isMaskAvatar();
    btn.title = on ? "伪装头像：开（点击恢复真实头像）" : "伪装头像：关（点击开启）";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-on", on);
  }

  function ensureMaskTitleToggle(panel) {
    if (!panel) return;
    const actions = panel.querySelector(".wecom-list-actions");
    if (!actions) return;
    let btn = actions.querySelector(".wecom-mask-title-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wecom-icon-btn wecom-mask-title-toggle";
      btn.innerHTML = ICONS.win;
      actions.appendChild(btn);
    }
    if (btn.dataset.bound !== "1") {
      btn.dataset.bound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        cycleMaskTitleMode();
      });
    }
    const mode = getMaskTitleMode();
    const on = mode !== "off";
    const titles = {
      all: "伪装标题：全部（列表+详情，点击切换为仅列表）",
      list: "伪装标题：仅列表（灰字为真标题，点击切换为仅详情）",
      detail: "伪装标题：仅详情（点击关闭）",
      off: "伪装标题：关（点击开启全部）"
    };
    btn.title = titles[mode] || "伪装标题：关（点击开启）";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-on", on);
  }

  function fullAvatarUrl(template) {
    if (!template) return "";
    let url = template.replace("{size}", String(AVATAR_SOURCE_SIZE));
    if (url.startsWith("//")) return (typeof location !== "undefined" ? location.protocol : "https:") + url;
    if (/^(?:data:|blob:|https?:)/i.test(url)) return url;
    return new URL(url, location.origin).href;
  }

  function formatTime(iso) {
    if (!iso) return "";
    if (typeof iso === "string" && (iso.includes("前") || iso.includes("刚刚") || iso.includes("昨天") || iso.includes("小时") || iso.includes("天"))) {
      return iso;
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    const now = Date.now();
    const diff = now - date.getTime();
    const minute = 60e3, hour = 3600e3, day = 86400e3;
    if (diff < minute) return "刚刚";
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < day && date.getDate() === new Date().getDate()) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    if (diff < 2 * day) return "昨天";
    if (diff < 365 * day) return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function formatClock(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  let rateLimitCooldownUntil = 0;

  async function api(path, options = {}) {
    const token = typeof csrfToken === "function" ? csrfToken() : "";
    const headers = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(IS_LINUXDO ? { "Discourse-Present": "true" } : {}),
      ...(token && IS_LINUXDO ? { "X-CSRF-Token": token } : {}),
      ...(options.headers || {})
    };
    const resp = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers
    });
    if (resp.status === 429) {
      rateLimitCooldownUntil = Date.now() + 15000;
      const err = new Error("HTTP 429 (访问频率受限)");
      err.status = 429;
      err.isRateLimit = true;
      throw err;
    }
    if (!resp.ok) {
      const err = new Error(`HTTP ${resp.status}`);
      err.status = resp.status;
      throw err;
    }
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      rateLimitCooldownUntil = Date.now() + 15000;
      const err = new Error("触发 Cloudflare 人机验证盾");
      err.status = 429;
      err.isCloudflare = true;
      throw err;
    }
    return resp.json();
  }

  let cachedUsername = null;
  let cachedUserId = null;

  function normalizeUsername(name) {
    return String(name ?? "").trim().replace(/^@/, "").toLowerCase();
  }

  function normalizeUserId(value) {
    const id = String(value ?? "").trim();
    return id ? id.toLowerCase() : "";
  }

  function extractUsernameFromHref(href) {
    if (!href) return null;
    try {
      const path = new URL(href, location.origin).pathname;
      const match = path.match(/^\/u\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  function parseUserCard(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : { username: raw };
    } catch {
      return { username: raw };
    }
  }

  function usernameFromElement(element) {
    if (!element) return null;
    const fromHref = extractUsernameFromHref(element.getAttribute("href") || "");
    if (fromHref) return fromHref;
    const card = parseUserCard(element.getAttribute("data-user-card"));
    const name = card?.username || card?.user?.username ||
      element.getAttribute("data-username") || element.getAttribute("data-user-name");
    return name ? String(name).trim() : null;
  }

  function userIdFromElement(element) {
    if (!element) return "";
    for (const attr of ["data-user-id", "data-user-id-value", "data-id"]) {
      const value = normalizeUserId(element.getAttribute(attr));
      if (value) return value;
    }
    return "";
  }

  function preloadedCurrentUser() {
    try {
      const element = document.getElementById("data-preloaded");
      const raw = element?.getAttribute("data-preloaded") || element?.textContent;
      if (!raw) return null;
      const data = JSON.parse(raw);
      const candidates = [data.currentUser, data.current_user];
      for (const key of Object.keys(data || {})) {
        if (/current.?user/i.test(key)) candidates.push(data[key]);
      }
      for (const candidate of candidates) {
        const record = typeof candidate === "string" ? parseUserCard(candidate) : candidate;
        if (record?.username || record?.user?.username || record?.id) return record;
      }
    } catch { /* 页面尚未完成预加载时稍后重试 */ }
    return null;
  }

  function getPreloadedTopic(topicId) {
    if (!topicId) return null;
    try {
      const element = document.getElementById("data-preloaded");
      const raw = element?.getAttribute("data-preloaded") || element?.textContent;
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const key = `topic_${topicId}`;
      if (parsed[key]) {
        return typeof parsed[key] === "string" ? JSON.parse(parsed[key]) : parsed[key];
      }
      if (parsed.topic) {
        const t = typeof parsed.topic === "string" ? JSON.parse(parsed.topic) : parsed.topic;
        if (Number(t?.id) === Number(topicId)) return t;
      }
    } catch { /* ignore */ }
    return null;
  }

  function getPreloadedCategories() {
    try {
      const element = document.getElementById("data-preloaded");
      const raw = element?.getAttribute("data-preloaded") || element?.textContent;
      if (raw) {
        const parsed = JSON.parse(raw);
        const siteData = parsed.site ? (typeof parsed.site === "string" ? JSON.parse(parsed.site) : parsed.site) : null;
        if (siteData?.categories?.length) return siteData.categories;
        if (parsed.categories) {
          return typeof parsed.categories === "string" ? JSON.parse(parsed.categories) : parsed.categories;
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  function rememberCurrentUser(record) {
    const username = record?.username || record?.user?.username;
    const id = record?.id ?? record?.user?.id;
    if (username) cachedUsername = String(username).trim();
    if (id != null && String(id).trim()) cachedUserId = normalizeUserId(id);
  }

  function getCurrentUserIdentity() {
    if (cachedUsername || cachedUserId) return { username: cachedUsername, id: cachedUserId };
    if (IS_V2EX) {
      const memberLink = document.querySelector("#Rightbar a[href^='/member/'], #Top a[href^='/member/']");
      if (memberLink) {
        const match = (memberLink.getAttribute("href") || "").match(/\/member\/([^/?#]+)/);
        if (match && match[1]) {
          rememberCurrentUser({ username: match[1], id: match[1] });
          return { username: cachedUsername, id: cachedUserId };
        }
      }
    }
    const selectors = [
      "#current-user",
      ".header-dropdown-toggle.current-user",
      ".current-user",
      "button.icon.btn-flat[data-user-card]"
    ];
    for (const selector of selectors) {
      const root = document.querySelector(selector);
      if (!root) continue;
      const elements = [root, ...root.querySelectorAll("a[href*='/u/'], [data-user-card], [data-username]")];
      let found = false;
      for (const element of elements) {
        const username = usernameFromElement(element);
        const id = userIdFromElement(element);
        if (username || id) {
          rememberCurrentUser({ username, id });
          found = true;
        }
      }
      if (found) return { username: cachedUsername, id: cachedUserId };
    }
    const image = document.querySelector("#current-user img[alt], .current-user img[alt]");
    if (image?.alt && !/avatar|头像/i.test(image.alt)) {
      rememberCurrentUser({ username: image.alt.trim() });
      return { username: cachedUsername, id: cachedUserId };
    }
    const preloaded = preloadedCurrentUser();
    if (preloaded) {
      rememberCurrentUser(preloaded);
      return { username: cachedUsername, id: cachedUserId };
    }
    try {
      const owner = window.Discourse?.__container__ ||
        document.querySelector(".ember-application")?.__ember_meta__?.owner;
      const user = owner?.lookup?.("service:current-user") || window.Discourse?.User?.current?.();
      const record = { username: user?.username || user?.get?.("username"), id: user?.id || user?.get?.("id") };
      if (record.username || record.id) rememberCurrentUser(record);
    } catch { /* Ember 尚未就绪时由下一次调用重试 */ }
    return { username: cachedUsername, id: cachedUserId };
  }

  function getCurrentUsername() {
    return getCurrentUserIdentity().username;
  }

  function booleanFlag(value) {
    return value === true || value === 1 || value === "1" ||
      (typeof value === "string" && value.trim().toLowerCase() === "true");
  }

  function postUsername(post) {
    return post?.username || post?.user?.username || post?.author?.username || "";
  }

  function postUserId(post) {
    return post?.user_id ?? post?.author_id ?? post?.user?.id ?? post?.author?.id ?? "";
  }

  function isMyPost(post, myName) {
    if (!post) return false;
    if (booleanFlag(post.yours) || booleanFlag(post.mine) || booleanFlag(post.is_my_post)) return true;
    const identity = getCurrentUserIdentity();
    const myId = normalizeUserId(identity.id);
    const postId = normalizeUserId(postUserId(post));
    if (myId && postId && myId === postId) return true;
    const me = normalizeUsername(myName || identity.username);
    const author = normalizeUsername(postUsername(post));
    return Boolean(me && author && me === author);
  }

  function isTopicPath(pathname) {
    return /^\/t\//.test(pathname);
  }

  /** /t/:slug/:id(/:post) 或 /t/:id(/:post) */
  function topicRouteFromPath(pathname) {
    const parts = String(pathname || "").split("/").filter(Boolean);
    if (parts[0] !== "t" || parts.length < 2) return { topicId: null, postNumber: 0, slug: "" };
    const postOf = (value) => (/^\d+$/.test(value || "") ? Number(value) : 0);
    if (/^\d+$/.test(parts[1])) {
      return { topicId: Number(parts[1]), postNumber: postOf(parts[2]), slug: "" };
    }
    if (/^\d+$/.test(parts[2] || "")) {
      return { topicId: Number(parts[2]), postNumber: postOf(parts[3]), slug: parts[1] };
    }
    return { topicId: null, postNumber: 0, slug: parts[1] || "" };
  }

  function topicIdFromPath(pathname) {
    return topicRouteFromPath(pathname).topicId;
  }

  const INITIAL_V2EX_TOPIC_ID = IS_V2EX ? (typeof location !== "undefined" ? topicIdFromPath(location.pathname) : null) : null;
  let initialV2exTopicConsumed = false;
  let suppressHistoryApply = false;

  function postNumberFromPath(pathname) {
    return topicRouteFromPath(pathname).postNumber;
  }

  function readLastReadMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LAST_READ_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function getRememberedPost(topicId) {
    const n = Number(readLastReadMap()[topicId]) || 0;
    return n > 0 ? n : 0;
  }

  function rememberedPostForTopic(topic) {
    if (!topic) return 0;
    return getRememberedPost(topic.id) || Number(topic.last_read_post_number) || 0;
  }

  function readTopicHistory() {
    try {
      const raw = localStorage.getItem(TOPIC_HISTORY_KEY);
      const list = JSON.parse(raw || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveTopicHistory(list) {
    try {
      localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify((list || []).slice(0, TOPIC_HISTORY_MAX)));
    } catch { /* ignore */ }
  }

  function recordTopicHistory(data, posts = []) {
    if (!data || !data.id) return;
    const topicId = Number(data.id);
    const existing = readTopicHistory();
    const opPost = (posts && posts.length) ? posts[0] : (data.post_stream?.posts?.[0] || null);

    let author = opPost?.username || data.details?.created_by?.username || "";
    let avatar = opPost?.avatar_template || data.details?.created_by?.avatar_template || "";
    if (IS_V2EX) {
      author = author || opPost?.name || data.member?.username || "";
      avatar = avatar || opPost?.avatar || data.member?.avatar_normal || "";
    }

    let nodeName = "";
    let categoryColor = "";
    if (IS_V2EX) {
      nodeName = data.node_title || data.node_name || "";
    } else {
      const cat = categoryById(data.category_id);
      if (cat) {
        nodeName = cat.name || "";
        categoryColor = cat.color || "";
      }
    }

    const replyCount = Number(data.total_replies != null ? data.total_replies : (data.posts_count ? data.posts_count - 1 : 0)) || 0;

    const convTopic = (listState.topics || []).find((t) => Number(t.id) === topicId);
    if (convTopic) {
      if (!author) author = convTopic.last_poster_username || "";
      if (!avatar) avatar = convTopic.v2ex_avatar || convTopic.avatar_template || "";
      if (!nodeName) nodeName = convTopic.node_name || "";
    }

    const item = {
      id: topicId,
      title: data.title || convTopic?.title || `话题 #${topicId}`,
      last_poster_username: author,
      v2ex_avatar: IS_V2EX ? avatar : "",
      avatar_template: !IS_V2EX ? avatar : "",
      node_name: nodeName,
      category_id: data.category_id || convTopic?.category_id || null,
      category_color: categoryColor,
      reply_count: replyCount,
      posts_count: replyCount + 1,
      visited_at: Date.now(),
      bumped_at: Date.now(),
      platform: IS_V2EX ? "v2ex" : "linuxdo",
      slug: data.slug || convTopic?.slug || ""
    };

    const filtered = existing.filter((t) => Number(t.id) !== topicId || (t.platform && t.platform !== item.platform));
    filtered.unshift(item);
    saveTopicHistory(filtered);
  }

  function isHomePath(pathname) {
    if (IS_V2EX) {
      return pathname === "/" || /^\/(recent|changes|notifications)\b/.test(pathname) || /^\/go\//.test(pathname);
    }
    return pathname === "/" ||
      /^\/(latest|new|unread|unseen|top|categories|hot|posted|read|bookmarks|notifications)\b/.test(pathname) ||
      /^\/c\//.test(pathname) || /^\/tag\//.test(pathname);
  }

  const LIST_API_BY_PATH = Object.freeze({
    "/": "/latest.json",
    "/latest": "/latest.json",
    "/new": "/new.json",
    "/unread": "/unseen.json",
    "/unseen": "/unseen.json",
    "/top": "/top.json",
    "/hot": "/hot.json",
    "/posted": "/posted.json",
    "/read": "/read.json",
    "/bookmarks": "/bookmarks.json",
    "/notifications": "/latest.json",
    // 类别索引本身没有 topic_list，继续展示最新话题。
    "/categories": "/latest.json"
  });

  function scopedListApiForPath(pathname) {
    if (!/^\/(?:c|tag)\/[^/]+/.test(pathname)) return "";
    return pathname.endsWith(".json") ? pathname : `${pathname}.json`;
  }

  function listApiForPath(pathname, search = "") {
    if (IS_V2EX) {
      const query = String(search || "");
      if (query.includes("tab=hot")) return "/api/topics/hot.json";
      if (query.includes("tab=all") || query.includes("tab=latest")) return "/?tab=all";
      if (query.includes("tab=")) return `/${query}`;
      if (/^\/go\//.test(pathname)) return pathname + query;
      if (pathname === "/recent" || pathname === "/notifications" || pathname.includes("/replies")) return pathname + query;
      return "/?tab=all";
    }
    const normalized = String(pathname || "/").replace(/\/+$/, "") || "/";
    const apiPath = LIST_API_BY_PATH[normalized] || scopedListApiForPath(normalized) || "/latest.json";
    const query = String(search || "");
    return `${apiPath}${query.startsWith("?") ? query : ""}`;
  }

  /* ============================== CSS ============================== */

  const RAW_CSS = String.raw`
    /* ---------- Token ---------- */
    .${ROOT_CLASS} {
      color-scheme: light;
      --wc-blue: #1A87FF;
      --wc-blue-hover: #0A6FE0;
      --wc-blue-soft: #E8F3FF;
      --wc-blue-chip: #D6EBFF;
      --wc-title: #1A87FF;
      --wc-accent: #1A87FF;
      --wc-accent-soft: #E8F3FF;
      --wc-nav2-bg: #FFFFFF;
      --wc-nav2-border: #E6E8EB;
      --wc-text: #1A1D24;
      --wc-text-2: #4A4F5C;
      --wc-text-3: #8A8F99;
      --wc-text-4: #B0B4BE;
      --wc-bg: #FFFFFF;
      --wc-chat-bg: #F5F7FB;
      --wc-hover: #ECF0F7;
      --wc-active: #E4EAF5;
      --wc-bubble-other: #FFFFFF;
      --wc-bubble-me: #D4E5FF;
      --wc-border: #E6E8EB;
      --wc-border-strong: #D5D8DE;
      --wc-danger: #FF4D4F;
      --wc-rail-bg: #F3F4F6;
      --wc-strip-bg: transparent;
      --wc-nav: ${RAIL_WIDTH}px;
      --wc-nav2w: 0px;
      --wc-strip: ${STRIP_WIDTH}px;
      --wc-list: ${LIST_WIDTH}px;
      --wc-header-h: ${TITLEBAR_HEIGHT}px;
      --wc-font: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      --radius: 8px;

      --primary: var(--wc-text);
      --primary-medium: var(--wc-text-2);
      --primary-low: var(--wc-text-3);
      --secondary: var(--wc-bg);
      --tertiary: var(--wc-accent);
      --header_background: #FFFFFF;
      --header_primary: var(--wc-text);
      --d-hover: var(--wc-hover);
    }

    /* 整站颜色模式：由运行时同步 html/body 与站点 stylesheet */
    html.${ROOT_CLASS},
    html.${ROOT_CLASS} body {
      color-scheme: light;
    }

    /* ---------- 字体与基础 ---------- */
    .${ROOT_CLASS} body {
      font-family: var(--wc-font) !important;
      background: var(--wc-chat-bg) !important;
      background-image: none !important;
    }

    /* 站点无全局 border-box：自绘面板统一盒模型，否则 padding 会加宽导致互相堆叠 */
    .wecom-rail, .wecom-rail *,
    .wecom-strip, .wecom-strip *,
    .wecom-list-panel, .wecom-list-panel *,
    .wecom-chat-panel, .wecom-chat-panel *,
    .wecom-mode-fab { box-sizing: border-box; }

    /* ---------- 顶栏视觉隐藏（保留 DOM，供 user-menu 挂载/点击） ---------- */
    .${ROOT_CLASS} .d-header-wrap,
    .${ROOT_CLASS} .d-header {
      position: fixed !important;
      left: 0 !important; top: 0 !important;
      width: 0 !important; height: 0 !important;
      max-width: 0 !important; max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      margin: 0 !important; padding: 0 !important;
      border: none !important;
      clip: rect(0, 0, 0, 0) !important;
      z-index: -1 !important;
    }
    /* 允许脚本对用户按钮做 programmatic click */
    .${ROOT_CLASS} #current-user,
    .${ROOT_CLASS} #toggle-current-user,
    .${ROOT_CLASS} .header-dropdown-toggle.current-user {
      pointer-events: auto !important;
    }
    .${ROOT_CLASS} #main-outlet-wrapper {
      padding-top: var(--wc-header-h) !important;
      margin-left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-strip)) !important;
    }

    /* ---------- 展开栏：原生侧栏原样搬入（内容与文案不变，≡ 滑出） ---------- */
    .${ROOT_CLASS}.wecom-nav2-open { --wc-nav2w: ${NAV2_WIDTH}px; }
    html.${ROOT_CLASS} body .sidebar-wrapper {
      display: block !important;
      position: fixed;
      left: var(--wc-nav); top: 0; bottom: 0;
      width: ${NAV2_WIDTH}px !important;
      background-color: #FFFFFF !important;
      background-image: none !important;
      backdrop-filter: none !important;
      box-shadow: none !important;
      border-right: 1px solid var(--wc-border);
      z-index: 600;
      transform: translateX(-105%);
      visibility: hidden;
      transition: transform 0.18s ease, visibility 0.18s;
      /* 站点可能是深色方案：强制企业微信浅色调色板 */
      --primary: var(--wc-text);
      --primary-medium: var(--wc-text-2);
      --primary-low: var(--wc-text-3);
      --primary-low-mid: #BBBFC4;
      --primary-very-low: #F0F2F5;
      --primary-50: #F5F6F7;
      --primary-100: #EBEDEF;
      --primary-200: #E8E9EB;
      --primary-300: #DEE0E3;
      --secondary: #FFFFFF;
      --tertiary: var(--wc-accent);
      --quaternary: var(--wc-accent);
      --d-hover: var(--wc-hover);
      --d-sidebar-background: #FFFFFF;
      --d-sidebar-border-color: var(--wc-border);
      color: var(--wc-text);
    }
    /* 可能盖住白底的子层/伪层一律透明 */
    html.${ROOT_CLASS} body .sidebar-wrapper *,
    html.${ROOT_CLASS} body .sidebar-wrapper *::before,
    html.${ROOT_CLASS} body .sidebar-wrapper *::after {
      background-color: transparent !important;
      background-image: none !important;
      backdrop-filter: none !important;
    }
    .${ROOT_CLASS}.wecom-nav2-open .sidebar-wrapper {
      transform: none;
      visibility: visible;
    }
    /*
     * 锁定态把 #main-outlet-wrapper 设成 pointer-events:none，
     * 而 Discourse 的 .sidebar-wrapper 在其内部 → 展开后只能看不能点。
     * 侧栏自身及子元素显式恢复点击。
     */
    .${ROOT_CLASS} .sidebar-wrapper,
    .${ROOT_CLASS} .sidebar-wrapper * {
      pointer-events: auto !important;
    }
    html.${ROOT_CLASS} body .sidebar-wrapper .sidebar-container {
      height: 100%;
      border-right: none;
    }
    /* 侧栏内部元素统一到企业微信浅色观感 */
    .${ROOT_CLASS} .sidebar-wrapper .sidebar-section-header,
    .${ROOT_CLASS} .sidebar-wrapper .sidebar-section-header-text {
      color: var(--wc-text-3) !important;
    }
    .${ROOT_CLASS} .sidebar-wrapper .sidebar-section-link {
      color: var(--wc-text-2) !important;
      border-radius: 8px;
      transition: background-color 0.15s;
    }
    html.${ROOT_CLASS} body .sidebar-wrapper .sidebar-section-link:hover {
      background-color: var(--wc-hover) !important;
      color: var(--wc-text) !important;
    }
    html.${ROOT_CLASS} body .sidebar-wrapper .sidebar-section-link.active {
      background-color: var(--wc-active) !important;
      color: var(--wc-accent) !important;
    }
    .${ROOT_CLASS} .sidebar-wrapper .sidebar-section-content svg,
    .${ROOT_CLASS} .sidebar-wrapper .sidebar-section-link-prefix {
      color: var(--wc-text-3);
    }
    /* 底部黑色聊天抽屉与侧栏底栏（用户栏）会破坏三栏观感，隐藏（不限于 sidebar 内部） */
    .${ROOT_CLASS} .chat-drawer-container,
    .${ROOT_CLASS} #chat-drawer,
    .${ROOT_CLASS} .chat-drawer,
    .${ROOT_CLASS} [class*="sidebar-footer"],
    .${ROOT_CLASS} [id*="chat-drawer"] {
      display: none !important;
    }

    /* ---------- 窄图标条：假 icon（纯装饰） ---------- */
    .wecom-strip {
      display: none !important;
    }
    .wecom-strip-item {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: var(--wc-text-2);
      position: relative; flex-shrink: 0;
      cursor: default; user-select: none;
    }
    .wecom-strip-item svg { width: 17px; height: 17px; }
    .wecom-strip-badge {
      position: absolute; top: -4px; right: -10px;
      min-width: 14px; height: 14px; padding: 0 4px;
      background: var(--wc-danger); color: #fff;
      font-size: 9px; line-height: 14px; text-align: center;
      border-radius: 7px; font-weight: 500;
    }
    /*
     * 原生用户菜单必须留在 .user-menu-dropdown-wrapper 内：
     * Discourse 用该父层判断“点击菜单内/外”，拆出子节点会让所有菜单项在
     * pointerdown 阶段被误判为外部点击。打开时仅解除顶栏祖先的裁剪。
     */
    .${ROOT_CLASS}.wecom-notif-open .d-header-wrap,
    .${ROOT_CLASS}.wecom-notif-open .d-header {
      overflow: visible !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: none !important;
      clip: auto !important;
      z-index: 450 !important;
    }
    .${ROOT_CLASS}.wecom-notif-open .user-menu-dropdown-wrapper {
      overflow: visible !important;
      pointer-events: none !important;
      visibility: visible !important;
    }
    .${ROOT_CLASS}.wecom-notif-open .d-header .contents > :not(.panel),
    .${ROOT_CLASS}.wecom-notif-open .d-header .panel > :not(.user-menu-dropdown-wrapper) {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    /* 左侧栏头像通知：仅在 html.wecom-notif-open 时显示，避免关不掉 */
    .${ROOT_CLASS} .user-menu.wecom-user-menu-float,
    .${ROOT_CLASS} .user-menu.revamped.menu-panel.wecom-user-menu-float,
    .${ROOT_CLASS} .user-menu.menu-panel.wecom-user-menu-float {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    .${ROOT_CLASS}.wecom-notif-open .user-menu.wecom-user-menu-float,
    .${ROOT_CLASS}.wecom-notif-open .user-menu.revamped.menu-panel.wecom-user-menu-float,
    .${ROOT_CLASS}.wecom-notif-open .user-menu.menu-panel.wecom-user-menu-float {
      display: block !important;
      position: fixed !important;
      left: 8px !important;
      top: calc(var(--wc-header-h) + 4px) !important;
      right: auto !important;
      bottom: auto !important;
      width: 320px !important;
      max-width: min(320px, calc(100vw - 20px)) !important;
      max-height: calc(100vh - 28px) !important;
      margin: 0 !important;
      z-index: 450 !important;
      box-shadow: 0 8px 28px rgba(31, 35, 41, 0.18) !important;
      border-radius: 8px !important;
      overflow: auto !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      visibility: visible !important;
      background: #fff !important;
      color: var(--wc-text) !important;
      clip: auto !important;
    }

    /* ---------- 通知浮层：Tab 置顶与「忽略」按钮置底 sticky ---------- */
    .${ROOT_CLASS}.wecom-notif-open .user-menu .menu-tabs-container,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .panel-header,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .tabs-list {
      position: sticky !important;
      top: 0 !important;
      z-index: 35 !important;
      background: #ffffff !important;
      border-bottom: 1px solid var(--wc-border, #E6E8EB) !important;
    }
    html.wecom-dark .user-menu .menu-tabs-container,
    html.wecom-dark .user-menu .panel-header,
    html.wecom-dark .user-menu .tabs-list,
    html.${ROOT_CLASS}.wecom-dark .user-menu .menu-tabs-container,
    html.${ROOT_CLASS}.wecom-dark .user-menu .panel-header,
    html.${ROOT_CLASS}.wecom-dark .user-menu .tabs-list {
      background: #23272e !important;
      border-bottom-color: #383e4a !important;
    }

    .${ROOT_CLASS}.wecom-notif-open .user-menu .panel-body,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .panel-body-contents,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .user-menu-notifications-list,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .quick-access-panel {
      overflow: visible !important;
    }

    .${ROOT_CLASS}.wecom-notif-open .user-menu .panel-bottom,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .bottom-tabs,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .user-menu-dismiss-container,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .notifications-dismiss-container,
    .${ROOT_CLASS}.wecom-notif-open .user-menu .wecom-notif-sticky-dismiss {
      position: sticky !important;
      bottom: 0 !important;
      z-index: 30 !important;
      background: #ffffff !important;
      border-top: 1px solid var(--wc-border, #E6E8EB) !important;
      box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.07) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      padding: 6px 12px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      margin-top: auto !important;
    }

    .${ROOT_CLASS}.wecom-notif-open .user-menu .wecom-notif-sticky-btn:not(.wecom-notif-sticky-dismiss) {
      position: sticky !important;
      bottom: 0 !important;
      z-index: 30 !important;
      background: #ffffff !important;
    }

    html.wecom-dark .user-menu .panel-bottom,
    html.wecom-dark .user-menu .bottom-tabs,
    html.wecom-dark .user-menu .user-menu-dismiss-container,
    html.wecom-dark .user-menu .notifications-dismiss-container,
    html.wecom-dark .user-menu .wecom-notif-sticky-dismiss,
    html.${ROOT_CLASS}.wecom-dark .user-menu .panel-bottom,
    html.${ROOT_CLASS}.wecom-dark .user-menu .bottom-tabs,
    html.${ROOT_CLASS}.wecom-dark .user-menu .user-menu-dismiss-container,
    html.${ROOT_CLASS}.wecom-dark .user-menu .notifications-dismiss-container,
    html.${ROOT_CLASS}.wecom-dark .user-menu .wecom-notif-sticky-dismiss {
      background: #23272e !important;
      border-top-color: #383e4a !important;
      box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.25) !important;
    }

    html.wecom-dark .user-menu .wecom-notif-sticky-btn:not(.wecom-notif-sticky-dismiss),
    html.${ROOT_CLASS}.wecom-dark .user-menu .wecom-notif-sticky-btn:not(.wecom-notif-sticky-dismiss) {
      background: #23272e !important;
    }

    /* ---------- 最左：企业微信文字导航栏（浅色渐变；仅「更多」可点，展开原生侧栏） ---------- */

    /* ---------- 顶部浅色 titlebar ---------- */
    .wecom-titlebar {
      position: fixed; left: 0; right: 0; top: 0;
      height: var(--wc-header-h);
      background: linear-gradient(90deg, #D5E0F8 0%, #DCE4F9 100%);
      color: var(--wc-text);
      display: flex; align-items: center;
      padding: 0 10px;
      z-index: 500;
      font-family: var(--wc-font);
      user-select: none;
      gap: 8px;
    }
    /* 顶栏左侧：当前用户头像（沿用 rail-avatar 类名，复用通知菜单逻辑） */
    .wecom-titlebar .me-chip { position: relative; width: 26px; height: 26px; flex-shrink: 0; }
    .wecom-titlebar .wecom-rail-avatar {
      width: 26px; height: 26px; border-radius: 6px; font-size: 11px;
    }
    .wecom-titlebar .wecom-rail-avatar-badge {
      top: -5px; right: -7px; min-width: 14px; height: 14px; padding: 0 3px;
      font-size: 9px; line-height: 14px; border-radius: 7px;
    }
    .wecom-titlebar .title-search {
      margin: 2px auto 0;
      width: min(420px, 36vw);
      height: 26px; border-radius: 13px;
      background: #EFF1FB;
      display: flex; align-items: center; gap: 6px;
      padding: 0 12px; color: var(--wc-text-3); font-size: 12px;
      position: relative;
    }
    .wecom-titlebar .title-search form {
      display: flex; align-items: center; gap: 6px; width: 100%; margin: 0;
    }
    .wecom-titlebar .title-search svg { opacity: .9; flex-shrink: 0; color: var(--wc-text-3); width: 14px; height: 14px; }
    .wecom-titlebar .title-search input {
      flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
      color: var(--wc-text); font-size: 12px; font-family: var(--wc-font);
      text-align: center; line-height: 26px; padding: 0; height: 100%;
    }
    .wecom-titlebar .title-search input::placeholder { color: var(--wc-text-4); text-align: center; }
    .wecom-titlebar .title-actions { display: flex; align-items: center; gap: 6px; margin-left: 8px; flex-shrink: 0; }
    .wecom-titlebar .t-btn {
      width: 28px; height: 28px; border: 0; background: transparent; color: var(--wc-text-2);
      border-radius: 6px; cursor: pointer; display: grid; place-items: center; padding: 0;
      position: relative;
    }
    .wecom-titlebar .t-btn:hover { background: rgba(0,0,0,.05); }
    .wecom-titlebar .t-btn .dot {
      position: absolute; top: 4px; right: 4px; width: 6px; height: 6px;
      background: var(--wc-danger); border-radius: 50%;
    }
    .wecom-titlebar .t-btn.ai {
      width: 24px; height: 24px; border-radius: 50%; color: #fff;
      background: conic-gradient(from 210deg, #7C5CFF, #1A87FF, #00C56C, #FFB020, #7C5CFF);
    }
    .wecom-titlebar .t-btn.ai svg { width: 12px; height: 12px; }
    .wecom-titlebar .t-btn svg { width: 16px; height: 16px; }

    .wecom-rail {
      position: fixed; left: 0; top: var(--wc-header-h); bottom: 0;
      width: var(--wc-nav);
      background: linear-gradient(180deg, #D5E0F8 0%, #DCE4F9 100%);
      display: flex; flex-direction: column; align-items: center;
      padding: 6px 0 8px;
      z-index: 350;
      font-family: var(--wc-font);
      /* 不能 overflow:hidden：顶部组织 chip 的名称要溢出到中栏头部区 */
      overflow: visible;
    }
    .wecom-rail-head {
      width: 100%; flex-shrink: 0;
      padding: 2px 8px 8px;
      position: relative; z-index: 360;
    }
    .wecom-rail-org-chip {
      display: flex; align-items: center; gap: 6px;
      white-space: nowrap; cursor: pointer;
      border-radius: 8px; padding: 2px 4px; margin-left: -4px;
    }
    .wecom-rail-org-chip:hover { background: rgba(255,255,255,.6); }
    .wecom-rail-org-chip:hover .wecom-rail-org-name { color: var(--wc-blue); }
    .wecom-rail-org-logo img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
    .wecom-rail-org-logo {
      width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
      background: #2F88FF; color: #fff;
      display: grid; place-items: center; font-size: 12px; font-weight: 700;
    }
    .wecom-rail-org-name { font-size: 13px; font-weight: 600; color: var(--wc-text); }
    .wecom-rail-org-chip > svg { width: 10px; height: 10px; color: var(--wc-text-3); flex-shrink: 0; }
    /* 头像基础样式（现挂在 titlebar 左侧，类名保留以复用通知逻辑） */
    .wecom-rail-avatar {
      width: 36px; height: 36px; border-radius: 8px;
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 13px; font-weight: 700;
      background: #F3A23A;
      cursor: pointer;
    }
    .wecom-rail-avatar img,
    .wecom-rail-avatar svg { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
    .wecom-rail-avatar.is-notif-pinned {
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--wc-accent);
    }
    .wecom-rail-avatar-badge {
      position: absolute; top: -4px; right: -6px;
      min-width: 16px; height: 16px; padding: 0 4px;
      background: var(--wc-danger); color: #fff;
      font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
      border-radius: 8px;
      border: none !important;
      box-shadow: none !important;
    }
    .wecom-rail-search { display: none !important; }
    .wecom-rail-items {
      flex: 1; width: 100%; overflow: auto;
      display: flex; flex-direction: column; align-items: center;
      padding: 0 8px;
    }
    .wecom-rail-items::-webkit-scrollbar { width: 0; }
    .wecom-rail-item {
      width: 100%; border: 0; background: transparent; border-radius: 10px;
      display: flex; flex-direction: row; align-items: center; justify-content: flex-start;
      gap: 8px;
      padding: 9px 10px; color: var(--wc-text-2); cursor: pointer; position: relative;
      font-size: 16px; line-height: 1; text-align: left;
    }
    .wecom-rail-item svg { width: 20px; height: 20px; color: #5B616C; flex-shrink: 0; }
    .wecom-rail-item span { white-space: nowrap; }
    .wecom-rail-item:hover { background: rgba(255,255,255,.65); }
    .wecom-rail-item.active { color: var(--wc-blue); background: #FFFFFF; box-shadow: 0 1px 4px rgba(31,35,41,.06); }
    .wecom-rail-item.active svg { color: var(--wc-blue); }
    .wecom-rail-bottom { width: 100%; flex-shrink: 0; padding: 4px 8px 0; }
    .wecom-theme-controls { position: relative; display: flex; flex-direction: column; gap: 1px; }
    .wecom-theme-toggle,
    .wecom-theme-options { position: relative; }
    .wecom-theme-toggle .wecom-theme-icon,
    .wecom-theme-options .wecom-theme-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
    .wecom-theme-options { opacity: .82; }
    .wecom-theme-options:hover { opacity: 1; }
    .wecom-theme-menu[hidden] { display: none !important; }
    .wecom-theme-menu {
      position: fixed;
      left: calc(var(--wc-nav) + 10px);
      bottom: 12px;
      z-index: 1200;
      width: 220px; max-height: calc(100vh - 24px); overflow-y: auto;
      padding: 7px;
      border: 1px solid var(--wc-border);
      border-radius: 10px;
      background: var(--wc-bg);
      box-shadow: 0 12px 30px rgba(31, 35, 41, .18);
      font-family: var(--wc-font);
    }
    .wecom-theme-menu-title { padding: 5px 8px 7px; color: var(--wc-text-3); font-size: 11px; }
    .wecom-theme-menu-divider {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--wc-border);
    }
    .wecom-theme-menu button {
      width: 100%; height: 34px; display: flex; align-items: center; gap: 8px;
      padding: 0 8px; border: 0; border-radius: 7px; background: transparent;
      color: var(--wc-text-2); font: 13px var(--wc-font); text-align: left; cursor: pointer;
    }
    .wecom-theme-menu button:hover { background: var(--wc-hover); color: var(--wc-text); }
    .wecom-theme-menu button.is-active { background: var(--wc-accent-soft); color: var(--wc-accent); font-weight: 600; }
    .wecom-theme-menu button svg { width: 16px; height: 16px; flex: 0 0 auto; }
    .wecom-theme-menu button .wecom-menu-label { flex: 1; min-width: 0; }
    .wecom-menu-state-badge {
      margin-left: auto;
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 500;
      line-height: 1.4;
      flex-shrink: 0;
    }
    .wecom-menu-state-badge.is-on {
      color: #07C160;
      background: rgba(7, 193, 96, 0.12);
    }
    .wecom-menu-state-badge.is-off {
      color: var(--wc-text-3);
      background: rgba(0, 0, 0, 0.04);
    }
    html.wecom-dark .wecom-menu-state-badge.is-off {
      background: rgba(255, 255, 255, 0.08);
      color: var(--wc-text-3);
    }
    .wecom-theme-menu .wecom-check-update { margin-top: 6px; border-top: 1px solid var(--wc-border); border-radius: 0; }
    /* 更新提示沿用企微配色，不遮罩、不抢占输入焦点。 */
    .wecom-update-notice {
      position: fixed; right: 20px; bottom: 20px; z-index: 1300;
      box-sizing: border-box; width: 420px; max-width: calc(100vw - 24px);
      padding: 16px; border: 1px solid var(--wc-border); border-radius: 10px;
      background: var(--wc-bg); color: var(--wc-text);
      box-shadow: 0 8px 32px rgba(31,35,41,.18); font: 13px/1.6 var(--wc-font);
    }
    .wecom-update-notice-title { display: flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 600; }
    .wecom-update-notice-title svg { color: var(--wc-blue); flex-shrink: 0; }
    .wecom-update-notice-message { margin-top: 6px; color: var(--wc-text-2); white-space: pre-line; }
    .wecom-update-notice-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
    .wecom-update-notice a, .wecom-update-notice button {
      box-sizing: border-box; margin: 0; font: inherit; text-decoration: none;
      cursor: pointer; border: 0; box-shadow: none;
    }
    .wecom-update-notice .wecom-update-install {
      display: inline-flex; align-items: center; min-height: 32px; padding: 4px 13px;
      background: var(--wc-blue); color: #fff; border-radius: 5px; font-weight: 600;
    }
    .wecom-update-notice .wecom-update-install:hover { background: var(--wc-blue-hover); }
    .wecom-update-notice .wecom-update-github { color: var(--wc-text-2); }
    .wecom-update-notice .wecom-update-dismiss { margin-left: auto; padding: 4px 0; background: transparent; color: var(--wc-text-3); }
    .wecom-update-notice :focus-visible { outline: 2px solid var(--wc-blue); outline-offset: 3px; }
    .wecom-update-notice [hidden] { display: none !important; }
    .wecom-rail-more.is-on { color: var(--wc-blue); background: #FFFFFF; box-shadow: 0 1px 4px rgba(31,35,41,.06); }
    .wecom-rail-more.is-on svg { color: var(--wc-blue); }
    /* 右边缘拖拽柄：左右拉伸 rail */
    .wecom-rail-resizer {
      position: fixed; top: var(--wc-header-h); bottom: 0;
      left: calc(var(--wc-nav) - 3px); width: 6px;
      cursor: col-resize; z-index: 400;
      touch-action: none;
    }
    .wecom-rail-resizer:hover,
    .wecom-rail-resizer.dragging { background: rgba(26,135,255,.3); }
    /* 窄宽度 → 纯图标模式 */
    .wecom-rail-compact .wecom-rail-item { justify-content: center; padding: 8px 0; }
    .wecom-rail-compact .wecom-rail-item span { display: none; }
    .wecom-rail-compact .wecom-rail-head { padding: 2px 0 8px; display: flex; justify-content: center; }
    .wecom-rail-compact .wecom-rail-org-name,
    .wecom-rail-compact .wecom-rail-org-chip > svg { display: none; }
    .wecom-rail-compact .wecom-rail-badge { left: auto; right: 8px; }
    .wecom-rail-badge {
      position: absolute; top: 3px; left: 26px; right: auto;
      min-width: 16px; height: 16px; padding: 0 4px;
      background: var(--wc-danger); color: #fff; border-radius: 8px;
      border: none !important; box-shadow: none !important;
      font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
    }

    .wecom-nav2-cat-dot {
      width: 10px; height: 10px; border-radius: 3px;
      flex-shrink: 0; margin: 0 4px;
    }

    /* ---------- 聊天 header 头像与标题行 ---------- */
    .wecom-chat-head-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .wecom-chat-avatar {
      width: 28px; height: 28px; border-radius: 6px;
      flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 13px; font-weight: 600;
    }
    /* ---------- 聊天头：标题行（人数 + 分类 chip） ---------- */
    .wecom-chat-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .wecom-chat-count {
      display: inline-flex; align-items: center; gap: 2px;
      font-size: 12px; color: var(--wc-text-3); font-weight: 400; flex-shrink: 0;
    }
    .wecom-chat-count svg { width: 13px; height: 13px; }
    .wecom-chat-chips { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .wecom-chat-chip {
      display: inline-flex; align-items: center; gap: 3px;
      height: 18px; padding: 0 5px; border-radius: 4px;
      font-size: 11px; line-height: 1; white-space: nowrap;
      color: var(--wc-blue) !important; background: var(--wc-blue-soft);
      border: 1px solid #C9E2FF !important;
      text-decoration: none !important; cursor: pointer;
    }
    .wecom-chat-chip .wecom-nav2-cat-dot { width: 8px; height: 8px; border-radius: 2px; margin: 0; }

    /* ---------- 隐藏原生主内容（三栏路由） ---------- */
    .${ROOT_CLASS}.${LOCK_CLASS} body { overflow: hidden !important; }
    .${ROOT_CLASS}.${LOCK_CLASS} #main-outlet > *,
    .${ROOT_CLASS}.${LOCK_CLASS} #Top,
    .${ROOT_CLASS}.${LOCK_CLASS} #Wrapper,
    .${ROOT_CLASS}.${LOCK_CLASS} #Bottom,
    .${ROOT_CLASS}.${LOCK_CLASS} #Main,
    .${ROOT_CLASS}.${LOCK_CLASS} #Rightbar {
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }

    /* ---------- 中栏右边缘拖拽柄 ---------- */
    .wecom-list-resizer {
      position: fixed; top: var(--wc-header-h); bottom: 0;
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-list) - 3px); width: 6px;
      cursor: col-resize; z-index: 400; touch-action: none;
    }
    .wecom-list-resizer:hover,
    .wecom-list-resizer.dragging { background: rgba(26,135,255,.25); }
    .${ROOT_CLASS}.${LOCK_CLASS}.wecom-nav2-open .wecom-list-resizer { left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-list) - 3px); }

    /* ---------- 中栏：会话列表 ---------- */
    .wecom-list-panel {
      position: fixed;
      top: var(--wc-header-h);
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-strip));
      width: var(--wc-list);
      bottom: 0;
      background: #F5F7FB;
      border-right: 1px solid var(--wc-border);
      display: flex;
      flex-direction: column;
      z-index: 200;
      font-family: var(--wc-font);
    }
    .wecom-list-header {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 44px;
      padding: 0 10px;
      flex-shrink: 0;
      border-bottom: 1px solid transparent;
    }
    .wecom-list-title { display: none !important; }
    /* 消息/未读：分段控件胶囊 */
    .wecom-list-chips {
      display: inline-flex; align-items: center; gap: 2px;
      background: #E7EAF1; border-radius: 14px; padding: 2px;
      flex-shrink: 0;
    }
    .wecom-history-header-bar {
      display: none;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    .wecom-list-panel.is-history-mode .wecom-list-nav-toggle,
    .wecom-list-panel.is-history-mode .wecom-list-chips,
    .wecom-list-panel.is-history-mode .wecom-list-add,
    .wecom-list-panel.is-history-mode .wecom-list-add-wrap {
      display: none !important;
    }
    .wecom-list-panel.is-history-mode .wecom-history-header-bar {
      display: inline-flex !important;
    }
    .wecom-history-tag {
      font-size: 13px;
      font-weight: 600;
      color: var(--wc-text);
      white-space: nowrap;
    }
    .wecom-history-count {
      font-size: 12px;
      color: var(--wc-text-3);
      white-space: nowrap;
    }
    .wecom-history-clear-btn {
      margin-left: auto;
      height: 22px;
      padding: 0 8px;
      border-radius: 4px;
      border: 1px solid var(--wc-border);
      background: transparent;
      color: var(--wc-text-3);
      font-size: 11px;
      cursor: pointer;
      font-family: var(--wc-font);
      transition: all .15s;
      white-space: nowrap;
    }
    .wecom-history-clear-btn:hover {
      color: #E54545;
      border-color: #E54545;
      background: rgba(229, 69, 69, 0.08);
    }
    .wecom-chip {
      height: 24px; padding: 0 12px; border: 0; border-radius: 12px;
      background: transparent; color: var(--wc-text-2); font-size: 13px; cursor: pointer;
      font-family: var(--wc-font);
      display: inline-flex; align-items: center; gap: 3px;
      white-space: nowrap; flex-shrink: 0;
    }
    .wecom-chip .n { font-weight: 600; }
    .wecom-chip.active { background: #FFFFFF; color: var(--wc-text); font-weight: 600; box-shadow: 0 1px 3px rgba(31,35,41,.12); }
    .wecom-list-actions { display: flex; gap: 6px; margin-left: auto; align-items: center; }
    .wecom-chip-icon {
      width: 26px; height: 26px; border-radius: 50%; background: #E7EAF1;
      border: 0; display: grid; place-items: center; color: var(--wc-text-2); cursor: pointer; padding: 0;
    }
    .wecom-chip-icon:hover { background: #DCE1EA; }
    .wecom-chip-icon.is-on, .wecom-list-nav-toggle[aria-expanded="true"] { color: var(--wc-accent); background: var(--wc-accent-soft); }
    .wecom-chip-icon svg { width: 14px; height: 14px; }
    .wecom-list-nav-toggle[aria-expanded="true"] { color: var(--wc-accent); background: var(--wc-accent-soft); }
    .wecom-list-nav {
      display: none !important;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 12px 10px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--wc-border);
    }
    .wecom-list-nav.open,
    .wecom-list-panel.wecom-list-nav-open .wecom-list-nav {
      display: flex !important;
    }
    .wecom-list-nav a {
      display: inline-flex; align-items: center;
      height: 28px; padding: 0 10px;
      border-radius: 14px;
      font-size: 12px; line-height: 1;
      color: var(--wc-text-2) !important;
      text-decoration: none !important;
      border: 1px solid var(--wc-border) !important;
      background: var(--wc-bg);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .wecom-list-nav a:hover {
      background: var(--wc-hover);
      color: var(--wc-text) !important;
    }
    .wecom-list-nav a.active {
      background: var(--wc-accent-soft);
      color: var(--wc-accent) !important;
      border-color: #C2D4FF !important;
      font-weight: 500;
    }
    .wecom-icon-btn {
      width: 32px; height: 32px;
      border: none; border-radius: 8px;
      background: transparent; color: var(--wc-text-2);
      cursor: pointer; display: inline-flex;
      align-items: center; justify-content: center;
      transition: background 0.15s;
      padding: 0;
    }
    .wecom-icon-btn:hover { background: var(--wc-hover); }
    .wecom-icon-btn svg { width: 18px; height: 18px; }
    .wecom-list-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
    .wecom-list-body::-webkit-scrollbar { width: 6px; }
    .wecom-list-body::-webkit-scrollbar-thumb { background: transparent; border-radius: 3px; }

    .wecom-conv {
      display: flex; gap: 8px;
      padding: 7px 10px;
      position: relative;
      text-decoration: none !important;
      cursor: pointer;
      transition: background 0.15s;
      border: none !important;
    }
    .wecom-conv:hover { background: var(--session-hover, var(--wc-hover)); }
    .wecom-conv.active { background: var(--session-active, var(--wc-active)); }
    .wecom-conv-avatar {
      width: 44px; height: 44px; border-radius: 8px;
      flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 15px; font-weight: 600;
    }
    /* 头像模板返回的图片通常是 96px；必须约束到头像框，否则会按原始尺寸溢出并被裁成放大的局部。 */
    .wecom-conv-avatar img,
    .wecom-chat-avatar img {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }
    /* 伪装文字头像：保持圆形；实心 / 空心；字数 3～5 */
    .wecom-conv-avatar.is-text-avatar {
      box-sizing: border-box;
      padding: 3px;
      letter-spacing: 0;
      text-align: center;
    }
    .wecom-conv-avatar .wecom-avatar-text {
      line-height: 1; font-weight: 700;
      font-size: 13px;
    }
    .wecom-conv-avatar .wecom-avatar-text[data-len="1"] { font-size: 14px; }
    .wecom-conv-avatar.is-grid-mask {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 0;
      background: #C9E7FF;
      padding: 0;
      overflow: hidden;
    }
    .wecom-conv-avatar.is-grid-mask > span {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
      color: #fff; font-size: 7px; font-weight: 700; line-height: 1;
    }
    .wecom-mask-avatar-toggle.is-on,
    .wecom-mask-title-toggle.is-on {
      color: var(--wc-accent); background: var(--wc-accent-soft);
    }
    .wecom-conv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .wecom-conv-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .wecom-conv-avatar.is-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 0;
      background: #C9E7FF;
      padding: 0;
      overflow: hidden;
    }
    .wecom-conv-avatar.is-group img,
    .wecom-conv-avatar.is-group span {
      width: 100%; height: 100%; object-fit: cover; background: #D4E5FF;
    }
    .wecom-conv-title {
      display: flex; align-items: center; gap: 6px;
      min-width: 0; flex: 1;
    }
    .wecom-conv-name {
      font-size: 14px; font-weight: 500; color: var(--wc-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; min-width: 0;
    }
    .wecom-conv-tag {
      display: inline-flex; align-items: center;
      height: 16px; padding: 0 5px; border-radius: 4px;
      font-size: 10px; line-height: 1; white-space: nowrap; flex-shrink: 0;
      color: #2F88FF; background: #E8F3FF;
      border: 1px solid #A8CFFF;
    }
    .wecom-conv-time { font-size: 12px; color: var(--wc-text-3); flex-shrink: 0; }
    .wecom-conv-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .wecom-conv-msg {
      font-size: 13px; color: var(--wc-text-3);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wecom-conv-badge {
      position: absolute; right: 12px; bottom: 12px;
      min-width: 16px; height: 16px; padding: 0 4px;
      background: var(--wc-danger); color: #fff;
      font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
      border-radius: 8px; flex-shrink: 0;
    }
    .wecom-list-status {
      padding: 14px; text-align: center;
      font-size: 12px; color: var(--wc-text-3);
    }
    .wecom-list-status.is-clickable {
      cursor: pointer;
    }
    .wecom-list-status.is-clickable:hover {
      color: var(--wc-blue);
    }

    /* ---------- 右栏：聊天详情 ---------- */
    .wecom-chat-panel {
      position: fixed;
      top: var(--wc-header-h);
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-strip) + var(--wc-list));
      right: 0; bottom: 0;
      background: var(--wc-chat-bg);
      display: flex; flex-direction: column;
      z-index: 420;
      font-family: var(--wc-font);
    }
    .wecom-chat-header {
      height: 52px; flex-shrink: 0;
      background: #F5F7FB;
      border-bottom: 1px solid var(--wc-border);
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 0 20px; gap: 12px;
    }
    .wecom-chat-titles { min-width: 0; }
    .wecom-chat-title {
      font-size: 16px; font-weight: 600; color: var(--wc-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      user-select: none; -webkit-user-select: none;
      touch-action: manipulation;
    }
    .wecom-chat-title.is-masked {
      cursor: pointer;
    }
    .wecom-chat-title.is-peeking-title {
      opacity: 0.95;
    }
    .wecom-chat-sub { font-size: 12px; color: var(--wc-text-3); margin-top: 1px; }
    .wecom-chat-tools,
    .wecom-chat-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .wecom-chat-body {
      flex: 1; overflow-y: auto;
      padding: 20px 24px;
      display: flex; flex-direction: column; gap: 16px;
      overscroll-behavior: contain;
    }
    .wecom-chat-body::-webkit-scrollbar { width: 6px; }
    .wecom-chat-body::-webkit-scrollbar-thumb { background: transparent; border-radius: 3px; }

    .wecom-msg { display: flex; gap: 10px; max-width: 78%; }
    .wecom-msg-other { align-self: flex-start; }
    .wecom-msg-me { align-self: flex-end; flex-direction: row-reverse; }
    .wecom-msg-avatar {
      width: 36px; height: 36px; border-radius: 8px;
      flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 14px; font-weight: 600;
    }
    .wecom-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .wecom-chat-panel [data-user-card],
    .wecom-member-panel [data-user-card] { cursor: pointer; }
    .wecom-chat-panel [data-user-card]:focus-visible,
    .wecom-member-panel [data-user-card]:focus-visible {
      outline: 2px solid var(--wc-accent);
      outline-offset: 2px;
    }
    .wecom-topic-bookmark.is-bookmarked {
      color: var(--wc-accent);
      background: var(--wc-accent-soft);
    }
    .wecom-topic-bookmark.is-bookmarked svg path { fill: currentColor; }
    .wecom-chat-panel[data-empty="1"] .wecom-topic-bookmark { display: none; }
    .wecom-msg-content { min-width: 0; display: flex; flex-direction: column; position: relative; }
    .wecom-msg-me .wecom-msg-content { align-items: flex-end; }
    .wecom-msg-name { font-size: 12px; color: var(--wc-text-3); margin-bottom: 4px; }
    .wecom-msg-me .wecom-msg-name { display: none; }
    .wecom-reply-reference {
      display: grid; grid-template-columns: 16px minmax(0, 1fr); column-gap: 6px;
      max-width: 420px; margin: 0 0 5px; padding: 5px 8px;
      color: var(--wc-text-2) !important; background: rgba(67, 137, 245, .09);
      border-left: 2px solid var(--wc-accent); border-radius: 3px;
      text-align: left; text-decoration: none !important; cursor: pointer;
    }
    .wecom-reply-reference:hover { background: rgba(67, 137, 245, .15); }
    .wecom-reply-reference:focus-visible { outline: 2px solid var(--wc-accent); outline-offset: 2px; }
    .wecom-reply-reference svg {
      grid-row: 1 / span 2; width: 15px; height: 15px; margin-top: 1px; color: var(--wc-accent);
    }
    .wecom-reply-reference-label {
      min-width: 0; overflow: hidden; color: var(--wc-accent);
      font-size: 11px; font-weight: 600; line-height: 16px; text-overflow: ellipsis; white-space: nowrap;
    }
    .wecom-reply-reference-preview {
      min-width: 0; overflow: hidden; color: var(--wc-text-3);
      font-size: 11px; line-height: 16px; text-overflow: ellipsis; white-space: nowrap;
    }
    .wecom-msg.is-reply-target .wecom-msg-bubble {
      outline: 2px solid var(--wc-accent); outline-offset: 3px;
    }
    .wecom-msg-bubble {
      padding: 10px 14px;
      font-size: 14px; line-height: 1.6;
      color: var(--wc-text);
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .wecom-msg-other .wecom-msg-bubble {
      background: var(--wc-bubble-other);
      border-radius: 8px;
      box-shadow: 0 1px 0 rgba(0,0,0,.03);
    }
    .wecom-msg-me .wecom-msg-bubble {
      background: var(--wc-bubble-me);
      border-radius: 8px;
    }
    .wecom-msg-bubble p { margin: 0 0 8px; }
    .wecom-msg-bubble p:last-child { margin-bottom: 0; }
    .wecom-msg-bubble img { max-width: 100%; border-radius: 6px; }
    .wecom-msg-bubble img:not(.emoji):not(.site-icon) { cursor: zoom-in; }
    .wecom-msg-bubble pre {
      background: rgba(127,127,127,0.12);
      padding: 8px 10px; border-radius: 6px;
      overflow-x: auto; font-size: 13px;
    }
    .wecom-msg-bubble code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .wecom-msg-bubble blockquote {
      margin: 0 0 8px; padding: 4px 10px;
      border-left: 3px solid var(--wc-accent);
      background: rgba(51,112,255,0.06);
      border-radius: 0 6px 6px 0;
    }
    .wecom-msg-bubble a { color: var(--wc-accent); }
    .wecom-msg-meta {
      font-size: 11px; color: var(--wc-text-3);
      margin-top: 4px; display: flex; gap: 8px; align-items: center;
    }
    .wecom-msg-likes {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      line-height: 1;
      color: var(--wc-text-3);
      vertical-align: middle;
      user-select: none;
    }
    .wecom-msg-likes .wecom-msg-like-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .wecom-msg-likes svg {
      width: 12px;
      height: 12px;
      color: var(--wc-text-3);
      fill: none;
      stroke: currentColor;
      flex-shrink: 0;
    }
    .wecom-msg-likes .wecom-msg-like-num {
      font-variant-numeric: tabular-nums;
    }
    .wecom-msg-time-sep {
      align-self: center;
      font-size: 12px; color: var(--wc-text-3);
      padding: 2px 10px;
    }
    .wecom-msg-tools {
      position: absolute; top: -14px; right: 0; z-index: 5;
      display: flex; align-items: center; gap: 2px;
      background: var(--wc-bg);
      border: 1px solid var(--wc-border);
      border-radius: 8px;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(31, 35, 41, 0.1);
      opacity: 0; visibility: hidden;
      transition: opacity 0.15s ease;
    }
    .wecom-msg:hover .wecom-msg-tools { opacity: 1; visibility: visible; }
    .wecom-msg-me .wecom-msg-tools { right: auto; left: 0; }
    .wecom-msg-tool {
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      border-radius: 6px; color: var(--wc-text-2);
      padding: 0;
    }
    .wecom-msg-tool svg { width: 15px; height: 15px; }
    .wecom-msg-tool:hover { background: var(--wc-hover); color: var(--wc-accent); }
    .wecom-msg-tool.liked,
    .wecom-msg-tool.bookmarked { color: var(--wc-accent); }
    .wecom-msg-tool.bookmarked svg path { fill: currentColor; }

    /* Boost 气泡与列表 */
    .wecom-msg-boosts {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 4px;
      max-width: 100%;
    }
    .wecom-msg-me .wecom-msg-boosts {
      justify-content: flex-end;
    }
    .wecom-msg-other .wecom-msg-boosts {
      justify-content: flex-start;
    }
    .wecom-boost-item {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 0 7px 0 3px !important;
      height: 22px !important;
      max-height: 22px !important;
      box-sizing: border-box !important;
      background: var(--wc-hover);
      border: 1px solid var(--wc-border);
      border-radius: 11px !important;
      font-size: 12px !important;
      color: var(--wc-text-2);
      line-height: 20px !important;
      max-width: 260px !important;
      transition: background 0.15s ease;
      vertical-align: middle !important;
      overflow: hidden !important;
    }
    html.wecom-dark .wecom-boost-item,
    html.${ROOT_CLASS}.wecom-dark .wecom-boost-item {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #D6D6D6 !important;
    }
    .wecom-boost-avatar {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      flex-shrink: 0 !important;
      display: block !important;
    }
    .wecom-boost-avatar-text {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
      border-radius: 50% !important;
      background: #267EF0 !important;
      color: #fff !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    .wecom-boost-cooked {
      display: inline-flex !important;
      align-items: center !important;
      height: 18px !important;
      max-height: 18px !important;
      line-height: 18px !important;
      gap: 2px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      vertical-align: middle !important;
    }
    .wecom-boost-cooked p {
      margin: 0 !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      height: 18px !important;
      max-height: 18px !important;
      min-height: 0 !important;
      line-height: 18px !important;
      gap: 2px !important;
      box-sizing: border-box !important;
    }
    .wecom-boost-cooked img,
    .wecom-boost-cooked img.emoji,
    .wecom-boost-cooked img.emoji.only-emoji,
    .wecom-boost-cooked img.only-emoji,
    .wecom-boost-cooked .only-emoji {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
      margin: 0 !important;
      padding: 0 !important;
      vertical-align: middle !important;
      display: inline-block !important;
      object-fit: contain !important;
      font-size: 12px !important;
      line-height: 1 !important;
    }
    html.${ROOT_CLASS} .wecom-boost-cooked img,
    html.${ROOT_CLASS} .wecom-boost-cooked img.emoji,
    html.${ROOT_CLASS} .wecom-boost-cooked img.emoji.only-emoji,
    html.${ROOT_CLASS} .wecom-boost-cooked img.only-emoji,
    html.${ROOT_CLASS} .wecom-boost-cooked .only-emoji {
      width: 16px !important;
      height: 16px !important;
      max-width: 16px !important;
      max-height: 16px !important;
      min-width: 16px !important;
      min-height: 16px !important;
    }
    .wecom-boost-delete {
      border: none;
      background: transparent;
      color: var(--wc-text-4);
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      padding: 0 2px;
      border-radius: 50%;
      margin-left: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .wecom-boost-delete:hover {
      color: #FA5151;
      background: rgba(250, 81, 81, 0.12);
    }

    /* 允许通过设置关闭显示 Boost */
    html.wecom-hide-boost .wecom-msg-boosts,
    html.wecom-hide-boost .wecom-msg-tool-btn[data-action="boost"] {
      display: none !important;
    }

    /* 允许通过设置隐藏对话详情头像 */
    html.wecom-hide-chat-avatar .wecom-msg-avatar {
      display: none !important;
    }
    html.wecom-hide-chat-avatar .wecom-msg {
      gap: 0 !important;
    }
    .wecom-chat-avatar-toggle.is-active,
    .wecom-chat-avatar-toggle[aria-pressed="true"] {
      color: var(--wc-accent) !important;
      background: var(--wc-accent-soft) !important;
    }

    /* Base64 自动解码悬浮卡片 */
    .wecom-base64-popover {
      position: fixed;
      z-index: 10001;
      width: 320px;
      max-width: calc(100vw - 24px);
      background: #FFFFFF;
      border: 1px solid var(--wc-border);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14), 0 1px 4px rgba(0, 0, 0, 0.08);
      padding: 10px 12px;
      box-sizing: border-box;
      animation: wecom-popover-in 0.12s ease-out;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      color: var(--wc-text);
    }
    html.wecom-dark .wecom-base64-popover,
    html.${ROOT_CLASS}.wecom-dark .wecom-base64-popover {
      background: #282C34;
      border-color: var(--wc-border-strong);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
      color: #ECEFF4;
    }
    .wecom-base64-popover-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .wecom-base64-popover-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--wc-accent, #267EF0);
    }
    .wecom-base64-popover-title svg {
      width: 14px;
      height: 14px;
    }
    .wecom-base64-popover-close {
      width: 18px;
      height: 18px;
      border: none;
      background: transparent;
      color: var(--wc-text-3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
      border-radius: 3px;
      padding: 0;
    }
    .wecom-base64-popover-close:hover {
      background: var(--wc-hover);
      color: var(--wc-text);
    }
    .wecom-base64-popover-body {
      max-height: 160px;
      overflow-y: auto;
    }
    .wecom-base64-decoded-text {
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 6px;
      padding: 8px 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.5;
      word-break: break-all;
      white-space: pre-wrap;
      user-select: text;
      color: var(--wc-text);
    }
    html.wecom-dark .wecom-base64-decoded-text,
    html.${ROOT_CLASS}.wecom-dark .wecom-base64-decoded-text {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.08);
      color: #ECEFF4;
    }
    .wecom-base64-popover-foot {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 2px;
    }
    .wecom-base64-btn {
      height: 26px;
      padding: 0 10px;
      border-radius: 5px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      border: 1px solid var(--wc-border);
      background: transparent;
      color: var(--wc-text-2);
      text-decoration: none !important;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .wecom-base64-btn:hover {
      background: var(--wc-hover);
      color: var(--wc-text);
    }
    .wecom-base64-btn.primary,
    .wecom-base64-open-btn {
      background: var(--wc-accent, #267EF0);
      border-color: var(--wc-accent, #267EF0);
      color: #FFFFFF !important;
    }
    .wecom-base64-btn.primary:hover,
    .wecom-base64-open-btn:hover {
      opacity: 0.9;
    }
    .wecom-base64-copy-btn.is-copied {
      color: #07C160 !important;
      border-color: #07C160 !important;
    }

    /* 保持消息浮动工具条在打开 Popover 时常驻 */
    .wecom-msg.has-boost-popover .wecom-msg-tools {
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Boost 添加微弹窗 */
    .wecom-boost-popover {
      position: fixed;
      z-index: 1000;
      background: var(--wc-bg);
      border: 1px solid var(--wc-border-strong);
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
      padding: 12px;
      width: 260px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: var(--wc-font);
      box-sizing: border-box;
      animation: wecom-popover-in 0.12s ease-out;
    }
    @keyframes wecom-popover-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    html.wecom-dark .wecom-boost-popover,
    html.${ROOT_CLASS}.wecom-dark .wecom-boost-popover {
      background: #26292E;
      border-color: #3B3E45;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    }
    .wecom-boost-popover-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: var(--wc-text);
      line-height: 1;
    }
    .wecom-boost-popover-head > span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .wecom-boost-popover-head svg {
      width: 15px;
      height: 15px;
      color: var(--wc-accent);
    }
    .wecom-boost-popover-close {
      border: none;
      background: transparent;
      color: var(--wc-text-3);
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .wecom-boost-popover-close:hover {
      background: var(--wc-hover);
      color: var(--wc-text);
    }
    .wecom-boost-presets {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .wecom-boost-preset-btn {
      border: 1px solid var(--wc-border);
      background: var(--wc-hover);
      color: var(--wc-text);
      font-size: 13px;
      height: 30px;
      padding: 0;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--wc-font);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
      user-select: none;
    }
    .wecom-boost-preset-btn:hover {
      background: var(--wc-active);
      border-color: var(--wc-accent);
      color: var(--wc-accent);
      transform: translateY(-1px);
    }
    .wecom-boost-input-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .wecom-boost-input {
      flex: 1;
      min-width: 0;
      height: 30px;
      padding: 0 8px;
      font-size: 12px;
      border: 1px solid var(--wc-border);
      border-radius: 6px;
      background: var(--wc-bg);
      color: var(--wc-text);
      outline: none;
      font-family: var(--wc-font);
      box-sizing: border-box;
    }
    .wecom-boost-input:focus {
      border-color: #267EF0;
    }
    .wecom-boost-send-btn {
      height: 30px;
      padding: 0 12px;
      background: #267EF0;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: var(--wc-font);
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .wecom-boost-send-btn:hover:not(:disabled) {
      background: #1B6EDB;
    }
    .wecom-boost-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .wecom-boost-status {
      font-size: 11px;
      color: #FA5151;
      min-height: 0;
      line-height: 1.3;
      display: none;
    }
    .wecom-boost-status:not(:empty) {
      display: block;
    }

    /* Window Controls Overlay (把内容延伸到标题栏，融合原生窗口控制按钮) */
    @media (display-mode: window-controls-overlay) {
      html.${ROOT_CLASS} {
        --wc-wco-active: 1;
      }
    }
    html.${ROOT_CLASS}.wecom-wco-active .wecom-win-controls,
    @media (display-mode: window-controls-overlay) {
      html.${ROOT_CLASS} .wecom-win-controls {
        display: none !important;
      }
    }
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-header,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-list-search,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail-head,
    @media (display-mode: window-controls-overlay) {
      html.${ROOT_CLASS} .wecom-chat-header,
      html.${ROOT_CLASS} .wecom-list-search,
      html.${ROOT_CLASS} .wecom-rail,
      html.${ROOT_CLASS} .wecom-rail-head {
        -webkit-app-region: drag !important;
        app-region: drag !important;
      }
    }
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-header button,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-header a,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-title,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-platform-switcher,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-platform-switcher *,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-chips,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-list-search input,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-list-search button,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail button,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail a,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail input,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail-avatar,
    html.${ROOT_CLASS}.wecom-wco-active .wecom-rail-item,
    @media (display-mode: window-controls-overlay) {
      html.${ROOT_CLASS} .wecom-chat-header button,
      html.${ROOT_CLASS} .wecom-chat-header a,
      html.${ROOT_CLASS} .wecom-chat-title,
      html.${ROOT_CLASS} .wecom-platform-switcher,
      html.${ROOT_CLASS} .wecom-platform-switcher *,
      html.${ROOT_CLASS} .wecom-chat-chips,
      html.${ROOT_CLASS} .wecom-list-search input,
      html.${ROOT_CLASS} .wecom-list-search button,
      html.${ROOT_CLASS} .wecom-rail button,
      html.${ROOT_CLASS} .wecom-rail a,
      html.${ROOT_CLASS} .wecom-rail input,
      html.${ROOT_CLASS} .wecom-rail-avatar,
      html.${ROOT_CLASS} .wecom-rail-item {
        -webkit-app-region: no-drag !important;
        app-region: no-drag !important;
      }
    }
    html.${ROOT_CLASS}.wecom-wco-active .wecom-chat-header,
    @media (display-mode: window-controls-overlay) {
      html.${ROOT_CLASS} .wecom-chat-header {
        padding-right: calc(100vw - env(titlebar-area-width, var(--wc-titlebar-width, calc(100vw - 138px))) + 12px) !important;
      }
    }

    /* 彻底屏蔽顶部原生及各类第三方加载进度条、时间线进度条，避免切话题时闪现进度条 */
    #loading-slider,
    .loading-slider,
    .loading-slider-container,
    .loading-slider__bar,
    .d-loading-slider,
    div[class*="loading-slider"],
    div[id*="loading-slider"],
    .loading-indicator-container,
    .loading-indicator,
    div[class*="loading-indicator"],
    div[id*="loading-indicator"],
    #page-loading-slider,
    .page-loading-slider,
    .ember-load-indicator,
    #nprogress,
    .pace,
    .progress-bar,
    div[class*="progress-bar"],
    div[class*="progress"],
    [data-loading-indicator],
    .topic-navigation,
    .topic-timeline,
    .timeline-container,
    .timeline-scrollarea {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      z-index: -9999 !important;
    }

    .wecom-chat-empty, .wecom-chat-error, .wecom-chat-loading {
      margin: auto;
      display: flex; flex-direction: column;
      align-items: center; gap: 12px;
      color: var(--wc-text-3); font-size: 14px;
      text-align: center; padding: 40px 20px;
    }
    .wecom-chat-empty svg, .wecom-chat-error svg {
      width: 56px; height: 56px; opacity: 0.5;
    }
    .wecom-chat-spinner {
      width: 28px;
      height: 28px;
      border: 2.5px solid rgba(0, 0, 0, 0.08);
      border-top-color: #267EF0;
      border-radius: 50%;
      animation: wecom-spin 0.7s linear infinite;
    }
    html.wecom-dark .wecom-chat-spinner,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-spinner {
      border-color: rgba(255, 255, 255, 0.12);
      border-top-color: #267EF0;
    }
    @keyframes wecom-spin {
      to { transform: rotate(360deg); }
    }
    .wecom-empty-btn {
      margin-top: 6px;
      border: 1px solid var(--wc-border-strong);
      background: var(--wc-bg); color: var(--wc-text-2);
      border-radius: 6px; height: 32px; padding: 0 14px;
      font-size: 13px; cursor: pointer; font-family: var(--wc-font);
    }
    .wecom-empty-btn:hover { background: var(--wc-hover); }
    .wecom-v2ex-more-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      margin: 16px auto 14px;
      max-width: 340px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--wc-text-2);
      background: var(--wc-hover-bg, rgba(0, 0, 0, 0.03));
      border: 1px solid var(--wc-border-light, rgba(0, 0, 0, 0.08));
      cursor: pointer;
      user-select: none;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .wecom-v2ex-more-bar:hover:not(.is-loading):not(.is-end) {
      background: rgba(26, 135, 255, 0.08);
      color: #1A87FF;
      border-color: rgba(26, 135, 255, 0.25);
    }
    .wecom-v2ex-more-bar.is-end {
      border: none;
      background: transparent;
      cursor: default;
      color: var(--wc-text-3);
      font-size: 12px;
      padding: 6px 12px;
    }
    .wecom-v2ex-more-bar.is-loading {
      cursor: default;
      opacity: 0.85;
    }
    .wecom-v2ex-more-bar .wecom-chat-spinner {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }
    html.wecom-dark .wecom-v2ex-more-bar,
    html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-more-bar {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.08);
      color: var(--wc-text-2);
    }
    html.wecom-dark .wecom-v2ex-more-bar:hover:not(.is-loading):not(.is-end),
    html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-more-bar:hover:not(.is-loading):not(.is-end) {
      background: rgba(26, 135, 255, 0.15);
      color: #409EFF;
      border-color: rgba(26, 135, 255, 0.35);
    }
    html.wecom-dark .wecom-v2ex-more-bar.is-end,
    html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-more-bar.is-end {
      background: transparent;
      border: none;
      color: var(--wc-text-3);
    }

    .wecom-chat-error-actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .wecom-chat-error-btn {
      border: 1px solid var(--wc-border-strong);
      background: var(--wc-bg);
      color: var(--wc-text-2);
      border-radius: 6px;
      height: 32px;
      padding: 0 16px;
      font-size: 13px;
      cursor: pointer;
      font-family: var(--wc-font);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      user-select: none;
    }
    .wecom-chat-error-btn:hover {
      background: var(--wc-hover);
      color: var(--wc-text);
    }
    .wecom-chat-error-btn.primary {
      background: #267EF0;
      border-color: #267EF0;
      color: #FFFFFF;
      font-weight: 500;
    }
    .wecom-chat-error-btn.primary:hover {
      background: #1B6ED8;
      border-color: #1B6ED8;
    }

    /* ---------- 企业微信 composer：白卡片，输入区 + 下方工具行 + 发送钮 ---------- */
    .wecom-composer {
      background: transparent; border-top: none;
      padding: 4px 12px 12px; flex-shrink: 0;
    }
    .wecom-composer-card {
      background: #FFFFFF;
      border: 1px solid var(--wc-border);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .wecom-composer-card:hover {
      border-color: #C2D4FF;
      box-shadow: 0 2px 10px rgba(26,135,255,.08);
    }
    .wecom-composer-tools {
      display: flex; align-items: center; gap: 0; padding: 0 8px 6px;
    }
    .wecom-composer-tools .wecom-icon-btn { width: 28px; height: 28px; }
    .wecom-composer-tools .spacer { flex: 1; }
    .wecom-composer-tools .hint { font-size: 11px; color: var(--wc-text-4); margin-right: 8px; }
    .wecom-image-input {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
    .wecom-send-btn {
      height: 26px; padding: 0 14px; border: 0; border-radius: 5px;
      background: #C5C9D0; color: #fff; font-size: 12px; cursor: pointer;
      font-family: var(--wc-font);
    }
    .wecom-chat-tools { margin-left: auto; display: flex; gap: 2px; }
    .wecom-chat-tools .wecom-icon-btn { width: 32px; height: 32px; position: relative; }
    .wecom-chat-tools .dot,
    .wecom-composer-tools .dot {
      position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
      background: var(--wc-danger); border-radius: 50%;
    }
    .wecom-composer-tools .wecom-icon-btn { position: relative; }

    /* ---------- 输入区：企微外观，内容同步给后台原生 composer ---------- */
    .wecom-chat-compose {
      position: relative;
      z-index: 430;
      flex-shrink: 0;
      margin: 0;
      min-height: 64px;
      height: auto;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--wc-text-4);
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 14px 4px;
      cursor: text;
      font-size: 14px;
      font-family: var(--wc-font);
      transition: color 0.15s;
      pointer-events: auto !important;
      width: 100%;
      text-align: left;
    }
    .wecom-chat-compose:hover { color: var(--wc-text-1); }
    .wecom-chat-compose.busy { color: var(--wc-accent); }
    .wecom-chat-compose.error { color: var(--wc-danger); }
    .wecom-chat-compose svg { width: 16px; height: 16px; flex-shrink: 0; }
    .wecom-chat-panel[data-empty="1"] .wecom-composer { display: none; }

    /* 锁定态：原生主区不要抢走点击；原生 composer 仅作为后台提交引擎 */
    .${ROOT_CLASS}.${LOCK_CLASS} #main-outlet-wrapper,
    .${ROOT_CLASS}.${LOCK_CLASS} #main-outlet,
    .${ROOT_CLASS}.${LOCK_CLASS} #Wrapper,
    .${ROOT_CLASS}.${LOCK_CLASS} #Main,
    .${ROOT_CLASS}.${LOCK_CLASS} #Rightbar {
      pointer-events: none !important;
    }
    .${ROOT_CLASS}.${LOCK_CLASS} #reply-control:not(.open):not(.fullscreen):not(.edit-title) {
      display: none !important;
      pointer-events: none !important;
      z-index: 0 !important;
    }
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) #reply-control.open,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) #reply-control.edit-title,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) #reply-control.fullscreen {
      display: block !important;
      position: fixed !important;
      inset: 0 auto auto -10000px !important;
      width: 2px !important;
      min-width: 0 !important;
      max-width: 2px !important;
      height: 2px !important;
      min-height: 0 !important;
      max-height: 2px !important;
      overflow: hidden !important;
      opacity: 0 !important;
      visibility: hidden !important;
      user-select: none !important;
      clip-path: inset(50%) !important;
      pointer-events: none !important;
      box-shadow: none !important;
    }
    /* 原生编辑器可能把补全菜单挂到 body；IM 输入框不应被这些浮层打断。 */
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) .autocomplete,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) .autocomplete-container,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) .d-editor-popup,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) .tag-chooser,
    html.${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-composing-new) .select-kit-body {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* 发布新主题时唤起的原生 Discourse Composer 抽屉/浮层 (企业微信视觉规范) */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control {
      display: flex !important;
      flex-direction: column !important;
      position: fixed !important;
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-strip) + var(--wc-list)) !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      width: auto !important;
      min-width: 320px !important;
      max-width: none !important;
      height: 75vh !important;
      min-height: 460px !important;
      max-height: 94vh !important;
      overflow: hidden !important;
      opacity: 1 !important;
      visibility: visible !important;
      user-select: auto !important;
      clip-path: none !important;
      pointer-events: auto !important;
      z-index: 1500 !important;
      background: #FFFFFF !important;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.14) !important;
      border: 1px solid #D8DCE0 !important;
      border-bottom: none !important;
      border-radius: 10px 10px 0 0 !important;
      font-family: var(--wc-font) !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control * {
      pointer-events: auto !important;
      box-sizing: border-box !important;
    }

    /* 顶部拖动手柄与标题栏 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .grippie {
      height: 32px !important;
      min-height: 32px !important;
      background: #F5F7FA !important;
      border-bottom: 1px solid #EAEBED !important;
      border-radius: 10px 10px 0 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: row-resize !important;
      position: relative !important;
      padding: 0 16px !important;
      user-select: none !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .grippie::before {
      content: "" !important;
      display: block !important;
      width: 40px !important;
      height: 4px !important;
      border-radius: 2px !important;
      background: #C8CDD4 !important;
      transition: background 0.15s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .grippie:hover::before {
      background: #267EF0 !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new:not(.wecom-mask-composing) #reply-control .grippie::after {
      content: "发布新主题" !important;
      position: absolute !important;
      left: 16px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #4E5359 !important;
      pointer-events: none !important;
    }
    html.${ROOT_CLASS}.wecom-mask-composing #reply-control .grippie::after {
      content: "发起新项目群" !important;
      position: absolute !important;
      left: 16px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #4E5359 !important;
      pointer-events: none !important;
    }

    /* 顶部右侧原生控制钮 (最小化/切换大小) */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .composer-controls,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .toggler {
      position: absolute !important;
      right: 12px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .composer-controls button,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .toggler button {
      background: transparent !important;
      border: none !important;
      color: #8F959E !important;
      width: 22px !important;
      height: 22px !important;
      border-radius: 4px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: all 0.12s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .composer-controls button:hover,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .toggler button:hover {
      background: rgba(0, 0, 0, 0.06) !important;
      color: #1F2329 !important;
    }

    /* 编辑区主体容器 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .reply-area {
      padding: 14px 20px 14px 20px !important;
      background: #FFFFFF !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    /* 字段区：标题 + 分类 + 标签 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .composer-fields {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      margin-bottom: 2px !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .title-and-category {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      flex-wrap: wrap !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .title-input {
      flex: 1 1 320px !important;
      min-width: 240px !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control input#reply-title {
      font-family: var(--wc-font) !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #1F2329 !important;
      background: #FFFFFF !important;
      border: 1px solid #D8DCE0 !important;
      border-radius: 6px !important;
      padding: 0 12px !important;
      height: 36px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      box-shadow: none !important;
      transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control input#reply-title:focus {
      border-color: #267EF0 !important;
      box-shadow: 0 0 0 2px rgba(38, 126, 240, 0.15) !important;
      outline: none !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control input#reply-title::placeholder {
      color: #8F959E !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .category-input {
      flex: 0 0 auto !important;
      min-width: 160px !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .select-kit.combobox .select-kit-header,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .category-chooser .select-kit-header,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .mini-tag-chooser .select-kit-header {
      font-family: var(--wc-font) !important;
      font-size: 13px !important;
      color: #1F2329 !important;
      background: #FFFFFF !important;
      border: 1px solid #D8DCE0 !important;
      border-radius: 6px !important;
      height: 36px !important;
      padding: 0 10px !important;
      box-sizing: border-box !important;
      box-shadow: none !important;
      transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .select-kit.is-expanded .select-kit-header {
      border-color: #267EF0 !important;
      box-shadow: 0 0 0 2px rgba(38, 126, 240, 0.15) !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .select-kit-body {
      border: 1px solid #D8DCE0 !important;
      border-radius: 6px !important;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12) !important;
      font-family: var(--wc-font) !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .select-kit-row.is-highlighted {
      background: #F0F2F5 !important;
      color: #267EF0 !important;
    }

    /* 编辑器整体卡片 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor {
      border: 1px solid #D8DCE0 !important;
      border-radius: 6px !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      background: #FFFFFF !important;
      box-sizing: border-box !important;
      transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor:focus-within {
      border-color: #267EF0 !important;
      box-shadow: 0 0 0 2px rgba(38, 126, 240, 0.12) !important;
    }
    /* 工具栏：企微灰底、微小圆角按钮 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-toolbar,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-button-bar {
      background: #F7F8FA !important;
      border-bottom: 1px solid #EAEBED !important;
      padding: 4px 8px !important;
      display: flex !important;
      align-items: center !important;
      gap: 2px !important;
      min-height: 36px !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-button-bar button,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-toolbar button {
      height: 28px !important;
      min-width: 28px !important;
      padding: 0 4px !important;
      border: none !important;
      background: transparent !important;
      border-radius: 4px !important;
      color: #4E5359 !important;
      cursor: pointer !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.12s ease, color 0.12s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-button-bar button:hover,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-toolbar button:hover {
      background: #EAF3FF !important;
      color: #267EF0 !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-button-bar button svg,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-toolbar button svg {
      width: 16px !important;
      height: 16px !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-textarea-wrapper {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control textarea.d-editor-input {
      font-family: var(--wc-font) !important;
      font-size: 14px !important;
      line-height: 1.65 !important;
      color: #1F2329 !important;
      background: #FFFFFF !important;
      padding: 10px 14px !important;
      border: none !important;
      outline: none !important;
      resize: none !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .d-editor-preview-wrapper {
      border-left: 1px solid #EAEBED !important;
      background: #FAFBFC !important;
      padding: 10px 16px !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
    }

    /* 底部操作行 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 4px 0 0 0 !important;
      margin-top: 0 !important;
      background: transparent !important;
      border-top: none !important;
      flex-shrink: 0 !important;
    }
    /* 创建话题主按钮：企微高亮商务蓝 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.create,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.btn-primary {
      background: #267EF0 !important;
      color: #FFFFFF !important;
      border: 1px solid #267EF0 !important;
      border-radius: 4px !important;
      height: 32px !important;
      min-width: 88px !important;
      padding: 0 16px !important;
      font-family: var(--wc-font) !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      box-shadow: 0 2px 6px rgba(38, 126, 240, 0.22) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.15s ease, box-shadow 0.15s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.create:hover,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.btn-primary:hover {
      background: #176BCE !important;
      border-color: #176BCE !important;
      box-shadow: 0 3px 8px rgba(38, 126, 240, 0.3) !important;
    }
    /* 取消/放弃按钮：企微次级按钮 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.cancel,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.btn-default {
      background: #FFFFFF !important;
      color: #33383E !important;
      border: 1px solid #D2D4D7 !important;
      border-radius: 4px !important;
      height: 32px !important;
      min-width: 64px !important;
      padding: 0 14px !important;
      font-family: var(--wc-font) !important;
      font-size: 13px !important;
      cursor: pointer !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background 0.12s ease, border-color 0.12s ease !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.cancel:hover,
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel button.btn-default:hover {
      background: #F5F7FA !important;
      border-color: #BDD0E8 !important;
      color: #1F2329 !important;
    }
    /* 底部辅助文字与控制 */
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel .composer-bottom-right {
      margin-left: auto !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      font-family: var(--wc-font) !important;
      font-size: 12px !important;
      color: #8F959E !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel .draft-status {
      font-size: 12px !important;
      color: #8F959E !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel .toggle-preview {
      height: 28px !important;
      padding: 0 8px !important;
      font-size: 12px !important;
      border-radius: 4px !important;
      border: 1px solid #E1E4E8 !important;
      background: #FFFFFF !important;
      color: #4E5359 !important;
      cursor: pointer !important;
    }
    html.${ROOT_CLASS}.wecom-composing-new #reply-control .submit-panel .toggle-preview:hover {
      background: #F5F7FA !important;
      color: #267EF0 !important;
    }

    /* 浮层下拉与自动补全 */
    html.${ROOT_CLASS}.wecom-composing-new .autocomplete,
    html.${ROOT_CLASS}.wecom-composing-new .autocomplete-container,
    html.${ROOT_CLASS}.wecom-composing-new .d-editor-popup,
    html.${ROOT_CLASS}.wecom-composing-new .tag-chooser,
    html.${ROOT_CLASS}.wecom-composing-new .select-kit-body,
    html.${ROOT_CLASS}.wecom-composing-new .select-kit-collection {
      z-index: 1600 !important;
      pointer-events: auto !important;
    }

    /* 深色模式深层适配 */
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control {
      background: #191B1F !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .grippie {
      background: #14161A !important;
      border-bottom-color: rgba(255, 255, 255, 0.08) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .grippie::before {
      background: #4C525C !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .grippie:hover::before {
      background: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .grippie::after {
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .composer-controls button,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .toggler button {
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .composer-controls button:hover,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .toggler button:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .reply-area {
      background: #191B1F !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control input#reply-title,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .select-kit.combobox .select-kit-header,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .category-chooser .select-kit-header,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .mini-tag-chooser .select-kit-header {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control input#reply-title:focus,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .select-kit.is-expanded .select-kit-header {
      border-color: #388BFD !important;
      box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.25) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .select-kit-body {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
      color: #ECEFF4 !important;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .select-kit-row.is-highlighted {
      background: #2C313A !important;
      color: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor:focus-within {
      border-color: rgba(56, 139, 253, 0.45) !important;
      box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.2) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-toolbar,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-button-bar {
      background: #1C1F24 !important;
      border-bottom-color: rgba(255, 255, 255, 0.08) !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-button-bar button,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-toolbar button {
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-button-bar button:hover,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-toolbar button:hover {
      background: #388BFD1A !important;
      color: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control textarea.d-editor-input {
      background: #23272E !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .d-editor-preview-wrapper {
      background: #14161A !important;
      border-left-color: rgba(255, 255, 255, 0.08) !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel button.cancel,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel button.btn-default {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.18) !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel button.cancel:hover,
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel button.btn-default:hover {
      background: #2C313A !important;
      border-color: rgba(255, 255, 255, 0.28) !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel .toggle-preview {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark.wecom-composing-new #reply-control .submit-panel .toggle-preview:hover {
      background: #2C313A !important;
      color: #388BFD !important;
    }

    /* ---------- Discourse 原生确认对话框/浮层（如点击“放弃”弹出的舍弃草稿确认层）、Modal 弹窗与遮罩层 ---------- */
    .dialog-holder,
    .dialog-container,
    .dialog-overlay,
    #discourse-modal-container,
    .d-modal,
    .d-modal__backdrop,
    .d-modal__container,
    .modal-backdrop,
    .modal-outer-container,
    .modal,
    .bootbox,
    .discard-draft-modal,
    .confirm-dialog {
      z-index: 20000 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }
    .dialog-holder *,
    .dialog-container *,
    #discourse-modal-container *,
    .d-modal *,
    .bootbox * {
      pointer-events: auto !important;
    }
    .dialog-holder .dialog-overlay,
    .d-modal__backdrop,
    .modal-backdrop {
      z-index: 19999 !important;
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.45) !important;
      backdrop-filter: blur(2px) !important;
      pointer-events: auto !important;
    }

    /* 弹窗居中卡片：企微规范 */
    .dialog-container,
    .modal-dialog,
    .d-modal__container {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      margin: 0 !important;
      z-index: 20000 !important;
      width: 90% !important;
      max-width: 440px !important;
      min-width: 280px !important;
      pointer-events: auto !important;
    }
    .dialog-content,
    .modal-content,
    .d-modal__container {
      background: #FFFFFF !important;
      border: 1px solid #D8DCE0 !important;
      border-radius: 8px !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22) !important;
      padding: 20px 24px !important;
      font-family: var(--wc-font) !important;
      color: #1F2329 !important;
      box-sizing: border-box !important;
    }
    .dialog-header,
    .modal-header,
    .d-modal__header {
      border-bottom: none !important;
      padding: 0 0 10px 0 !important;
    }
    .dialog-title,
    .modal-title,
    .d-modal__title {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: #1F2329 !important;
      font-family: var(--wc-font) !important;
    }
    .dialog-body,
    .modal-body,
    .d-modal__body {
      font-size: 13px !important;
      line-height: 1.6 !important;
      color: #4E5359 !important;
      padding: 0 0 18px 0 !important;
      font-family: var(--wc-font) !important;
    }
    .dialog-footer,
    .modal-footer,
    .d-modal__footer {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 10px !important;
      border-top: none !important;
      padding: 0 !important;
    }
    /* 危险操作按钮（如“舍弃”草稿） */
    .dialog-footer button.btn-danger,
    .modal-footer button.btn-danger,
    .d-modal__footer button.btn-danger,
    .bootbox button.btn-danger,
    button.btn-danger.btn-confirm {
      background: #FA5151 !important;
      border: 1px solid #FA5151 !important;
      color: #FFFFFF !important;
      border-radius: 4px !important;
      height: 32px !important;
      min-width: 72px !important;
      padding: 0 16px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      font-family: var(--wc-font) !important;
      cursor: pointer !important;
      transition: background 0.15s ease !important;
    }
    .dialog-footer button.btn-danger:hover,
    .modal-footer button.btn-danger:hover,
    .d-modal__footer button.btn-danger:hover,
    .bootbox button.btn-danger:hover,
    button.btn-danger.btn-confirm:hover {
      background: #D9363E !important;
      border-color: #D9363E !important;
    }
    /* 取消 / 继续编辑按钮 */
    .dialog-footer button.btn-default,
    .dialog-footer button.btn-cancel,
    .modal-footer button.btn-default,
    .d-modal__footer button.btn-default,
    .bootbox button.btn-default {
      background: #FFFFFF !important;
      border: 1px solid #D2D4D7 !important;
      color: #33383E !important;
      border-radius: 4px !important;
      height: 32px !important;
      min-width: 64px !important;
      padding: 0 14px !important;
      font-size: 13px !important;
      font-family: var(--wc-font) !important;
      cursor: pointer !important;
      transition: background 0.12s ease !important;
    }
    .dialog-footer button.btn-default:hover,
    .dialog-footer button.btn-cancel:hover,
    .modal-footer button.btn-default:hover,
    .d-modal__footer button.btn-default:hover,
    .bootbox button.btn-default:hover {
      background: #F5F7FA !important;
      border-color: #BDD0E8 !important;
      color: #1F2329 !important;
    }

    /* 深色模式下对话框 */
    html.wecom-dark .dialog-content,
    html.wecom-dark .modal-content,
    html.wecom-dark .d-modal__container {
      background: #232529 !important;
      border-color: #383A40 !important;
      color: #ECEFF4 !important;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5) !important;
    }
    html.wecom-dark .dialog-title,
    html.wecom-dark .modal-title,
    html.wecom-dark .d-modal__title {
      color: #FFFFFF !important;
    }
    html.wecom-dark .dialog-body,
    html.wecom-dark .modal-body,
    html.wecom-dark .d-modal__body {
      color: #A6A9AD !important;
    }
    html.wecom-dark .dialog-footer button.btn-default,
    html.wecom-dark .dialog-footer button.btn-cancel,
    html.wecom-dark .modal-footer button.btn-default,
    html.wecom-dark .d-modal__footer button.btn-default,
    html.wecom-dark .bootbox button.btn-default {
      background: #2B2D31 !important;
      border-color: #44474E !important;
      color: #DCDDDE !important;
    }
    html.wecom-dark .dialog-footer button.btn-default:hover,
    html.wecom-dark .dialog-footer button.btn-cancel:hover,
    html.wecom-dark .modal-footer button.btn-default:hover,
    html.wecom-dark .d-modal__footer button.btn-default:hover,
    html.wecom-dark .bootbox button.btn-default:hover {
      background: #383A40 !important;
      color: #FFFFFF !important;
    }

    /* ---------- 消息编辑弹窗 ---------- */
    .wecom-edit-dialog,
    .wecom-edit-dialog * { box-sizing: border-box; }
    .wecom-edit-dialog[hidden] { display: none !important; }
    .wecom-edit-dialog {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(24, 35, 49, .42);
      font-family: var(--wc-font);
    }
    .wecom-edit-dialog-card {
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      padding: 18px;
      border: 1px solid #D6DEE8;
      border-radius: 10px;
      background: #FFFFFF;
      box-shadow: 0 18px 50px rgba(30, 48, 71, .24);
      color: #172033;
    }
    .wecom-edit-dialog-head,
    .wecom-edit-dialog-actions {
      display: flex;
      align-items: center;
    }
    .wecom-edit-dialog-head { justify-content: space-between; margin-bottom: 12px; }
    .wecom-edit-dialog-title { font-size: 16px; font-weight: 600; }
    .wecom-edit-dialog-close {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 5px;
      background: transparent;
      color: #7D8B9D;
      font-size: 21px;
      line-height: 26px;
      cursor: pointer;
    }
    .wecom-edit-dialog-close:hover { background: #EEF3F8; }
    .wecom-edit-input {
      width: 100%;
      min-height: 180px;
      max-height: 55vh;
      padding: 11px 12px;
      resize: vertical;
      border: 1px solid #C9D3DF;
      border-radius: 7px;
      outline: 0;
      background: #FFFFFF;
      color: #172033;
      font: 14px/1.6 var(--wc-font);
    }
    .wecom-edit-input:focus { border-color: #267EF0; box-shadow: 0 0 0 2px rgba(38,126,240,.15); }
    .wecom-edit-status { min-height: 20px; padding-top: 6px; color: #8795A8; font-size: 12px; }
    .wecom-edit-status.error { color: #D84C4C; }
    .wecom-edit-status.busy { color: #267EF0; }
    .wecom-edit-status.success { color: #07A35A; }
    .wecom-edit-dialog-actions { justify-content: flex-end; gap: 8px; margin-top: 10px; }
    .wecom-edit-dialog-actions button {
      min-width: 68px;
      height: 32px;
      border: 1px solid #CCD6E2;
      border-radius: 6px;
      background: #FFFFFF;
      color: #526175;
      font: 13px var(--wc-font);
      cursor: pointer;
    }
    .wecom-edit-dialog-actions .wecom-edit-save {
      border-color: #267EF0;
      background: #267EF0;
      color: #FFFFFF;
    }
    .wecom-edit-dialog-actions .wecom-edit-save:disabled { opacity: .5; cursor: default; }

    /* ---------- native 模式悬浮恢复钮 ---------- */
    .wecom-mode-fab {
      position: fixed; right: 20px; bottom: 20px; z-index: 10000;
      width: 44px; height: 44px; border-radius: 50%;
      background: #1A87FF; color: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(51,112,255,0.4);
    }
    .wecom-mode-fab svg { width: 22px; height: 22px; }

    /* ---------- 帖子详情图片自动排版 ---------- */
    .wecom-msg-images {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      margin-top: 8px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    blockquote .wecom-msg-images {
      margin-top: 6px !important;
      margin-bottom: 2px !important;
    }
    .wecom-msg-body.is-empty {
      display: none !important;
    }
    .wecom-msg-body.is-empty + .wecom-msg-images,
    .wecom-msg-body:empty + .wecom-msg-images {
      margin-top: 0 !important;
    }
    .wecom-msg-body > *:last-child {
      margin-bottom: 0 !important;
    }
    .wecom-msg-body > p:last-child {
      margin-bottom: 0 !important;
    }
    .wecom-msg-body p:empty,
    .wecom-msg-body div:empty {
      display: none !important;
    }
    .wecom-msg-thumb {
      position: relative !important;
      width: 100px !important;
      width: var(--wecom-image-thumb-size, 100px) !important;
      width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      height: 100px !important;
      height: var(--wecom-image-thumb-size, 100px) !important;
      height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      min-width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      min-height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      max-width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      max-height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      flex: 0 0 var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      aspect-ratio: var(--wecom-image-thumb-aspect, 1 / 1) !important;
      border-radius: 6px !important;
      overflow: hidden !important;
      background: rgba(0, 0, 0, 0.04) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      cursor: zoom-in !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      user-select: none !important;
      transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    .wecom-msg-thumb:hover {
      border-color: rgba(38, 126, 240, 0.45) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
    }
    .wecom-msg-thumb:focus-visible {
      outline: 2px solid var(--wc-accent) !important;
      outline-offset: 1px !important;
    }
    .wecom-msg-thumb a {
      display: flex !important;
      width: 100% !important;
      height: 100% !important;
      align-items: center !important;
      justify-content: center !important;
      text-decoration: none !important;
    }
    .wecom-msg-thumb img {
      width: 100px !important;
      width: var(--wecom-image-thumb-size, 100px) !important;
      width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      height: 100px !important;
      height: var(--wecom-image-thumb-size, 100px) !important;
      height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      min-width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      min-height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      max-width: var(--wecom-image-thumb-width, var(--wecom-image-thumb-size, 100px)) !important;
      max-height: var(--wecom-image-thumb-height, var(--wecom-image-thumb-size, 100px)) !important;
      aspect-ratio: var(--wecom-image-thumb-aspect, 1 / 1) !important;
      object-fit: cover !important;
      display: block !important;
      border-radius: 4px !important;
      margin: 0 !important;
      padding: 0 !important;
      transition: transform 0.2s ease !important;
    }
    .wecom-msg-thumb:hover img {
      transform: scale(1.05) !important;
    }
    .wecom-msg-thumb .meta {
      display: none !important;
    }
    .wecom-msg-thumb-badge {
      position: absolute !important;
      right: 4px !important;
      bottom: 4px !important;
      background: rgba(0, 0, 0, 0.65) !important;
      color: #FFFFFF !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      line-height: 1 !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      pointer-events: none !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
    }
    html.wecom-dark .wecom-msg-thumb {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
    }
    html.wecom-dark .wecom-msg-thumb:hover {
      border-color: rgba(38, 126, 240, 0.6) !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35) !important;
    }

    /* 图片排版尺寸设置行 */
    .wecom-menu-image-size-row {
      padding: 6px 8px 8px !important;
      margin: 2px 4px 4px !important;
      background: rgba(0, 0, 0, 0.025);
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      box-sizing: border-box !important;
      transition: opacity 0.15s ease !important;
    }
    html.wecom-dark .wecom-menu-image-size-row {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }
    .wecom-menu-size-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-size: 11px !important;
      color: var(--wc-text-3) !important;
      user-select: none !important;
    }
    .wecom-menu-size-val {
      font-weight: 600 !important;
      color: var(--wc-blue, #267EF0) !important;
      font-size: 11px !important;
    }
    .wecom-menu-size-chips {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      width: 100% !important;
    }
    .wecom-theme-menu .wecom-size-chip {
      flex: 1 1 0 !important;
      width: auto !important;
      min-width: 0 !important;
      height: 22px !important;
      line-height: 20px !important;
      padding: 0 !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      background: rgba(0, 0, 0, 0.03) !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      color: var(--wc-text-2) !important;
      cursor: pointer !important;
      text-align: center !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.12s ease !important;
      box-sizing: border-box !important;
      user-select: none !important;
    }
    .wecom-theme-menu .wecom-size-chip:hover {
      background: rgba(38, 126, 240, 0.1) !important;
      border-color: rgba(38, 126, 240, 0.4) !important;
      color: var(--wc-blue, #267EF0) !important;
    }
    .wecom-theme-menu .wecom-size-chip.is-active {
      background: var(--wc-blue, #267EF0) !important;
      border-color: var(--wc-blue, #267EF0) !important;
      color: #FFFFFF !important;
      font-weight: 600 !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-size-chip {
      background: rgba(255, 255, 255, 0.06) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #B2B8C2 !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-size-chip:hover {
      background: rgba(38, 126, 240, 0.2) !important;
      border-color: rgba(38, 126, 240, 0.6) !important;
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-size-chip.is-active {
      background: var(--wc-blue, #267EF0) !important;
      border-color: var(--wc-blue, #267EF0) !important;
      color: #FFFFFF !important;
    }

    /* 图片排版比例设置行 */
    .wecom-menu-image-aspect-row {
      padding: 6px 8px 8px !important;
      margin: 0 4px 4px !important;
      background: rgba(0, 0, 0, 0.025);
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      box-sizing: border-box !important;
      transition: opacity 0.15s ease !important;
    }
    html.wecom-dark .wecom-menu-image-aspect-row {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }
    .wecom-menu-aspect-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-size: 11px !important;
      color: var(--wc-text-3) !important;
      user-select: none !important;
    }
    .wecom-menu-aspect-val {
      font-weight: 600 !important;
      color: var(--wc-blue, #267EF0) !important;
      font-size: 11px !important;
    }
    .wecom-menu-aspect-chips {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      width: 100% !important;
    }
    .wecom-theme-menu .wecom-aspect-chip {
      flex: 1 1 0 !important;
      width: auto !important;
      min-width: 0 !important;
      height: 22px !important;
      line-height: 20px !important;
      padding: 0 !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      background: rgba(0, 0, 0, 0.03) !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      color: var(--wc-text-2) !important;
      cursor: pointer !important;
      text-align: center !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.12s ease !important;
      box-sizing: border-box !important;
      user-select: none !important;
    }
    .wecom-theme-menu .wecom-aspect-chip:hover {
      background: rgba(38, 126, 240, 0.1) !important;
      border-color: rgba(38, 126, 240, 0.4) !important;
      color: var(--wc-blue, #267EF0) !important;
    }
    .wecom-theme-menu .wecom-aspect-chip.is-active {
      background: var(--wc-blue, #267EF0) !important;
      border-color: var(--wc-blue, #267EF0) !important;
      color: #FFFFFF !important;
      font-weight: 600 !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-aspect-chip {
      background: rgba(255, 255, 255, 0.06) !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #B2B8C2 !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-aspect-chip:hover {
      background: rgba(38, 126, 240, 0.2) !important;
      border-color: rgba(38, 126, 240, 0.6) !important;
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-theme-menu .wecom-aspect-chip.is-active {
      background: var(--wc-blue, #267EF0) !important;
      border-color: var(--wc-blue, #267EF0) !important;
      color: #FFFFFF !important;
    }

    /* ---------- 气泡排版切换悬浮钮 ---------- */
    .wecom-bubble-layout-toggle {
      position: absolute !important;
      top: 6px !important;
      right: 8px !important;
      z-index: 10 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      height: 22px !important;
      padding: 0 8px !important;
      border-radius: 11px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      font-family: var(--wc-font) !important;
      line-height: 1 !important;
      color: #4E5359 !important;
      background: rgba(255, 255, 255, 0.94) !important;
      backdrop-filter: blur(4px) !important;
      border: 1px solid rgba(0, 0, 0, 0.12) !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
      cursor: pointer !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
      user-select: none !important;
    }
    .wecom-msg-bubble:hover .wecom-bubble-layout-toggle,
    .wecom-msg:hover .wecom-bubble-layout-toggle {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    .wecom-bubble-layout-toggle:hover {
      background: #FFFFFF !important;
      color: #267EF0 !important;
      border-color: rgba(38, 126, 240, 0.4) !important;
      box-shadow: 0 2px 8px rgba(38, 126, 240, 0.15) !important;
    }
    .wecom-bubble-layout-toggle.is-raw {
      color: #267EF0 !important;
      border-color: rgba(38, 126, 240, 0.3) !important;
    }
    .wecom-bubble-layout-toggle svg {
      width: 12px !important;
      height: 12px !important;
      flex-shrink: 0 !important;
    }
    .wecom-msg-me .wecom-bubble-layout-toggle {
      right: auto !important;
      left: 8px !important;
    }
    html.wecom-dark .wecom-bubble-layout-toggle {
      background: rgba(35, 37, 41, 0.94) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
      color: #C5C8CC !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35) !important;
    }
    html.wecom-dark .wecom-bubble-layout-toggle:hover {
      background: #2B2D31 !important;
      color: #3A8BFD !important;
      border-color: rgba(58, 139, 253, 0.5) !important;
    }
    html.wecom-dark .wecom-bubble-layout-toggle.is-raw {
      color: #3A8BFD !important;
      border-color: rgba(58, 139, 253, 0.4) !important;
    }

    /* ---------- 聊天图片预览 ---------- */
    html.wecom-image-viewer-open,
    html.wecom-image-viewer-open body { overflow: hidden !important; }
    .wecom-image-viewer,
    .wecom-image-viewer * { box-sizing: border-box; }
    .wecom-image-viewer[hidden] { display: none !important; }
    .wecom-image-viewer {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 18, 29, .88);
      backdrop-filter: blur(3px);
      font-family: var(--wc-font);
      user-select: none;
    }
    .wecom-image-viewer-stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      touch-action: none;
    }
    .wecom-image-viewer-image {
      display: block;
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 6px;
      object-fit: contain;
      box-shadow: 0 18px 60px rgba(0, 0, 0, .42);
      transform: translate3d(var(--wecom-image-viewer-x, 0px), var(--wecom-image-viewer-y, 0px), 0px) scale(var(--wecom-image-viewer-scale, 1));
      transform-origin: center center;
      transition: transform 100ms cubic-bezier(0.2, 0, 0.2, 1);
      user-select: none;
      -webkit-user-drag: none;
      will-change: transform;
      cursor: zoom-in;
    }
    .wecom-image-viewer-image.is-dragging {
      cursor: grabbing !important;
      transition: none !important;
    }
    .wecom-image-viewer-close {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 20;
      height: 40px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 0 14px;
      border: 1px solid rgba(255, 255, 255, .28);
      border-radius: 8px;
      background: rgba(255, 255, 255, .13);
      color: #FFFFFF;
      font: 13px var(--wc-font);
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 120ms ease;
    }
    .wecom-image-viewer-close:hover,
    .wecom-image-viewer-close:focus-visible {
      outline: none;
      background: rgba(255, 255, 255, .24);
    }
    .wecom-image-viewer-close b { font-size: 24px; font-weight: 300; line-height: 1; }
    .wecom-image-viewer-zoom {
      position: fixed;
      top: 20px;
      left: 24px;
      z-index: 20;
      height: 40px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 13px;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 8px;
      background: rgba(0, 0, 0, .28);
      color: rgba(255, 255, 255, .68);
      font-size: 12px;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }
    .wecom-image-viewer-zoom strong {
      min-width: 38px;
      color: #FFFFFF;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    .wecom-image-viewer-counter {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      border: 1px solid rgba(255, 255, 255, .18);
      border-radius: 20px;
      background: rgba(0, 0, 0, .38);
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5px;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }
    .wecom-image-viewer-counter[hidden] {
      display: none !important;
    }
    .wecom-image-viewer-nav {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      z-index: 20;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, .25);
      background: rgba(0, 0, 0, .38);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 180ms ease;
      user-select: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, .3);
    }
    .wecom-image-viewer-prev {
      left: 24px;
    }
    .wecom-image-viewer-next {
      right: 24px;
    }
    .wecom-image-viewer-nav:hover {
      background: rgba(255, 255, 255, .28);
      border-color: rgba(255, 255, 255, .6);
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, .45);
    }
    .wecom-image-viewer-nav:active {
      transform: translateY(-50%) scale(0.96);
    }
    .wecom-image-viewer-nav svg {
      width: 24px;
      height: 24px;
      display: block;
    }
    .wecom-image-viewer-nav[hidden] {
      display: none !important;
    }
    .wecom-image-viewer-caption {
      position: fixed;
      left: 24px;
      right: 24px;
      bottom: 18px;
      z-index: 20;
      overflow: hidden;
      color: rgba(255, 255, 255, .78);
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
      pointer-events: none;
    }

    /* ---------- splash ---------- */
    .${ROOT_CLASS} #d-splash { background: var(--wc-bg) !important; }
    .${ROOT_CLASS} #d-splash .preloader-image { display: none !important; }
    .${ROOT_CLASS} #d-splash .splash-logo-container {
      width: 96px !important; height: 96px !important;
      background-image: var(--wc-splash-logo) !important;
      background-size: contain !important;
      background-repeat: no-repeat !important;
      animation: none !important;
    }
    .${ROOT_CLASS} #d-splash .dots { background-color: #1A87FF !important; filter: none !important; }

    /* ---------- 窄屏降级 ---------- */
    @media (max-width: 1280px) {
      .${ROOT_CLASS} { --wc-list: 250px; }
    }
    @media (max-width: 1000px) {
      .${ROOT_CLASS} { --wc-nav2w: 0px !important; --wc-strip: 0px !important; }
      .wecom-strip { display: none; }
      .${ROOT_CLASS}.${LOCK_CLASS} .wecom-list-panel { width: calc(100% - var(--wc-nav)); left: var(--wc-nav); }
      .${ROOT_CLASS}.${LOCK_CLASS}.wecom-topic-open .wecom-list-panel { display: none; }
      .${ROOT_CLASS}.${LOCK_CLASS}:not(.wecom-topic-open) .wecom-chat-panel { display: none; }
      .${ROOT_CLASS}.${LOCK_CLASS} .wecom-chat-panel { left: var(--wc-nav); }
      .${ROOT_CLASS}.${LOCK_CLASS}.wecom-composing-new #reply-control { left: var(--wc-nav) !important; }
      .wecom-image-viewer-stage { inset: 0; }
      .wecom-image-viewer-close { top: 14px; right: 14px; }
      .wecom-image-viewer-zoom { top: 14px; left: 14px; }
      .wecom-image-viewer-counter { top: 14px; }
      .wecom-image-viewer-nav { width: 40px; height: 40px; }
      .wecom-image-viewer-prev { left: 12px; }
      .wecom-image-viewer-next { right: 12px; }
    }
  `;

  /* 企业微信经典桌面端视觉层。交互逻辑与 Discourse 数据层保持独立。 */
  const WECOM_REFINEMENTS = String.raw`
    .${ROOT_CLASS} {
      --wc-blue: #267EF0;
      --wc-blue-hover: #176BCE;
      --wc-blue-soft: #EAF3FF;
      --wc-blue-chip: #DCEBFF;
      --wc-title: #267EF0;
      --wc-accent: #267EF0;
      --wc-accent-soft: #EAF3FF;
      --wc-nav2-bg: #FFFFFF;
      --wc-nav2-border: #D9D9D9;
      --wc-text: #181818;
      --wc-text-2: #575757;
      --wc-text-3: #8B8B8B;
      --wc-text-4: #B2B2B2;
      --wc-bg: #FFFFFF;
      --wc-chat-bg: #F5F5F5;
      --wc-hover: #E7E7E7;
      --wc-active: #D8D8D8;
      --wc-bubble-other: #FFFFFF;
      --wc-bubble-me: #95EC69;
      --wc-border: #DEDEDE;
      --wc-border-strong: #CACACA;
      --wc-danger: #FA5151;
      --wc-rail-bg: #2B2D31;
      --wc-nav: ${RAIL_WIDTH}px;
      --wc-list: ${LIST_WIDTH}px;
      --wc-header-h: 0px;
      --wc-font: "Microsoft YaHei UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      --radius: 4px;
    }

    .wecom-titlebar { display: none !important; }

    /* 深色工作台 rail */
    .wecom-rail {
      top: 0;
      padding: 14px 0 8px;
      overflow: hidden;
      background: #2B2D31;
      border-right: 1px solid #202226;
    }
    .wecom-rail-head {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 0 0 8px;
    }
    .wecom-rail-head .me-chip {
      position: relative;
      width: 38px;
      height: 38px;
      flex: 0 0 auto;
    }
    .wecom-rail .wecom-rail-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #267EF0;
      box-shadow: none;
    }
    .wecom-rail .wecom-rail-avatar.is-notif-pinned {
      box-shadow: 0 0 0 2px #2B2D31, 0 0 0 4px #46C36F;
    }
    .wecom-rail .wecom-rail-avatar-badge {
      top: -7px;
      right: -9px;
      border: none !important;
      box-shadow: none !important;
    }
    .wecom-rail-org-chip {
      width: 32px;
      height: 32px;
      justify-content: center;
      margin: 0;
      padding: 0;
      border-radius: 5px;
      background: rgba(255, 255, 255, .08);
    }
    .wecom-rail-org-chip:hover { background: rgba(255, 255, 255, .14); }
    .wecom-rail-org-logo {
      width: 26px;
      height: 26px;
      border-radius: 4px;
      background: linear-gradient(145deg, #4294FF, #1769D2);
      font-size: 10px;
    }
    .wecom-rail-org-name,
    .wecom-rail-org-chip > svg { display: none; }
    .wecom-rail-items {
      gap: 2px;
      padding: 4px 5px;
      overflow-x: hidden;
    }
    .wecom-rail-item {
      height: 52px;
      flex: 0 0 52px;
      flex-direction: column;
      justify-content: center;
      gap: 3px;
      padding: 5px 2px;
      border-radius: 4px;
      color: #AEB2B9;
      font-size: 10px;
      line-height: 1.15;
      text-align: center;
    }
    .wecom-rail-item svg {
      width: 21px;
      height: 21px;
      color: #B9BDC4;
    }
    .wecom-rail-item:hover { background: rgba(255, 255, 255, .07); }
    .wecom-rail-item.active,
    .wecom-rail-more.is-on {
      color: #55CF7B;
      background: rgba(255, 255, 255, .08);
      box-shadow: none;
    }
    .wecom-rail-item.active svg,
    .wecom-rail-more.is-on svg { color: #55CF7B; }
    .wecom-rail-item.active::before {
      content: "";
      position: absolute;
      left: -5px;
      top: 14px;
      width: 3px;
      height: 24px;
      border-radius: 0 2px 2px 0;
      background: #55CF7B;
    }
    .wecom-rail-bottom { padding: 3px 5px 0; }
    .wecom-rail-badge {
      top: 2px;
      left: auto;
      right: 3px;
      border: none !important;
      box-shadow: none !important;
    }
    .wecom-rail-resizer { display: none !important; }

    /* 通知浮层从头像右侧展开 */
    .${ROOT_CLASS}.wecom-notif-open .user-menu.wecom-user-menu-float,
    .${ROOT_CLASS}.wecom-notif-open .user-menu.revamped.menu-panel.wecom-user-menu-float,
    .${ROOT_CLASS}.wecom-notif-open .user-menu.menu-panel.wecom-user-menu-float {
      left: 76px !important;
      top: 10px !important;
      border: 1px solid #E1E1E1 !important;
      border-radius: 6px !important;
      box-shadow: 0 10px 32px rgba(0, 0, 0, .2) !important;
    }

    /* 会话栏 */
    .wecom-list-panel {
      top: 0;
      background: #F2F2F2;
      border-right-color: #D5D5D5;
    }
    .wecom-list-search {
      height: 60px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 10px 8px;
      flex: 0 0 60px;
    }
    .wecom-list-search form {
      height: 30px;
      min-width: 0;
      flex: 1;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 9px;
      border-radius: 4px;
      background: #E2E2E2;
      color: #8B8B8B;
    }
    .wecom-list-search form:focus-within {
      background: #FFFFFF;
      box-shadow: inset 0 0 0 1px #AFCDF5;
    }
    .wecom-list-search svg { width: 15px; height: 15px; flex: 0 0 auto; }
    .wecom-list-search input {
      width: 100%;
      height: 100%;
      padding: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: #202020;
      font: 12px var(--wc-font);
    }
    .wecom-list-search input::placeholder { color: #8C8C8C; }
    .wecom-list-add {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: #DFDFDF;
      color: #555;
      cursor: pointer;
    }
    .wecom-list-add:hover { background: #D4D4D4; }
    .wecom-list-add svg { width: 17px; height: 17px; }
    .wecom-list-add-wrap {
      position: relative;
      flex: 0 0 auto;
    }
    .wecom-list-add-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: 152px;
      background: #FFFFFF;
      border: 1px solid var(--wc-border, rgba(0, 0, 0, 0.08));
      border-radius: 6px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
      padding: 4px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: wecom-fade-in 0.12s cubic-bezier(0, 0, 0.2, 1);
    }
    .wecom-list-add-menu[hidden] {
      display: none !important;
    }
    .wecom-list-add-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 32px;
      padding: 0 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--wc-text, #1F2329);
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      user-select: none;
      transition: background 0.1s ease, color 0.1s ease;
      box-sizing: border-box;
    }
    .wecom-list-add-item:hover {
      background: var(--wc-hover, #F0F2F5);
      color: var(--wc-primary, #1A87FF);
    }
    .wecom-list-add-item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: currentColor;
    }
    .wecom-list-add-item-icon svg {
      width: 16px;
      height: 16px;
      stroke: currentColor;
      stroke-width: 1.5;
      fill: none;
    }
    .wecom-list-add-item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .wecom-list-header {
      height: 40px;
      padding: 0 10px;
      border-bottom: 1px solid #E2E2E2;
    }
    .wecom-list-chips {
      gap: 16px;
      padding: 0;
      background: transparent;
      border-radius: 0;
    }
    .wecom-chip {
      position: relative;
      height: 39px;
      padding: 0 2px;
      border-radius: 0;
      color: #707070;
    }
    .wecom-chip.active {
      color: #191919;
      background: transparent;
      box-shadow: none;
    }
    .wecom-chip.active::after {
      content: "";
      position: absolute;
      left: 5px;
      right: 5px;
      bottom: 0;
      height: 2px;
      background: #267EF0;
    }
    .wecom-chip-icon { background: transparent; border-radius: 4px; }
    .wecom-chip-icon:hover { background: #E3E3E3; }
    .wecom-conv {
      min-height: 62px;
      gap: 10px;
      padding: 9px 11px;
    }
    .wecom-conv:hover { background: #E5E5E5; }
    .wecom-conv.active { background: #D5D5D5; }
    .wecom-conv-avatar {
      width: 42px;
      height: 42px;
      border-radius: 8px;
    }
    .wecom-conv-avatar.is-group,
    .wecom-conv-avatar.is-grid-mask { gap: 1px; padding: 1px; background: #FFFFFF; }
    .wecom-conv-info { justify-content: center; gap: 5px; }
    .wecom-conv-name { font-size: 13px; font-weight: 400; }
    .wecom-conv-msg,
    .wecom-conv-time { font-size: 11px; }
    .wecom-conv-tag {
      color: #267EF0;
      background: #E8F2FF;
      border-color: #BDD8FA;
    }

    /* 聊天区 */
    .wecom-chat-panel { top: 0; background: #F5F5F5; }
    .wecom-chat-header {
      height: 62px;
      padding: 0 22px;
      background: #F5F5F5;
      border-bottom-color: #E2E2E2;
    }
    .wecom-chat-title { font-size: 15px; font-weight: 500; }
    .wecom-chat-sub { color: #999; }
    .wecom-chat-avatar { border-radius: 8px; }
    .wecom-chat-body { padding: 22px 30px; gap: 18px; }
    .wecom-msg { max-width: min(76%, 820px); gap: 11px; }
    .wecom-msg-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
    }
    .wecom-msg-name { margin-bottom: 5px; color: #999; }
    .wecom-msg-bubble {
      position: relative;
      padding: 9px 12px;
      border-radius: 8px !important;
      font-size: 14px;
      line-height: 1.62;
      box-shadow: none !important;
    }
    .wecom-msg-other .wecom-msg-bubble::before,
    .wecom-msg-me .wecom-msg-bubble::before {
      content: "";
      position: absolute;
      top: 12px;
      width: 0;
      height: 0;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }
    .wecom-msg-other .wecom-msg-bubble::before {
      left: -7px;
      border-right: 8px solid #FFFFFF;
    }
    .wecom-msg-me .wecom-msg-bubble::before {
      right: -7px;
      border-left: 8px solid #95EC69;
    }
    .wecom-msg-bubble blockquote {
      border-left-color: #267EF0;
      background: rgba(38, 126, 240, .06);
    }
    .wecom-msg-meta { color: #AAA; }
    .wecom-msg-tools { border-radius: 4px; }

    /* 企业微信底部编辑区已统一在 WECOM_LATEST_REFINEMENTS 规范管理 */
    .wecom-mode-fab {
      background: #267EF0;
      border-radius: 6px;
      box-shadow: 0 5px 18px rgba(38, 126, 240, .32);
    }
    .${ROOT_CLASS} #d-splash .dots { background-color: #267EF0 !important; }

    @media (max-width: 1280px) {
      .${ROOT_CLASS} { --wc-list: 280px; }
    }
    @media (max-width: 1000px) {
      .${ROOT_CLASS}.${LOCK_CLASS} .wecom-chat-panel { left: var(--wc-nav); }
      .${ROOT_CLASS}.${LOCK_CLASS}.wecom-composing-new #reply-control { left: var(--wc-nav) !important; }
    }
  `;

  /* 企业微信 PC 客户端视觉规范 (基准像素对齐 media_1789091792061.png) */
  const WECOM_LATEST_REFINEMENTS = String.raw`
    /* 线性图标统一 1px 极细线条规范 */
    svg[fill="none"],
    svg[stroke],
    svg path[stroke],
    .wecom-composer-tools .wecom-icon-btn svg,
    .wecom-chat-tools .wecom-icon-btn svg,
    .wecom-chat-actions .wecom-icon-btn svg,
    .wecom-list-search form svg,
    .wecom-list-add-btn svg,
    .wecom-member-actions .wecom-icon-btn svg,
    .wecom-arrow-icon svg,
    .wecom-tool-quick-meet svg,
    .wecom-msg-tool svg {
      stroke-width: 1px !important;
    }

    .${ROOT_CLASS} {
      /* 核心品牌色系（像素级采样自 media_1789091792061.png） */
      --wc-blue: #267EF0;              /* 企微经典高亮蓝 (采样自 dock 激活态 #267EF0) */
      --wc-blue-hover: #1E6FFF;
      --wc-blue-soft: #CCE0FA;         /* 企微激活项浅蓝底色 (采样自 dock 选中底色 #CCE0FA) */
      --wc-list-active: #3D8AF5;       /* 会话列表选中项纯蓝底色 (采样自 list_crop.png #3D8AF5) */
      --wc-accent: #267EF0;
      --wc-accent-soft: #CCE0FA;
      --wc-text: #1F2329;              /* 主要正文深灰近黑 */
      --wc-text-2: #585C60;            /* 工具栏与副文本 Charcoal Slate (采样自 toolbar #585C60) */
      --wc-text-3: #8F959E;            /* 时间戳/灰色说明/未选中标签 */
      --wc-text-4: #C5C9CF;
      --wc-rail-bg: #E1EBF5;           /* 最左侧停靠栏背景色，微蓝冷灰 (采样自 dock_crop.png) */
      --wc-rail-border: #CFDAE6;
      --wc-rail-icon: #7C8B9D;         /* 停靠栏未选中图标与文字颜色 #7C8B9D */
      --wc-rail-active-bg: #CCE0FA;    /* 停靠栏选中背景，浅蓝圆角块 */
      --wc-list-bg: #EBF0F5;           /* 会话列表背景 (采样自 list_crop.png #EBF0F5) */
      --wc-list-border: #D9DFE5;
      --wc-chat-bg: #F5F7FA;           /* 聊天区域背景 (采样自 chat_crop.png #F5F7FA) */
      --wc-composer-bg: #FFFFFF;
      --wc-hover: rgba(0, 0, 0, 0.05);
      
      /* 会话气泡规范（严格匹配微信生态与截图标准） */
      --wc-bubble-other: #E4E7EB;      /* 对方气泡：精确采样自截图 bubble2_crop.png #E4E7EB */
      --wc-bubble-other-text: #1F2329; /* 对方文字颜色 */
      --wc-bubble-me: #95EC69;         /* 自己气泡：企微与微信标准经典绿 #95EC69 */
      --wc-bubble-me-text: #1F2329;    /* 自己文字颜色 */
      
      --wc-border: #E5E8EC;
      --wc-border-strong: #D0D5DD;
      --wc-nav: ${RAIL_WIDTH}px;
      --wc-list: ${LIST_WIDTH}px;
      --wc-members: ${MEMBER_WIDTH}px;
      --wc-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
    }

    /* 保证布局根节点三栏固定定位 */
    html.${ROOT_CLASS} body {
      overflow: hidden !important;
      font-family: var(--wc-font);
      background: var(--wc-chat-bg);
      color: var(--wc-text);
    }

    /* 1. 最左侧 56px 垂直停靠栏 */
    .wecom-rail {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--wc-nav) !important;
      min-width: var(--wc-nav) !important;
      max-width: var(--wc-nav) !important;
      height: 100vh;
      background: var(--wc-rail-bg) !important;
      border-right: 1px solid var(--wc-rail-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0 10px 0;
      box-sizing: border-box;
      z-index: 1000;
      user-select: none;
    }

    .wecom-rail-head {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 6px;
      width: 100%;
    }
    .wecom-rail-head .me-chip {
      position: relative;
      width: 34px;
      height: 34px;
      cursor: pointer;
    }
    /* 截图特征：头像为圆角正方形，而非圆形 */
    .wecom-rail .wecom-rail-avatar {
      width: 34px !important;
      height: 34px !important;
      border-radius: 8px !important;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-size: 13px;
      font-weight: 600;
      color: #fff;
    }
    .wecom-rail .wecom-rail-avatar img,
    .wecom-rail .wecom-rail-avatar svg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px !important;
      display: block;
      pointer-events: none;
    }
    .wecom-rail-avatar-status {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2BA245;
      border: 1.5px solid var(--wc-rail-bg);
    }
    .wecom-rail-avatar-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #FA5151;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 600;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 8px;
      border: none !important;
      box-shadow: none !important;
      min-width: 12px;
      text-align: center;
    }

    /* 停靠栏按钮列表 */
    .wecom-rail-items {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      width: 100%;
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none;
      padding: 0 4px;
      box-sizing: border-box;
    }
    .wecom-rail-items::-webkit-scrollbar { display: none; }

    .wecom-rail-item {
      width: 46px;
      height: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 0;
      margin: 0 auto;
      border: none;
      border-radius: 6px !important;
      background: transparent;
      color: var(--wc-rail-icon) !important; /* #7C8B9D */
      cursor: pointer;
      position: relative;
      transition: background 0.1s ease, color 0.1s ease;
      outline: none;
    }
    .wecom-rail-item:hover {
      background: rgba(0, 0, 0, 0.04);
      color: var(--wc-blue) !important;
    }
    .wecom-rail-item:hover .wecom-rail-label,
    .wecom-rail-item:hover .wecom-rail-icon svg {
      color: var(--wc-blue) !important;
      fill: var(--wc-blue) !important;
    }
    /* 激活项：浅蓝圆角底色 + 企微高亮蓝 */
    .wecom-rail-item.active,
    .wecom-rail-item.is-on {
      background: var(--wc-rail-active-bg) !important; /* #CCE0FA */
      color: var(--wc-blue) !important; /* #267EF0 */
    }
    .wecom-rail-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* 填充型 SVG 图标规范：必须 fill: currentColor，去掉 stroke */
    .wecom-rail-icon svg {
      width: 22px;
      height: 22px;
      fill: var(--wc-rail-icon) !important; /* #7C8B9D */
      stroke: none !important;
      transition: transform 0.2s ease;
    }
    .wecom-rail-icon.wecom-refreshing svg {
      animation: wecom-icon-bounce 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes wecom-icon-bounce {
      0% { transform: scale(1); }
      35% { transform: scale(0.8); }
      70% { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    .wecom-rail-item.active .wecom-rail-icon svg,
    .wecom-rail-item.is-on .wecom-rail-icon svg {
      fill: var(--wc-blue) !important;
    }
    .wecom-rail-label {
      font-size: 11px !important;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      color: var(--wc-rail-icon) !important; /* #7C8B9D */
    }
    .wecom-rail-item.active .wecom-rail-label,
    .wecom-rail-item.is-on .wecom-rail-label {
      color: var(--wc-blue) !important;
      font-weight: 500;
    }
    .wecom-rail-badge {
      position: absolute;
      top: 2px;
      right: 4px;
      background: #FA5151;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      height: 14px;
      line-height: 14px;
      padding: 0 4px;
      border-radius: 7px;
      border: none !important;
      box-shadow: none !important;
      text-align: center;
      min-width: 14px;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 2;
    }
    .wecom-rail-dot {
      position: absolute;
      top: 4px;
      right: 8px;
      width: 6px;
      height: 6px;
      background: #FA5151;
      border-radius: 50%;
      border: none !important;
      box-shadow: none !important;
    }

    /* 停靠栏底部控制 */
    .wecom-rail-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      width: 100%;
      padding-top: 6px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      flex: 0 0 auto;
    }
    .wecom-theme-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      width: 100%;
    }
    .wecom-theme-controls .wecom-rail-item {
      color: var(--wc-rail-icon) !important;
    }
    .wecom-theme-controls .wecom-rail-item svg {
      fill: currentColor !important;
      stroke: none !important;
    }

    /* 外观模式下拉菜单 */
    .wecom-theme-menu {
      position: fixed;
      left: calc(var(--wc-nav) + 8px);
      bottom: 12px;
      background: var(--wc-card-bg, #FFFFFF);
      border: 1px solid var(--wc-border);
      box-shadow: 0 6px 18px rgba(0,0,0,0.12);
      border-radius: 8px;
      padding: 6px;
      z-index: 10000;
      width: 220px; max-height: calc(100vh - 24px); overflow-y: auto;
    }
    .wecom-theme-menu-title {
      font-size: 11px;
      color: var(--wc-text-3);
      padding: 4px 8px;
    }
    .wecom-theme-menu button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: none;
      background: transparent;
      border-radius: 5px;
      font-size: 12px;
      color: var(--wc-text);
      cursor: pointer;
      text-align: left;
    }
    .wecom-theme-menu button:hover {
      background: var(--wc-blue-soft);
      color: var(--wc-blue);
    }
    .wecom-theme-menu button svg {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }
    .wecom-theme-menu button svg:not([fill="none"]) {
      fill: currentColor;
    }
    html.wecom-dark .wecom-theme-menu {
      background: #2B2F36;
      border-color: rgba(255, 255, 255, 0.12);
      color: #E4E7EB;
    }

    /* 2. 中间会话列表栏 280px (支持拖拽调宽) */
    .wecom-list-panel {
      position: fixed;
      top: 0;
      left: calc(var(--wc-nav) + var(--wc-nav2w)) !important;
      bottom: 0;
      width: var(--wc-list) !important;
      min-width: var(--wc-list) !important;
      max-width: var(--wc-list) !important;
      height: 100vh;
      background: var(--wc-list-bg) !important;
      border-right: 1px solid var(--wc-list-border);
      display: flex;
      flex-direction: column;
      z-index: 200 !important;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* 会话列表栏右边缘拖拽调整宽度柄 (z-index 1000 保证悬浮最上层，方便抓取) */
    .wecom-list-resizer {
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      height: 100vh !important;
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-list) - 4px) !important;
      width: 8px !important;
      cursor: col-resize !important;
      z-index: 1000 !important;
      touch-action: none !important;
      background: transparent !important;
      transition: background 0.15s ease !important;
    }
    .wecom-list-resizer:hover,
    .wecom-list-resizer.dragging {
      background: rgba(38, 126, 240, 0.45) !important;
    }
    body.wecom-resizing-list,
    body.wecom-resizing-list * {
      cursor: col-resize !important;
      user-select: none !important;
    }

    /* 搜索栏：高度 52px 与右侧聊天顶栏 52px 绝对对齐 */
    .wecom-list-search {
      height: 52px !important;
      max-height: 52px !important;
      min-height: 52px !important;
      padding: 10px 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      flex: 0 0 52px !important;
      box-sizing: border-box !important;
      background: var(--wc-list-bg) !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04) !important;
    }
    /* 搜索框：灰底圆角输入框，覆盖 Discourse 全局样式 */
    .wecom-list-search form {
      flex: 1 !important;
      height: 32px !important;
      min-height: 32px !important;
      max-height: 32px !important;
      background: #E2E5EB !important;
      background-color: #E2E5EB !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      padding: 0 8px !important;
      border: 1px solid transparent !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      gap: 6px !important;
    }
    .wecom-list-search form:focus-within {
      background: #E2E5EB !important;
      background-color: #E2E5EB !important;
      border-color: #BDC4CE !important;
      box-shadow: none !important;
    }
    .wecom-list-search form svg {
      width: 14px !important;
      height: 14px !important;
      stroke: #7D8693 !important;
      stroke-width: 1px !important;
      fill: none !important;
      flex: 0 0 14px !important;
      margin: 0 !important;
    }
    .wecom-list-search input,
    .wecom-list-search input[type="search"],
    .wecom-list-search input[type="text"] {
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      background-color: transparent !important;
      box-shadow: none !important;
      font-size: 13px !important;
      color: var(--wc-text) !important;
      line-height: 32px !important;
      -webkit-appearance: none !important;
    }
    .wecom-list-search input::placeholder {
      color: #9CA3AF !important;
      font-size: 13px !important;
    }
    /* 搜索右侧加号操作按钮 */
    .wecom-list-add-btn {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      flex: 0 0 32px !important;
      border-radius: 4px !important;
      border: none !important;
      background: #E2E5EB !important;
      background-color: #E2E5EB !important;
      color: #646A73 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      transition: background 0.1s ease, color 0.1s ease;
    }
    .wecom-list-add-btn:hover {
      background: #D5DAE2 !important;
      color: var(--wc-text) !important;
    }
    .wecom-list-add-btn svg {
      width: 16px !important;
      height: 16px !important;
      stroke: currentColor !important;
      stroke-width: 1px !important;
      fill: none !important;
    }

    /* 隐藏冗余筛选项占位栏，使搜索框直接连接会话列表 */
    .wecom-list-header {
      display: none !important;
    }

    .wecom-list-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 0 !important;
      box-sizing: border-box;
      scrollbar-width: thin;
    }
    /* 统一高精度企微自动隐藏滚动条：平时透明隐藏，移入面板或滚动时柔和显现，与详情框完全一致 */
    .wecom-list-body,
    .wecom-chat-body,
    .wecom-chat-messages,
    .wecom-member-body {
      scrollbar-width: thin !important;
      scrollbar-color: transparent transparent !important;
    }
    .wecom-list-body::-webkit-scrollbar,
    .wecom-chat-body::-webkit-scrollbar,
    .wecom-chat-messages::-webkit-scrollbar,
    .wecom-member-body::-webkit-scrollbar {
      width: 6px !important;
      height: 6px !important;
    }
    .wecom-list-body::-webkit-scrollbar-track,
    .wecom-chat-body::-webkit-scrollbar-track,
    .wecom-chat-messages::-webkit-scrollbar-track,
    .wecom-member-body::-webkit-scrollbar-track {
      background: transparent !important;
    }
    .wecom-list-body::-webkit-scrollbar-thumb,
    .wecom-chat-body::-webkit-scrollbar-thumb,
    .wecom-chat-messages::-webkit-scrollbar-thumb,
    .wecom-member-body::-webkit-scrollbar-thumb {
      background: transparent !important;
      border-radius: 3px !important;
      transition: background-color 0.2s ease-in-out !important;
    }
    .wecom-list-panel:hover .wecom-list-body::-webkit-scrollbar-thumb,
    .wecom-list-body:hover::-webkit-scrollbar-thumb,
    .wecom-list-body.is-scrolling::-webkit-scrollbar-thumb,
    .wecom-chat-panel:hover .wecom-chat-body::-webkit-scrollbar-thumb,
    .wecom-chat-body:hover::-webkit-scrollbar-thumb,
    .wecom-chat-body.is-scrolling::-webkit-scrollbar-thumb,
    .wecom-member-panel:hover .wecom-member-body::-webkit-scrollbar-thumb,
    .wecom-member-body:hover::-webkit-scrollbar-thumb,
    .wecom-member-body.is-scrolling::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2) !important;
    }
    .wecom-list-body::-webkit-scrollbar-thumb:hover,
    .wecom-chat-body::-webkit-scrollbar-thumb:hover,
    .wecom-chat-messages::-webkit-scrollbar-thumb:hover,
    .wecom-member-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.35) !important;
    }
    .wecom-list-panel:hover .wecom-list-body,
    .wecom-list-body:hover,
    .wecom-list-body.is-scrolling,
    .wecom-chat-panel:hover .wecom-chat-body,
    .wecom-chat-body:hover,
    .wecom-chat-body.is-scrolling,
    .wecom-member-panel:hover .wecom-member-body,
    .wecom-member-body:hover,
    .wecom-member-body.is-scrolling {
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent !important;
    }

    /* 会话项规范（截图特征：卡片带有左右留白和圆角，无下划线） */
    .wecom-conv {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 2px 8px !important;
      padding: 9px 10px !important;
      border-radius: 6px !important;
      border-bottom: none !important;
      cursor: pointer;
      text-decoration: none !important;
      position: relative;
      transition: background 0.1s ease;
      color: var(--wc-text);
      box-sizing: border-box;
      background: transparent;
    }
    .wecom-conv:hover {
      background: rgba(0, 0, 0, 0.04) !important;
    }
    .wecom-conv.is-pinned {
      background: rgba(0, 0, 0, 0.02) !important;
    }
    .wecom-conv.is-pinned:hover {
      background: rgba(0, 0, 0, 0.05) !important;
    }
    /* 核心：高亮选中态 (纯蓝卡片 #3D8AF5 + 纯白文字) */
    .wecom-conv.active {
      background: var(--wc-list-active) !important; /* #3D8AF5 */
      color: #FFFFFF !important;
      border-radius: 6px !important;
    }
    .wecom-conv.active .wecom-conv-name {
      color: #FFFFFF !important;
      font-weight: 500;
    }
    .wecom-conv.active .wecom-conv-msg {
      color: rgba(255, 255, 255, 0.82) !important;
    }
    .wecom-conv.active .wecom-conv-time {
      color: rgba(255, 255, 255, 0.72) !important;
    }
    .wecom-conv.active .wecom-conv-pin svg {
      fill: rgba(255, 255, 255, 0.8) !important;
    }
    .wecom-conv.active .wecom-conv-tag {
      border: none !important;
      color: #FFFFFF !important;
      background: rgba(255, 255, 255, 0.22) !important;
    }

    /* 会话头像 */
    .wecom-conv-avatar {
      width: 40px;
      height: 40px;
      border-radius: 8px !important;
      flex: 0 0 40px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #DFE3E8;
    }
    .wecom-conv-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px !important;
    }
    .wecom-conv-avatar.is-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 1px;
      padding: 1px;
      background: #E5E8EC;
      box-sizing: border-box;
    }
    .wecom-conv-avatar.is-group img,
    .wecom-conv-avatar.is-group span {
      width: 100%;
      height: 100%;
      border-radius: 2px !important;
      object-fit: cover;
    }

    .wecom-conv-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .wecom-conv-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
    }
    .wecom-conv-title {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }
    .wecom-conv-name {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--wc-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.3;
    }
    .wecom-conv-tag {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 2px;
      line-height: 1.1;
      white-space: nowrap;
      flex-shrink: 0;
      font-weight: normal;
    }
    .wecom-conv-tag.is-dept {
      background: #E8F3FF !important;
      color: #1E6FFF !important;
      border: 1px solid rgba(30, 111, 255, 0.25) !important;
    }
    .wecom-conv-tag.is-ext {
      background: #E8F8EE !important;
      color: #07C160 !important;
      border: 1px solid rgba(7, 193, 96, 0.25) !important;
    }
    .wecom-conv-time {
      font-size: 11px;
      color: var(--wc-text-3);
      flex-shrink: 0;
      white-space: nowrap;
    }
    .wecom-conv-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .wecom-conv-msg {
      font-size: 12px;
      color: var(--wc-text-3);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
      line-height: 1.3;
    }
    .wecom-conv-icons {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .wecom-conv-pin svg {
      width: 12px;
      height: 12px;
      fill: var(--wc-text-3);
    }
    .wecom-conv-badge {
      background: #FA5151;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
      height: 14px;
      line-height: 14px;
      padding: 0 4px;
      border-radius: 7px;
      min-width: 14px;
      text-align: center;
      box-sizing: border-box;
    }

    /* 3. 右侧主聊天面板 */
    .wecom-chat-panel {
      position: fixed;
      top: 0;
      left: calc(var(--wc-nav) + var(--wc-nav2w) + var(--wc-list)) !important;
      right: 0;
      bottom: 0;
      height: 100vh;
      background: var(--wc-chat-bg) !important; /* #F5F7FA */
      display: flex;
      flex-direction: column;
      z-index: 100 !important;
      box-sizing: border-box;
      overflow: hidden;
    }
    html.${ROOT_CLASS}.wecom-members-open .wecom-chat-panel {
      right: var(--wc-members);
    }

    /* 聊天窗口顶栏 52px */
    .wecom-chat-head {
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
      padding: 0 16px !important;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: var(--wc-chat-bg) !important;
      box-sizing: border-box;
      user-select: none;
      flex: 0 0 52px !important;
    }
    .wecom-chat-title-wrap {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }
    .wecom-chat-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--wc-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }
    .wecom-chat-count {
      font-size: 12px;
      color: var(--wc-text-3);
      flex-shrink: 0;
    }
    .wecom-chat-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .wecom-chat-actions .wecom-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: #646A73;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .wecom-chat-actions .wecom-icon-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--wc-text);
    }
    .wecom-chat-actions .wecom-icon-btn svg {
      width: 17px;
      height: 17px;
      stroke: currentColor;
    }

    /* 窗口右上角三键 (最小化、最大化、切换原生视图/关闭) 像素级精致设计 */
    .wecom-win-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      border-left: 1px solid rgba(0, 0, 0, 0.08);
      padding-left: 8px;
      height: 28px;
      flex-shrink: 0;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-win-controls {
      border-left-color: rgba(255, 255, 255, 0.12);
    }
    .wecom-win-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--wc-text-3, #7A8599);
      cursor: pointer;
      border-radius: 4px;
      padding: 0;
      margin: 0;
      transition: background 0.15s ease, color 0.15s ease;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .wecom-win-btn svg {
      width: 12px;
      height: 12px;
      display: block;
      stroke: currentColor;
      stroke-width: 1.1px !important;
      fill: none;
      pointer-events: none;
    }
    .wecom-win-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--wc-text, #1F2329);
    }
    .wecom-win-btn:active {
      background: rgba(0, 0, 0, 0.12);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-win-btn {
      color: #8C9AB0;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-win-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #E0E6F0;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-win-btn:active {
      background: rgba(255, 255, 255, 0.15);
    }
    /* 关闭/切换原生视图按钮 hover 变为红底白字 */
    .wecom-win-btn.wecom-win-close:hover,
    .wecom-win-close:hover {
      background: #FA5151 !important;
      color: #FFFFFF !important;
    }
    .wecom-win-btn.wecom-win-close:hover svg,
    .wecom-win-close:hover svg {
      stroke: #FFFFFF !important;
    }
    .wecom-win-btn.wecom-win-close:active,
    .wecom-win-close:active {
      background: #D93B3B !important;
      color: #FFFFFF !important;
    }
    .wecom-chat-scroll-top:hover {
      color: var(--wc-blue, #267EF0) !important;
    }

    /* 顶栏右上角社区平台切换器 (Linux DO ⇄ V2EX) - 极简低调图标模式 */
    .wecom-platform-switcher {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .wecom-platform-switcher .wecom-platform-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--wc-icon, #585C60);
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
      box-sizing: border-box;
    }
    .wecom-platform-switcher .wecom-platform-btn:hover {
      color: var(--wc-blue, #267EF0);
      background: var(--wc-hover, rgba(0, 0, 0, 0.05));
    }
    .wecom-platform-switcher.is-open .wecom-platform-btn {
      color: var(--wc-blue, #267EF0);
      background: rgba(38, 126, 240, 0.12);
    }
    .wecom-platform-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 220px;
      background: var(--wc-surface-0, #FFFFFF);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.08);
      padding: 6px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-sizing: border-box;
    }
    .wecom-platform-dropdown[hidden] {
      display: none !important;
    }
    .wecom-platform-dropdown-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--wc-text-3, #8F959E);
      padding: 6px 10px 4px 10px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      margin-bottom: 4px;
    }
    .wecom-platform-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
      user-select: none;
    }
    .wecom-platform-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }
    .wecom-platform-item.is-active {
      background: rgba(38, 126, 240, 0.08);
    }
    .wecom-platform-item-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    .wecom-platform-item-info {
      flex: 1;
      min-width: 0;
    }
    .wecom-platform-item-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--wc-text, #1F2329);
      line-height: 1.3;
    }
    .wecom-platform-item.is-active .wecom-platform-item-name {
      color: var(--wc-blue, #267EF0);
    }
    .wecom-platform-item-desc {
      font-size: 11px;
      color: var(--wc-text-3, #8F959E);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .wecom-platform-item-check {
      font-size: 14px;
      font-weight: 700;
      color: var(--wc-blue, #267EF0);
      flex-shrink: 0;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-switcher .wecom-platform-btn {
      color: #A4B1C2;
      background: transparent;
      border: none;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-switcher .wecom-platform-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #5BA2FF;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-switcher.is-open .wecom-platform-btn {
      background: rgba(38, 126, 240, 0.22);
      color: #5BA2FF;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-dropdown {
      background: #23272E;
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-dropdown-title {
      color: #7D8899;
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-item.is-active {
      background: rgba(38, 126, 240, 0.22);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-item-name {
      color: #E6EDF5;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-item.is-active .wecom-platform-item-name {
      color: #5BA2FF;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-platform-item-desc {
      color: #8C99AA;
    }

    /* 背景水印设置浮层卡片 (企业微信原生规范) */
    .wecom-watermark-panel {
      position: absolute;
      top: 56px;
      right: 16px;
      width: 300px;
      background: var(--wc-surface-0, #FFFFFF);
      border-radius: 8px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.08);
      padding: 16px;
      z-index: 500;
      box-sizing: border-box;
      font-family: var(--wc-font);
      animation: wecom-popover-in 0.15s ease-out;
    }
    .wecom-watermark-panel[hidden] {
      display: none !important;
    }
    .wecom-watermark-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .wecom-watermark-head strong {
      font-size: 14px;
      font-weight: 600;
      color: var(--wc-text, #1F2329);
    }
    .wecom-watermark-close {
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--wc-text-3, #8F959E);
      font-size: 18px;
      line-height: 1;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .wecom-watermark-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--wc-text, #1F2329);
    }
    .wecom-watermark-switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      cursor: pointer;
      user-select: none;
      font-size: 13px;
      color: var(--wc-text, #1F2329);
    }
    .wecom-watermark-switch {
      position: relative;
      width: 36px;
      height: 20px;
      display: inline-block;
    }
    .wecom-watermark-switch input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    .wecom-watermark-switch i {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: #D8D8D8;
      border-radius: 20px;
      transition: background 0.2s ease;
    }
    .wecom-watermark-switch i::before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background: #FFFFFF;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    .wecom-watermark-switch input:checked + i {
      background: var(--wc-blue, #267EF0);
    }
    .wecom-watermark-switch input:checked + i::before {
      transform: translateX(16px);
    }
    .wecom-watermark-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }
    .wecom-watermark-field span {
      font-size: 12px;
      color: var(--wc-text-2, #585C60);
      font-weight: 500;
    }
    .wecom-watermark-text {
      height: 32px;
      padding: 0 10px;
      border: 1px solid var(--wc-border, #E6E7E8);
      border-radius: 4px;
      font-size: 13px;
      color: var(--wc-text, #1F2329);
      background: var(--wc-surface-0, #FFFFFF);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .wecom-watermark-text:focus {
      border-color: var(--wc-blue, #267EF0);
      box-shadow: 0 0 0 2px rgba(38, 126, 240, 0.15);
    }
    .wecom-watermark-hint {
      font-size: 11px;
      color: var(--wc-text-3, #8F959E);
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .wecom-watermark-error {
      font-size: 11px;
      color: #FA5151;
      min-height: 14px;
      margin-bottom: 8px;
    }
    .wecom-watermark-error:empty {
      display: none;
    }
    .wecom-watermark-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
    .wecom-watermark-cancel {
      height: 28px;
      padding: 0 14px;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      background: transparent;
      color: var(--wc-text, #1F2329);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .wecom-watermark-cancel:hover {
      background: rgba(0, 0, 0, 0.04);
    }
    .wecom-watermark-save {
      height: 28px;
      padding: 0 16px;
      border-radius: 4px;
      border: none;
      background: var(--wc-blue, #267EF0);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .wecom-watermark-save:hover {
      background: #1F6FD9;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-panel {
      background: #23272E;
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-head strong {
      color: #E6EDF5;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-close {
      color: #8C99AA;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-switch-row {
      color: #E6EDF5;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-switch i {
      background: #4A5260;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-switch input:checked + i {
      background: #3D8AF5;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-field span {
      color: #A4B1C2;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-text {
      background: #1A1D23;
      border-color: rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-text:focus {
      border-color: #3D8AF5;
      box-shadow: 0 0 0 2px rgba(61, 138, 245, 0.25);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-hint {
      color: #7D8899;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-cancel {
      border-color: rgba(255, 255, 255, 0.15);
      color: #DCE3EE;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-cancel:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-save {
      background: #3D8AF5;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-watermark-save:hover {
      background: #2B7CE6;
    }

    /* 消息流主体 */
    .wecom-chat-messages {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 20px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--wc-chat-bg);
      box-sizing: border-box;
      scrollbar-width: thin;
    }
    /* 详情框滚动条已统一由上方规范管理 */

    /* 时间分隔符 */
    .wecom-msg-time-sep {
      align-self: center;
      font-size: 11px;
      color: #8F959E;
      background: transparent;
      padding: 2px 8px;
      border-radius: 4px;
      margin: 6px 0;
      user-select: none;
    }

    /* 单条消息包裹 */
    .wecom-msg {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 82%;
      position: relative;
    }
    .wecom-msg-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px !important;
      flex: 0 0 34px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }
    .wecom-msg-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px !important;
    }
    .wecom-msg-content {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .wecom-msg-name {
      font-size: 12px !important;
      color: var(--wc-text-3) !important;
      margin-bottom: 4px !important;
      margin-left: 1px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .wecom-msg-name .wecom-name-ext {
      color: #07C160 !important;
      font-size: 12px !important;
      font-weight: 500;
    }


    /* 引用与回复样式（完全对齐企微规范：透明背景、细竖线、作者低对比度、无白色高亮） */
    .wecom-msg-bubble .wecom-reply-reference,
    .wecom-msg-bubble aside.quote,
    .wecom-msg-bubble blockquote,
    .cooked aside.quote,
    aside.quote {
      display: block !important;
      margin: 0 0 8px 0 !important;
      padding: 0 0 0 8px !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      border-left: 2px solid rgba(0, 0, 0, 0.18) !important;
      border-radius: 0 !important;
      text-decoration: none !important;
      cursor: pointer !important;
      box-shadow: none !important;
      text-align: left !important;
    }
    .wecom-msg-bubble .wecom-reply-reference:hover {
      background: transparent !important;
    }
    .wecom-msg-me .wecom-msg-bubble .wecom-reply-reference,
    .wecom-msg-me .wecom-msg-bubble aside.quote,
    .wecom-msg-me .wecom-msg-bubble blockquote {
      border-left-color: rgba(0, 0, 0, 0.22) !important;
    }
    .wecom-msg-bubble .wecom-reply-author,
    .wecom-msg-bubble aside.quote .title,
    .cooked aside.quote .title,
    aside.quote .title {
      font-size: 12px !important;
      font-weight: 600 !important;
      color: #767C85 !important;
      line-height: 1.4 !important;
      margin: 0 0 3px 0 !important;
      padding: 0 !important;
      display: block !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      border-left: none !important;
      box-shadow: none !important;
      outline: none !important;
      user-select: text !important;
    }
    .wecom-msg-bubble aside.quote .title a,
    .wecom-msg-bubble aside.quote .title a:visited,
    .cooked aside.quote .title a,
    .cooked aside.quote .title a:visited,
    aside.quote .title a,
    aside.quote .title a:visited {
      color: inherit !important;
      text-decoration: none !important;
      font-weight: 600 !important;
    }
    .wecom-msg-bubble aside.quote .title a:hover,
    .cooked aside.quote .title a:hover,
    aside.quote .title a:hover {
      text-decoration: underline !important;
      color: var(--wc-accent, #267EF0) !important;
    }
    .wecom-msg-bubble aside.quote .title img,
    .wecom-msg-bubble aside.quote .title .quote-controls,
    .wecom-msg-bubble aside.quote .title .back,
    .wecom-msg-bubble aside.quote .title .quote-toggle,
    aside.quote .title img,
    aside.quote .title .quote-controls,
    aside.quote .title .back,
    aside.quote .title .quote-toggle {
      display: none !important;
    }
    .wecom-msg-bubble .wecom-reply-preview,
    .wecom-msg-bubble aside.quote blockquote,
    .wecom-msg-bubble blockquote p,
    .cooked aside.quote blockquote {
      font-size: 12px !important;
      color: #7D8590 !important;
      line-height: 1.45 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
      background-color: transparent !important;
      box-shadow: none !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      word-break: break-word !important;
    }
    .wecom-msg-me .wecom-msg-bubble aside.quote .title,
    .wecom-msg-me .wecom-msg-bubble .wecom-reply-author {
      color: rgba(0, 0, 0, 0.52) !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    .wecom-msg-me .wecom-msg-bubble .wecom-reply-preview,
    .wecom-msg-me .wecom-msg-bubble aside.quote blockquote,
    .wecom-msg-me .wecom-msg-bubble blockquote p {
      color: rgba(0, 0, 0, 0.48) !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    /* 深色模式下的引用线与文字配色 */
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-reference,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble blockquote,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-reference,
    html.wecom-dark .wecom-msg-bubble aside.quote,
    html.wecom-dark .wecom-msg-bubble blockquote,
    html.wecom-dark aside.quote,
    html.wecom-dark .cooked aside.quote {
      border-left-color: rgba(255, 255, 255, 0.22) !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-author,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote .title,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-author,
    html.wecom-dark .wecom-msg-bubble aside.quote .title,
    html.wecom-dark aside.quote .title,
    html.wecom-dark .cooked aside.quote .title {
      color: #929AA7 !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      border-left: none !important;
      box-shadow: none !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-preview,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote blockquote,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble blockquote p,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-preview,
    html.wecom-dark .wecom-msg-bubble aside.quote blockquote,
    html.wecom-dark .wecom-msg-bubble blockquote p,
    html.wecom-dark aside.quote blockquote,
    html.wecom-dark .cooked aside.quote blockquote {
      color: #7D8590 !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble aside.quote .title,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble .wecom-reply-author,
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble aside.quote .title,
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble .wecom-reply-author {
      color: rgba(255, 255, 255, 0.65) !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble .wecom-reply-preview,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble aside.quote blockquote,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble blockquote p,
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble .wecom-reply-preview,
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble aside.quote blockquote,
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble blockquote p {
      color: rgba(255, 255, 255, 0.52) !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* 气泡样式规范（圆角矩形，去除三角箭头，纯净优雅） */
    .wecom-msg-bubble {
      padding: 8px 12px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      line-height: 1.55 !important;
      position: relative !important;
      word-break: break-word !important;
      box-shadow: none !important;
      border: none !important;
    }
    /* 去除粗糙尖角，完全对齐截图微圆角矩形 */
    .wecom-msg-bubble::before,
    .wecom-msg-other .wecom-msg-bubble::before,
    .wecom-msg-me .wecom-msg-bubble::before {
      display: none !important;
      content: none !important;
    }
    .wecom-msg-bubble p {
      margin: 0 0 6px;
    }
    .wecom-msg-bubble p:last-child {
      margin-bottom: 0;
    }
    .wecom-msg-bubble pre {
      background: rgba(0,0,0,0.05);
      padding: 8px 10px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      margin: 6px 0;
    }
    .wecom-msg-bubble blockquote {
      border-left: 3px solid var(--wc-blue);
      padding-left: 8px;
      margin: 6px 0;
      color: var(--wc-text-2);
    }
    .wecom-msg-bubble img {
      max-width: 100%;
      border-radius: 8px;
    }

    /* 对方消息 (左侧浅灰蓝气泡 #E4E7EB) */
    .wecom-msg-other {
      align-self: flex-start;
    }
    .wecom-msg-other .wecom-msg-bubble {
      background: var(--wc-bubble-other) !important; /* #E4E7EB */
      color: var(--wc-bubble-other-text) !important; /* #1F2329 */
    }

    /* 自己消息 (右侧微信经典绿 #95EC69) */
    .wecom-msg-me {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .wecom-msg-me .wecom-msg-content {
      align-items: flex-end;
    }
    .wecom-msg-me .wecom-msg-name {
      display: none;
    }
    .wecom-msg-me .wecom-msg-bubble {
      background: var(--wc-bubble-me) !important; /* #95EC69 */
      color: var(--wc-bubble-me-text) !important; /* #1F2329 */
    }

    /* 悬停浮动工具条 */
    .wecom-msg-tools {
      position: absolute;
      top: -24px;
      right: 0;
      display: none;
      align-items: center;
      gap: 2px;
      background: #FFFFFF;
      border: 1px solid var(--wc-border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-radius: 4px;
      padding: 2px 4px;
      z-index: 10;
    }
    .wecom-msg:hover .wecom-msg-tools {
      display: flex;
    }
    .wecom-msg-tool {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--wc-text-2);
      cursor: pointer;
      border-radius: 3px;
    }
    .wecom-msg-tool:hover {
      background: rgba(0,0,0,0.06);
      color: var(--wc-blue);
    }
    .wecom-msg-tool svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
    }

    /* ==========================================================================
       4. 输入区域与工具栏规范 (基准对齐 media_1789096763016.png 企微 5.x 悬浮卡片)
       ========================================================================== */
    .wecom-composer {
      background: #F5F7FA !important;
      border-top: none !important;
      padding: 0 14px 14px 14px !important;
      box-sizing: border-box !important;
      position: relative !important;
      flex: 0 0 auto !important;
      width: 100% !important;
      min-height: auto !important;
    }
    .wecom-composer-card {
      background: #FFFFFF !important;
      border: 1px solid #E6E7E8 !important;
      border-radius: 6px !important;
      box-shadow: none !important;
      display: flex !important;
      flex-direction: column !important;
      height: 164px !important;
      min-height: 160px !important;
      box-sizing: border-box !important;
      position: relative !important;
      overflow: hidden !important;
      transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    .wecom-composer-card:hover {
      border-color: #D2D4D7 !important;
    }
    .wecom-composer-card:focus-within {
      border-color: #BDD0E8 !important;
    }

    /* 工具栏：高 38px，水平对齐，9 个线性图标 + 快速会议 */
    .wecom-composer-tools {
      height: 38px !important;
      padding: 6px 14px 0 14px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      border-bottom: none !important;
      box-sizing: border-box !important;
    }
    .wecom-composer-tools .wecom-icon-btn {
      height: 26px !important;
      min-width: 22px !important;
      padding: 0 3px !important;
      color: #3E4247 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 3px !important;
      cursor: pointer !important;
      background: transparent !important;
      border: none !important;
      border-radius: 4px !important;
      transition: color 0.12s ease !important;
    }
    .wecom-composer-tools .wecom-icon-btn.has-arrow {
      padding: 0 4px !important;
    }
    .wecom-composer-tools .wecom-icon-btn:hover {
      color: #267EF0 !important;
    }
    .wecom-composer-tools .wecom-icon-btn svg:not(.wecom-tool-arrow) {
      width: 18px !important;
      height: 18px !important;
      stroke: currentColor !important;
      stroke-width: 1.1px !important;
      fill: none !important;
      flex-shrink: 0 !important;
    }
    /* 下拉小三角：宽 6px，高 4px，居中对齐 */
    .wecom-tool-arrow {
      width: 6px !important;
      height: 4px !important;
      fill: #6C7075 !important;
      flex-shrink: 0 !important;
      margin-left: 1px !important;
      transition: fill 0.12s ease !important;
    }
    .wecom-composer-tools .wecom-icon-btn:hover .wecom-tool-arrow {
      fill: #267EF0 !important;
    }

    /* 快速会议：右浮动，灰色文本+图标，无外边框背景 */
    .wecom-tool-quick-meet {
      margin-left: auto !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      font-size: 12px !important;
      color: #3E4247 !important;
      background: transparent !important;
      border: none !important;
      border-radius: 4px !important;
      padding: 3px 6px !important;
      cursor: pointer !important;
      transition: color 0.12s ease !important;
    }
    .wecom-tool-quick-meet svg {
      width: 14px !important;
      height: 14px !important;
      stroke: currentColor !important;
      stroke-width: 1.2px !important;
      fill: none !important;
    }
    .wecom-tool-quick-meet:hover {
      color: #267EF0 !important;
    }

    /* 指定回复条 */
    .wecom-reply-target {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 4px 14px !important;
      background: rgba(38, 126, 240, 0.08) !important;
      font-size: 12px !important;
      color: #267EF0 !important;
      border-bottom: 1px solid rgba(38, 126, 240, 0.15) !important;
      box-sizing: border-box !important;
    }
    .wecom-reply-target[hidden] {
      display: none !important;
    }
    .wecom-reply-cancel {
      background: transparent !important;
      border: none !important;
      font-size: 14px !important;
      color: #267EF0 !important;
      cursor: pointer !important;
      padding: 0 4px !important;
      line-height: 1 !important;
    }

    /* 文本输入区：无边框无底色，与企微原生完全一致 */
    .wecom-chat-compose {
      flex: 1 1 auto !important;
      min-height: 70px !important;
      max-height: 100px !important;
      padding: 6px 14px 4px 14px !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: #1F2329 !important;
      border: none !important;
      outline: none !important;
      background: transparent !important;
      box-shadow: none !important;
      resize: none !important;
      font-family: inherit !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
    }
    .wecom-chat-compose::placeholder {
      color: #B2B6BC !important;
    }

    /* 隐藏底部快捷键提示，保持企微原生界面的极致清爽 */
    .wecom-composer-tip {
      display: none !important;
    }

    /* 底部操作行与发送按钮 */
    .wecom-composer-bottom {
      height: 32px !important;
      padding: 0 14px 8px 14px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      box-sizing: border-box !important;
      gap: 10px !important;
    }
    .wecom-compose-status {
      font-size: 11px !important;
      line-height: 1.3 !important;
      color: var(--wc-text-3, #8F959E) !important;
      max-width: 360px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      pointer-events: none !important;
      user-select: none !important;
      transition: opacity 0.2s ease !important;
    }
    .wecom-compose-status:empty {
      display: none !important;
    }
    .wecom-compose-status.busy {
      color: var(--wc-accent, #267EF0) !important;
    }
    .wecom-compose-status.success {
      color: #07C160 !important;
    }
    .wecom-compose-status.error {
      color: #FA5151 !important;
    }
    html.wecom-dark .wecom-compose-status,
    html.${ROOT_CLASS}.wecom-dark .wecom-compose-status {
      color: #8F959E !important;
    }
    html.wecom-dark .wecom-compose-status.busy,
    html.${ROOT_CLASS}.wecom-dark .wecom-compose-status.busy {
      color: #388BFD !important;
    }
    html.wecom-dark .wecom-compose-status.success,
    html.${ROOT_CLASS}.wecom-dark .wecom-compose-status.success {
      color: #3FB950 !important;
    }
    html.wecom-dark .wecom-compose-status.error,
    html.${ROOT_CLASS}.wecom-dark .wecom-compose-status.error {
      color: #F85149 !important;
    }

    /* V2EX 内置表情选择器 */
    .wecom-v2ex-emoji-picker {
      position: fixed;
      z-index: 10002;
      width: 340px;
      max-width: calc(100vw - 24px);
      background: #FFFFFF;
      border: 1px solid var(--wc-border);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: wecom-popover-in 0.12s ease-out;
      user-select: none;
    }
    html.wecom-dark .wecom-v2ex-emoji-picker,
    html.${ROOT_CLASS}.wecom-dark .wecom-v2ex-emoji-picker {
      background: #282C34;
      border-color: var(--wc-border-strong);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    }
    .wecom-emoji-picker-tabs {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.02);
      border-bottom: 1px solid var(--wc-border);
      padding: 4px 6px;
      gap: 2px;
    }
    html.wecom-dark .wecom-emoji-picker-tabs,
    html.${ROOT_CLASS}.wecom-dark .wecom-emoji-picker-tabs {
      background: rgba(255, 255, 255, 0.03);
      border-bottom-color: var(--wc-border-strong);
    }
    .wecom-emoji-tab-btn {
      flex: 1;
      height: 28px;
      padding: 0 4px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--wc-text-2);
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: all 0.12s ease;
    }
    .wecom-emoji-tab-btn:hover {
      background: var(--wc-hover);
      color: var(--wc-text);
    }
    .wecom-emoji-tab-btn.is-active {
      background: var(--wc-accent-soft);
      color: var(--wc-accent);
      font-weight: 600;
    }
    .wecom-emoji-picker-body {
      padding: 8px;
      height: 220px;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      box-sizing: border-box;
    }
    .wecom-emoji-item-btn {
      width: 100%;
      aspect-ratio: 1 / 1;
      border: none;
      border-radius: 6px;
      background: transparent;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.1s ease, transform 0.1s ease;
      padding: 0;
    }
    .wecom-emoji-item-btn:hover {
      background: var(--wc-hover);
      transform: scale(1.2);
    }
    .wecom-send-btn {
      height: 26px !important;
      font-size: 12px !important;
      border-radius: 4px !important;
      border: none !important;
      box-sizing: border-box !important;
      font-family: inherit !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease !important;
    }
    /* 未输入任何内容时：纯文本灰字 发送(S)，无背景，无边框 */
    .wecom-send-btn:disabled,
    .wecom-send-btn.is-disabled {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      color: #C9CBCC !important;
      cursor: default !important;
      padding: 0 4px !important;
    }
    /* 输入有内容时：企微蓝实心按钮，白色文本 */
    .wecom-send-btn:not(:disabled) {
      background: #267EF0 !important;
      color: #FFFFFF !important;
      padding: 0 14px !important;
      cursor: pointer !important;
      box-shadow: 0 1px 3px rgba(38, 126, 240, 0.2) !important;
    }
    .wecom-send-btn:not(:disabled):hover {
      background: #1B72E2 !important;
    }
    .wecom-send-btn:not(:disabled):active {
      background: #1562C6 !important;
    }

    /* 5. 最右侧群成员与详情面板（默认收起，点击顶栏成员按钮展开） */
    .wecom-member-panel {
      display: none !important;
    }
    html.${ROOT_CLASS}.wecom-members-open .wecom-member-panel {
      display: flex !important;
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: var(--wc-members) !important;
      min-width: var(--wc-members) !important;
      max-width: var(--wc-members) !important;
      height: 100vh !important;
      background: var(--wc-chat-bg) !important;
      border-left: 1px solid var(--wc-border) !important;
      flex-direction: column !important;
      z-index: 850 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    /* 顶栏成员切换按钮高亮 */
    .wecom-chat-members-toggle.active {
      background: rgba(38, 126, 240, 0.12) !important;
      color: var(--wc-blue) !important;
    }

    /* 群公告卡片：严格对齐示例图纯白微圆角卡片 */
    .wecom-member-announcement {
      margin: 10px 10px 4px 10px !important;
      padding: 10px 12px !important;
      background: #FFFFFF !important;
      border-radius: 6px !important;
      border: 1px solid rgba(0, 0, 0, 0.04) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
      box-sizing: border-box !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
    }
    .wecom-announcement-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      color: var(--wc-text) !important;
      margin-bottom: 6px !important;
      line-height: 1 !important;
    }
    .wecom-announcement-preview {
      font-size: 12px !important;
      color: var(--wc-text-2) !important;
      line-height: 1.6 !important;
      max-height: 110px !important;
      overflow: hidden !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 5 !important;
      -webkit-box-orient: vertical !important;
      word-break: break-word !important;
    }

    /* 群成员头部（群成员·数量 与邮件/更多操作） */
    .wecom-member-header {
      padding: 8px 12px 4px 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-size: 12px !important;
      color: var(--wc-text-3) !important;
      user-select: none !important;
      flex-shrink: 0 !important;
    }
    .wecom-member-count {
      font-weight: 500 !important;
      color: var(--wc-text-3) !important;
    }
    .wecom-member-actions {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .wecom-member-actions .wecom-icon-btn {
      width: 22px !important;
      height: 22px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: none !important;
      background: transparent !important;
      color: var(--wc-text-3) !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      padding: 0 !important;
    }
    .wecom-member-actions .wecom-icon-btn:hover {
      background: rgba(0, 0, 0, 0.05) !important;
      color: var(--wc-text) !important;
    }
    .wecom-member-actions .wecom-icon-btn svg {
      width: 14px !important;
      height: 14px !important;
      stroke: currentColor !important;
    }

    /* 分类标签条（橙色小卡片：如 骏德跨境财税专家 >） */
    .wecom-member-category-bar {
      margin: 2px 10px 8px 10px !important;
      padding: 5px 8px !important;
      border-radius: 4px !important;
      background: #FFF7E6 !important;
      border: 1px solid #FFE7BA !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
    }
    .wecom-member-cat-tag {
      font-size: 11px !important;
      color: #FA8C16 !important;
      font-weight: 500 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    .wecom-arrow-icon {
      display: flex !important;
      align-items: center !important;
    }
    .wecom-arrow-icon svg {
      width: 12px !important;
      height: 12px !important;
      stroke: #8F959E !important;
    }
    .wecom-member-category-bar .wecom-arrow-icon svg {
      stroke: #FA8C16 !important;
    }

    /* 成员列表滚动区 */
    .wecom-member-body {
      flex: 1 1 auto !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 0 8px 16px 8px !important;
      box-sizing: border-box !important;
      scrollbar-width: thin !important;
    }
    /* 成员栏滚动条已统一由上方规范管理 */
    .wecom-member-section {
      margin-bottom: 6px !important;
    }
    .wecom-member-section-title {
      font-size: 11px !important;
      color: var(--wc-text-3) !important;
      padding: 4px 6px 2px 6px !important;
      user-select: none !important;
    }

    /* 单个成员行 */
    .wecom-member-row {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 5px 6px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      transition: background 0.1s ease !important;
      box-sizing: border-box !important;
    }
    .wecom-member-row:hover {
      background: rgba(0, 0, 0, 0.04) !important;
    }
    .wecom-member-avatar {
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      border-radius: 6px !important;
      overflow: hidden !important;
      flex: 0 0 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      color: #FFFFFF !important;
      background: #4A90E2 !important;
    }
    .wecom-member-avatar img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 6px !important;
    }
    .wecom-member-name {
      font-size: 12px !important;
      color: var(--wc-text) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      flex: 1 !important;
      line-height: 1.3 !important;
    }
    .wecom-member-role {
      font-size: 10px !important;
      padding: 1px 4px !important;
      border-radius: 2px !important;
      background: #E8F3FF !important;
      color: var(--wc-blue) !important;
      font-weight: 500 !important;
      line-height: 1.2 !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
  `;

  /* 深色主题配色微调 */
  const WECOM_DARK_REFINEMENTS = String.raw`
    html.${ROOT_CLASS}.wecom-dark,
    html.wecom-dark,
    body.wecom-dark {
      color-scheme: dark !important;
      --wc-rail-bg: #16181C;
      --wc-rail-border: #22252A;
      --wc-rail-icon: #7A8699;
      --wc-rail-active-bg: rgba(30, 111, 255, 0.22);
      --wc-list-bg: #1C1E22;
      --wc-list-border: #26292E;
      --wc-chat-bg: #202328;
      --wc-composer-bg: #1A1C20;
      --wc-bubble-other: #2B2E34;
      --wc-bubble-other-text: #ECEFF4;
      --wc-bubble-me: #1E6B38;
      --wc-bubble-me-text: #FFFFFF;
      --wc-text: #E6E8EB;
      --wc-text-2: #959CA6;
      --wc-text-3: #6F7682;
      --wc-text-4: #545B66;
      --wc-bg: #202328;
      --wc-hover: rgba(255, 255, 255, 0.06);
      --wc-active: rgba(255, 255, 255, 0.1);
      --wc-border: #2A2D33;
      --wc-border-strong: #3A3E46;
      --wc-list-active: #1F477A;
      --wc-blue-soft: rgba(30, 111, 255, 0.18);
      --wc-blue-chip: rgba(30, 111, 255, 0.25);
      --wc-accent-soft: rgba(30, 111, 255, 0.18);
      --wc-card-bg: #23272E;
      --wc-surface-0: #23272E;
      --wc-surface-1: #202328;
      --wc-surface-2: #272B33;
      --wc-surface-3: #2F343D;
      --wc-nav2-bg: #1C1E22;
      --wc-nav2-border: #26292E;
      --primary: var(--wc-text);
      --primary-medium: var(--wc-text-2);
      --primary-low: var(--wc-text-3);
      --secondary: var(--wc-bg);
      --header_background: var(--wc-chat-bg);
      --header_primary: var(--wc-text);
      --d-hover: var(--wc-hover);
      --d-sidebar-background: #1C1E22;
      --d-sidebar-border-color: var(--wc-border);
    }

    /* 侧栏原生展开抽屉 */
    html.${ROOT_CLASS}.wecom-dark body .sidebar-wrapper {
      background-color: #1C1E22 !important;
      border-right-color: #26292E !important;
      color: #ECEFF4 !important;
      --secondary: #1C1E22 !important;
      --d-sidebar-background: #1C1E22 !important;
      --d-sidebar-border-color: #26292E !important;
      --primary: #ECEFF4 !important;
      --primary-medium: #959CA6 !important;
      --primary-low: #6F7682 !important;
      --d-hover: rgba(255, 255, 255, 0.06) !important;
    }

    /* 左侧头像通知浮层与用户菜单 */
    html.wecom-dark .user-menu.wecom-user-menu-float,
    html.${ROOT_CLASS}.wecom-dark .user-menu.wecom-user-menu-float,
    html.wecom-dark .user-menu.revamped.menu-panel.wecom-user-menu-float,
    html.${ROOT_CLASS}.wecom-dark .user-menu.revamped.menu-panel.wecom-user-menu-float,
    html.wecom-dark .user-menu.menu-panel.wecom-user-menu-float,
    html.${ROOT_CLASS}.wecom-dark .user-menu.menu-panel.wecom-user-menu-float {
      background: #23272E !important;
      color: #ECEFF4 !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55) !important;
    }
    html.wecom-dark .user-menu .quick-access-panel,
    html.wecom-dark .user-menu .menu-tabs-container,
    html.wecom-dark .user-menu .panel-body,
    html.wecom-dark .user-menu .menu-panel,
    html.${ROOT_CLASS}.wecom-dark .user-menu .quick-access-panel,
    html.${ROOT_CLASS}.wecom-dark .user-menu .menu-tabs-container,
    html.${ROOT_CLASS}.wecom-dark .user-menu .panel-body,
    html.${ROOT_CLASS}.wecom-dark .user-menu .menu-panel {
      background: #23272E !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .user-menu li:hover,
    html.wecom-dark .user-menu .notification.read:hover,
    html.wecom-dark .user-menu .notification.unread:hover,
    html.${ROOT_CLASS}.wecom-dark .user-menu li:hover,
    html.${ROOT_CLASS}.wecom-dark .user-menu .notification.read:hover,
    html.${ROOT_CLASS}.wecom-dark .user-menu .notification.unread:hover {
      background: rgba(255, 255, 255, 0.06) !important;
    }
    html.wecom-dark .user-menu .notification.unread,
    html.${ROOT_CLASS}.wecom-dark .user-menu .notification.unread {
      background: rgba(30, 111, 255, 0.1) !important;
    }
    html.wecom-dark .user-menu a,
    html.${ROOT_CLASS}.wecom-dark .user-menu a {
      color: #ECEFF4 !important;
    }

    /* 外观与排版菜单按钮 hover 与分隔线 */
    html.wecom-dark .wecom-theme-menu button:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-theme-menu button:hover {
      background: rgba(30, 111, 255, 0.22) !important;
      color: #3D8AF5 !important;
    }
    html.wecom-dark .wecom-theme-menu hr,
    html.${ROOT_CLASS}.wecom-dark .wecom-theme-menu hr {
      border-color: rgba(255, 255, 255, 0.1) !important;
    }

    /* 搜索栏与新增按钮 */
    html.${ROOT_CLASS}.wecom-dark .wecom-list-search form,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-btn {
      background: #2B2D31 !important;
      background-color: #2B2D31 !important;
      color: #8F959E !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-search form:focus-within {
      background: #23262B !important;
      background-color: #23262B !important;
      border-color: #388BFD !important;
      box-shadow: 0 0 0 1px #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-btn:hover {
      background: #363A42 !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-menu {
      background: #232529 !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-item {
      color: #D3D8E2 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-item svg {
      stroke: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-item:hover {
      background: #2C2F36 !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-add-item:hover svg {
      stroke: #3D8AF5 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-search input {
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-search input::placeholder {
      color: #6F7682 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-rail-item {
      color: #7A8699 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-rail-item.active,
    html.${ROOT_CLASS}.wecom-dark .wecom-rail-item.is-on {
      background: rgba(30, 111, 255, 0.22) !important;
      color: #3D8AF5 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-rail-item.active .wecom-rail-icon svg,
    html.${ROOT_CLASS}.wecom-dark .wecom-rail-item.is-on .wecom-rail-icon svg {
      fill: #3D8AF5 !important;
    }

    /* 分类标签胶囊 */
    html.${ROOT_CLASS}.wecom-dark .wecom-chip {
      color: #959CA6 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chip:hover {
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chip.active {
      background: #2D323B !important;
      color: #FFFFFF !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chip-icon {
      background: #2B2F36 !important;
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chip-icon:hover {
      background: #363B44 !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chip-icon.is-on,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-nav-toggle[aria-expanded="true"] {
      background: rgba(30, 111, 255, 0.25) !important;
      color: #3D8AF5 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-nav {
      border-bottom-color: var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-nav a {
      background: #23272E !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #A6AFBC !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-nav a:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-nav a.active {
      background: rgba(30, 111, 255, 0.22) !important;
      border-color: rgba(30, 111, 255, 0.45) !important;
      color: #3D8AF5 !important;
    }

    /* 会话列表项与标签 */
    html.${ROOT_CLASS}.wecom-dark .wecom-conv {
      border-bottom-color: var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv.is-pinned {
      background: rgba(255, 255, 255, 0.03) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv.active {
      background: #1F477A !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv.active .wecom-conv-name,
    html.${ROOT_CLASS}.wecom-dark .wecom-conv.active .wecom-conv-msg,
    html.${ROOT_CLASS}.wecom-dark .wecom-conv.active .wecom-conv-time {
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-name {
      color: #E6E8EB !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-msg {
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-time {
      color: #6F7682 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-avatar {
      background: #2C3038 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-avatar.is-group,
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-avatar.is-grid-mask {
      background: #25282F !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.is-dept {
      background: rgba(30, 111, 255, 0.18) !important;
      color: #5BA2FF !important;
      border: 1px solid rgba(30, 111, 255, 0.35) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag.is-ext {
      background: rgba(7, 193, 96, 0.18) !important;
      color: #21C978 !important;
      border: 1px solid rgba(7, 193, 96, 0.35) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-conv-tag {
      background: rgba(30, 111, 255, 0.15) !important;
      color: #5BA2FF !important;
      border-color: rgba(30, 111, 255, 0.3) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-status {
      color: #7A8494 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-status.is-clickable:hover {
      color: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-history-tag {
      color: #E6E8EB !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-history-clear-btn {
      border-color: var(--wc-border) !important;
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-history-clear-btn:hover {
      border-color: #FA5151 !important;
      color: #FA5151 !important;
      background: rgba(250, 81, 81, 0.12) !important;
    }

    /* 聊天窗口主框架与顶栏 */
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-panel {
      background: var(--wc-chat-bg) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-head {
      background: var(--wc-chat-bg) !important;
      border-bottom: 1px solid var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-header {
      background: var(--wc-chat-bg) !important;
      border-bottom-color: var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-title {
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-count,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-sub {
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-actions .wecom-icon-btn {
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-actions .wecom-icon-btn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #ECEFF4 !important;
    }

    /* 气泡浮动操作条 */
    html.wecom-dark .wecom-msg-tools,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-tools {
      background: #2B2F36 !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45) !important;
    }
    html.wecom-dark .wecom-msg-tool,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-tool {
      color: #A0A6B2 !important;
    }
    html.wecom-dark .wecom-msg-tool:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-tool:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #388BFD !important;
    }

    /* 气泡消息体 */
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-other .wecom-msg-bubble {
      background: #2B2E34 !important;
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble {
      background: #1E6B38 !important;
      color: #FFFFFF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble a {
      color: #4D9BF7 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble a {
      color: #BEE3FF !important;
      text-decoration: underline !important;
    }

    /* 代码块与内联代码 */
    html.wecom-dark .wecom-msg-bubble pre,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble pre {
      background: #191C21 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: #E6EDF5 !important;
    }
    html.wecom-dark .wecom-msg-bubble code,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble code {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #E6EDF5 !important;
      padding: 1px 4px !important;
      border-radius: 3px !important;
    }
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble pre,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble pre {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-msg-me .wecom-msg-bubble code,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-me .wecom-msg-bubble code {
      background: rgba(0, 0, 0, 0.25) !important;
      color: #FFFFFF !important;
    }

    /* Onebox 嵌入卡片 */
    html.wecom-dark .wecom-msg-bubble aside.onebox,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.onebox,
    html.wecom-dark .wecom-msg-bubble .onebox,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .onebox {
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      color: #ECEFF4 !important;
      border-radius: 6px !important;
    }
    html.wecom-dark .wecom-msg-bubble aside.onebox header a,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.onebox header a,
    html.wecom-dark .wecom-msg-bubble aside.onebox .onebox-body a,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.onebox .onebox-body a,
    html.wecom-dark .wecom-msg-bubble .onebox a,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .onebox a {
      color: #4D9BF7 !important;
    }
    html.wecom-dark .wecom-msg-bubble aside.onebox .onebox-body,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.onebox .onebox-body {
      color: #C0C5CF !important;
    }

    /* 引用块优化 */
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-reference,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble blockquote,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-reference,
    html.wecom-dark .wecom-msg-bubble aside.quote,
    html.wecom-dark .wecom-msg-bubble blockquote {
      border-left-color: rgba(255, 255, 255, 0.28) !important;
      background: transparent !important;
      background-color: transparent !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-author,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote .title,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-author,
    html.wecom-dark .wecom-msg-bubble aside.quote .title {
      color: #929AA7 !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      border-left: none !important;
      box-shadow: none !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .wecom-reply-preview,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble aside.quote blockquote,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble blockquote p,
    html.wecom-dark .wecom-msg-bubble .wecom-reply-preview,
    html.wecom-dark .wecom-msg-bubble aside.quote blockquote,
    html.wecom-dark .wecom-msg-bubble blockquote p {
      color: #8E95A2 !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* 表格 */
    html.wecom-dark .wecom-msg-bubble table th,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble table th {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #FFFFFF !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
    }
    html.wecom-dark .wecom-msg-bubble table td,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble table td {
      background: rgba(255, 255, 255, 0.03) !important;
      color: #ECEFF4 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    /* 折叠面板与剧透 */
    html.wecom-dark .wecom-msg-bubble details,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble details {
      background: rgba(255, 255, 255, 0.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 6px !important;
      padding: 6px 10px !important;
    }
    html.wecom-dark .wecom-msg-bubble details summary,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble details summary {
      color: #388BFD !important;
    }

    /* V2EX 附言 (.subtle) */
    html.wecom-dark .wecom-msg-bubble .subtle,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .subtle {
      background: rgba(255, 255, 255, 0.04) !important;
      border-left: 3px solid #388BFD !important;
      border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      color: #ECEFF4 !important;
      border-radius: 0 6px 6px 0 !important;
      padding: 6px 10px !important;
      margin: 8px 0 !important;
    }
    html.wecom-dark .wecom-msg-bubble .subtle .fade,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble .subtle .fade {
      color: #8C99AA !important;
    }

    /* @提及徽标 */
    html.wecom-dark .wecom-msg-bubble a.mention,
    html.${ROOT_CLASS}.wecom-dark .wecom-msg-bubble a.mention {
      background: rgba(56, 139, 253, 0.22) !important;
      color: #5BA2FF !important;
      padding: 1px 6px !important;
      border-radius: 10px !important;
    }

    /* 底栏输入卡片 */
    html.${ROOT_CLASS}.wecom-dark .wecom-composer {
      background: #191B1F !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-card {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-card:hover {
      border-color: rgba(255, 255, 255, 0.18) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-card:focus-within {
      border-color: rgba(38, 126, 240, 0.45) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-tools .wecom-icon-btn {
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-tools .wecom-icon-btn:hover {
      color: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-tool-arrow {
      fill: #80868B !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-composer-tools .wecom-icon-btn:hover .wecom-tool-arrow {
      fill: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-tool-quick-meet {
      color: #9EA3A8 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-tool-quick-meet:hover {
      color: #388BFD !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-reply-target {
      background: rgba(38, 126, 240, 0.16) !important;
      color: #5BA2FF !important;
      border-bottom-color: rgba(38, 126, 240, 0.25) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-reply-cancel {
      color: #5BA2FF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-compose {
      color: #ECEFF4 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-compose::placeholder {
      color: #5C6370 !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-send-btn:disabled,
    html.${ROOT_CLASS}.wecom-dark .wecom-send-btn.is-disabled {
      color: rgba(255, 255, 255, 0.28) !important;
      background: transparent !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-send-btn:not(:disabled) {
      background: #267EF0 !important;
      color: #FFFFFF !important;
    }

    /* Discourse Emoji 选择器 */
    html.wecom-dark .emoji-picker,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker,
    html.wecom-dark [data-identifier='emoji-picker'],
    html.${ROOT_CLASS}.wecom-dark [data-identifier='emoji-picker'] {
      background: #23272E !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      color: #ECEFF4 !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55) !important;
    }
    html.wecom-dark .emoji-picker input,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker input {
      background: #1A1D22 !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .emoji-picker .category-button:hover,
    html.wecom-dark .emoji-picker .category-button.is-active,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker .category-button:hover,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker .category-button.is-active,
    html.wecom-dark .emoji-picker button.emoji:hover,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker button.emoji:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
    html.wecom-dark .emoji-picker .emoji-picker-category-title,
    html.${ROOT_CLASS}.wecom-dark .emoji-picker .emoji-picker-category-title {
      color: #8C99AA !important;
    }

    /* 输入自动补全浮层 */
    html.wecom-dark .autocomplete,
    html.wecom-dark .autocomplete-container,
    html.${ROOT_CLASS}.wecom-dark .autocomplete,
    html.${ROOT_CLASS}.wecom-dark .autocomplete-container {
      background: #23272E !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45) !important;
    }
    html.wecom-dark .autocomplete li a,
    html.${ROOT_CLASS}.wecom-dark .autocomplete li a {
      color: #D3D8E2 !important;
    }
    html.wecom-dark .autocomplete li a:hover,
    html.wecom-dark .autocomplete li.selected a,
    html.${ROOT_CLASS}.wecom-dark .autocomplete li a:hover,
    html.${ROOT_CLASS}.wecom-dark .autocomplete li.selected a {
      background: #2C313A !important;
      color: #388BFD !important;
    }

    /* 消息编辑弹窗 */
    html.wecom-dark .wecom-edit-dialog-card,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-card {
      background: #23272E !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      color: #ECEFF4 !important;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6) !important;
    }
    html.wecom-dark .wecom-edit-dialog-title,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-title {
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-edit-dialog-close,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-close {
      color: #8C99AA !important;
    }
    html.wecom-dark .wecom-edit-dialog-close:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-close:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-edit-input,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-input {
      background: #1A1D23 !important;
      border-color: rgba(255, 255, 255, 0.14) !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .wecom-edit-input:focus,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-input:focus {
      border-color: #388BFD !important;
      box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.25) !important;
    }
    html.wecom-dark .wecom-edit-dialog-actions button:not(.wecom-edit-save),
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-actions button:not(.wecom-edit-save) {
      background: #2B2D31 !important;
      border-color: rgba(255, 255, 255, 0.14) !important;
      color: #DCDDDE !important;
    }
    html.wecom-dark .wecom-edit-dialog-actions button:not(.wecom-edit-save):hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-actions button:not(.wecom-edit-save):hover {
      background: #383A40 !important;
      color: #FFFFFF !important;
    }
    html.wecom-dark .wecom-edit-dialog-actions .wecom-edit-save,
    html.${ROOT_CLASS}.wecom-dark .wecom-edit-dialog-actions .wecom-edit-save {
      background: #267EF0 !important;
      border-color: #267EF0 !important;
      color: #FFFFFF !important;
    }

    /* 暗色模式滚动条自适应 */
    html.${ROOT_CLASS}.wecom-dark .wecom-list-panel:hover .wecom-list-body::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-body:hover::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-body.is-scrolling::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-panel:hover .wecom-chat-body::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-body:hover::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-body.is-scrolling::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-panel:hover .wecom-member-body::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-body:hover::-webkit-scrollbar-thumb,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-body.is-scrolling::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.22) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-body::-webkit-scrollbar-thumb:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-body::-webkit-scrollbar-thumb:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-messages::-webkit-scrollbar-thumb:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-body::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.38) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-list-panel:hover .wecom-list-body,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-body:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-list-body.is-scrolling,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-panel:hover .wecom-chat-body,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-body:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-chat-body.is-scrolling,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-panel:hover .wecom-member-body,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-body:hover,
    html.${ROOT_CLASS}.wecom-dark .wecom-member-body.is-scrolling {
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent !important;
    }

    /* 群成员/公告栏 */
    html.${ROOT_CLASS}.wecom-dark .wecom-member-panel {
      background: var(--wc-chat-bg) !important;
      border-left-color: var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-announcement {
      background: #1E2024 !important;
      border-color: var(--wc-border) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-category-bar {
      background: #2D2318 !important;
      border-color: #593D1E !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-row:hover {
      background: rgba(255, 255, 255, 0.06) !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-role {
      background: rgba(30, 111, 255, 0.2) !important;
      color: #5BA2FF !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-actions .wecom-icon-btn {
      color: #8C99AA !important;
    }
    html.${ROOT_CLASS}.wecom-dark .wecom-member-actions .wecom-icon-btn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #ECEFF4 !important;
    }

    /* V2EX 原生结构暗色兜底 */
    html.wecom-dark #Top {
      background-color: #1A1C20 !important;
      border-bottom: 1px solid #26292E !important;
    }
    html.wecom-dark #Wrapper {
      background-color: #141619 !important;
    }
    html.wecom-dark .box {
      background-color: #1C1E22 !important;
      border-color: #282C33 !important;
      box-shadow: none !important;
    }
    html.wecom-dark .cell,
    html.wecom-dark .cell.item {
      background-color: #1C1E22 !important;
      border-bottom-color: #26292E !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .cell:hover {
      background-color: #202328 !important;
    }
    html.wecom-dark .header {
      background-color: #1E2126 !important;
      border-bottom-color: #26292E !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .inner {
      background-color: #1C1E22 !important;
      border-top-color: #26292E !important;
      color: #959CA6 !important;
    }
    html.wecom-dark .topic_content,
    html.wecom-dark .reply_content {
      color: #ECEFF4 !important;
    }
    html.wecom-dark .item_title a,
    html.wecom-dark a.dark {
      color: #D8DEE9 !important;
    }
    html.wecom-dark .snow,
    html.wecom-dark .fade,
    html.wecom-dark .gray {
      color: #7A8494 !important;
    }
    html.wecom-dark input.s,
    html.wecom-dark .mll {
      background-color: #16181C !important;
      border-color: #2C3038 !important;
      color: #ECEFF4 !important;
    }
    html.wecom-dark .wecom-mode-fab,
    html.${ROOT_CLASS}.wecom-dark .wecom-mode-fab {
      background: #267EF0 !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
    }
  `;

  /* ============================== 基础设施 ============================== */

  function injectStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    // 始终刷新，避免旧版 CSS（挡住回复按钮）残留
    style.textContent = `${RAW_CSS}\n${WECOM_REFINEMENTS}\n${WECOM_LATEST_REFINEMENTS}\n${WECOM_DARK_REFINEMENTS}`;
  }

  let faviconObserver = null;
  let faviconApplying = false;

  function makeFavicon() {
    const head = document.head;
    if (!head || faviconApplying) return;
    faviconApplying = true;
    try {
      const href = FAVICON_URI;
      // 覆盖所有常见 icon 链（含 shortcut / apple-touch），避免未选中标签仍用站点原图
      const icons = head.querySelectorAll(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel~='icon'], link[rel='apple-touch-icon'], link[rel='apple-touch-icon-precomposed'], link[rel='mask-icon']"
      );
      for (const icon of icons) {
        if (icon.id && icon.id !== FAVICON_ID) icon.removeAttribute("id");
        if (icon.getAttribute("href") !== href) icon.setAttribute("href", href);
        if (icon.rel === "mask-icon") continue;
        if (icon.getAttribute("type") !== "image/x-icon") icon.setAttribute("type", "image/x-icon");
        if (!icon.getAttribute("sizes")) icon.setAttribute("sizes", "any");
      }

      let link = document.getElementById(FAVICON_ID);
      if (!link) {
        link = document.createElement("link");
        link.id = FAVICON_ID;
        link.rel = "icon";
        link.type = "image/x-icon";
        link.sizes = "any";
        link.setAttribute("href", href);
        head.appendChild(link);
      } else if (link.getAttribute("href") !== href) {
        link.setAttribute("href", href);
      }

      // 再补一条 shortcut icon，部分浏览器未聚焦标签时优先读它
      let shortcut = head.querySelector("link[data-wecom-shortcut='1']");
      if (!shortcut) {
        shortcut = document.createElement("link");
        shortcut.rel = "shortcut icon";
        shortcut.type = "image/x-icon";
        shortcut.dataset.wecomShortcut = "1";
        shortcut.setAttribute("href", href);
        head.insertBefore(shortcut, head.firstChild);
      } else if (shortcut.getAttribute("href") !== href) {
        shortcut.setAttribute("href", href);
      }

      if (!faviconObserver) {
        faviconObserver = new MutationObserver(() => {
          if (faviconApplying) return;
          // 站点 SPA / 主题脚本可能写回原 favicon
          makeFavicon();
        });
        faviconObserver.observe(head, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["href", "rel", "type", "sizes"]
        });
      }
    } finally {
      faviconApplying = false;
    }
  }

  /* ============================== 网页 Title 空白守护 ============================== */

  const BLANK_PAGE_TITLE = " ";

  function enforceBlankTitle() {
    if (typeof document === "undefined") return;
    if (getViewMode() === "native" || otherThemeActive()) return;
    try {
      if (document.title !== BLANK_PAGE_TITLE) {
        document.title = BLANK_PAGE_TITLE;
      }
      const titleEl = document.querySelector("title");
      if (titleEl && titleEl.textContent !== BLANK_PAGE_TITLE) {
        titleEl.textContent = BLANK_PAGE_TITLE;
      }
    } catch { /* ignore */ }
  }

  function setupTitleGuard() {
    if (typeof document === "undefined") return;
    enforceBlankTitle();

    try {
      const proto = typeof Document !== "undefined" ? Document.prototype : null;
      const desc = proto ? Object.getOwnPropertyDescriptor(proto, "title") : null;
      if (desc && desc.configurable) {
        Object.defineProperty(document, "title", {
          get() {
            if (getViewMode() === "native" || otherThemeActive()) {
              return desc.get ? desc.get.call(document) : BLANK_PAGE_TITLE;
            }
            return BLANK_PAGE_TITLE;
          },
          set(val) {
            if (getViewMode() === "native" || otherThemeActive()) {
              if (desc.set) desc.set.call(document, val);
              return;
            }
            // 企微模式下强制保持空白，不显示详情页标题
            if (desc.set) desc.set.call(document, BLANK_PAGE_TITLE);
          },
          configurable: true,
          enumerable: true
        });
      }
    } catch { /* ignore */ }

    try {
      const titleEl = document.querySelector("title");
      if (titleEl && typeof MutationObserver !== "undefined") {
        const titleObserver = new MutationObserver(() => {
          if (getViewMode() === "native" || otherThemeActive()) return;
          if (titleEl.textContent !== BLANK_PAGE_TITLE) {
            titleEl.textContent = BLANK_PAGE_TITLE;
          }
        });
        titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
      }
    } catch { /* ignore */ }
  }


  function restyleSplash() {
    const splash = document.getElementById("d-splash");
    if (!splash) return;
    document.documentElement.style.setProperty(
      "--wc-splash-logo",
      `url("${FAVICON_URI}")`
    );
  }

  function getViewMode() {
    try {
      if (typeof location !== "undefined" && new URLSearchParams(location.search).get("wecom_view") === "native") {
        return "native";
      }
      return localStorage.getItem(VIEW_KEY) === "native" ? "native" : "im";
    } catch {
      return "im";
    }
  }

  function setViewMode(mode) {
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch { /* ignore */ }
  }

  /** 与仓库内其他外观脚本互斥避让 */
  function otherThemeActive() {
    return !!document.getElementById("linuxdo-idea-theme") ||
      document.documentElement.classList.contains("idea-ide-theme") ||
      !!document.getElementById("linuxdo-feishu-theme") ||
      document.documentElement.classList.contains("feishu-im-theme") ||
      !!document.getElementById("linuxdo-dingtalk-theme") ||
      document.documentElement.classList.contains("dingtalk-im-theme");
  }

  /* ============================== 颜色模式 ============================== */

  let colorSchemeObserver = null;
  let systemSchemeMedia = null;
  let applyingColorMode = false;
  let transientThemeMode = null;

  function normalizeThemeMode(mode) {
    return THEME_MODE_VALUES.includes(mode) ? mode : DEFAULT_THEME_MODE;
  }

  function getThemeMode() {
    if (transientThemeMode) return transientThemeMode;
    try {
      const saved = localStorage.getItem(THEME_MODE_KEY);
      if (saved) return normalizeThemeMode(saved);
      // 兼容早期测试版可能使用的布尔开关。
      const legacy = localStorage.getItem("linuxdo-wecom-dark-mode");
      if (legacy === "1" || legacy === "true") return "dark";
    } catch { /* localStorage 不可用时使用默认模式 */ }
    return DEFAULT_THEME_MODE;
  }

  function systemPrefersDark() {
    try {
      return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  }

  function isDarkMode() {
    const mode = getThemeMode();
    return mode === "dark" || (mode === "system" && systemPrefersDark());
  }

  function setThemeMode(mode) {
    const normalized = normalizeThemeMode(mode);
    try {
      localStorage.setItem(THEME_MODE_KEY, normalized);
      transientThemeMode = null;
    } catch {
      // 私密浏览或禁用存储时仍保持本页选择，避免点击后立即跳回默认模式。
      transientThemeMode = normalized;
    }
    applySiteColorMode();
    syncThemeControls();
  }

  function applySchemeLinks(dark) {
    const darkMedia = dark ? "all" : "none";
    const lightMedia = dark ? "none" : "all";
    for (const link of document.querySelectorAll("link.dark-scheme, link[class*='dark-scheme']")) {
      if (link.media !== darkMedia) link.media = darkMedia;
      if (link.disabled !== !dark) link.disabled = !dark;
    }
    for (const link of document.querySelectorAll("link.light-scheme, link[class*='light-scheme']")) {
      if (link.media !== lightMedia) link.media = lightMedia;
      if (link.disabled !== dark) link.disabled = dark;
    }
  }

  function schemeLinksMatch(dark) {
    const darkMedia = dark ? "all" : "none";
    const lightMedia = dark ? "none" : "all";
    const darkLinks = document.querySelectorAll("link.dark-scheme, link[class*='dark-scheme']");
    const lightLinks = document.querySelectorAll("link.light-scheme, link[class*='light-scheme']");
    const darkReady = [...darkLinks].every((link) => link.media === darkMedia && link.disabled === !dark);
    const lightReady = [...lightLinks].every((link) => link.media === lightMedia && link.disabled === dark);
    return darkReady && lightReady;
  }

  function siteColorModeMatches(dark) {
    const scheme = dark ? "dark" : "light";
    const root = document.documentElement;
    const rootReady = root.style.colorScheme === scheme &&
      root.classList.contains("wecom-dark") === dark &&
      root.classList.contains("dark") === dark &&
      root.classList.contains("dark-scheme") === dark &&
      root.classList.contains("scheme-dark") === dark &&
      root.getAttribute("data-color-mode") === scheme;
    if (!rootReady || !schemeLinksMatch(dark)) return false;
    if (!document.body) return true;
    const body = document.body;
    return body.style.colorScheme === scheme &&
      body.classList.contains("wecom-dark") === dark &&
      body.classList.contains("dark") === dark &&
      body.classList.contains("dark-scheme") === dark &&
      body.classList.contains("scheme-dark") === dark &&
      body.getAttribute("data-color-mode") === scheme;
  }

  /** 同步站点 stylesheet、html/body 属性及企业微信自绘面板。 */
  function applySiteColorMode() {
    if (otherThemeActive()) return;
    const dark = isDarkMode();
    const root = document.documentElement;
    const scheme = dark ? "dark" : "light";
    applyingColorMode = true;
    try {
      if (root.style.colorScheme !== scheme) root.style.colorScheme = scheme;
      root.classList.toggle("wecom-dark", dark);
      root.classList.toggle("dark", dark);
      root.classList.toggle("dark-scheme", dark);
      root.classList.toggle("scheme-dark", dark);
      if (root.getAttribute("data-color-mode") !== scheme) root.setAttribute("data-color-mode", scheme);
      if (document.body) {
        if (document.body.style.colorScheme !== scheme) document.body.style.colorScheme = scheme;
        document.body.classList.toggle("wecom-dark", dark);
        document.body.classList.toggle("dark", dark);
        document.body.classList.toggle("dark-scheme", dark);
        document.body.classList.toggle("scheme-dark", dark);
        if (document.body.getAttribute("data-color-mode") !== scheme) {
          document.body.setAttribute("data-color-mode", scheme);
        }
      }
      applySchemeLinks(dark);
    } finally {
      applyingColorMode = false;
    }
    ensureColorSchemeObserver();
    ensureSystemSchemeListener();
    syncThemeControls();
  }

  function ensureColorSchemeObserver() {
    if (colorSchemeObserver || typeof MutationObserver === "undefined") return;
    colorSchemeObserver = new MutationObserver(() => {
      const dark = isDarkMode();
      if (!applyingColorMode && !otherThemeActive() && !siteColorModeMatches(dark)) {
        applySiteColorMode();
      }
    });
    const observeSchemeRoot = () => {
      const root = document.head || document.documentElement;
      if (!root) return;
      colorSchemeObserver.disconnect();
      colorSchemeObserver.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["media", "disabled", "class", "href"]
      });
    };
    observeSchemeRoot();
    if (!document.head) document.addEventListener("DOMContentLoaded", observeSchemeRoot, { once: true });
  }

  function ensureSystemSchemeListener() {
    if (systemSchemeMedia || typeof window.matchMedia !== "function") return;
    systemSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getThemeMode() === "system" && !otherThemeActive()) applySiteColorMode();
    };
    if (typeof systemSchemeMedia.addEventListener === "function") {
      systemSchemeMedia.addEventListener("change", onChange);
    } else if (typeof systemSchemeMedia.addListener === "function") {
      systemSchemeMedia.addListener(onChange);
    }
  }

  /* ============================== 最左图标 rail ============================== */

  const NAV2_KEY = "linuxdo-wecom-nav2"; // "1" = 展开原生侧栏

  function isNav2Open() {
    try { return localStorage.getItem(NAV2_KEY) === "1"; } catch { return false; }
  }

  function setNav2Open(open) {
    try { localStorage.setItem(NAV2_KEY, open ? "1" : "0"); } catch { /* ignore */ }
    document.documentElement.classList.toggle("wecom-nav2-open", open);
    const moreBtn = document.querySelector(".wecom-rail-more, [data-rail-key='group']");
    if (moreBtn) {
      moreBtn.classList.toggle("is-on", open);
      moreBtn.classList.toggle("active", open);
      moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      moreBtn.title = open ? "收起话题导航" : "展开话题导航";
    }
  }

  function isBoostEnabled() {
    try {
      return localStorage.getItem(BOOST_ENABLED_KEY) !== "0";
    } catch {
      return true;
    }
  }

  function setBoostEnabled(on) {
    try {
      localStorage.setItem(BOOST_ENABLED_KEY, on ? "1" : "0");
    } catch { /* ignore */ }
    document.documentElement.classList.toggle("wecom-hide-boost", !on);
    syncThemeControls();
  }

  function isHideChatAvatar() {
    try {
      return localStorage.getItem(HIDE_CHAT_AVATAR_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setHideChatAvatar(on) {
    try {
      localStorage.setItem(HIDE_CHAT_AVATAR_KEY, on ? "1" : "0");
    } catch { /* ignore */ }
    document.documentElement.classList.toggle("wecom-hide-chat-avatar", !!on);
    syncThemeControls();
  }

  /* ============================== Base64 自动解码 ============================== */

  let activeBase64Popover = null;

  function isBase64DecodeEnabled() {
    try {
      return localStorage.getItem(BASE64_DECODE_KEY) !== "0";
    } catch {
      return true;
    }
  }

  function setBase64DecodeEnabled(on) {
    try {
      localStorage.setItem(BASE64_DECODE_KEY, on ? "1" : "0");
    } catch { /* ignore */ }
    syncThemeControls();
    if (!on) closeBase64Popover();
  }

  function decodeBase64(raw) {
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

  function fallbackCopyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch { /* ignore */ }
    ta.remove();
  }

  function copyTextToClipboard(text) {
    if (!text) return Promise.resolve(false);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => {
        fallbackCopyText(text);
        return true;
      });
    }
    fallbackCopyText(text);
    return Promise.resolve(true);
  }

  function closeBase64Popover() {
    if (activeBase64Popover) {
      activeBase64Popover.remove();
      activeBase64Popover = null;
    }
  }

  function showBase64Popover(decoded, selectedText, rect) {
    closeBase64Popover();
    if (!decoded || !rect) return;

    const isUrl = /^https?:\/\//i.test(decoded.trim());
    const isMagnet = /^magnet:\?xt=/i.test(decoded.trim());

    const popover = document.createElement("div");
    popover.className = "wecom-base64-popover";
    popover.style.visibility = "hidden";

    let footButtons = `
      <button type="button" class="wecom-base64-btn wecom-base64-copy-btn">
        ${ICONS.copy}
        <span>复制</span>
      </button>
    `;

    if (isUrl) {
      footButtons += `
        <a class="wecom-base64-btn primary wecom-base64-open-btn" href="${escapeHtml(decoded.trim())}" target="_blank" rel="noopener noreferrer">
          打开链接
        </a>
      `;
    } else if (isMagnet) {
      footButtons += `
        <a class="wecom-base64-btn primary wecom-base64-open-btn" href="${escapeHtml(decoded.trim())}">
          打开磁力链
        </a>
      `;
    }

    popover.innerHTML = `
      <div class="wecom-base64-popover-head">
        <div class="wecom-base64-popover-title">
          ${ICONS.code}
          <span>Base64 已解码</span>
        </div>
        <button type="button" class="wecom-base64-popover-close" aria-label="关闭">&times;</button>
      </div>
      <div class="wecom-base64-popover-body">
        <div class="wecom-base64-decoded-text">${escapeHtml(decoded)}</div>
      </div>
      <div class="wecom-base64-popover-foot">
        ${footButtons}
      </div>
    `;

    document.body.appendChild(popover);
    activeBase64Popover = popover;

    const popoverWidth = popover.offsetWidth || 320;
    const popoverHeight = popover.offsetHeight || 120;
    let left = Math.round(rect.left + rect.width / 2 - popoverWidth / 2);
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) left = window.innerWidth - popoverWidth - 12;

    let top = Math.round(rect.top - popoverHeight - 8);
    if (top < 10) {
      top = Math.round(rect.bottom + 8);
    }
    if (top + popoverHeight > window.innerHeight - 10) {
      top = Math.max(10, window.innerHeight - popoverHeight - 10);
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.visibility = "visible";

    popover.querySelector(".wecom-base64-popover-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeBase64Popover();
    });

    const copyBtn = popover.querySelector(".wecom-base64-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        void copyTextToClipboard(decoded).then(() => {
          const span = copyBtn.querySelector("span");
          if (span) span.textContent = "已复制!";
          copyBtn.classList.add("is-copied");
          setTimeout(() => {
            if (activeBase64Popover === popover) {
              if (span) span.textContent = "复制";
              copyBtn.classList.remove("is-copied");
            }
          }, 1500);
        });
      });
    }

    const openBtn = popover.querySelector(".wecom-base64-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
  }

  function handleBase64Selection(event) {
    if (!isBase64DecodeEnabled()) return;
    if (getViewMode() === "native" || otherThemeActive()) return;
    if (event?.target?.closest?.(".wecom-base64-popover")) return;

    setTimeout(() => {
      const selection = window.getSelection ? window.getSelection() : null;
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }
      const raw = selection.toString();
      if (!raw || !raw.trim()) return;

      const decoded = decodeBase64(raw);
      if (!decoded) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;

      showBase64Popover(decoded, raw, rect);
    }, 10);
  }

  function bindBase64Selection() {
    if (window.__wecomBase64SelectionBound) return;
    window.__wecomBase64SelectionBound = true;

    document.addEventListener("mouseup", handleBase64Selection);
    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End") {
        handleBase64Selection(e);
      }
    });

    document.addEventListener("pointerdown", (e) => {
      if (!activeBase64Popover) return;
      if (e.target.closest && e.target.closest(".wecom-base64-popover")) return;
      closeBase64Popover();
    });
  }

  function isImageAutoLayoutEnabled() {
    try {
      return localStorage.getItem(IMAGE_AUTO_LAYOUT_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setImageAutoLayoutEnabled(on) {
    try {
      localStorage.setItem(IMAGE_AUTO_LAYOUT_KEY, on ? "1" : "0");
    } catch { /* ignore */ }
    syncThemeControls();
    refreshChatMessagesLayout();
  }

  function getImageAutoLayoutSize() {
    try {
      const val = parseInt(localStorage.getItem(IMAGE_AUTO_LAYOUT_SIZE_KEY), 10);
      if (Number.isFinite(val) && val >= MIN_IMAGE_AUTO_LAYOUT_SIZE && val <= MAX_IMAGE_AUTO_LAYOUT_SIZE) {
        return val;
      }
    } catch { /* ignore */ }
    return DEFAULT_IMAGE_AUTO_LAYOUT_SIZE;
  }

  function normalizeImageAutoLayoutAspect(val) {
    const raw = String(val || "").trim();
    if (SUPPORTED_IMAGE_AUTO_LAYOUT_ASPECTS.includes(raw)) return raw;
    return DEFAULT_IMAGE_AUTO_LAYOUT_ASPECT;
  }

  function getImageAutoLayoutAspect() {
    try {
      return normalizeImageAutoLayoutAspect(localStorage.getItem(IMAGE_AUTO_LAYOUT_ASPECT_KEY));
    } catch {
      return DEFAULT_IMAGE_AUTO_LAYOUT_ASPECT;
    }
  }

  function computeImageAutoLayoutDimensions(size, aspect) {
    const baseSize = Math.min(MAX_IMAGE_AUTO_LAYOUT_SIZE, Math.max(MIN_IMAGE_AUTO_LAYOUT_SIZE, Number(size) || DEFAULT_IMAGE_AUTO_LAYOUT_SIZE));
    const normalizedAspect = normalizeImageAutoLayoutAspect(aspect);
    let width = baseSize;
    let height = baseSize;
    let cssAspect = "1 / 1";

    if (normalizedAspect === "4:3") {
      // 4:3 比例：以 baseSize 为基准高度，宽度为 baseSize * 4 / 3
      height = baseSize;
      width = Math.round(baseSize * 4 / 3);
      cssAspect = "4 / 3";
    } else if (normalizedAspect === "16:9") {
      // 16:9 比例：以 baseSize 为基准高度，宽度为 baseSize * 16 / 9
      height = baseSize;
      width = Math.round(baseSize * 16 / 9);
      cssAspect = "16 / 9";
    } else {
      // 1:1 比例：正方形
      height = baseSize;
      width = baseSize;
      cssAspect = "1 / 1";
    }

    return { width, height, aspect: normalizedAspect, cssAspect, baseSize };
  }

  function applyImageAutoLayoutSizeCss(size) {
    const num = Number(size) || getImageAutoLayoutSize();
    const curAspect = arguments[1] !== undefined ? normalizeImageAutoLayoutAspect(arguments[1]) : getImageAutoLayoutAspect();
    const dims = computeImageAutoLayoutDimensions(num, curAspect);
    document.documentElement.style.setProperty("--wecom-image-thumb-size", `${dims.baseSize}px`);
    document.documentElement.style.setProperty("--wecom-image-thumb-width", `${dims.width}px`);
    document.documentElement.style.setProperty("--wecom-image-thumb-height", `${dims.height}px`);
    document.documentElement.style.setProperty("--wecom-image-thumb-aspect", dims.cssAspect);
  }

  function setImageAutoLayoutSize(size) {
    const num = Math.min(MAX_IMAGE_AUTO_LAYOUT_SIZE, Math.max(MIN_IMAGE_AUTO_LAYOUT_SIZE, Number(size) || DEFAULT_IMAGE_AUTO_LAYOUT_SIZE));
    try {
      localStorage.setItem(IMAGE_AUTO_LAYOUT_SIZE_KEY, String(num));
    } catch { /* ignore */ }
    applyImageAutoLayoutSizeCss(num);
    syncThemeControls();
    refreshChatMessagesLayout();
  }

  function setImageAutoLayoutAspect(aspect) {
    const normalized = normalizeImageAutoLayoutAspect(aspect);
    try {
      localStorage.setItem(IMAGE_AUTO_LAYOUT_ASPECT_KEY, normalized);
    } catch { /* ignore */ }
    applyImageAutoLayoutSizeCss(getImageAutoLayoutSize(), normalized);
    syncThemeControls();
    refreshChatMessagesLayout();
  }

  const THEME_MODE_LABELS = Object.freeze({
    light: "浅色模式",
    dark: "深色模式",
    system: "跟随系统"
  });

  function themeModeDescription(mode) {
    return THEME_MODE_LABELS[normalizeThemeMode(mode)];
  }

  function setThemeMenuOpen(open) {
    const menu = document.querySelector(".wecom-theme-menu");
    const trigger = document.querySelector(".wecom-theme-options");
    if (!menu) return;
    menu.hidden = !open;
    trigger?.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) syncThemeControls();
  }

  function syncThemeControls() {
    const mode = getThemeMode();
    const dark = isDarkMode();
    const toggle = document.querySelector(".wecom-theme-toggle");
    if (toggle) {
      const label = toggle.querySelector(".wecom-theme-label");
      const icon = toggle.querySelector(".wecom-theme-icon");
      toggle.classList.toggle("is-dark", dark);
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.title = dark ? "切换到浅色模式" : "切换到深色模式";
      if (label) label.textContent = dark ? "浅色模式" : "深色模式";
      if (icon) icon.innerHTML = dark ? ICONS.sun : ICONS.moon;
    }
    const menu = document.querySelector(".wecom-theme-menu");
    if (!menu) return;
    menu.querySelectorAll("button[data-theme-mode]").forEach((button) => {
      const active = button.dataset.themeMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
    });
    const options = document.querySelector(".wecom-theme-options");
    if (options) options.title = `外观设置（${themeModeDescription(mode)}）`;

    const curTitleMode = getMaskTitleMode();
    menu.querySelectorAll("button[data-mask-title-mode]").forEach((button) => {
      const active = button.dataset.maskTitleMode === curTitleMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", active ? "true" : "false");
    });

    const maskAvatarBtn = menu.querySelector(".wecom-menu-mask-avatar");
    if (maskAvatarBtn) {
      const on = isMaskAvatar();
      maskAvatarBtn.classList.toggle("is-active", on);
      maskAvatarBtn.setAttribute("aria-checked", on ? "true" : "false");
      const badge = maskAvatarBtn.querySelector(".wecom-menu-state-badge");
      if (badge) {
        badge.textContent = on ? "已开启" : "已关闭";
        badge.className = `wecom-menu-state-badge ${on ? "is-on" : "is-off"}`;
      }
    }

    const hideChatAvatarBtn = menu.querySelector(".wecom-menu-toggle-hide-chat-avatar");
    if (hideChatAvatarBtn) {
      const on = isHideChatAvatar();
      hideChatAvatarBtn.classList.toggle("is-active", on);
      hideChatAvatarBtn.setAttribute("aria-checked", on ? "true" : "false");
      const badge = hideChatAvatarBtn.querySelector(".wecom-menu-state-badge");
      if (badge) {
        badge.textContent = on ? "已开启" : "已关闭";
        badge.className = `wecom-menu-state-badge ${on ? "is-on" : "is-off"}`;
      }
    }

    const chatAvatarToggleBtn = document.querySelector(".wecom-chat-avatar-toggle");
    if (chatAvatarToggleBtn) {
      const hidden = isHideChatAvatar();
      chatAvatarToggleBtn.classList.toggle("is-active", hidden);
      chatAvatarToggleBtn.setAttribute("aria-pressed", hidden ? "true" : "false");
      chatAvatarToggleBtn.title = hidden ? "显示对话头像" : "隐藏对话头像";
    }

    const boostBtn = menu.querySelector(".wecom-menu-toggle-boost");
    if (boostBtn) {
      const on = isBoostEnabled();
      boostBtn.classList.toggle("is-active", on);
      boostBtn.setAttribute("aria-checked", on ? "true" : "false");
      const badge = boostBtn.querySelector(".wecom-menu-state-badge");
      if (badge) {
        badge.textContent = on ? "已开启" : "已关闭";
        badge.className = `wecom-menu-state-badge ${on ? "is-on" : "is-off"}`;
      }
    }

    const base64Btn = menu.querySelector(".wecom-menu-toggle-base64");
    if (base64Btn) {
      const on = isBase64DecodeEnabled();
      base64Btn.classList.toggle("is-active", on);
      base64Btn.setAttribute("aria-checked", on ? "true" : "false");
      const badge = base64Btn.querySelector(".wecom-menu-state-badge");
      if (badge) {
        badge.textContent = on ? "已开启" : "已关闭";
        badge.className = `wecom-menu-state-badge ${on ? "is-on" : "is-off"}`;
      }
    }

    const imageLayoutBtn = menu.querySelector(".wecom-menu-toggle-image-layout");
    if (imageLayoutBtn) {
      const on = isImageAutoLayoutEnabled();
      imageLayoutBtn.classList.toggle("is-active", on);
      imageLayoutBtn.setAttribute("aria-checked", on ? "true" : "false");
      const badge = imageLayoutBtn.querySelector(".wecom-menu-state-badge");
      if (badge) {
        badge.textContent = on ? "已开启" : "已关闭";
        badge.className = `wecom-menu-state-badge ${on ? "is-on" : "is-off"}`;
      }
    }

    const imageSizeRow = menu.querySelector(".wecom-menu-image-size-row");
    if (imageSizeRow) {
      const isAuto = isImageAutoLayoutEnabled();
      imageSizeRow.style.opacity = isAuto ? "" : "0.55";
      const curSize = getImageAutoLayoutSize();
      const valEl = imageSizeRow.querySelector(".wecom-menu-size-val");
      if (valEl) valEl.textContent = `${curSize}px`;
      let matched = false;
      imageSizeRow.querySelectorAll(".wecom-size-chip").forEach((chip) => {
        const s = chip.dataset.size;
        if (s === "custom") return;
        const active = Number(s) === curSize;
        if (active) matched = true;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-checked", active ? "true" : "false");
      });
      const customChip = imageSizeRow.querySelector(".wecom-size-chip-custom");
      if (customChip) {
        customChip.classList.toggle("is-active", !matched);
        customChip.setAttribute("aria-checked", !matched ? "true" : "false");
        customChip.textContent = !matched ? `${curSize}px` : "自定义";
      }
    }

    const imageAspectRow = menu.querySelector(".wecom-menu-image-aspect-row");
    if (imageAspectRow) {
      const isAuto = isImageAutoLayoutEnabled();
      imageAspectRow.style.opacity = isAuto ? "" : "0.55";
      const curAspect = getImageAutoLayoutAspect();
      const valEl = imageAspectRow.querySelector(".wecom-menu-aspect-val");
      if (valEl) valEl.textContent = curAspect;
      imageAspectRow.querySelectorAll(".wecom-aspect-chip").forEach((chip) => {
        const a = chip.dataset.aspect;
        const active = a === curAspect;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-checked", active ? "true" : "false");
      });
    }
  }

  function bindThemeControls() {
    if (window.__wecomThemeControlsBound) return;
    window.__wecomThemeControlsBound = true;
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".wecom-theme-controls, .wecom-theme-menu")) setThemeMenuOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setThemeMenuOpen(false);
    });
  }

  function createThemeControls(rail) {
    const controls = document.createElement("div");
    controls.className = "wecom-theme-controls";
    controls.innerHTML =
      `<button type="button" class="wecom-rail-item wecom-theme-toggle" aria-pressed="false" title="切换深色/浅色模式">` +
      `<div class="wecom-rail-icon wecom-theme-icon">${ICONS.moon}</div>` +
      `<span class="wecom-rail-label wecom-theme-label">深色</span></button>` +
      `<button type="button" class="wecom-rail-item wecom-theme-options" aria-haspopup="menu" aria-expanded="false" title="外观设置">` +
      `<div class="wecom-rail-icon wecom-theme-icon">${ICONS.gear}</div>` +
      `<span class="wecom-rail-label">设置</span></button>`;
    const bottom = rail.querySelector(".wecom-rail-bottom");
    if (bottom) bottom.appendChild(controls);
    else rail.appendChild(controls);
    return controls;
  }

  function createThemeMenu() {
    const menu = document.createElement("div");
    menu.className = "wecom-theme-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "外观模式");
    menu.innerHTML =
      `<div class="wecom-theme-menu-title">外观模式</div>` +
      `<button type="button" role="menuitemradio" data-theme-mode="light" aria-checked="false">${ICONS.sun}<span>浅色模式</span></button>` +
      `<button type="button" role="menuitemradio" data-theme-mode="dark" aria-checked="false">${ICONS.moon}<span>深色模式</span></button>` +
      `<button type="button" role="menuitemradio" data-theme-mode="system" aria-checked="false">${ICONS.monitorSmall}<span>跟随系统</span></button>` +
      `<div class="wecom-theme-menu-title wecom-theme-menu-divider">伪装标题</div>` +
      `<button type="button" role="menuitemradio" data-mask-title-mode="all" aria-checked="false">` +
      `${ICONS.win}<span class="wecom-menu-label">全部（列表 + 详情）</span></button>` +
      `<button type="button" role="menuitemradio" data-mask-title-mode="list" aria-checked="false">` +
      `${ICONS.todo}<span class="wecom-menu-label">仅列表（灰字为真标题）</span></button>` +
      `<button type="button" role="menuitemradio" data-mask-title-mode="detail" aria-checked="false">` +
      `${ICONS.msg}<span class="wecom-menu-label">仅详情（聊天顶栏）</span></button>` +
      `<button type="button" role="menuitemradio" data-mask-title-mode="off" aria-checked="false">` +
      `${ICONS.circleOff}<span class="wecom-menu-label">关闭标题伪装</span></button>` +
      `<div class="wecom-theme-menu-title wecom-theme-menu-divider">伪装头像</div>` +
      `<button type="button" role="menuitemcheckbox" class="wecom-menu-mask-avatar" aria-checked="false">` +
      `${ICONS.disguise}<span class="wecom-menu-label">百家姓/九宫格头像</span><span class="wecom-menu-state-badge is-off">已关闭</span></button>` +
      `<button type="button" role="menuitemcheckbox" class="wecom-menu-toggle-hide-chat-avatar" aria-checked="false">` +
      `${ICONS.userOff}<span class="wecom-menu-label">隐藏对话详情头像</span><span class="wecom-menu-state-badge is-off">已关闭</span></button>` +
      `<div class="wecom-theme-menu-title wecom-theme-menu-divider">消息功能</div>` +
      `<button type="button" role="menuitemcheckbox" class="wecom-menu-toggle-boost" aria-checked="true">` +
      `${ICONS.boost}<span class="wecom-menu-label">显示消息 Boost</span><span class="wecom-menu-state-badge is-on">已开启</span></button>` +
      `<button type="button" role="menuitemcheckbox" class="wecom-menu-toggle-base64" aria-checked="true">` +
      `${ICONS.code}<span class="wecom-menu-label">划词自动解码 Base64</span><span class="wecom-menu-state-badge is-on">已开启</span></button>` +
      `<div class="wecom-theme-menu-title wecom-theme-menu-divider">详情排版</div>` +
      `<button type="button" role="menuitemcheckbox" class="wecom-menu-toggle-image-layout" aria-checked="false">` +
      `${ICONS.pic}<span class="wecom-menu-label">图片自动排版</span><span class="wecom-menu-state-badge is-off">已关闭</span></button>` +
      `<div class="wecom-menu-image-size-row" title="点击切换或自定义图片排版尺寸">` +
      `  <div class="wecom-menu-size-header"><span class="wecom-menu-sub-label">缩略图尺寸</span><span class="wecom-menu-size-val">100px</span></div>` +
      `  <div class="wecom-menu-size-chips">` +
      `    <button type="button" class="wecom-size-chip" data-size="80">80</button>` +
      `    <button type="button" class="wecom-size-chip" data-size="100">100</button>` +
      `    <button type="button" class="wecom-size-chip" data-size="120">120</button>` +
      `    <button type="button" class="wecom-size-chip" data-size="150">150</button>` +
      `    <button type="button" class="wecom-size-chip wecom-size-chip-custom" data-size="custom">自定义</button>` +
      `  </div>` +
      `</div>` +
      `<div class="wecom-menu-image-aspect-row" title="点击切换图片自动排版显示比例">` +
      `  <div class="wecom-menu-aspect-header"><span class="wecom-menu-sub-label">显示比例</span><span class="wecom-menu-aspect-val">1:1</span></div>` +
      `  <div class="wecom-menu-aspect-chips">` +
      `    <button type="button" class="wecom-aspect-chip" data-aspect="4:3">4:3</button>` +
      `    <button type="button" class="wecom-aspect-chip" data-aspect="1:1">1:1</button>` +
      `    <button type="button" class="wecom-aspect-chip" data-aspect="16:9">16:9</button>` +
      `  </div>` +
      `</div>` +
      `<button type="button" role="menuitem" class="wecom-menu-restore-native">${ICONS.external}<span>恢复原风格 (Alt+W)</span></button>` +
      `<button type="button" role="menuitem" class="wecom-check-update">${ICONS.refresh}<span>检查脚本更新</span></button>`;
    document.body.appendChild(menu);
    menu.addEventListener("click", (event) => {
      if (event.target.closest(".wecom-menu-restore-native")) {
        event.preventDefault();
        event.stopPropagation();
        setThemeMenuOpen(false);
        toggleViewModeByShortcut();
        return;
      }
      if (event.target.closest(".wecom-check-update")) {
        event.preventDefault();
        event.stopPropagation();
        setThemeMenuOpen(false);
        void checkForScriptUpdate(true);
        return;
      }
      const titleModeBtn = event.target.closest("button[data-mask-title-mode]");
      if (titleModeBtn) {
        event.preventDefault();
        event.stopPropagation();
        setMaskTitleMode(titleModeBtn.dataset.maskTitleMode);
        return;
      }
      const maskAvatarBtn = event.target.closest(".wecom-menu-mask-avatar");
      if (maskAvatarBtn) {
        event.preventDefault();
        event.stopPropagation();
        setMaskAvatar(!isMaskAvatar());
        return;
      }
      const hideChatAvatarBtn = event.target.closest(".wecom-menu-toggle-hide-chat-avatar");
      if (hideChatAvatarBtn) {
        event.preventDefault();
        event.stopPropagation();
        setHideChatAvatar(!isHideChatAvatar());
        return;
      }
      const boostBtn = event.target.closest(".wecom-menu-toggle-boost");
      if (boostBtn) {
        event.preventDefault();
        event.stopPropagation();
        setBoostEnabled(!isBoostEnabled());
        return;
      }
      const base64Btn = event.target.closest(".wecom-menu-toggle-base64");
      if (base64Btn) {
        event.preventDefault();
        event.stopPropagation();
        setBase64DecodeEnabled(!isBase64DecodeEnabled());
        return;
      }
      const imageLayoutBtn = event.target.closest(".wecom-menu-toggle-image-layout");
      if (imageLayoutBtn) {
        event.preventDefault();
        event.stopPropagation();
        setImageAutoLayoutEnabled(!isImageAutoLayoutEnabled());
        return;
      }
      const sizeChip = event.target.closest(".wecom-size-chip");
      if (sizeChip) {
        event.preventDefault();
        event.stopPropagation();
        const sizeVal = sizeChip.dataset.size;
        if (sizeVal === "custom") {
          const current = getImageAutoLayoutSize();
          const input = window.prompt("请输入图片自动排版缩略图尺寸 (像素 px，范围 50-400):", String(current));
          if (input !== null) {
            const parsed = parseInt(input.trim(), 10);
            if (!Number.isNaN(parsed) && parsed >= MIN_IMAGE_AUTO_LAYOUT_SIZE && parsed <= MAX_IMAGE_AUTO_LAYOUT_SIZE) {
              if (!isImageAutoLayoutEnabled()) {
                setImageAutoLayoutEnabled(true);
              }
              setImageAutoLayoutSize(parsed);
            } else if (!Number.isNaN(parsed)) {
              alert(`尺寸超出范围，请输入 ${MIN_IMAGE_AUTO_LAYOUT_SIZE} 到 ${MAX_IMAGE_AUTO_LAYOUT_SIZE} 之间的数值`);
            }
          }
        } else {
          if (!isImageAutoLayoutEnabled()) {
            setImageAutoLayoutEnabled(true);
          }
          setImageAutoLayoutSize(Number(sizeVal));
        }
        return;
      }
      const aspectChip = event.target.closest(".wecom-aspect-chip");
      if (aspectChip) {
        event.preventDefault();
        event.stopPropagation();
        const aspectVal = aspectChip.dataset.aspect;
        if (!isImageAutoLayoutEnabled()) {
          setImageAutoLayoutEnabled(true);
        }
        setImageAutoLayoutAspect(aspectVal);
        return;
      }
      const option = event.target.closest("button[data-theme-mode]");
      if (!option) return;
      event.preventDefault();
      event.stopPropagation();
      setThemeMode(option.dataset.themeMode);
      setThemeMenuOpen(false);
    });
    return menu;
  }

  function bindThemeControlButtons(controls) {
    const toggle = controls.querySelector(".wecom-theme-toggle");
    if (toggle && !toggle.dataset.bound) {
      toggle.dataset.bound = "1";
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setThemeMode(isDarkMode() ? "light" : "dark");
      });
    }
    const options = controls.querySelector(".wecom-theme-options");
    if (options && !options.dataset.bound) {
      options.dataset.bound = "1";
      options.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const menu = document.querySelector(".wecom-theme-menu");
        setThemeMenuOpen(!!menu?.hidden);
      });
    }
  }

  function ensureThemeControls(rail) {
    if (!rail || !document.body) return;
    const controls = rail.querySelector(".wecom-theme-controls") || createThemeControls(rail);
    let menu = document.querySelector(".wecom-theme-menu");
    if (menu && !menu.querySelector("button[data-mask-title-mode]")) {
      menu.remove();
      menu = null;
    }
    if (!menu) createThemeMenu();
    bindThemeControlButtons(controls);
    bindThemeControls();
    syncThemeControls();
  }

  /* ============================== 脚本更新 ============================== */

  // 保留 @grant none，避免把依赖 window.require / Discourse 的桥接迁入沙箱。
  // 发布时用 scripts/release.py 同步此版本、头部、meta.js 和 README。
  const SCRIPT_VERSION = "0.7.26";
  const SCRIPT_REPOSITORY_URL = "https://github.com/samsamsue/wecom_v2linuxdo";
  const SCRIPT_UPDATE_URL = "https://raw.githubusercontent.com/samsamsue/wecom_v2linuxdo/main/linuxdo-wecom.meta.js";
  const SCRIPT_DOWNLOAD_URL = "https://raw.githubusercontent.com/samsamsue/wecom_v2linuxdo/main/linuxdo-wecom.user.js";
  const UPDATE_CACHE_KEY = "linuxdo-wecom-update-cache";
  const UPDATE_DISMISS_KEY = "linuxdo-wecom-update-dismiss";
  const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  const UPDATE_RETRY_INTERVAL_MS = 15 * 60 * 1000;
  const UPDATE_DISMISS_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const UPDATE_REQUEST_TIMEOUT_MS = 8000;
  let updateCheckPromise = null;
  const updateMemory = new Map();

  function validScriptVersion(version) {
    return typeof version === "string" && /^\d{1,9}(?:\.\d{1,9}){1,3}$/.test(version);
  }

  function compareScriptVersions(left, right) {
    const a = left.split(".").map(Number);
    const b = right.split(".").map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const difference = (a[i] || 0) - (b[i] || 0);
      if (difference) return Math.sign(difference);
    }
    return 0;
  }

  function currentScriptVersion() {
    // GM_info 在 Tampermonkey 的 @grant none 下仍可用；其他注入方式使用发布版本。
    const version = typeof GM_info !== "undefined" ? GM_info?.script?.version : "";
    return validScriptVersion(version) ? version : SCRIPT_VERSION;
  }

  function readUpdateState(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (value && typeof value === "object" && !Array.isArray(value)) return value;
    } catch { /* 存储不可用时仍能在本页检查、稍后提醒 */ }
    return updateMemory.get(key) || {};
  }

  function writeUpdateState(key, value) {
    updateMemory.set(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }

  function parseUpdateMetadata(text) {
    const header = String(text).match(/^\s*\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==/m)?.[1];
    if (!header) throw new Error("无效的脚本元数据");
    const field = (name) => header.match(new RegExp(`^// @${name}\\s+(.+)$`, "m"))?.[1].trim();
    const version = field("version");
    if (field("name") !== "Linux DO · 企业微信 IM 外观" || field("namespace") !== "https://linux.do/" || !validScriptVersion(version)) {
      throw new Error("脚本标识或版本号不匹配");
    }
    return version;
  }

  async function fetchLatestScriptVersion() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPDATE_REQUEST_TIMEOUT_MS);
    try {
      // 仅读取元数据，不执行远程代码，也不携带站点 Cookie / Referer。
      const response = await fetch(`${SCRIPT_UPDATE_URL}?t=${Date.now()}`, {
        signal: controller.signal, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseUpdateMetadata(await response.text());
    } finally {
      clearTimeout(timeout);
    }
  }

  function showUpdateNotice(state, latestVersion = "") {
    if (!document.body || getViewMode() === "native" || otherThemeActive()) return;
    let notice = document.querySelector(".wecom-update-notice");
    if (!notice) {
      notice = document.createElement("section");
      notice.className = "wecom-update-notice";
      notice.innerHTML =
        `<div role="status" aria-live="polite" aria-atomic="true">` +
        `<div class="wecom-update-notice-title">${ICONS.refresh}<span></span></div>` +
        `<div class="wecom-update-notice-message"></div></div>` +
        `<div class="wecom-update-notice-actions">` +
        `<a class="wecom-update-install" target="_blank" rel="noopener noreferrer">立即更新</a>` +
        `<a class="wecom-update-github" target="_blank" rel="noopener noreferrer">前往 GitHub</a>` +
        `<button type="button" class="wecom-update-dismiss">关闭</button></div>`;
      notice.querySelector(".wecom-update-install").href = SCRIPT_DOWNLOAD_URL;
      notice.querySelector(".wecom-update-github").href = SCRIPT_REPOSITORY_URL;
      notice.querySelector(".wecom-update-dismiss").addEventListener("click", () => {
        if (notice.dataset.version) {
          writeUpdateState(UPDATE_DISMISS_KEY, { version: notice.dataset.version, dismissedAt: Date.now() });
        }
        notice.remove();
      });
      notice.querySelector(".wecom-update-install").addEventListener("click", () => {
        // 打开安装页不代表安装成功；不要自动刷新，以免丢失正在编辑的回复。
        notice.querySelector(".wecom-update-notice-message").textContent = "请在脚本管理器中确认更新，完成后刷新此页面。若打开的是源码，请在油猴管理面板中检查更新。";
      });
      document.body.appendChild(notice);
    }
    const current = currentScriptVersion();
    const messages = {
      available: ["新版本已发布", `当前版本：${current}　最新版本：${latestVersion}\n点击更新，在脚本管理器中确认后刷新页面。`],
      checking: ["正在检查脚本更新", `当前版本：${current}`],
      latest: ["暂无新版本", `当前版本：${current}，未发现更高版本。`],
      error: ["暂时无法检查更新", "网络或站点策略可能阻止了检查，请稍后重试；也可直接打开安装页或前往 GitHub。"]
    };
    const [title, message] = messages[state];
    notice.dataset.version = state === "available" ? latestVersion : "";
    notice.querySelector(".wecom-update-notice-title span").textContent = title;
    notice.querySelector(".wecom-update-notice-message").textContent = message;
    const install = notice.querySelector(".wecom-update-install");
    install.hidden = state !== "available" && state !== "error";
    install.textContent = state === "error" ? "打开安装页" : "立即更新";
    notice.querySelector(".wecom-update-dismiss").textContent = state === "available" ? "稍后提醒" : "关闭";
  }

  async function checkForScriptUpdate(manual = false) {
    if (!manual && (document.visibilityState === "hidden" || getViewMode() === "native" || otherThemeActive())) return;
    const now = Date.now();
    let cache = readUpdateState(UPDATE_CACHE_KEY);
    const age = now - cache.checkedAt;
    const cacheFresh = Number.isFinite(age) && age >= 0 && age < (cache.failed ? UPDATE_RETRY_INTERVAL_MS : UPDATE_CHECK_INTERVAL_MS);
    if (manual) showUpdateNotice("checking");
    if (manual || !cacheFresh || (!cache.failed && !validScriptVersion(cache.latestVersion))) {
      if (!updateCheckPromise) {
        updateCheckPromise = fetchLatestScriptVersion().then(
          (latestVersion) => ({ checkedAt: Date.now(), latestVersion, failed: false }),
          () => ({ checkedAt: Date.now(), failed: true })
        ).then((result) => {
          writeUpdateState(UPDATE_CACHE_KEY, result);
          return result;
        }).finally(() => { updateCheckPromise = null; });
      }
      cache = await updateCheckPromise;
    }
    if (cache.failed) {
      if (manual) showUpdateNotice("error");
      return;
    }
    if (compareScriptVersions(cache.latestVersion, currentScriptVersion()) <= 0) {
      document.querySelector(".wecom-update-notice")?.remove();
      if (manual) showUpdateNotice("latest");
      return;
    }
    const dismissed = readUpdateState(UPDATE_DISMISS_KEY);
    const dismissedAge = now - dismissed.dismissedAt;
    if (!manual && dismissed.version === cache.latestVersion && dismissedAge >= 0 && dismissedAge < UPDATE_DISMISS_INTERVAL_MS) return;
    // 已显示的提示不重复改写，避免覆盖“安装后刷新”提示。
    if (manual || document.querySelector(".wecom-update-notice")?.dataset.version !== cache.latestVersion) {
      showUpdateNotice("available", cache.latestVersion);
    }
  }

  function scheduleScriptUpdateCheck() {
    const check = () => { void checkForScriptUpdate(); };
    setTimeout(check, 5000);
    setInterval(check, UPDATE_RETRY_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  }

  /* ============================== 脚本更新结束 ============================== */

  /** 企业微信工作台导航项（对齐官方截图：消息、历史、日程、待办、会议、智能文档、智能总结、工作台、通讯录、微盘、高级功能、分组） */
  const RAIL_DECO_ITEMS = [
    { key: "history", icon: "history", label: "历史" },
    { key: "cal", icon: "cal", label: "日程" },
    { key: "todo", icon: "todo", label: "待办" },
    { key: "meet", icon: "meet", label: "会议" },
    { key: "smartdoc", icon: "smartdoc", label: "智能文档", dot: true },
    { key: "summary", icon: "spark", label: "智能总结" },
    { key: "work", icon: "work", label: "工作台" },
    { key: "book", icon: "book", label: "通讯录" },
    { key: "disk", icon: "disk", label: "微盘" },
    { key: "advanced", icon: "advanced", label: "高级功能" },
    { key: "group", icon: "group", label: "分组" }
  ];

  const RAIL_GROUP_ITEMS = [];

  /* ---------- 组织 chip：点击改名 / 换图标 ---------- */
  const ORG_NAME_KEY = "linuxdo-wecom-org-name";
  const ORG_ICON_KEY = "linuxdo-wecom-org-icon";

  function getOrgName() {
    const defaultOrg = IS_V2EX ? "v2ex.com" : "linux.do";
    try { return localStorage.getItem(ORG_NAME_KEY) || defaultOrg; } catch { return defaultOrg; }
  }

  function getOrgIcon() {
    const defaultIcon = IS_V2EX ? "v2" : "do";
    try { return localStorage.getItem(ORG_ICON_KEY) || defaultIcon; } catch { return defaultIcon; }
  }

  function renderOrgChip(rail) {
    const root = rail || document.querySelector(".wecom-rail");
    if (!root) return;
    const logo = root.querySelector(".wecom-rail-org-logo");
    const name = root.querySelector(".wecom-rail-org-name");
    if (!logo || !name) return;
    const icon = getOrgIcon();
    name.textContent = getOrgName();
    if (/^(https?:\/\/|data:image)/i.test(icon)) {
      logo.innerHTML = `<img src="${escapeHtml(icon)}" alt="">`;
    } else {
      logo.textContent = [...icon].slice(0, 2).join("") || "do";
    }
  }

  function bindOrgChip(rail) {
    const chip = rail?.querySelector(".wecom-rail-org-chip");
    if (!chip || chip.dataset.bound === "1") return;
    chip.dataset.bound = "1";
    const logo = chip.querySelector(".wecom-rail-org-logo");
    const name = chip.querySelector(".wecom-rail-org-name");
    if (logo) {
      logo.title = "点击更换图标（1~2 个字 / emoji / 图片 URL）";
      logo.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = window.prompt("团队图标：1~2 个字、emoji 或图片 URL", getOrgIcon());
        if (v === null) return;
        try { localStorage.setItem(ORG_ICON_KEY, v.trim() || "do"); } catch { /* ignore */ }
        renderOrgChip(rail);
      });
    }
    if (name) {
      name.title = "点击修改团队名称";
      name.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = window.prompt("团队名称", getOrgName());
        if (v === null) return;
        try { localStorage.setItem(ORG_NAME_KEY, v.trim() || "linux.do"); } catch { /* ignore */ }
        renderOrgChip(rail);
      });
    }
  }

  /* ---------- rail 停靠栏固定为 56px ---------- */
  function getRailWidth() {
    return RAIL_WIDTH;
  }

  function applyRailWidth(w) {
    document.documentElement.style.setProperty("--wc-nav", `${RAIL_WIDTH}px`);
  }

  function ensureRailResizer() {
    let rz = document.querySelector(".wecom-rail-resizer");
    if (rz) return rz;
    rz = document.createElement("div");
    rz.className = "wecom-rail-resizer";
    rz.title = "拖动调整侧栏宽度（双击复位）";
    document.body.appendChild(rz);

    let dragging = false;
    let startX = 0;
    let startW = 0;
    rz.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startW = parseInt(document.documentElement.style.getPropertyValue("--wc-nav"), 10) || getRailWidth();
      rz.classList.add("dragging");
      try { rz.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    });
    rz.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      applyRailWidth(startW + e.clientX - startX);
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      rz.classList.remove("dragging");
      const w = parseInt(document.documentElement.style.getPropertyValue("--wc-nav"), 10);
      if (w) {
        try { localStorage.setItem(RAIL_W_KEY, String(w)); } catch { /* ignore */ }
      }
    };
    rz.addEventListener("pointerup", endDrag);
    rz.addEventListener("pointercancel", endDrag);
    rz.addEventListener("dblclick", () => {
      applyRailWidth(RAIL_WIDTH);
      try { localStorage.removeItem(RAIL_W_KEY); } catch { /* ignore */ }
    });
    return rz;
  }

  /* ---------- 中栏会话列表右边缘拖拽调宽 ---------- */
  const LIST_W_KEY = "linuxdo-wecom-list-width";
  const LIST_W_MIN = 200;
  const LIST_W_MAX = 520;

  function getListWidth() {
    try {
      const w = parseInt(localStorage.getItem(LIST_W_KEY), 10);
      if (w >= LIST_W_MIN && w <= LIST_W_MAX) return w;
    } catch { /* ignore */ }
    return LIST_WIDTH;
  }

  function applyListWidth(w) {
    const width = Math.min(LIST_W_MAX, Math.max(LIST_W_MIN, Math.round(w)));
    document.documentElement.style.setProperty("--wc-list", `${width}px`);
  }

  function ensureListResizer() {
    let rz = document.querySelector(".wecom-list-resizer");
    if (rz) return rz;
    rz = document.createElement("div");
    rz.className = "wecom-list-resizer";
    rz.title = "拖动调整会话列表宽度（双击恢复默认 280px）";
    document.body.appendChild(rz);

    let dragging = false;
    let startX = 0;
    let startW = 0;

    const onMove = (e) => {
      if (!dragging) return;
      applyListWidth(startW + e.clientX - startX);
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("wecom-resizing-list");
      rz.classList.remove("dragging");
      const w = parseInt(document.documentElement.style.getPropertyValue("--wc-list"), 10);
      if (w) {
        try { localStorage.setItem(LIST_W_KEY, String(w)); } catch { /* ignore */ }
      }
    };

    rz.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startW = parseInt(document.documentElement.style.getPropertyValue("--wc-list"), 10) || getListWidth();
      rz.classList.add("dragging");
      document.body.classList.add("wecom-resizing-list");
      try { rz.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      e.preventDefault();
    });

    rz.addEventListener("dblclick", () => {
      applyListWidth(LIST_WIDTH);
      try { localStorage.removeItem(LIST_W_KEY); } catch { /* ignore */ }
    });
    return rz;
  }

  function bindRailSearch(rail) {
    if (!rail) return;
    let wrap = rail.querySelector(".wecom-rail-search");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "wecom-rail-search";
      const head = rail.querySelector(".wecom-rail-head");
      if (head && head.nextSibling) rail.insertBefore(wrap, head.nextSibling);
      else rail.prepend(wrap);
    }
    // 旧版装饰块 / 缺 input 时升级为可输入搜索
    if (!wrap.querySelector("input")) {
      wrap.innerHTML = `
        <form action="/search" method="get" role="search">
          ${ICONS.search}
          <input type="search" name="q" placeholder="搜索" autocomplete="off" enterkeyhint="search" aria-label="搜索">
        </form>`;
      delete rail.dataset.searchBound;
    }
    if (rail.dataset.searchBound === "1") return;
    const form = wrap.querySelector("form");
    const input = wrap.querySelector("input");
    if (!form || !input) return;
    rail.dataset.searchBound = "1";

    input.addEventListener("input", () => {
      syncSearchToNative(input.value);
    });
    input.addEventListener("focus", () => {
      syncSearchToNative(input.value);
      const native = getNativeSearchInput();
      if (native && native !== input) {
        try { native.dispatchEvent(new FocusEvent("focus", { bubbles: true })); } catch { /* ignore */ }
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      submitNativeSearch(input.value);
    });
  }


  /* ============================== 会话栏搜索 ============================== */

  function bindSearchBox(container) {
    if (!container || container.dataset.searchBound === "1") return;
    const form = container.querySelector(".wecom-list-search form");
    const input = form?.querySelector("input");
    if (!form || !input) return;
    container.dataset.searchBound = "1";
    input.addEventListener("input", () => {
      if (listState.listMode === "history") {
        renderHistoryList(input.value.trim());
        return;
      }
      syncSearchToNative(input.value);
    });
    input.addEventListener("focus", () => {
      if (listState.listMode === "history") return;
      syncSearchToNative(input.value);
      const native = getNativeSearchInput();
      if (native && native !== input) {
        try { native.dispatchEvent(new FocusEvent("focus", { bubbles: true })); } catch { /* ignore */ }
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (listState.listMode === "history") {
        renderHistoryList(input.value.trim());
        return;
      }
      submitNativeSearch(input.value);
    });
  }

  function ensureRail() {
    let rail = document.querySelector(".wecom-rail");
    // 重建为企业微信 56px 垂直标准停靠栏
    if (rail && (!rail.querySelector("[data-rail-key='group']") || !rail.querySelector("[data-rail-key='history']") || rail.querySelector(".wecom-rail-groups"))) {
      rail.remove();
      rail = null;
    }
    if (rail) {
      bindRailAvatarNotif(rail);
      bindRailNavClicks(rail);
      ensureThemeControls(rail);
      syncRail();
      return rail;
    }
    rail = document.createElement("nav");
    rail.className = "wecom-rail";
    rail.setAttribute("aria-label", "企业微信工作台导航");

    const head = document.createElement("div");
    head.className = "wecom-rail-head";
    head.innerHTML =
      `<div class="me-chip" title="通知与个人菜单">` +
      `<div class="wecom-rail-avatar"></div>` +
      `<span class="wecom-rail-avatar-badge" style="display:none"></span>` +
      `<span class="wecom-rail-avatar-status"></span>` +
      `</div>`;
    rail.appendChild(head);

    const items = document.createElement("div");
    items.className = "wecom-rail-items";
    items.innerHTML =
      `<button type="button" class="wecom-rail-item active" data-rail-key="chat" title="消息">` +
      `<div class="wecom-rail-icon">${ICONS.msg}</div>` +
      `<span class="wecom-rail-label">消息</span>` +
      `<span class="wecom-rail-badge" style="display:none"></span></button>` +
      RAIL_DECO_ITEMS.map((item) =>
        `<button type="button" class="wecom-rail-item" data-rail-key="${item.key}" title="${item.label}">` +
        `<div class="wecom-rail-icon">${ICONS[item.icon] || ""}</div>` +
        `<span class="wecom-rail-label">${item.label}</span>` +
        `${item.dot ? '<i class="wecom-rail-dot"></i>' : ""}</button>`
      ).join("") +
      `<button type="button" class="wecom-rail-item wecom-rail-more" data-rail-key="group" title="展开/收起话题导航" aria-expanded="false">` +
      `<div class="wecom-rail-icon">${ICONS.group}</div>` +
      `<span class="wecom-rail-label">分组</span></button>`;
    rail.appendChild(items);

    const bottom = document.createElement("div");
    bottom.className = "wecom-rail-bottom";
    rail.appendChild(bottom);

    document.body.appendChild(rail);
    ensureThemeControls(rail);
    bindRailAvatarNotif(rail);
    bindRailNavClicks(rail);

    const groupBtn = rail.querySelector('[data-rail-key="group"]');
    groupBtn?.addEventListener("click", () => setNav2Open(!isNav2Open()));

    setNav2Open(isNav2Open());
    syncRail();
    return rail;
  }

  let notificationCountOverride = null;
  let lastKnownRawNotifCount = 0;

  /** 消除未读通知角标（支持 Linux DO 与 V2EX） */
  function clearNotificationBadge() {
    notificationCountOverride = 0;
    const avatarBadge = document.querySelector(".wecom-rail-avatar-badge");
    if (avatarBadge) {
      avatarBadge.style.display = "none";
      avatarBadge.textContent = "";
    }
    // 清除 V2EX 原生 DOM 中的未读提示文本
    if (IS_V2EX) {
      const notifLink = document.querySelector("#Top a[href^='/notifications'], #Rightbar a[href^='/notifications']");
      if (notifLink) {
        notifLink.textContent = notifLink.textContent.replace(/\d+\s*条未读提醒?/g, "").replace(/\(\d+\)/g, "");
      }
    }
    // 同步更新 Discourse Ember current-user 与原生通知角标
    try {
      const owner = getEmberOwner();
      const user = safeLookup(owner, "service:current-user") || window.Discourse?.User?.current?.();
      if (user) {
        user.set?.("unread_notifications", 0);
        user.set?.("all_unread_notifications_count", 0);
        user.set?.("unread_high_priority_notifications", 0);
        user.set?.("new_personal_messages_notifications_count", 0);
      }
    } catch { /* ignore */ }
    const domBadges = document.querySelectorAll(
      "#current-user .badge-notification, " +
      ".header-dropdown-toggle.current-user .badge-notification, " +
      "#toggle-current-user .badge-notification, " +
      ".current-user .badge-notification"
    );
    domBadges.forEach((b) => {
      b.classList.remove("unread");
      b.remove();
    });
  }

  /** 递减或消除未读通知角标 */
  function decrementNotificationBadge() {
    const current = getUnreadNotificationCount();
    if (current <= 1) {
      clearNotificationBadge();
      return;
    }
    const next = current - 1;
    notificationCountOverride = next;
    const avatarBadge = document.querySelector(".wecom-rail-avatar-badge");
    if (avatarBadge) {
      avatarBadge.style.display = next > 0 ? "" : "none";
      avatarBadge.textContent = next > 99 ? "99+" : String(next);
    }
  }

  /** 读取未读通知数 */
  function getUnreadNotificationCount() {
    let raw = 0;
    if (IS_V2EX) {
      const notifLink = document.querySelector("#Top a[href^='/notifications'], #Rightbar a[href^='/notifications']");
      if (notifLink) {
        const text = notifLink.textContent || "";
        const m = text.match(/\d+/);
        if (m) raw = parseInt(m[0], 10);
      }
    } else {
      try {
        const owner = getEmberOwner();
        const user =
          safeLookup(owner, "service:current-user") ||
          window.Discourse?.User?.current?.() ||
          null;
        if (user) {
          const pick = (key) => {
            try {
              const v = user.get?.(key);
              if (v != null && v !== "") return Number(v);
            } catch { /* ignore */ }
            const direct = user[key];
            return direct == null || direct === "" ? null : Number(direct);
          };
          const all = pick("all_unread_notifications_count");
          if (all != null && !Number.isNaN(all)) raw = Math.max(0, all);
          else {
            const unread = pick("unread_notifications");
            const high = pick("unread_high_priority_notifications");
            const pm = pick("new_personal_messages_notifications_count");
            const sum = (unread || 0) + (high || 0) + (pm || 0);
            if (sum > 0) raw = sum;
            else if (unread != null && !Number.isNaN(unread)) raw = Math.max(0, unread);
          }
        }
      } catch { /* ignore */ }

      if (raw === 0) {
        const domBadge = document.querySelector(
          "#current-user .badge-notification, " +
          ".header-dropdown-toggle.current-user .badge-notification, " +
          "#toggle-current-user .badge-notification, " +
          ".current-user .badge-notification"
        );
        if (domBadge) {
          const text = (domBadge.textContent || "").replace(/\s+/g, "").trim();
          if (/^\d+$/.test(text)) raw = Number(text);
          else if (/\d/.test(text)) {
            const n = parseInt(text, 10);
            if (!Number.isNaN(n)) raw = Math.min(n, 99);
          } else if (domBadge.classList.contains("unread") || domBadge.querySelector("svg")) {
            raw = 1;
          }
        }
      }
    }

    if (raw > lastKnownRawNotifCount) {
      notificationCountOverride = null;
    }
    lastKnownRawNotifCount = raw;

    if (notificationCountOverride !== null) {
      return notificationCountOverride;
    }
    return raw;
  }

  function syncRail() {
    // 当前用户头像与名称
    const avatarEl = document.querySelector(".wecom-rail-avatar");
    if (!avatarEl) return;

    const disguiseId = getRailDisguiseAvatarId();
    const disguisePreset = RAIL_DISGUISE_AVATARS.find((a) => a.id === disguiseId);

    if (disguisePreset) {
      if (avatarEl.dataset.bound !== "disguise-" + disguisePreset.id) {
        avatarEl.dataset.bound = "disguise-" + disguisePreset.id;
        avatarEl.innerHTML = disguisePreset.svg;
        avatarEl.style.background = "transparent";
      }
      avatarEl.setAttribute("title", `当前头像：${disguisePreset.name}（右键切换伪装头像样式）`);
    } else {
      // 原生头像兜底（若选择 native）
      const img = document.querySelector(IS_V2EX ? "#Rightbar .avatar, #Top .avatar, #current-user img" : "#current-user img");
      const name = getCurrentUsername();
      if (img && img.src) {
        if (avatarEl.dataset.bound !== img.src) {
          avatarEl.dataset.bound = img.src;
          avatarEl.innerHTML = `<img src="${escapeHtml(img.src)}" alt="">`;
          avatarEl.style.background = "transparent";
        }
      } else if (name && avatarEl.dataset.bound !== name) {
        avatarEl.dataset.bound = name;
        avatarEl.textContent = avatarLetter(name);
        avatarEl.style.background = avatarColor(name);
      }
      avatarEl.setAttribute("title", "当前头像：原站真实头像（右键切换为伪装头像）");
    }

    const name = getCurrentUsername();
    const currentName = document.querySelector(".wecom-current-user-name");
    if (currentName) {
      currentName.textContent = (disguisePreset || isMaskAvatar()) ? "企业员工" : (name || getOrgName());
    }

    // 头像通知角标
    const notifCount = getUnreadNotificationCount();
    const avatarBadge = document.querySelector(".wecom-rail-avatar-badge");
    if (avatarBadge) {
      avatarBadge.style.display = notifCount > 0 ? "" : "none";
      avatarBadge.textContent = notifCount > 99 ? "99+" : String(notifCount);
    }

    // 「消息」项角标：显示新主题数（从 .show-more.has-topics 提取）
    syncChatBadge();
  }

  /* ============================== 新主题角标与「消息」刷新回到顶部 ============================== */

  const SHOW_MORE_TOPICS_SEL = [
    ".show-more.has-topics",
    ".has-topics.show-more",
    ".show-more[class*='has-topics']",
    "[class*='show-more'][class*='has-topics']",
    ".alert-info.has-topics",
    ".topic-list-container .show-more",
    ".contents .show-more",
    "#main-outlet .show-more"
  ].join(", ");

  function findShowMoreElement() {
    return document.querySelector(SHOW_MORE_TOPICS_SEL);
  }

  /** 读取新主题数（优先从原生 .show-more.has-topics 提取） */
  function getNewTopicsCount() {
    // 1. 优先从 DOM 中的 .show-more.has-topics 提取
    const showMoreEl = findShowMoreElement();
    if (showMoreEl) {
      if (showMoreEl.style.display !== "none" && !showMoreEl.classList.contains("hidden")) {
        const text = (showMoreEl.textContent || "").trim();
        const match = text.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!Number.isNaN(num) && num > 0) return num;
        }
        if (showMoreEl.classList.contains("has-topics") || /主题|topic/i.test(text)) {
          return 1;
        }
      }
    }

    // 2. 备选：从 Discourse Ember discovery 控制器读取
    try {
      const owner = getEmberOwner();
      if (owner) {
        const discovery = safeLookup(owner, "controller:discovery/topics") || safeLookup(owner, "controller:discovery");
        if (discovery) {
          const count = discovery.get?.("newTopicsCount") ?? discovery.newTopicsCount;
          if (typeof count === "number" && count > 0) return count;
        }
      }
    } catch { /* ignore */ }

    return 0;
  }

  /** 同步「消息」项新主题角标 */
  function syncChatBadge() {
    const badge = document.querySelector('[data-rail-key="chat"] .wecom-rail-badge');
    if (!badge) return;
    const newTopics = getNewTopicsCount();
    if (newTopics > 0) {
      badge.style.display = "";
      badge.textContent = newTopics > 99 ? "99+" : String(newTopics);
      badge.title = `${newTopics} 个新主题，点击刷新列表并回到顶部`;
    } else {
      badge.style.display = "none";
      badge.textContent = "";
      badge.removeAttribute("title");
    }
  }

  let syncChatBadgeTimer = null;
  function scheduleSyncChatBadge() {
    if (syncChatBadgeTimer) return;
    syncChatBadgeTimer = setTimeout(() => {
      syncChatBadgeTimer = null;
      syncChatBadge();
    }, 200);
  }

  /** 点击左侧「消息」图标：回到顶部 + 刷新会话列表 */
  function handleChatNavClick() {
    closeNotifMenu();

    // 1. 确保停靠栏「消息」项处于 active 态
    const chatBtn = document.querySelector('.wecom-rail-item[data-rail-key="chat"]');
    if (chatBtn) {
      const rail = chatBtn.closest(".wecom-rail");
      if (rail) {
        rail.querySelectorAll(".wecom-rail-item").forEach((item) => {
          if (item.dataset.railKey === "chat") item.classList.add("active");
          else if (item.dataset.railKey !== "group") item.classList.remove("active");
        });
      }
    }

    if (listState.listMode === "history") {
      switchToListMode("chat");
      return;
    }

    // 若当前处于原生未支持页面（例如 /u/... 个人中心），点击「消息」应切回首页三栏
    const currentPath = location.pathname;
    if (!isHomePath(currentPath) && !isTopicPath(currentPath)) {
      navigateInApp(IS_V2EX ? "/?tab=all" : "/latest");
      return;
    }

    // 2. 消息图标微动效反馈
    const iconEl = chatBtn?.querySelector(".wecom-rail-icon");
    if (iconEl) {
      iconEl.classList.remove("wecom-refreshing");
      void iconEl.offsetWidth;
      iconEl.classList.add("wecom-refreshing");
      setTimeout(() => iconEl.classList.remove("wecom-refreshing"), 600);
    }

    // 3. 会话列表回到顶部（平滑滚动）
    const listBody = document.querySelector(".wecom-list-body");
    if (listBody) {
      listBody.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 4. 若存在原生 .show-more.has-topics，触发点击并清理
    const showMoreEl = findShowMoreElement();
    if (showMoreEl) {
      const clickTarget = showMoreEl.querySelector("a, button") || showMoreEl;
      try { clickTarget.click(); } catch { /* ignore */ }
      try { showMoreEl.remove(); } catch { /* ignore */ }
    }

    // 5. 强制重新拉取当前列表数据（刷新列表）
    const apiPath = IS_V2EX && listState.apiPath === "/notifications"
      ? "/?tab=all"
      : (listState.apiPath || listApiForPath(location.pathname, location.search) || "/latest.json");
    loadList(apiPath, true);

    // 6. 立即更新角标
    syncChatBadge();
  }

  /** 点击左侧「历史」图标：切换中栏至浏览历史模式 */
  function handleHistoryNavClick() {
    closeNotifMenu();

    const historyBtn = document.querySelector('.wecom-rail-item[data-rail-key="history"]');
    if (historyBtn) {
      const rail = historyBtn.closest(".wecom-rail");
      if (rail) {
        rail.querySelectorAll(".wecom-rail-item").forEach((item) => {
          if (item.dataset.railKey === "history") item.classList.add("active");
          else if (item.dataset.railKey !== "group") item.classList.remove("active");
        });
      }
    }

    if (listState.listMode !== "history") {
      switchToListMode("history");
    } else {
      const listBody = document.querySelector(".wecom-list-body");
      if (listBody) {
        listBody.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  function bindRailChatClick(rail) {
    const chatBtn = rail?.querySelector('[data-rail-key="chat"]');
    if (!chatBtn || chatBtn.dataset.clickBound === "1") return;
    chatBtn.dataset.clickBound = "1";
    chatBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleChatNavClick();
    });
  }

  function bindRailHistoryClick(rail) {
    const historyBtn = rail?.querySelector('[data-rail-key="history"]');
    if (!historyBtn || historyBtn.dataset.clickBound === "1") return;
    historyBtn.dataset.clickBound = "1";
    historyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleHistoryNavClick();
    });
  }

  function bindRailNavClicks(rail) {
    bindRailChatClick(rail);
    bindRailHistoryClick(rail);
  }

  /* ============================== 左侧头像 hover → 原生通知菜单 ============================== */

  let notifLeaveTimer = null;
  let notifOpenInFlight = false;
  let notifMenuObserver = null;
  let notifPinned = false; // 点击头像钉住；再点头像 / 点外面取消
  let notifWantOpen = false; // 意向开关：避免收起后因仍悬停被 observer 再次捞起
  let notifIgnoreHoverUntil = 0; // 点击收起后短暂忽略 hover，防止立刻再打开

  function findUserMenu() {
    return document.querySelector(".user-menu.revamped.menu-panel, .user-menu.menu-panel, .user-menu");
  }

  function findUserMenuToggle() {
    return document.querySelector(
      "#toggle-current-user, #current-user button, .header-dropdown-toggle.current-user button, .current-user button.icon, #current-user .icon, #current-user summary, button[aria-controls*='user'], .header-dropdown-toggle.current-user"
    );
  }

  function getHeaderService() {
    return safeLookup(getEmberOwner(), "service:header");
  }

  /** 打开/关闭 Discourse 原生 user-menu（优先 Ember header.userVisible） */
  function setUserMenuVisible(visible) {
    const header = getHeaderService();
    if (header) {
      try {
        if ("userVisible" in header) {
          header.userVisible = !!visible;
          return true;
        }
        if (typeof header.set === "function") {
          header.set("userVisible", !!visible);
          return true;
        }
      } catch (err) {
        console.warn("[linuxdo-wecom] header.userVisible failed", err);
      }
    }

    const events = safeLookup(getEmberOwner(), "service:app-events");
    if (events && typeof events.trigger === "function") {
      try {
        const isOpen = !!findUserMenu();
        // keyboard-trigger 是 toggle：仅在状态需要变化时触发
        if (!!visible !== isOpen) {
          events.trigger("header:keyboard-trigger", { type: "user" });
        }
        return true;
      } catch (err) {
        console.warn("[linuxdo-wecom] app-events user menu failed", err);
      }
    }
    return false;
  }

  function setNotifOpenClass(open) {
    document.documentElement.classList.toggle("wecom-notif-open", !!open);
  }

  function positionNotifMenu(menu) {
    if (!menu || !notifWantOpen) return;
    // 不得移动节点：原版 wrapper 依赖父子关系识别菜单内点击。
    menu.classList.add("wecom-user-menu-float", "show-avatars");
    // 显隐交给 html.wecom-notif-open；这里清掉 Discourse 内联定位
    menu.style.display = "";
    menu.style.visibility = "";
    menu.style.opacity = "";
    menu.style.pointerEvents = "";
    menu.style.position = "";
    menu.style.left = "";
    menu.style.top = "";
    menu.style.right = "";
    menu.style.bottom = "";
    menu.style.transform = "";
    setNotifOpenClass(true);
    ensureStickyDismissButton(menu);
    bindNotifMenuEvents(menu);
  }

  function clickUserMenuToggle() {
    const toggle = findUserMenuToggle();
    if (!toggle) return false;
    try {
      toggle.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    } catch {
      try { toggle.click(); } catch { return false; }
    }
    return true;
  }

  /** 短暂解除顶栏隐藏，让原生 click / Ember 能创建菜单。 */
  function unlockHeaderForNotifClick() {
    let style = document.getElementById("wecom-unlock-header");
    if (!style) {
      style = document.createElement("style");
      style.id = "wecom-unlock-header";
      style.textContent = `
        html.wecom-im-theme.wecom-notif-opening .d-header-wrap,
        html.wecom-im-theme.wecom-notif-opening .d-header {
          opacity: 1 !important;
          clip: auto !important;
          overflow: visible !important;
          width: auto !important;
          height: auto !important;
          max-width: none !important;
          max-height: none !important;
          pointer-events: auto !important;
          z-index: 440 !important;
          top: -9999px !important;
          left: 0 !important;
          position: fixed !important;
        }
      `;
      document.documentElement.appendChild(style);
    }
    document.documentElement.classList.add("wecom-notif-opening");
  }

  function lockHeaderAfterNotif() {
    document.documentElement.classList.remove("wecom-notif-opening");
  }

  function adoptNotifMenuIfAny() {
    if (!notifWantOpen) return false;
    const menu = findUserMenu();
    if (!menu) return false;
    positionNotifMenu(menu);
    bindNotifMenuEvents(menu);
    lockHeaderAfterNotif();
    return true;
  }

  function openNotifMenu() {
    notifWantOpen = true;
    if (adoptNotifMenuIfAny()) {
      // 已打开则确保 Ember 状态同步为可见
      setUserMenuVisible(true);
      return true;
    }
    if (notifOpenInFlight) return false;
    notifOpenInFlight = true;
    ensureNotifMenuObserver();

    let opened = false;
    try {
      opened = setUserMenuVisible(true);
    } catch (err) {
      console.warn("[linuxdo-wecom] setUserMenuVisible threw", err);
    }

    // Ember 失败或不立刻出 DOM → 解锁顶栏再点一次原生按钮
    if (!findUserMenu()) {
      unlockHeaderForNotifClick();
      clickUserMenuToggle();
    } else {
      opened = true;
    }

    let tries = 0;
    const poll = setInterval(() => {
      if (adoptNotifMenuIfAny()) {
        notifOpenInFlight = false;
        clearInterval(poll);
        return;
      }
      if (++tries > 24) {
        notifOpenInFlight = false;
        lockHeaderAfterNotif();
        clearInterval(poll);
        console.warn("[linuxdo-wecom] openNotifMenu: menu not found", {
          opened,
          hasOwner: !!getEmberOwner(),
          hasHeader: !!getHeaderService(),
          hasToggle: !!findUserMenuToggle()
        });
      }
    }, 50);
    return opened;
  }

  function setNotifPinned(pinned) {
    notifPinned = !!pinned;
    document.documentElement.classList.toggle("wecom-notif-pinned", notifPinned);
    const avatar = document.querySelector(".wecom-rail-avatar");
    if (avatar) avatar.classList.toggle("is-notif-pinned", notifPinned);
  }

  function resetNotifPresentation() {
    notifWantOpen = false;
    notifOpenInFlight = false;
    clearNotifLeaveTimer();
    setNotifPinned(false);
    setNotifOpenClass(false);
    lockHeaderAfterNotif();
    const menu = findUserMenu();
    if (menu) {
      menu.classList.remove("wecom-user-menu-float");
      menu.style.display = "none";
    }
  }

  function closeNotifMenu() {
    const menu = findUserMenu();
    const hadNativeMenu = Boolean(menu);
    resetNotifPresentation();
    try {
      const closed = setUserMenuVisible(false);
      // 仅当菜单在 DOM 中确实处于显示状态时才尝试模拟点击收起；若已关闭绝不盲目 toggle 重新展开
      if (!closed && hadNativeMenu && menu) {
        const isVisible = menu.offsetParent !== null && menu.style.display !== "none";
        if (isVisible) {
          clickUserMenuToggle();
        }
      }
    } catch (err) {
      console.error("[linuxdo-wecom] closeNotifMenu failed", err);
    }
    // 看过通知后刷新角标
    setTimeout(() => syncRail(), 400);
  }

  function clearNotifLeaveTimer() {
    if (notifLeaveTimer) {
      clearTimeout(notifLeaveTimer);
      notifLeaveTimer = null;
    }
  }

  function scheduleCloseNotifMenu() {
    if (notifPinned) return; // 已钉住：移出不关，点外面才关
    clearNotifLeaveTimer();
    notifLeaveTimer = setTimeout(() => {
      notifLeaveTimer = null;
      if (notifPinned) return;
      const avatar = document.querySelector(".wecom-rail-avatar");
      const menu = findUserMenu();
      const overAvatar = !!(avatar && avatar.matches(":hover"));
      const overMenu = !!(menu && menu.classList.contains("wecom-user-menu-float") && menu.matches(":hover"));
      if (!overAvatar && !overMenu) closeNotifMenu();
    }, 220);
  }

  /** 判断点击目标是否属于「忽略 / 全部忽略 / 标记为已读」相关操作 */
  function isDismissAllTarget(target) {
    if (!target) return false;
    const btn = (typeof target.closest === "function") ? target.closest("button, a, [role='button'], .btn") : null;
    if (!btn) return false;
    if (btn.matches(
      ".btn-dismiss-read, .dismiss-read, .dismiss-notification, .dismiss-notifications, " +
      "[data-action='dismiss-all'], [data-action='dismiss'], .notifications-dismiss-button, " +
      ".user-menu-dismiss, .user-menu__dismiss"
    )) return true;
    const title = (btn.getAttribute("title") || btn.getAttribute("aria-label") || "").trim();
    if (/忽略|已读|dismiss|mark.*read/i.test(title)) return true;
    const text = (btn.textContent || "").trim();
    if (/^(全部)?忽略$|^(全部)?标记为已读$|^dismiss( all)?$/i.test(text)) return true;
    if (btn.querySelector(".d-icon-check, .d-icon-check-double")) return true;
    return false;
  }

  /** 判断点击目标是否属于用户菜单内部的 Tab / 分类切换项（不应收起菜单也不改角标） */
  function isUserMenuTab(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(target.closest(
      ".user-menu-tab, [data-tab-name], .tabs-list, .user-menu-tabs, " +
      ".btn-flat[aria-controls], .user-menu-tab-icon, .filter-item, " +
      ".dropdown-menu, .select-kit, .select-kit-header, nav.nav-pills"
    ));
  }

  /** 向 Discourse 官方接口标记单个通知为已读 */
  async function markDiscourseNotificationRead(notificationId) {
    if (!notificationId) return;
    try {
      await fetch("/notifications/mark-read", {
        method: "PUT",
        headers: bridgeHeaders("application/json"),
        body: JSON.stringify({ id: Number(notificationId) })
      });
    } catch { /* ignore */ }
  }

  /** 全部标记为已读（Linux DO 通知列表「全部忽略/忽略」） */
  async function dismissAllDiscourseNotifications() {
    clearNotificationBadge();

    // 1. 同步 Ember 用户通知状态
    try {
      const owner = getEmberOwner();
      const user = safeLookup(owner, "service:current-user") || window.Discourse?.User?.current?.();
      if (user) {
        user.set?.("unread_notifications", 0);
        user.set?.("all_unread_notifications_count", 0);
        user.set?.("unread_high_priority_notifications", 0);
        user.set?.("new_personal_messages_notifications_count", 0);
      }
      const notifService = safeLookup(owner, "service:notifications") || safeLookup(owner, "service:user-menu");
      if (typeof notifService?.dismissAll === "function") {
        try { await notifService.dismissAll(); } catch { /* ignore */ }
      } else if (typeof notifService?.markAllAsRead === "function") {
        try { await notifService.markAllAsRead(); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    // 2. 发送官方 PUT /notifications/mark-read 接口持久化到服务端
    try {
      await fetch("/notifications/mark-read", {
        method: "PUT",
        headers: bridgeHeaders("application/json"),
        body: JSON.stringify({})
      });
    } catch (err) {
      console.warn("[linuxdo-wecom] PUT /notifications/mark-read failed:", err);
    }

    // 3. 将当前通知菜单内渲染的所有未读项即时更新为已读样式并移除未读指示点
    const menu = findUserMenu();
    if (menu) {
      menu.querySelectorAll(".notification.unread, [data-notification-id].unread, li.unread, .user-menu-item.unread").forEach((item) => {
        item.classList.remove("unread");
        item.classList.add("read");
      });
      menu.querySelectorAll(".unread-indicator, .notification-unread-dot, .badge-notification").forEach((dot) => {
        dot.remove();
      });
    }

    // 4. 定时刷新左侧停靠栏头像未读角标
    setTimeout(() => syncRail(), 300);
  }

  /** 确保通知列表的「全部忽略/忽略」按钮及其容器具备 sticky 置底吸附类名 */
  function ensureStickyDismissButton(menu) {
    if (!menu) return;
    const candidates = menu.querySelectorAll(
      "button, a, .btn-dismiss-read, .dismiss-read, .dismiss-notification, [data-action='dismiss-all'], [data-action='dismiss']"
    );
    let btn = null;
    for (const el of candidates) {
      if (isDismissAllTarget(el)) {
        btn = el.closest("button, a, [role='button'], .btn") || el;
        break;
      }
    }
    if (!btn) return;
    btn.classList.add("wecom-notif-sticky-btn");
    const parent = btn.parentElement;
    if (parent && parent !== menu && !parent.matches(".notifications, ul, ol, li")) {
      parent.classList.add("wecom-notif-sticky-dismiss");
    } else {
      btn.classList.add("wecom-notif-sticky-dismiss");
    }
  }

  function bindNotifMenuEvents(menu) {
    if (!menu || menu.dataset.wecomBound === "1") return;
    menu.dataset.wecomBound = "1";
    ensureStickyDismissButton(menu);
    menu.addEventListener("mouseenter", clearNotifLeaveTimer);
    menu.addEventListener("mouseleave", scheduleCloseNotifMenu);
    menu.addEventListener("click", (e) => {
      const actionable = e.target.closest("a[href], button, .notification, [data-notification-id]");
      if (actionable && menu.contains(actionable)) {
        // 如果点击的是菜单顶部的分类 Tab（通知/书签/消息等），不收起菜单，不改角标，放行原生切换
        if (isUserMenuTab(actionable)) {
          setTimeout(() => ensureStickyDismissButton(menu), 50);
          setTimeout(() => ensureStickyDismissButton(menu), 200);
          return;
        }

        notifIgnoreHoverUntil = Date.now() + 500;
        const isDismissAll = isDismissAllTarget(actionable) || Boolean(actionable.closest(".btn-dismiss-read, .dismiss-notification, [data-action='dismiss-all']"));
        if (isDismissAll) {
          dismissAllDiscourseNotifications();
          clearNotificationBadge();
        } else {
          decrementNotificationBadge();
          const notifId = actionable.dataset?.notificationId || actionable.closest("[data-notification-id]")?.dataset?.notificationId;
          if (notifId) markDiscourseNotificationRead(notifId);
          closeNotifMenu();
        }
      }
    }, true);
  }

  // 全局兜底：任何位置点击「全部忽略 / 忽略」按钮时，均同步调用后端 mark-read API 并清除角标
  if (!window.__wecomDismissAllBound) {
    window.__wecomDismissAllBound = true;
    document.addEventListener("click", (e) => {
      if (isDismissAllTarget(e.target)) {
        dismissAllDiscourseNotifications();
      }
    }, true);
  }

  function ensureNotifMenuObserver() {
    if (notifMenuObserver) return;
    notifMenuObserver = new MutationObserver(() => {
      if (getViewMode() === "native" || otherThemeActive()) return;
      if (!notifWantOpen) return;
      const menu = findUserMenu();
      if (menu) ensureStickyDismissButton(menu);
      if (adoptNotifMenuIfAny() || notifOpenInFlight) return;
      // 原版路由或菜单项主动关闭后，同步清掉企微侧的钉住/显示状态。
      if (getHeaderService()?.userVisible === false || !findUserMenu()) resetNotifPresentation();
    });
    notifMenuObserver.observe(document.body, { childList: true, subtree: true });
  }

  function isNotifMenuOpen() {
    return notifPinned || document.documentElement.classList.contains("wecom-notif-open");
  }

  function ensureNotifOutsideClose() {
    if (window.__wecomNotifOutsideBound) return;
    window.__wecomNotifOutsideBound = true;
    const onOutside = (e) => {
      if (!isNotifMenuOpen()) return;
      const avatar = document.querySelector(".wecom-rail-avatar");
      const menu = document.querySelector(".user-menu.wecom-user-menu-float, .wecom-user-menu-float");
      const t = e.target;
      if (avatar && (avatar === t || avatar.contains(t))) return;
      if (menu && (menu === t || menu.contains(t))) return;
      notifIgnoreHoverUntil = Date.now() + 400;
      closeNotifMenu();
    };
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("mousedown", onOutside, true);
  }

  function stopNotifAvatarPointer(event) {
    if (getViewMode() === "native" || otherThemeActive()) return;
    event.stopPropagation();
  }

  function bindRailAvatarNotif(rail) {
    const avatar = rail?.querySelector(".wecom-rail-avatar");
    if (!avatar || avatar.dataset.notifBound === "1") return;
    avatar.dataset.notifBound = "1";
    avatar.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      cycleRailDisguiseAvatar();
    });
    if (IS_V2EX) {
      avatar.addEventListener("click", (event) => {
        if (event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          cycleRailDisguiseAvatar();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        clearNotificationBadge();
        const body = document.querySelector(".wecom-list-body");
        if (body) body.innerHTML = `<div class="wecom-list-status">正在加载通知…</div>`;
        loadList("/notifications", true);
      });
      const badge = rail.querySelector(".wecom-rail-avatar-badge");
      badge?.addEventListener("click", (e) => {
        e.stopPropagation();
        clearNotificationBadge();
        avatar.click();
      });
      return;
    }
    avatar.addEventListener("click", (event) => {
      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        cycleRailDisguiseAvatar();
      }
    });
    ensureNotifOutsideClose();
    avatar.addEventListener("pointerdown", stopNotifAvatarPointer);
    avatar.addEventListener("mousedown", stopNotifAvatarPointer);

    avatar.addEventListener("mouseenter", () => {
      if (getViewMode() === "native" || otherThemeActive()) return;
      if (notifPinned) return;
      if (Date.now() < notifIgnoreHoverUntil) return;
      clearNotifLeaveTimer();
      ensureNotifMenuObserver();
      openNotifMenu();
    });
    avatar.addEventListener("mouseleave", scheduleCloseNotifMenu);

    // 点击头像：未钉住 → 钉住；已钉住 → 收起
    avatar.addEventListener("click", (e) => {
      if (getViewMode() === "native" || otherThemeActive()) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      clearNotifLeaveTimer();

      if (notifPinned) {
        notifIgnoreHoverUntil = Date.now() + 500;
        closeNotifMenu();
        return;
      }

      ensureNotifMenuObserver();
      openNotifMenu();
      setNotifPinned(true);
    });

    const badge = rail?.querySelector(".wecom-rail-avatar-badge");
    badge?.addEventListener("click", (e) => {
      e.stopPropagation();
      avatar.click();
    });
  }

  /* ============================== 窄图标条：假 icon（纯装饰） ============================== */

  const STRIP_ITEMS = [
    { icon: "menu" },
    { icon: "chat", badge: 19 },
    { icon: "calendar", badge: 1 },
    { icon: "contacts" },
    { icon: "wiki" },
    { icon: "cloud" },
    { icon: "task", badge: 11 },
    { icon: "more" }
  ];

  function stripFakeHtml() {
    return STRIP_ITEMS.map((it) =>
      `<div class="wecom-strip-item">${ICONS[it.icon]}` +
      (it.badge ? `<span class="wecom-strip-badge">${it.badge}</span>` : "") +
      `</div>`
    ).join("");
  }

  function ensureStrip() {
    // 企业微信布局不使用窄条；若残留则移除
    document.querySelector(".wecom-strip")?.remove();
    return null;
  }

  /* ============================== 展开栏：站点原生侧栏（原样搬入） ============================== */

  let categoriesCache = null; // [{id,name,slug,color}]
  let categoriesPromise = null;

  async function loadCategories() {
    if (IS_V2EX) return [];
    if (categoriesCache && categoriesCache.length) return categoriesCache;
    const preloaded = getPreloadedCategories();
    if (preloaded && preloaded.length) {
      categoriesCache = preloaded;
      return categoriesCache;
    }
    if (categoriesPromise) return categoriesPromise;
    categoriesPromise = (async () => {
      try {
        const data = await api("/categories.json");
        categoriesCache = (data.category_list && data.category_list.categories) || [];
      } catch {
        categoriesCache = categoriesCache || [];
      } finally {
        categoriesPromise = null;
      }
      return categoriesCache;
    })();
    return categoriesPromise;
  }

  function categoryById(id) {
    return (categoriesCache || []).find((c) => c.id === id) || null;
  }

  /* ============================== 中栏：会话列表 ============================== */

  const listState = {
    listMode: "chat", // "chat" | "history"
    apiPath: "",
    loadedApiPath: "",
    moreUrl: null,
    v2exPage: 0,
    v2exPagePath: "",
    v2exHasMore: false,
    loading: false,
    requestSerial: 0,
    topics: [],
    usersById: {}
  };

  const LIST_NAV_KEY = "linuxdo-wecom-list-nav"; // "1" = 展开中栏筛选
  // 内存态优先，避免 MutationObserver 回写时把展开瞬间打回去
  let listNavOpen = (() => {
    try { return localStorage.getItem(LIST_NAV_KEY) === "1"; } catch { return false; }
  })();

  const DEFAULT_LIST_NAV = [
    { href: "/latest", label: "最新" },
    { href: "/new", label: "新" },
    { href: "/unseen", label: "未读" },
    { href: "/hot", label: "热门" },
    { href: "/top", label: "排行榜" },
    { href: "/posted", label: "我的帖子" },
    { href: "/read", label: "已读" },
    { href: "/bookmarks", label: "书签" },
    { href: "/categories", label: "类别" }
  ];

  const DEFAULT_V2EX_LIST_NAV = [
    { href: "/?tab=hot", label: "最热" },
    { href: "/?tab=all", label: "全部" },
    { href: "/?tab=tech", label: "技术" },
    { href: "/?tab=creative", label: "创意" },
    { href: "/?tab=play", label: "好玩" },
    { href: "/?tab=apple", label: "Apple" },
    { href: "/?tab=jobs", label: "酷工作" },
    { href: "/?tab=deals", label: "交易" },
    { href: "/?tab=city", label: "城市" },
    { href: "/?tab=qna", label: "问与答" },
    { href: "/recent", label: "最新" }
  ];

  function applyListNavDom() {
    const panel = document.querySelector(".wecom-list-panel");
    const nav = document.querySelector(".wecom-list-nav");
    const btn = document.querySelector(".wecom-list-nav-toggle");
    if (panel) panel.classList.toggle("wecom-list-nav-open", listNavOpen);
    if (nav) nav.classList.toggle("open", listNavOpen);
    if (btn) {
      btn.setAttribute("aria-expanded", listNavOpen ? "true" : "false");
      btn.title = listNavOpen ? "收起筛选" : "筛选";
      btn.classList.toggle("is-on", listNavOpen);
      if (!btn.dataset.iconFixed) {
        btn.dataset.iconFixed = "1";
        btn.innerHTML = ICONS.filter;
      }
    }
    if (listNavOpen) syncListNav();
  }

  function setListNavOpen(open) {
    listNavOpen = !!open;
    try { localStorage.setItem(LIST_NAV_KEY, listNavOpen ? "1" : "0"); } catch { /* ignore */ }
    applyListNavDom();
  }

  function collectListNavItems() {
    if (IS_V2EX) {
      const v2exTabs = document.querySelectorAll("#Tabs a, #Main .cell table a[href^='/?tab=']");
      if (v2exTabs.length > 0) {
        const items = [...v2exTabs].map((a) => ({
          href: a.getAttribute("href") || "#",
          label: (a.textContent || "").replace(/\s+/g, " ").trim(),
          active: a.classList.contains("tab_current") || (location.search && location.search.includes(a.getAttribute("href") || ""))
        })).filter((it) => it.label && it.href && it.href !== "#");
        if (items.length) return items;
      }
      return DEFAULT_V2EX_LIST_NAV.map((it) => ({
        ...it,
        active: (location.search && location.search.includes(it.href)) || (it.href === "/?tab=all" && location.pathname === "/" && !location.search)
      }));
    }
    const native = document.querySelector("#navigation-bar");
    if (native) {
      const items = [...native.querySelectorAll(":scope > li > a, li > a")].map((a) => ({
        href: a.getAttribute("href") || "#",
        label: (a.textContent || "").replace(/\s+/g, " ").trim(),
        active: a.classList.contains("active") || a.getAttribute("aria-current") === "page"
      })).filter((it) => it.label && it.href && it.href !== "#");
      // 去重（有的主题 li>a 会匹配两次）
      const seen = new Set();
      const deduped = items.filter((it) => {
        if (seen.has(it.href)) return false;
        seen.add(it.href);
        return true;
      });
      if (deduped.length) return deduped;
    }
    const path = location.pathname.replace(/\/$/, "") || "/";
    return DEFAULT_LIST_NAV.map((it) => ({
      ...it,
      active: path === it.href || (it.href === "/latest" && path === "/")
    }));
  }

  function syncListNav() {
    const nav = document.querySelector(".wecom-list-nav");
    if (!nav) return;
    const items = collectListNavItems();
    const html = items.map((it) =>
      `<a href="${escapeHtml(it.href)}" class="${it.active ? "active" : ""}">${escapeHtml(it.label)}</a>`
    ).join("");
    if (nav.dataset.sig === html) return; // 避免无变化时触发 MutationObserver 死循环
    nav.dataset.sig = html;
    nav.innerHTML = html;
  }

  function getNativeSearchInput() {
    return document.querySelector(
      "#welcome-banner-search-input, .welcome-banner__search-menu .search-term__input, .search-menu .search-term__input, input.search-term__input"
    );
  }

  function setNativeInputValue(input, value) {
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function syncSearchToNative(value) {
    const input = getNativeSearchInput();
    if (!input) return null;
    if (input.value !== value) setNativeInputValue(input, value);
    return input;
  }

  function submitNativeSearch(value) {
    const q = (value || "").trim();
    if (!q) return;
    if (IS_V2EX) {
      window.open(`https://www.google.com/search?q=site:v2ex.com/t%20${encodeURIComponent(q)}`, "_blank");
      return;
    }
    const input = syncSearchToNative(q) || getNativeSearchInput();
    if (input) {
      try {
        input.focus({ preventScroll: true });
      } catch {
        try { input.focus(); } catch { /* ignore */ }
      }
      for (const type of ["keydown", "keypress", "keyup"]) {
        input.dispatchEvent(new KeyboardEvent(type, {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
      }
      const form = input.closest("form");
      if (form && typeof form.requestSubmit === "function") {
        try { form.requestSubmit(); } catch { /* ignore */ }
      }
    }
    // 站点搜索页不在 IM 锁定路由内，会露出原生结果
    const target = `/search?q=${encodeURIComponent(q)}`;
    if (location.pathname !== "/search" || new URLSearchParams(location.search).get("q") !== q) {
      // 给 Ember 一点时间吃掉 input 事件；若未跳转再兜底
      setTimeout(() => {
        if (!location.pathname.startsWith("/search")) {
          location.assign(target);
        }
      }, 120);
    }
  }

  /** 彻底清理并移除注入到页面的各类型加载指示器与进度条节点 */
  function removeLoadingSliderDom() {
    const selectors = [
      ".loading-indicator-container",
      ".loading-indicator",
      "#loading-slider",
      ".loading-slider",
      ".loading-slider-container",
      ".loading-slider__bar",
      ".d-loading-slider",
      "#page-loading-slider",
      ".page-loading-slider",
      ".ember-load-indicator",
      "#nprogress",
      ".pace",
      ".progress-bar",
      ".timeline-container"
    ];
    try {
      document.querySelectorAll(selectors.join(",")).forEach((el) => {
        try {
          el.remove();
        } catch {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("visibility", "hidden", "important");
        }
      });
    } catch { /* ignore */ }
  }

  /** 禁用 Discourse 原生页面加载进度条设置 */
  function disablePageLoadingIndicator() {
    if (IS_V2EX) return;
    try {
      if (window.Discourse?.SiteSettings) {
        window.Discourse.SiteSettings.page_loading_indicator = "none";
      }
      const owner = getEmberOwner();
      const settings = safeLookup(owner, "service:site-settings");
      if (settings) {
        if ("page_loading_indicator" in settings) settings.page_loading_indicator = "none";
        settings.set?.("page_loading_indicator", "none");
      }
    } catch { /* ignore */ }
  }

  /** 站内软跳转：避免中栏自定义链接触发浏览器整页重载 */
  function discourseRouteTo(url) {
    if (IS_V2EX || !url) return false;
    removeLoadingSliderDom();
    try {
      const mod = discourseRequire("discourse/lib/url");
      const DiscourseURL = mod?.default || mod;
      if (DiscourseURL && typeof DiscourseURL.routeTo === "function") {
        DiscourseURL.routeTo(url);
        removeLoadingSliderDom();
        return true;
      }
    } catch { /* ignore */ }
    try {
      if (typeof window.Discourse?.URL?.routeTo === "function") {
        window.Discourse.URL.routeTo(url);
        removeLoadingSliderDom();
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  function navigateInApp(url) {
    if (!url) return;
    // 绝对地址收成站内路径
    let path = url;
    try {
      if (/^https?:/i.test(url)) path = new URL(url, location.origin).pathname + new URL(url, location.origin).search + new URL(url, location.origin).hash;
    } catch { /* keep url */ }
    if (discourseRouteTo(path)) {
      scheduleApply();
      return;
    }
    history.pushState({}, "", path);
    scheduleApply();
  }

  let newTopicObserver = null;
  function monitorNewTopicComposerClose() {
    if (newTopicObserver) {
      newTopicObserver.disconnect();
      newTopicObserver = null;
    }
    const rc = document.getElementById("reply-control");
    let hasBeenOpen = Boolean(rc && rc.classList.contains("open") && !rc.classList.contains("closed"));
    const check = () => {
      const currentRc = document.getElementById("reply-control");
      const isOpen = Boolean(currentRc && currentRc.classList.contains("open") && !currentRc.classList.contains("closed"));
      if (isOpen) {
        hasBeenOpen = true;
      } else if (hasBeenOpen) {
        document.documentElement.classList.remove("wecom-composing-new", "wecom-mask-composing");
        if (newTopicObserver) {
          newTopicObserver.disconnect();
          newTopicObserver = null;
        }
      }
    };
    newTopicObserver = new MutationObserver(check);
    const target = rc || document.body || document.documentElement;
    newTopicObserver.observe(target, { attributes: true, subtree: target !== rc, attributeFilter: ["class"] });
    setTimeout(() => {
      if (!hasBeenOpen) {
        const currentRc = document.getElementById("reply-control");
        if (currentRc && currentRc.classList.contains("open")) {
          hasBeenOpen = true;
        } else {
          document.documentElement.classList.remove("wecom-composing-new", "wecom-mask-composing");
          if (newTopicObserver) {
            newTopicObserver.disconnect();
            newTopicObserver = null;
          }
        }
      }
    }, 10000);
  }

  function openNewTopic() {
    if (IS_V2EX) {
      window.open("https://v2ex.com/new", "_blank", "noopener,noreferrer");
      return;
    }

    let opened = false;
    try {
      const owner = getEmberOwner();
      const composer = owner ? getComposerService(owner) : null;
      if (composer && typeof composer.open === "function") {
        const Composer = discourseRequire("discourse/models/composer");
        const CREATE_TOPIC = Composer?.CREATE_TOPIC || Composer?.default?.CREATE_TOPIC || "createTopic";
        const DRAFT_KEY = Composer?.NEW_TOPIC_KEY || Composer?.default?.NEW_TOPIC_KEY || "new_topic";
        composer.open({
          action: CREATE_TOPIC,
          draftKey: DRAFT_KEY
        });
        opened = true;
      }
    } catch (err) {
      console.warn("[linuxdo-wecom] openNewTopic via composer service failed", err);
    }

    if (!opened) {
      const createBtn = document.querySelector("#create-topic, button.create-topic, .btn-primary.create-topic");
      if (createBtn) {
        createBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        opened = true;
      }
    }

    if (opened) {
      document.documentElement.classList.add("wecom-composing-new");
      document.documentElement.classList.toggle("wecom-mask-composing", isMaskTitleList());
      monitorNewTopicComposerClose();
    } else {
      window.open(`${location.origin}/?create_topic=true`, "_blank", "noopener,noreferrer");
    }
  }

  function closeListAddMenu() {
    const menu = document.querySelector(".wecom-list-add-menu");
    const addBtn = document.querySelector(".wecom-list-add");
    if (menu) menu.hidden = true;
    if (addBtn) addBtn.setAttribute("aria-expanded", "false");
  }

  function updateListAddMenuTexts(menu) {
    if (!menu) return;
    const isMask = isMaskTitleList();
    const newTopicItem = menu.querySelector('[data-add-action="new-topic"]');
    if (newTopicItem) {
      const textEl = newTopicItem.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "发起新项目群" : "发布新主题";
      newTopicItem.title = isMask ? "发新话题" : "发布新主题";
    }
    const navItem = menu.querySelector('[data-add-action="nav"]');
    if (navItem) {
      const textEl = navItem.querySelector(".wecom-list-add-item-text");
      if (textEl) textEl.textContent = isMask ? "部门架构导航" : "话题分类导航";
      navItem.title = isMask ? "话题分类" : "话题分类导航";
    }
  }

  function toggleListAddMenu(panel) {
    const wrap = panel.querySelector(".wecom-list-add-wrap");
    const menu = wrap?.querySelector(".wecom-list-add-menu");
    const addBtn = wrap?.querySelector(".wecom-list-add");
    if (!menu || !addBtn) return;
    const willOpen = menu.hidden;
    if (willOpen) {
      updateListAddMenuTexts(menu);
      menu.hidden = false;
      addBtn.setAttribute("aria-expanded", "true");
    } else {
      menu.hidden = true;
      addBtn.setAttribute("aria-expanded", "false");
    }
  }

  let listAddOutsideBound = false;
  function ensureListAddOutsideClose() {
    if (listAddOutsideBound) return;
    listAddOutsideBound = true;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".wecom-list-add-wrap")) {
        closeListAddMenu();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeListAddMenu();
    });
  }

  function bindListPanelClicks(panel) {
    // v5：含新建菜单与话题导航下拉，并支持站内发帖器；旧面板需重绑
    if (!panel || panel.dataset.linkBound === "5") return;
    panel.dataset.linkBound = "5";
    ensureListAddOutsideClose();
    panel.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".wecom-list-add");
      if (addBtn && panel.contains(addBtn)) {
        e.preventDefault();
        e.stopPropagation();
        toggleListAddMenu(panel);
        return;
      }

      const addActionBtn = e.target.closest(".wecom-list-add-item");
      if (addActionBtn && panel.contains(addActionBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const action = addActionBtn.dataset.addAction;
        closeListAddMenu();
        if (action === "new-topic") {
          openNewTopic();
        } else if (action === "nav") {
          setNav2Open(!isNav2Open());
        }
        return;
      }

      // 伪装按钮已在按钮自身监听；这里仍兜底一次
      const maskBtn = e.target.closest(".wecom-mask-avatar-toggle");
      if (maskBtn && panel.contains(maskBtn)) {
        e.preventDefault();
        e.stopPropagation();
        setMaskAvatar(!isMaskAvatar());
        return;
      }

      const maskTitleBtn = e.target.closest(".wecom-mask-title-toggle");
      if (maskTitleBtn && panel.contains(maskTitleBtn)) {
        e.preventDefault();
        e.stopPropagation();
        cycleMaskTitleMode();
        return;
      }

      const btn = e.target.closest(".wecom-list-nav-toggle");
      if (btn && panel.contains(btn)) {
        e.preventDefault();
        e.stopPropagation();
        setListNavOpen(!listNavOpen);
        return;
      }

      const clearBtn = e.target.closest(".wecom-history-clear-btn");
      if (clearBtn && panel.contains(clearBtn)) {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("确定要清空所有浏览历史吗？")) {
          saveTopicHistory([]);
          renderHistoryList();
        }
        return;
      }

      const statusEl = e.target.closest(".wecom-list-status");
      if (statusEl && panel.contains(statusEl)) {
        if (listState.moreUrl && !listState.loading) {
          loadMoreList();
        }
        return;
      }

      // 会话/置顶：拦截默认跳转，走即时渲染或 Discourse SPA / pushState
      const link = e.target.closest("a.wecom-conv, .wecom-list-nav a");
      if (!link || !panel.contains(link)) return;
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.startsWith("javascript:")) return;

      const conv = link.closest("a.wecom-conv");
      if (conv && panel.contains(conv)) {
        closeNotifMenu();
        e.preventDefault();
        e.stopPropagation();
        try { conv.blur(); } catch { /* ignore */ }
        // 消除被点击会话自身角标
        const convBadge = conv.querySelector(".wecom-conv-badge");
        if (convBadge) {
          convBadge.remove();
        }
        // 如果是通知列表项或带有通知/回复特征，消除头像通知角标
        const isNotifItem = (
          listState.apiPath === "/notifications" ||
          Boolean(conv.dataset.targetReplyId || conv.dataset.targetFloor || conv.dataset.targetAnchor) ||
          Boolean(conv.querySelector(".wecom-conv-tag")?.textContent?.includes("通知"))
        );
        if (isNotifItem) {
          clearNotificationBadge();
        } else if (convBadge) {
          decrementNotificationBadge();
        }
        const topicId = Number(conv.dataset.topicId || topicIdFromPath(href));
        if (!topicId) {
          navigateInApp(href);
          return;
        }
        panel.querySelectorAll(".wecom-conv").forEach((row) => {
          row.classList.toggle("active", row === conv);
        });
        document.documentElement.classList.add("wecom-topic-open");
        ensureChatPanel();
        const body = document.querySelector(".wecom-chat-body");
        const isSame = Number(chatState.topicId) === topicId;
        const hasRendered = isSame && Boolean(
          body &&
          Number(body.dataset.topicId) === topicId &&
          body.querySelector(".wecom-msg") &&
          !body.querySelector(".wecom-chat-loading, .wecom-chat-error, .wecom-chat-empty")
        );

        const target = parseV2exReplyTarget(conv.dataset.targetAnchor || href || location.hash);
        if (conv.dataset.targetFloor) target.floor = Number(conv.dataset.targetFloor);
        if (conv.dataset.targetReplyId) target.replyId = Number(conv.dataset.targetReplyId);
        if (conv.dataset.targetPage) target.page = Number(conv.dataset.targetPage);
        if (IS_V2EX && !target.floor && !target.replyId && !target.anchor) {
          const remembered = getRememberedPost(topicId);
          if (remembered > 1) {
            target.floor = remembered - 1;
            target.page = target.floor > 100 ? Math.floor((target.floor - 1) / 100) + 1 : 1;
            target.anchor = `reply${target.floor}`;
          }
        }

        if (isSame && hasRendered && (target.floor || target.replyId || target.anchor)) {
          const located = locateV2exReply(body, target);
          if (located) {
            if (location.pathname + location.hash !== href) {
              suppressHistoryApply = true;
              try {
                history.pushState({}, "", href);
              } finally {
                suppressHistoryApply = false;
              }
            }
            return;
          }
        }

        if (!hasRendered) {
          if (body) {
            body.dataset.topicId = String(topicId);
            delete body.dataset.state;
            body.innerHTML = `
              <div class="wecom-chat-loading">
                <div class="wecom-chat-spinner"></div>
                <div>加载中…</div>
              </div>`;
          }
          const chatPanel = document.querySelector(".wecom-chat-panel");
          if (chatPanel) chatPanel.dataset.topicId = String(topicId);
          const convTitle = conv.querySelector(".wecom-conv-name")?.textContent || conv.getAttribute("title") || "";
          const titleEl = document.querySelector(".wecom-chat-title");
          const subEl = document.querySelector(".wecom-chat-sub");
          if (titleEl && convTitle) {
            titleEl.textContent = convTitle;
            titleEl.classList.toggle("is-masked", isMaskTitleDetail());
            titleEl.classList.remove("is-peeking-title");
            titleEl.title = isMaskTitleDetail() ? "" : convTitle;
          }
          if (subEl) subEl.textContent = "加载中…";
        }
        if (location.pathname !== href) {
          suppressHistoryApply = true;
          try {
            history.pushState({}, "", href);
          } finally {
            suppressHistoryApply = false;
          }
        }
        removeLoadingSliderDom();
        discourseRouteTo(href);
        loadTopic(topicId, !hasRendered, target);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      try { link.blur(); } catch { /* ignore */ }
      navigateInApp(href);
    });
  }

  function ensureListPanel() {
    let panel = document.querySelector(".wecom-list-panel");
    // 旧面板缺筛选按钮/容器时重建
    if (panel && (!panel.querySelector(".wecom-list-search") || !panel.querySelector(".wecom-list-nav-toggle") || !panel.querySelector(".wecom-list-nav") || !panel.querySelector(".wecom-chip") || !panel.querySelector(".wecom-history-header-bar") || !panel.querySelector(".wecom-list-add-menu"))) {
      panel.remove();
      panel = null;
    }
    if (panel) {
      bindListPanelClicks(panel);
      bindSearchBox(panel);
      ensureMaskAvatarToggle(panel);
      ensureMaskTitleToggle(panel);
      applyListNavDom();
      return panel;
    }
    panel = document.createElement("div");
    panel.className = "wecom-list-panel";
    const searchPlaceholder = IS_V2EX ? "搜索 V2EX 话题" : "搜索";
    const chipsHtml = IS_V2EX
      ? `
          <button type="button" class="wecom-chip active" data-chip="all">消息<span class="n"></span></button>
          <button type="button" class="wecom-chip" data-chip="hot">最热</button>
          <button type="button" class="wecom-chip" data-chip="tech">技术</button>
          <button type="button" class="wecom-chip" data-chip="creative">创意</button>
          <button type="button" class="wecom-chip" data-chip="qna">问答</button>
        `
      : `
          <button type="button" class="wecom-chip active" data-chip="all">消息<span class="n"></span></button>
          <button type="button" class="wecom-chip" data-chip="unread">未读<span class="n"></span></button>
        `;
    panel.innerHTML = `
      <div class="wecom-list-search">
        <form action="${IS_V2EX ? "https://www.google.com/search" : "/search"}" method="get"${IS_V2EX ? ' target="_blank"' : ""} role="search">
          ${ICONS.search}
          <input type="search" name="q" placeholder="${searchPlaceholder}" autocomplete="off" enterkeyhint="search" aria-label="搜索话题">
        </form>
        <div class="wecom-list-add-wrap">
          <button type="button" class="wecom-list-add" title="新建与导航" aria-label="新建与导航" aria-haspopup="menu" aria-expanded="false">${ICONS.plus}</button>
          <div class="wecom-list-add-menu" hidden role="menu">
            <button type="button" class="wecom-list-add-item" data-add-action="new-topic" role="menuitem">
              <span class="wecom-list-add-item-icon">${ICONS.compose}</span>
              <span class="wecom-list-add-item-text">发布新主题</span>
            </button>
            <button type="button" class="wecom-list-add-item" data-add-action="nav" role="menuitem">
              <span class="wecom-list-add-item-icon">${ICONS.grid}</span>
              <span class="wecom-list-add-item-text">话题分类导航</span>
            </button>
          </div>
        </div>
      </div>
      <div class="wecom-list-header">
        <button type="button" class="wecom-chip-icon wecom-list-nav-toggle" title="筛选" aria-expanded="false">${ICONS.filter}</button>
        <div class="wecom-list-chips">
          ${chipsHtml}
        </div>
        <div class="wecom-history-header-bar">
          <span class="wecom-history-tag">浏览历史</span>
          <span class="wecom-history-count"></span>
          <button type="button" class="wecom-history-clear-btn" title="清空全部浏览历史">清空</button>
        </div>
        <div class="wecom-list-actions">
          <button type="button" class="wecom-icon-btn wecom-mask-avatar-toggle" title="伪装头像：关（点击开启）" aria-pressed="false">${ICONS.disguise}</button>
          <button type="button" class="wecom-icon-btn wecom-mask-title-toggle" title="伪装标题：关（点击开启）" aria-pressed="false">${ICONS.win}</button>
        </div>
      </div>
      <div class="wecom-list-nav" role="navigation" aria-label="话题筛选"></div>
      <div class="wecom-list-body"></div>
    `;
    document.body.appendChild(panel);
    bindListPanelClicks(panel);
    bindSearchBox(panel);
    ensureMaskAvatarToggle(panel);
    ensureMaskTitleToggle(panel);
    panel.querySelectorAll(".wecom-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        panel.querySelectorAll(".wecom-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        if (IS_V2EX) {
          const chipKey = chip.dataset.chip;
          if (chipKey === "all" || chipKey === "latest") loadList("/?tab=all", true);
          else if (chipKey === "hot") loadList("/api/topics/hot.json", true);
          else loadList(`/?tab=${chipKey}`, true);
        } else {
          navigateInApp(chip.dataset.chip === "unread" ? "/unseen" : "/latest");
        }
      });
    });
    let listScrollTimer = null;
    const listBody = panel.querySelector(".wecom-list-body");
    listBody.addEventListener("scroll", () => {
      listBody.classList.add("is-scrolling");
      clearTimeout(listScrollTimer);
      listScrollTimer = setTimeout(() => {
        listBody.classList.remove("is-scrolling");
      }, 800);
      if (listBody.scrollTop + listBody.clientHeight >= listBody.scrollHeight - 120) {
        if (listState.listMode !== "history") {
          loadMoreList();
        }
      }
    }, { passive: true });
    applyListNavDom();
    return panel;
  }

  function topicHref(topic) {
    if (IS_V2EX) {
      let targetPage = topic.target_page;
      let targetAnchor = topic.target_anchor;
      if (!targetPage && !targetAnchor) {
        const remembered = rememberedPostForTopic(topic);
        if (remembered > 1) {
          const floor = remembered - 1;
          targetPage = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;
          targetAnchor = `reply${floor}`;
        }
      }
      const pagePart = targetPage > 1 ? `?p=${targetPage}` : "";
      const anchorPart = targetAnchor ? `#${targetAnchor}` : "";
      return `/t/${topic.id}${pagePart}${anchorPart}`;
    }
    const slug = topic.slug || "topic";
    const lastRead = rememberedPostForTopic(topic);
    if (lastRead > 1) return `/t/${slug}/${topic.id}/${lastRead}`;
    return `/t/${slug}/${topic.id}`;
  }

  function convAvatarHtml(topic, usersById) {
    if (isMaskAvatar()) {
      if (isGridMaskTopic(topic)) return disguiseGridAvatar(topic);
      const d = disguiseAvatarForTopic(topic);
      return `<span class="wecom-conv-avatar${d.className ? " " + d.className : ""}" style="background:${d.bg};${d.styleExtra}">${d.html}</span>`;
    }
    if (topic.v2ex_avatar) {
      return `<span class="wecom-conv-avatar"><img src="${escapeHtml(fullAvatarUrl(topic.v2ex_avatar))}" alt="" loading="lazy"></span>`;
    }
    if (topic.avatar_template) {
      return `<span class="wecom-conv-avatar"><img src="${escapeHtml(fullAvatarUrl(topic.avatar_template))}" alt="" loading="lazy"></span>`;
    }
    if (isGroupConversation(topic)) {
      return groupAvatarHtml(topic, usersById || {});
    }
    const poster = (topic.posters || [])[0];
    const user = poster && usersById ? usersById[poster.user_id] : null;
    const displayName = userDisplayName(user, topic.last_poster_username || "?");
    if (user && user.avatar_template) {
      return `<span class="wecom-conv-avatar"><img src="${escapeHtml(fullAvatarUrl(user.avatar_template))}" alt="" loading="lazy"></span>`;
    }
    return `<span class="wecom-conv-avatar is-text-avatar is-solid" style="background:${avatarColor(displayName)}">${escapeHtml(avatarLetter(displayName))}</span>`;
  }

  function convCategoryTag(topic) {
    if (topic.node_name) {
      return `<span class="wecom-conv-tag is-dept">@${escapeHtml(topic.node_name)}</span>`;
    }
    if (!categoriesCache || !topic.category_id) return "";
    const cat = categoryById(topic.category_id);
    if (!cat) return "";
    const name = cat.name || "";
    const isExt = /外|ext|资源|闲聊|搞七/i.test(name);
    const cls = isExt ? "wecom-conv-tag is-ext" : "wecom-conv-tag is-dept";
    return `<span class="${cls}">@${escapeHtml(name)}</span>`;
  }

  function convRowHtml(topic, usersById) {
    const unread = topic.unread > 0 ? topic.unread : (topic.new_posts > 0 ? topic.new_posts : 0);
    const replyCount = Math.max(0, (topic.posts_count || 1) - 1);
    const rawSummary = topic.notification_text || (topic.last_poster_username
      ? `${topic.last_poster_username}: ${replyCount > 0 ? `[${replyCount}条回复]` : "发起话题"}`
      : `${topic.posts_count || 0} 回复`);
    const maskList = isMaskTitleList();
    // 列表伪装时：顶部大字为工作流拟真标题，下方的灰色摘要字显示真实话题标题！
    const title = maskList ? disguiseTitleForTopic(topic) : String(topic.title || "");
    const summary = maskList ? String(topic.title || rawSummary) : rawSummary;
    const tag = (maskList || isMaskAvatar()) ? "" : convCategoryTag(topic);
    const isPinned = !!(topic.pinned || topic.pinned_globally);
    let targetFloor = topic.target_floor;
    let targetReplyId = topic.target_reply_id;
    let targetAnchor = topic.target_anchor;
    let targetPage = topic.target_page;
    if (IS_V2EX && !targetFloor && !targetReplyId && !targetAnchor && !targetPage) {
      const remembered = rememberedPostForTopic(topic);
      if (remembered > 1) {
        targetFloor = remembered - 1;
        targetPage = targetFloor > 100 ? Math.floor((targetFloor - 1) / 100) + 1 : 1;
        targetAnchor = `reply${targetFloor}`;
      }
    }
    const targetAttrs = [
      targetFloor ? `data-target-floor="${targetFloor}"` : "",
      targetReplyId ? `data-target-reply-id="${targetReplyId}"` : "",
      targetAnchor ? `data-target-anchor="${escapeHtml(targetAnchor)}"` : "",
      targetPage ? `data-target-page="${targetPage}"` : ""
    ].filter(Boolean).join(" ");
    return `
      <a class="wecom-conv${isPinned ? " is-pinned" : ""}" href="${escapeHtml(topicHref(topic))}" data-topic-id="${topic.id}" ${targetAttrs} title="${escapeHtml(String(topic.title || title || ""))}">
        ${convAvatarHtml(topic, usersById)}
        <span class="wecom-conv-info">
          <span class="wecom-conv-top">
            <span class="wecom-conv-title">
              <span class="wecom-conv-name">${escapeHtml(title)}</span>
              ${tag}
            </span>
            <span class="wecom-conv-time">${escapeHtml(formatTime(topic.bumped_at || topic.last_activity_at || topic.created_at))}</span>
          </span>
          <span class="wecom-conv-bottom">
            <span class="wecom-conv-msg">${escapeHtml(summary)}</span>
            <span class="wecom-conv-icons">
              ${isPinned ? `<span class="wecom-conv-pin" title="置顶">${ICONS.pin}</span>` : ""}
              ${unread ? `<span class="wecom-conv-badge">${unread > 99 ? "99+" : unread}</span>` : ""}
            </span>
          </span>
        </span>
      </a>`;
  }

  function isGroupConversation(topic) {
    return Math.abs(Number(topic.id) || 0) % 2 === 1;
  }

  function mulberry32(a) {
    a |= 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, seed) {
    const rng = mulberry32(seed);
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function groupAvatarHtml(topic, usersById) {
    const all = Object.values(usersById || {})
      .filter((u) => u && u.avatar_template)
      .map((u) => u.avatar_template);
    const tpls = seededShuffle(all, Number(topic.id) || 1).slice(0, 9);
    const seed = Math.abs(Number(topic.id) || 0);
    const placeholder = surnameForTopic(topic);
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const tpl = tpls[i];
      if (tpl) {
        cells.push(`<img src="${escapeHtml(fullAvatarUrl(tpl))}" alt="" loading="lazy">`);
      } else {
        const color = MASK_GRID_BLUES[(seed + i) % MASK_GRID_BLUES.length];
        cells.push(`<span style="background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;line-height:1;">${escapeHtml(placeholder)}</span>`);
      }
    }
    return `<span class="wecom-conv-avatar is-group">${cells.join("")}</span>`;
  }

  function renderListRows() {
    const body = document.querySelector(".wecom-list-body");
    if (!body) return;
    const usersById = listState.usersById || {};
    body.innerHTML =
      listState.topics.map((t) => convRowHtml(t, usersById)).join("") +
      `<div class="wecom-list-status ${listState.moreUrl ? "is-clickable" : ""}">${listState.moreUrl ? "下拉或点击加载更多…" : (listState.topics.length ? "没有更多了" : "")}</div>`;
    syncListChips();
    syncListActive();
  }

  /** 中栏 chips 计数：消息 = 已加载话题数，未读 = unread/new_posts 求和 */
  function syncListChips() {
    const allN = document.querySelector('.wecom-chip[data-chip="all"] .n');
    const unreadN = document.querySelector('.wecom-chip[data-chip="unread"] .n');
    if (allN) allN.textContent = listState.topics.length ? String(listState.topics.length) : "";
    if (unreadN) {
      const n = listState.topics.reduce((sum, t) => sum + (t.unread || 0) + (t.new_posts || 0), 0);
      unreadN.textContent = n > 0 ? String(n > 99 ? "99+" : n) : "";
    }
  }

  function syncListActive() {
    const currentId = topicIdFromPath(location.pathname);
    for (const row of document.querySelectorAll(".wecom-conv")) {
      row.classList.toggle("active", currentId != null && Number(row.dataset.topicId) === currentId);
    }
  }

  function switchToListMode(mode) {
    listState.listMode = mode;
    const panel = document.querySelector(".wecom-list-panel");
    const rail = document.querySelector(".wecom-rail");
    if (rail) {
      rail.querySelectorAll(".wecom-rail-item").forEach((item) => {
        if (item.dataset.railKey === (mode === "history" ? "history" : "chat")) item.classList.add("active");
        else if (item.dataset.railKey !== "group") item.classList.remove("active");
      });
    }
    if (panel) {
      panel.classList.toggle("is-history-mode", mode === "history");
      const searchInput = panel.querySelector(".wecom-list-search input");
      if (searchInput) {
        searchInput.value = "";
        searchInput.placeholder = mode === "history" ? "搜索历史帖子" : (IS_V2EX ? "搜索 V2EX 话题" : "搜索");
      }
    }
    if (mode === "history") {
      renderHistoryList();
    } else {
      renderListRows();
    }
  }

  function renderHistoryList(searchQuery = "") {
    const body = document.querySelector(".wecom-list-body");
    const countEl = document.querySelector(".wecom-history-count");
    const rawList = readTopicHistory();
    const currentPlatform = IS_V2EX ? "v2ex" : "linuxdo";
    const historyList = rawList.filter((item) => !item.platform || item.platform === currentPlatform);

    let displayList = historyList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      displayList = historyList.filter((item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.node_name && item.node_name.toLowerCase().includes(q)) ||
        (item.last_poster_username && item.last_poster_username.toLowerCase().includes(q))
      );
    }

    if (countEl) {
      countEl.textContent = `共 ${displayList.length} 条`;
    }

    if (!body) return;

    if (!displayList.length) {
      body.innerHTML = `<div class="wecom-list-status">${searchQuery ? "未找到相关历史帖子" : "暂无浏览历史"}</div>`;
      return;
    }

    const usersById = {};
    body.innerHTML = displayList.map((item) => {
      const topicObj = {
        id: item.id,
        title: item.title,
        last_poster_username: item.last_poster_username,
        v2ex_avatar: item.v2ex_avatar,
        avatar_template: item.avatar_template,
        node_name: item.node_name,
        category_id: item.category_id,
        reply_count: item.reply_count,
        posts_count: item.posts_count || (item.reply_count + 1),
        bumped_at: item.visited_at || item.bumped_at || Date.now(),
        slug: item.slug || "topic"
      };
      return convRowHtml(topicObj, usersById);
    }).join("") + `<div class="wecom-list-status">没有更多历史了</div>`;

    syncListActive();
  }

  function applyListJson(data, append) {
    const topics = (data.topic_list && data.topic_list.topics) || [];
    const users = data.users || [];
    const usersById = append ? { ...(listState.usersById || {}) } : {};
    for (const u of users) usersById[u.id] = u;
    listState.usersById = usersById;
    const existing = new Set(append ? listState.topics.map((t) => t.id) : []);
    const fresh = topics.filter((t) => !existing.has(t.id));
    listState.topics = append ? listState.topics.concat(fresh) : topics;
    const more = data.topic_list && data.topic_list.more_topics_url;
    listState.moreUrl = more ? more.replace(/\.json\b/, ".json") : null;
    renderListRows();
    syncRail();
  }

  function v2exPageForPath(apiPath) {
    const path = String(apiPath || "");
    const match = path.match(/[?&]p=(\d+)/);
    if (match) return Math.max(1, Number(match[1]) || 1);
    // V2EX 各类列表若未带 ?p=，第一页均为页码 1（如 /recent、/go/programmer、/?tab=all）
    return 1;
  }

  function v2exPageUrl(apiPath, page) {
    let base = String(apiPath || "");
    if (base === "/api/topics/latest.json" || base === "latest" || base === "all") base = "/?tab=all";
    if (base === "/api/topics/hot.json" || base === "hot") base = "/?tab=hot";
    if (!base.startsWith("/")) base = `/${base}`;
    try {
      const url = new URL(base, location.origin);
      url.searchParams.set("p", String(page));
      return `${url.pathname}${url.search}`;
    } catch {
      return `${base}${base.includes("?") ? "&" : "?"}p=${page}`;
    }
  }

  function v2exNextPageUrl(currentPath) {
    const path = String(currentPath || "");
    // V2EX 首页 tab=all/latest/全部：下一页为 /recent
    if (path === "/api/topics/latest.json" || path === "latest" || path === "all" || path === "/" || path === "/?tab=all") {
      return "/recent";
    }
    if (path === "/recent") return "/recent?p=2";
    const currentPage = v2exPageForPath(path);
    return v2exPageUrl(path, currentPage + 1);
  }

  /**
   * 精确解析 V2EX 话题列表的分页状态，依据原站 input.page_input、.ps_container 和分页链接判断，
   * 彻底避免因单页话题数波动（如 19 条 < 20 条）或节点首页被误判为 0 页而导致翻页过早中断。
   */
  function parseV2exListPagination(doc, apiPath, count) {
    const path = String(apiPath || "");
    const currentPage = v2exPageForPath(path);

    if (path === "/notifications" || count === 0) {
      return { hasMore: false, nextPageUrl: null, totalPages: 1 };
    }

    // 首页全部/最新：无 pager 容器，但下一页确定为 /recent
    const isAllHome = path === "/api/topics/latest.json" || path === "latest" || path === "all" || path === "/" || path === "/?tab=all";
    if (isAllHome) {
      return {
        hasMore: count > 0,
        nextPageUrl: "/recent",
        totalPages: 0
      };
    }

    // 其他首页分类 tab（最热/技术/创意/好玩等）：V2EX 原站首页 tab 为固定精选列表，无分页
    if (path.includes("tab=") && !path.includes("tab=all") && !path.includes("tab=latest")) {
      return { hasMore: false, nextPageUrl: null, totalPages: 1 };
    }

    if (doc) {
      // 1. 提取分页输入框 <input class="page_input" value="X" max="Y" />
      const pageInput = doc.querySelector("input.page_input");
      const inputMax = pageInput ? (Number(pageInput.getAttribute("max") || pageInput.max) || 0) : 0;
      const inputVal = pageInput ? (Number(pageInput.getAttribute("value") || pageInput.value) || 0) : 0;

      // 2. 提取下一页按钮（.normal_page_right 或 [title='Next Page']）
      const nextBtn = doc.querySelector(".normal_page_right, [title='Next Page']");
      const hasDisabledNext = Boolean(nextBtn && nextBtn.classList.contains("disable_now"));
      const hasNextBtn = Boolean(nextBtn) && !hasDisabledNext;

      // 3. 提取页码链接中的最大页
      const pageNumbers = [...doc.querySelectorAll("a.page_normal, a.page_current, a[href*='p=']")]
        .map((el) => (el.getAttribute("href") || "").match(/[?&]p=(\d+)/))
        .filter(Boolean)
        .map((m) => Number(m[1]));
      const maxPageInLinks = pageNumbers.length ? Math.max(...pageNumbers) : 0;

      const totalPages = Math.max(inputMax, maxPageInLinks);
      const effPage = inputVal || currentPage;

      if (totalPages > 0) {
        const hasMore = (totalPages > effPage) || hasNextBtn;
        return {
          hasMore,
          nextPageUrl: hasMore ? v2exNextPageUrl(path) : null,
          totalPages
        };
      }

      if (hasNextBtn) {
        return {
          hasMore: true,
          nextPageUrl: v2exNextPageUrl(path),
          totalPages: effPage + 1
        };
      }
      if (hasDisabledNext) {
        return { hasMore: false, nextPageUrl: null, totalPages: effPage };
      }
    }

    // 容错降级：对于 /recent 或 /go/ 节点页面，只要当前页有话题内容且非空，允许尝试翻到下一页
    const isRecentOrNode = path.startsWith("/recent") || path.startsWith("/go/");
    if (isRecentOrNode && count > 0) {
      return {
        hasMore: true,
        nextPageUrl: v2exNextPageUrl(path),
        totalPages: 0
      };
    }

    return { hasMore: false, nextPageUrl: null, totalPages: 1 };
  }

  function setV2exPagination(apiPath, count, doc = null) {
    const pagination = parseV2exListPagination(doc, apiPath, count);
    listState.v2exPage = v2exPageForPath(apiPath);
    listState.v2exPagePath = apiPath;
    listState.v2exHasMore = pagination.hasMore;
    listState.moreUrl = pagination.nextPageUrl;
  }

  async function loadList(apiPath, force) {
    if (!apiPath) return;
    if (IS_V2EX) {
      if (!force && listState.loadedApiPath === apiPath && listState.topics.length) {
        syncListActive();
        return;
      }
      if (!force && listState.loading && listState.apiPath === apiPath) return;
      const requestSerial = ++listState.requestSerial;
      listState.loading = true;
      listState.apiPath = apiPath;
      if (force || listState.loadedApiPath !== apiPath) {
        listState.v2exPage = v2exPageForPath(apiPath);
        listState.v2exPagePath = apiPath;
        listState.v2exHasMore = false;
        listState.moreUrl = null;
      }
      try {
        if (!force && document.querySelectorAll("#Main .cell, #Main .item").length > 0 && listState.topics.length === 0) {
          const domTopics = extractV2exTopicsFromDoc(document);
          if (domTopics.length > 0) {
            listState.topics = domTopics;
            setV2exPagination(apiPath, domTopics.length, document);
            renderListRows();
            syncRail();
            listState.loadedApiPath = apiPath;
            return;
          }
        }
        let topics = [];
        let fetchedDoc = null;
        if (apiPath === "/api/topics/hot.json" || apiPath === "hot") {
          try {
            const res = await api("/api/topics/hot.json");
            topics = mapV2exJsonTopics(res);
          } catch {
            topics = [];
          }
          if (!topics.length) {
            try {
              const resp = await fetch("/?tab=hot", { credentials: "same-origin" });
              if (resp.ok) {
                const html = await resp.text();
                fetchedDoc = new DOMParser().parseFromString(html, "text/html");
                topics = extractV2exTopicsFromDoc(fetchedDoc);
              }
            } catch { /* ignore */ }
          }
        } else if (apiPath === "/api/topics/latest.json" || apiPath === "latest" || apiPath === "all") {
          try {
            const res = await api("/api/topics/latest.json");
            topics = mapV2exJsonTopics(res);
          } catch {
            topics = [];
          }
          if (!topics.length) {
            try {
              const resp = await fetch("/?tab=all", { credentials: "same-origin" });
              if (resp.ok) {
                const html = await resp.text();
                fetchedDoc = new DOMParser().parseFromString(html, "text/html");
                topics = extractV2exTopicsFromDoc(fetchedDoc);
              }
            } catch { /* ignore */ }
          }
        } else {
          const path = (apiPath && apiPath.startsWith("/")) ? apiPath : ("/" + (apiPath || ""));
          try {
            const resp = await fetch(path, { credentials: "same-origin" });
            if (resp.ok) {
              const html = await resp.text();
              fetchedDoc = new DOMParser().parseFromString(html, "text/html");
              topics = path === "/notifications"
                ? extractV2exNotificationsFromDoc(fetchedDoc)
                : extractV2exTopicsFromDoc(fetchedDoc);
              if (path === "/notifications") {
                clearNotificationBadge();
              }
            }
          } catch {
            topics = [];
          }
          if (!topics.length && path !== "/notifications") {
            try {
              const res = await api("/api/topics/hot.json");
              topics = mapV2exJsonTopics(res);
            } catch { /* ignore */ }
          }
        }
        if (requestSerial !== listState.requestSerial) return;
        listState.topics = topics;
        setV2exPagination(apiPath, topics.length, fetchedDoc);
        renderListRows();
        syncRail();
        listState.loadedApiPath = apiPath;
      } catch (error) {
        if (requestSerial !== listState.requestSerial) return;
        console.error("[v2ex-wecom] list load failed", error);
        const body = document.querySelector(".wecom-list-body");
        if (body) body.innerHTML = `<div class="wecom-list-status">V2EX 话题加载失败：${escapeHtml(error.message)}</div>`;
      } finally {
        if (requestSerial === listState.requestSerial) listState.loading = false;
      }
      return;
    }

    // 用列表 API 做缓存键：进帖子时 pathname 会变，但不应重拉会话列表
    if (!force && listState.loadedApiPath === apiPath && listState.topics.length) {
      syncListActive();
      return;
    }
    if (!force && listState.loading && listState.apiPath === apiPath) return;
    const requestSerial = ++listState.requestSerial;
    listState.loading = true;
    listState.apiPath = apiPath;
    try {
      const data = await api(apiPath);
      if (requestSerial !== listState.requestSerial) return;
      applyListJson(data, false);
      listState.loadedApiPath = apiPath;
    } catch (error) {
      if (requestSerial !== listState.requestSerial) return;
      console.error("[linuxdo-wecom] list load failed", { apiPath, error });
      const body = document.querySelector(".wecom-list-body");
      const reason = error instanceof Error ? error.message : String(error);
      if (body) body.innerHTML = `<div class="wecom-list-status">列表加载失败：${escapeHtml(reason)}</div>`;
    } finally {
      if (requestSerial === listState.requestSerial) listState.loading = false;
    }
  }

  async function loadMoreList() {
    if (!listState.moreUrl || listState.loading) return;
    if (IS_V2EX) {
      const requestSerial = ++listState.requestSerial;
      const pageUrl = listState.moreUrl;
      listState.loading = true;
      try {
        const resp = await fetch(pageUrl, { credentials: "same-origin" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const topics = extractV2exTopicsFromDoc(doc);
        if (requestSerial !== listState.requestSerial) return;
        const existing = new Set(listState.topics.map((topic) => topic.id));
        const fresh = topics.filter((topic) => !existing.has(topic.id));
        if (fresh.length > 0) {
          listState.topics = listState.topics.concat(fresh);
        }
        listState.v2exPagePath = pageUrl;
        listState.v2exPage = v2exPageForPath(pageUrl);
        const pagination = parseV2exListPagination(doc, pageUrl, topics.length);
        listState.v2exHasMore = pagination.hasMore && (topics.length > 0);
        listState.moreUrl = listState.v2exHasMore ? pagination.nextPageUrl : null;
        renderListRows();
        syncRail();
      } catch (error) {
        if (requestSerial === listState.requestSerial) console.error("[v2ex-wecom] load more topics failed", error);
      } finally {
        if (requestSerial === listState.requestSerial) listState.loading = false;
      }
      return;
    }
    const requestSerial = ++listState.requestSerial;
    listState.loading = true;
    try {
      const data = await api(listState.moreUrl);
      if (requestSerial !== listState.requestSerial) return;
      applyListJson(data, true);
    } catch (error) {
      if (requestSerial === listState.requestSerial) {
        console.error("[linuxdo-wecom] load more topics failed", error);
      }
    } finally {
      if (requestSerial === listState.requestSerial) listState.loading = false;
    }
  }

  /* ============================== 右栏：聊天详情 ============================== */

  const chatState = {
    topicId: null,
    slug: "",
    loading: false,
    stream: [],        // 全部 post id 顺序
    postsByNumber: new Map(), // 已加载楼层，供回复关系与摘要解析
    renderedFirstIdx: 0, // stream 中已渲染的起始下标
    renderedLastIdx: -1, // stream 中已渲染的结束下标
    renderedLastNumber: 0, // 已渲染的最大 post_number
    hasOlder: false,
    hasNewer: false,
    title: "",
    replyTotal: 0,
    v2exPage: 1,
    v2exHasMore: false,
    v2exLoadingPage: false,
    topicBookmarked: false,
    pinnedPost: 0,
    pinningScroll: false
  };

  const composerBridgeState = {
    topicId: null,
    nativeTopicId: null,
    nativeReplyToPostNumber: null,
    replyToPostNumber: null,
    connecting: null,
    connectingTarget: null,
    connectionSerial: 0,
    submitting: false,
    uploading: false,
    drafts: new Map()
  };

  const editState = {
    postId: null,
    postNumber: null,
    requestSerial: 0,
    loading: false,
    saving: false,
    uploading: false,
    trigger: null
  };

  function normalizeWatermarkText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function validateWatermarkSettings(settings) {
    const text = normalizeWatermarkText(settings.text);
    if (text.length > WATERMARK_MAX_LENGTH) {
      throw new RangeError(`水印文字不能超过 ${WATERMARK_MAX_LENGTH} 个字符`);
    }
    if (settings.enabled && !text) throw new Error("启用水印前请填写水印文字");
    return Object.freeze({ enabled: Boolean(settings.enabled), text });
  }

  function getWatermarkSettings() {
    const storedText = localStorage.getItem(WATERMARK_TEXT_KEY);
    return validateWatermarkSettings({
      enabled: localStorage.getItem(WATERMARK_ENABLED_KEY) === "1",
      text: storedText === null ? DEFAULT_WATERMARK_TEXT : storedText
    });
  }

  function watermarkBackgroundImage(text) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WATERMARK_TILE_WIDTH}" height="${WATERMARK_TILE_HEIGHT}" viewBox="0 0 ${WATERMARK_TILE_WIDTH} ${WATERMARK_TILE_HEIGHT}"><text x="150" y="82" text-anchor="middle" fill="#7890AA" fill-opacity="0.14" font-family="Microsoft YaHei UI, PingFang SC, sans-serif" font-size="15" transform="rotate(-18 150 82)">${escapeHtml(text)}</text></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function renderWatermark(settings) {
    const text = normalizeWatermarkText(settings.text);
    const enabled = Boolean(settings.enabled && text);
    const body = document.querySelector(".wecom-chat-body");
    if (body) {
      body.style.backgroundImage = enabled ? watermarkBackgroundImage(text) : "none";
      body.classList.toggle("has-watermark", enabled);
    }
    const button = document.querySelector(".wecom-watermark-settings");
    if (!button) return;
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.title = enabled ? "背景水印：已开启" : "背景水印设置";
  }

  function saveWatermarkSettings(settings) {
    const value = validateWatermarkSettings(settings);
    localStorage.setItem(WATERMARK_TEXT_KEY, value.text);
    localStorage.setItem(WATERMARK_ENABLED_KEY, value.enabled ? "1" : "0");
    renderWatermark(value);
    return value;
  }

  function watermarkFormSettings(panel) {
    return {
      enabled: panel.querySelector(".wecom-watermark-enabled").checked,
      text: panel.querySelector(".wecom-watermark-text").value
    };
  }

  function setWatermarkError(panel, message) {
    panel.querySelector(".wecom-watermark-error").textContent = message || "";
  }

  function openWatermarkSettings(panel) {
    const settings = getWatermarkSettings();
    const dialog = panel.querySelector(".wecom-watermark-panel");
    dialog.querySelector(".wecom-watermark-enabled").checked = settings.enabled;
    dialog.querySelector(".wecom-watermark-text").value = settings.text;
    setWatermarkError(panel, "");
    dialog.hidden = false;
    panel.querySelector(".wecom-watermark-settings").setAttribute("aria-expanded", "true");
    dialog.querySelector(".wecom-watermark-text").focus();
  }

  function closeWatermarkSettings(panel) {
    panel.querySelector(".wecom-watermark-panel").hidden = true;
    panel.querySelector(".wecom-watermark-settings").setAttribute("aria-expanded", "false");
    renderWatermark(getWatermarkSettings());
  }

  function previewWatermarkSettings(panel) {
    const settings = watermarkFormSettings(panel);
    const text = normalizeWatermarkText(settings.text);
    const message = settings.enabled && !text ? "启用水印前请填写水印文字" : "";
    setWatermarkError(panel, message);
    renderWatermark(settings);
  }

  function bindWatermarkSettings(panel) {
    if (panel.dataset.watermarkBound === "1") return;
    panel.dataset.watermarkBound = "1";
    const dialog = panel.querySelector(".wecom-watermark-panel");
    panel.querySelector(".wecom-watermark-settings").addEventListener("click", () => openWatermarkSettings(panel));
    dialog.querySelectorAll(".wecom-watermark-close, .wecom-watermark-cancel").forEach((button) => {
      button.addEventListener("click", () => closeWatermarkSettings(panel));
    });
    dialog.querySelector(".wecom-watermark-save").addEventListener("click", () => {
      try {
        saveWatermarkSettings(watermarkFormSettings(panel));
        closeWatermarkSettings(panel);
      } catch (error) {
        console.error("[Linux DO 企业微信] 保存水印失败", error);
        setWatermarkError(panel, error instanceof Error ? error.message : String(error));
      }
    });
    dialog.querySelector(".wecom-watermark-enabled").addEventListener("change", () => previewWatermarkSettings(panel));
    dialog.querySelector(".wecom-watermark-text").addEventListener("input", () => previewWatermarkSettings(panel));
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeWatermarkSettings(panel);
    });
  }

  let imageViewerTrigger = null;
  let imageViewerList = [];
  let imageViewerIndex = 0;
  let viewerIsDragging = false;
  let viewerDragStartX = 0;
  let viewerDragStartY = 0;
  let viewerDragStartTx = 0;
  let viewerDragStartTy = 0;
  let viewerHasDragged = false;

  function isPreviewableChatImage(image) {
    if (!(image instanceof HTMLImageElement)) return false;
    if (!image.closest(".wecom-msg-bubble")) return false;
    if (image.closest("aside.onebox, .onebox, .onebox-body, [data-onebox-src]")) return false;
    return !image.matches(".emoji, .site-icon, .avatar, [role='emoji'], .onebox-avatar, .onebox-thumbnail");
  }

  function normalizePreviewImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^data:image\//i.test(raw)) return raw;
    try {
      const url = new URL(raw, location.href);
      if (["http:", "https:", "blob:"].includes(url.protocol)) return url.href;
      console.warn("[Linux DO 企业微信] 已拒绝不支持的图片地址协议", url.protocol);
    } catch (error) {
      console.warn("[Linux DO 企业微信] 图片地址解析失败", raw, error);
    }
    return "";
  }

  function previewImageSource(image) {
    const lightbox = image.closest("a.lightbox, .lightbox-wrapper a[href]");
    const generalLink = image.closest("a[href]");
    const linkHref = generalLink?.getAttribute("href");
    const isImageLink = linkHref && (generalLink.classList.contains("lightbox") || /\.(?:png|jpe?g|gif|webp|bmp|svg)(?:\?.*)?$/i.test(linkHref) || /image|photo|img|uploads/i.test(linkHref));
    const candidates = [
      image.getAttribute("data-large-src"),
      image.getAttribute("data-orig-src"),
      image.getAttribute("data-original"),
      lightbox?.getAttribute("href"),
      isImageLink ? linkHref : null,
      image.currentSrc,
      image.getAttribute("src"),
      linkHref
    ];
    for (const candidate of candidates) {
      const url = normalizePreviewImageUrl(candidate);
      if (url) return url;
    }
    return "";
  }

  function normalizeImageViewerScale(value) {
    const scale = Number(value);
    if (!Number.isFinite(scale)) return IMAGE_VIEWER_DEFAULT_SCALE;
    return Math.min(IMAGE_VIEWER_MAX_SCALE, Math.max(IMAGE_VIEWER_MIN_SCALE, scale));
  }

  function getImageViewerScale(viewer) {
    return normalizeImageViewerScale(viewer?.dataset.zoomScale);
  }

  function setImageViewerTransform(viewer, scaleValue, tx = 0, ty = 0, animate = false) {
    const scale = normalizeImageViewerScale(scaleValue);
    const image = viewer?.querySelector(".wecom-image-viewer-image");
    const percentage = viewer?.querySelector(".wecom-image-viewer-zoom strong");

    let finalTx = Number(tx) || 0;
    let finalTy = Number(ty) || 0;
    if (scale <= 1) {
      finalTx = 0;
      finalTy = 0;
    }

    if (viewer) {
      viewer.dataset.zoomScale = String(scale);
      viewer.dataset.translateX = String(finalTx);
      viewer.dataset.translateY = String(finalTy);
    }

    if (image) {
      if (animate) {
        image.style.transition = "transform 100ms cubic-bezier(0.2, 0, 0.2, 1)";
      } else {
        image.style.transition = "none";
      }
      image.style.setProperty("--wecom-image-viewer-scale", String(scale));
      image.style.setProperty("--wecom-image-viewer-x", `${Math.round(finalTx)}px`);
      image.style.setProperty("--wecom-image-viewer-y", `${Math.round(finalTy)}px`);
      image.style.cursor = scale > 1 ? "grab" : "zoom-in";
    }

    if (percentage) {
      percentage.textContent = `${Math.round(scale * IMAGE_VIEWER_PERCENT_MULTIPLIER)}%`;
    }
  }

  function setImageViewerScale(viewer, value) {
    setImageViewerTransform(viewer, value, 0, 0, false);
  }

  function normalizedImageViewerWheelDelta(event) {
    if (event.deltaMode === WHEEL_DELTA_LINE_MODE) {
      return event.deltaY * IMAGE_VIEWER_LINE_HEIGHT_PX;
    }
    if (event.deltaMode === WHEEL_DELTA_PAGE_MODE) return event.deltaY * window.innerHeight;
    return event.deltaY;
  }

  function handleImageViewerWheel(viewer, event) {
    if (viewer.hidden || event.target.closest(".wecom-image-viewer-close, .wecom-image-viewer-nav, .wecom-image-viewer-counter")) return;
    const delta = normalizedImageViewerWheelDelta(event);
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();

    const currentScale = getImageViewerScale(viewer);
    const currentTx = Number(viewer.dataset.translateX || 0);
    const currentTy = Number(viewer.dataset.translateY || 0);

    const factor = Math.exp(-delta * IMAGE_VIEWER_WHEEL_SENSITIVITY);
    const newScale = normalizeImageViewerScale(currentScale * factor);
    if (newScale === currentScale) return;

    const stage = viewer.querySelector(".wecom-image-viewer-stage");
    const stageRect = stage ? stage.getBoundingClientRect() : viewer.getBoundingClientRect();
    const cx = stageRect.left + stageRect.width / 2;
    const cy = stageRect.top + stageRect.height / 2;

    const mx = event.clientX;
    const my = event.clientY;

    let newTx = 0;
    let newTy = 0;
    if (newScale > 1) {
      const ratio = newScale / currentScale;
      newTx = (mx - cx) - ratio * (mx - cx - currentTx);
      newTy = (my - cy) - ratio * (my - cy - currentTy);
    }

    setImageViewerTransform(viewer, newScale, newTx, newTy, true);
  }

  /** 收集当前会话聊天面板中所有可预览的图片，保证自然顺序且按地址去重 */
  function collectChatImages(sourceImage) {
    const panel = document.querySelector(".wecom-chat-panel") || document.body;
    const allImgs = Array.from(panel.querySelectorAll(".wecom-msg-bubble img, .wecom-msg-thumb img"))
      .filter((img) => isPreviewableChatImage(img) && previewImageSource(img));

    const list = [];
    const seen = new Set();
    for (const img of allImgs) {
      const src = previewImageSource(img);
      if (!seen.has(src)) {
        seen.add(src);
        list.push(img);
      }
    }

    if (sourceImage && !list.includes(sourceImage)) {
      const src = previewImageSource(sourceImage);
      const idx = list.findIndex((img) => previewImageSource(img) === src);
      if (idx === -1) {
        list.push(sourceImage);
      }
    }
    return list;
  }

  function updateImageViewerNavigationUi() {
    const viewer = document.querySelector(".wecom-image-viewer");
    if (!viewer) return;
    const prevBtn = viewer.querySelector(".wecom-image-viewer-prev");
    const nextBtn = viewer.querySelector(".wecom-image-viewer-next");
    const counter = viewer.querySelector(".wecom-image-viewer-counter");

    const total = imageViewerList.length;
    const hasMultiple = total > 1;

    if (prevBtn) prevBtn.hidden = !hasMultiple;
    if (nextBtn) nextBtn.hidden = !hasMultiple;
    if (counter) {
      counter.hidden = !hasMultiple;
      if (hasMultiple) {
        counter.textContent = `${imageViewerIndex + 1} / ${total}`;
      }
    }
  }

  function renderImageViewerCurrent() {
    const viewer = ensureImageViewer();
    const sourceImage = imageViewerList[imageViewerIndex];
    if (!sourceImage) return;

    const src = previewImageSource(sourceImage);
    if (!src) {
      console.error("[Linux DO 企业微信] 无法预览图片：未找到有效图片地址", sourceImage);
      return;
    }

    const image = viewer.querySelector(".wecom-image-viewer-image");
    const caption = viewer.querySelector(".wecom-image-viewer-caption");
    const label = sourceImage.alt?.trim() || "图片预览";
    imageViewerTrigger = sourceImage;
    image.alt = label;

    setImageViewerTransform(viewer, IMAGE_VIEWER_DEFAULT_SCALE, 0, 0, false);

    const total = imageViewerList.length;
    const indexSuffix = total > 1 ? ` (${imageViewerIndex + 1} / ${total})` : "";
    caption.textContent = `图片加载中…${indexSuffix}`;

    image.onload = () => { caption.textContent = `${label}${indexSuffix}`; };
    image.onerror = () => {
      caption.textContent = `图片加载失败${indexSuffix}`;
      console.error("[Linux DO 企业微信] 图片预览加载失败", src);
    };

    updateImageViewerNavigationUi();
    image.src = src;
  }

  function nextImageViewerImage() {
    if (!imageViewerList || imageViewerList.length <= 1) return;
    imageViewerIndex = (imageViewerIndex + 1) % imageViewerList.length;
    renderImageViewerCurrent();
  }

  function prevImageViewerImage() {
    if (!imageViewerList || imageViewerList.length <= 1) return;
    imageViewerIndex = (imageViewerIndex - 1 + imageViewerList.length) % imageViewerList.length;
    renderImageViewerCurrent();
  }

  function ensureImageViewer() {
    let viewer = document.querySelector(".wecom-image-viewer");
    if (viewer) return viewer;
    viewer = document.createElement("div");
    viewer.className = "wecom-image-viewer";
    viewer.hidden = true;
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "图片预览");
    viewer.innerHTML = `
      <button type="button" class="wecom-image-viewer-close" aria-label="关闭图片预览">
        <b aria-hidden="true">×</b><span>关闭</span>
      </button>
      <div class="wecom-image-viewer-zoom" aria-hidden="true"><strong>100%</strong><span>滚轮缩放</span></div>
      <div class="wecom-image-viewer-counter" aria-live="polite"></div>
      <button type="button" class="wecom-image-viewer-nav wecom-image-viewer-prev" aria-label="上一张 (←)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button type="button" class="wecom-image-viewer-nav wecom-image-viewer-next" aria-label="下一张 (→)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div class="wecom-image-viewer-stage"><img class="wecom-image-viewer-image" alt=""></div>
      <div class="wecom-image-viewer-caption" aria-live="polite"></div>`;
    document.body.appendChild(viewer);

    const stage = viewer.querySelector(".wecom-image-viewer-stage");

    viewer.addEventListener("click", (event) => {
      if (viewerHasDragged) {
        viewerHasDragged = false;
        return;
      }
      const close = event.target.closest(".wecom-image-viewer-close");
      const navPrev = event.target.closest(".wecom-image-viewer-prev");
      const navNext = event.target.closest(".wecom-image-viewer-next");

      if (navPrev) {
        prevImageViewerImage();
        return;
      }
      if (navNext) {
        nextImageViewerImage();
        return;
      }
      if (close || event.target === viewer || event.target === stage) {
        closeImageViewer();
      }
    });

    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest(".wecom-image-viewer-close, .wecom-image-viewer-nav")) return;

      viewerIsDragging = true;
      viewerHasDragged = false;
      viewerDragStartX = event.clientX;
      viewerDragStartY = event.clientY;
      viewerDragStartTx = Number(viewer.dataset.translateX || 0);
      viewerDragStartTy = Number(viewer.dataset.translateY || 0);

      const scale = getImageViewerScale(viewer);
      const image = viewer.querySelector(".wecom-image-viewer-image");
      if (image && scale > 1) {
        image.classList.add("is-dragging");
      }
      try { stage.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
    });

    stage.addEventListener("pointermove", (event) => {
      if (!viewerIsDragging) return;
      const dx = event.clientX - viewerDragStartX;
      const dy = event.clientY - viewerDragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        viewerHasDragged = true;
      }
      const scale = getImageViewerScale(viewer);
      if (scale > 1) {
        const tx = viewerDragStartTx + dx;
        const ty = viewerDragStartTy + dy;
        setImageViewerTransform(viewer, scale, tx, ty, false);
      }
    });

    const endDrag = (event) => {
      if (!viewerIsDragging) return;
      viewerIsDragging = false;
      const image = viewer.querySelector(".wecom-image-viewer-image");
      if (image) {
        image.classList.remove("is-dragging");
        const scale = getImageViewerScale(viewer);
        image.style.cursor = scale > 1 ? "grab" : "zoom-in";
      }
      try { stage.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    stage.addEventListener("dblclick", (event) => {
      if (event.target.closest(".wecom-image-viewer-close, .wecom-image-viewer-nav")) return;
      const currentScale = getImageViewerScale(viewer);
      const stageRect = stage.getBoundingClientRect();
      const cx = stageRect.left + stageRect.width / 2;
      const cy = stageRect.top + stageRect.height / 2;

      if (currentScale > 1.1) {
        setImageViewerTransform(viewer, 1, 0, 0, true);
      } else {
        const targetScale = 2.5;
        const ratio = targetScale / currentScale;
        const mx = event.clientX;
        const my = event.clientY;
        const tx = (mx - cx) - ratio * (mx - cx);
        const ty = (my - cy) - ratio * (my - cy);
        setImageViewerTransform(viewer, targetScale, tx, ty, true);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (viewer.hidden) return;
      if (event.key === "Escape") {
        closeImageViewer();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prevImageViewerImage();
      } else if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        nextImageViewerImage();
      } else if (event.key === "0" || event.key === "r" || event.key === "R") {
        setImageViewerTransform(viewer, 1, 0, 0, true);
      }
    });

    viewer.addEventListener("wheel", (event) => handleImageViewerWheel(viewer, event), { passive: false });
    return viewer;
  }

  function openImageViewer(sourceImage) {
    if (!sourceImage) return;
    imageViewerList = collectChatImages(sourceImage);
    const currentSrc = previewImageSource(sourceImage);
    const idx = imageViewerList.findIndex((img) => img === sourceImage || (currentSrc && previewImageSource(img) === currentSrc));
    imageViewerIndex = idx >= 0 ? idx : 0;

    const viewer = ensureImageViewer();
    viewer.hidden = false;
    document.documentElement.classList.add("wecom-image-viewer-open");
    renderImageViewerCurrent();
    viewer.querySelector(".wecom-image-viewer-close")?.focus({ preventScroll: true });
  }

  function closeImageViewer() {
    const viewer = document.querySelector(".wecom-image-viewer");
    document.documentElement.classList.remove("wecom-image-viewer-open");
    if (!viewer) return;
    viewer.hidden = true;
    setImageViewerTransform(viewer, IMAGE_VIEWER_DEFAULT_SCALE, 0, 0, false);
    const image = viewer.querySelector(".wecom-image-viewer-image");
    if (image) {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
    }
    imageViewerList = [];
    imageViewerIndex = 0;
    if (imageViewerTrigger?.isConnected) imageViewerTrigger.focus({ preventScroll: true });
    imageViewerTrigger = null;
  }

  function hydrateChatLinks(root) {
    if (!root) return;
    const links = root.querySelectorAll("a[href]");
    links.forEach((a) => {
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

  function isNodeVisuallyEmpty(node) {
    if (!node) return true;
    if (node.textContent.replace(/[\s\u200B\u00A0]+/g, "").length > 0) return false;
    const meaningful = node.querySelector("img, svg, iframe, video, audio, table, pre, code, input, hr, canvas, object, embed, aside.onebox, .onebox, .poll, details, .wecom-msg-images, .wecom-msg-thumb");
    return !meaningful;
  }

  function cleanMessageBodyWhitespace(bodyEl) {
    if (!bodyEl) return;

    // 1. 递归清理视觉为空的段落与块级容器（包括仅含空白、&nbsp;、<br> 的节点）
    const emptyNodes = bodyEl.querySelectorAll("p, div, span, blockquote, section, article, h1, h2, h3, h4, h5, h6");
    for (let i = emptyNodes.length - 1; i >= 0; i--) {
      const el = emptyNodes[i];
      if (el.parentNode && isNodeVisuallyEmpty(el)) {
        el.remove();
      }
    }

    // 2. 清理连续的 <br>，将连续 2 个以上的 <br> 缩减为最多 1 个换行
    // 同时清理紧挨块级元素（p, div, blockquote, pre, table, ul, ol 等）前后的冗余 <br>
    const allBrs = Array.from(bodyEl.querySelectorAll("br"));
    for (const br of allBrs) {
      if (!br.parentNode) continue;

      let prev = br.previousSibling;
      while (prev && prev.nodeType === 3 && prev.textContent.trim() === "") {
        const toRemove = prev;
        prev = prev.previousSibling;
        toRemove.remove();
      }
      if (prev) {
        if (prev.nodeName === "BR") {
          br.remove();
          continue;
        }
        if (prev.nodeType === 1 && /^(P|DIV|BLOCKQUOTE|PRE|TABLE|UL|OL|H[1-6]|HR|ASIDE|DETAILS)$/i.test(prev.nodeName)) {
          br.remove();
          continue;
        }
      }

      let next = br.nextSibling;
      while (next && next.nodeType === 3 && next.textContent.trim() === "") {
        next = next.nextSibling;
      }
      if (next && next.nodeType === 1 && /^(P|DIV|BLOCKQUOTE|PRE|TABLE|UL|OL|H[1-6]|HR|ASIDE|DETAILS)$/i.test(next.nodeName)) {
        br.remove();
        continue;
      }
    }

    // 3. 清理段落或行内容器内部首尾的空节点与 <br>
    bodyEl.querySelectorAll("p, div, blockquote, li").forEach((container) => {
      while (container.firstChild && (container.firstChild.nodeName === "BR" || (container.firstChild.nodeType === 3 && container.firstChild.textContent.trim() === ""))) {
        container.firstChild.remove();
      }
      while (container.lastChild && (container.lastChild.nodeName === "BR" || (container.lastChild.nodeType === 3 && container.lastChild.textContent.trim() === ""))) {
        container.lastChild.remove();
      }
    });

    // 4. 清理 bodyEl 首尾的空文本节点与 <br>，彻底消除正文顶部与底部（紧贴图片栏处）的空行
    while (bodyEl.firstChild) {
      const first = bodyEl.firstChild;
      if (first.nodeType === 3 && first.textContent.trim() === "") {
        first.remove();
      } else if (first.nodeName === "BR") {
        first.remove();
      } else if (first.nodeType === 1 && isNodeVisuallyEmpty(first)) {
        first.remove();
      } else {
        break;
      }
    }
    while (bodyEl.lastChild) {
      const last = bodyEl.lastChild;
      if (last.nodeType === 3 && last.textContent.trim() === "") {
        last.remove();
      } else if (last.nodeName === "BR") {
        last.remove();
      } else if (last.nodeType === 1 && isNodeVisuallyEmpty(last)) {
        last.remove();
      } else {
        break;
      }
    }

    // 5. 整体状态判断
    if (isNodeVisuallyEmpty(bodyEl)) {
      bodyEl.classList.add("is-empty");
    } else {
      bodyEl.classList.remove("is-empty");
    }
  }

  function parsePixelDimension(val) {
    if (!val) return NaN;
    const str = String(val).trim();
    if (!str || str.endsWith("%") || str.endsWith("vw") || str.endsWith("vh")) return NaN;
    const num = parseFloat(str);
    return Number.isFinite(num) && num > 0 ? num : NaN;
  }

  function getImageEffectiveDimensions(img) {
    if (!img) return null;

    // 1. Natural dimensions if loaded
    if (img.naturalWidth > 0) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight || img.naturalWidth
      };
    }

    // 2. Explicit HTML attributes (width, height, data-width, data-height, data-orig-width, data-orig-height)
    const attrW = parsePixelDimension(img.getAttribute("width") || img.getAttribute("data-width") || img.getAttribute("data-orig-width"));
    const attrH = parsePixelDimension(img.getAttribute("height") || img.getAttribute("data-height") || img.getAttribute("data-orig-height"));
    if (Number.isFinite(attrW) && Number.isFinite(attrH)) {
      return { width: attrW, height: attrH };
    }
    if (Number.isFinite(attrW)) {
      return { width: attrW, height: attrW };
    }
    if (Number.isFinite(attrH)) {
      return { width: attrH, height: attrH };
    }

    // 3. Inline style
    const styleW = parsePixelDimension(img.style?.width);
    const styleH = parsePixelDimension(img.style?.height);
    if (Number.isFinite(styleW) && Number.isFinite(styleH)) {
      return { width: styleW, height: styleH };
    }
    if (Number.isFinite(styleW)) {
      return { width: styleW, height: styleW };
    }
    if (Number.isFinite(styleH)) {
      return { width: styleH, height: styleH };
    }

    // 4. Discourse .meta informations (e.g. "800×600 45 KB")
    const metaInfo = img.closest(".lightbox-wrapper")?.querySelector(".informations")?.textContent;
    if (metaInfo) {
      const match = metaInfo.match(/(\d+)\s*[×x]\s*(\d+)/i);
      if (match) {
        const mw = parseInt(match[1], 10);
        const mh = parseInt(match[2], 10);
        if (mw > 0 && mh > 0) {
          return { width: mw, height: mh };
        }
      }
    }

    // 5. Rendered dimensions if in document
    if (typeof img.getBoundingClientRect === "function" && img.isConnected) {
      const rect = img.getBoundingClientRect();
      const rw = img.offsetWidth || img.clientWidth || (rect ? rect.width : 0);
      const rh = img.offsetHeight || img.clientHeight || (rect ? rect.height : 0);
      if (rw > 0 && rh > 0) {
        return { width: rw, height: rh };
      }
    }

    return null;
  }

  function isImageSmallerThanLayout(img, layoutSize) {
    const dim = getImageEffectiveDimensions(img);
    if (!dim) return false;
    const targetSize = Number(layoutSize) || getImageAutoLayoutSize();
    const dims = computeImageAutoLayoutDimensions(targetSize, getImageAutoLayoutAspect());
    // 小于排版尺寸：图片的宽度和高度均小于设定的排版缩略图尺寸
    return dim.width < dims.width && dim.height < dims.height;
  }

  function attachImageAutoLayoutLoadCheck(img, bubble) {
    if (!img || img.dataset.layoutChecked) return;
    img.dataset.layoutChecked = "1";
    if (typeof img.addEventListener !== "function") return;
    img.addEventListener("load", () => {
      const currentLayoutSize = getImageAutoLayoutSize();
      if (isImageSmallerThanLayout(img, currentLayoutSize)) {
        const msg = bubble?.closest(".wecom-msg");
        if (!msg) return;
        const postNum = Number(msg.dataset.postNumber);
        const post = chatState.postsByNumber.get(postNum);
        const rawContent = post?.cooked || bubble.dataset.rawCooked;
        if (rawContent) {
          bubble.removeAttribute("data-layout-mode");
          bubble.querySelectorAll(".wecom-msg-images").forEach((el) => el.remove());
          bubble.querySelector(".wecom-bubble-layout-toggle")?.remove();
          const bodyEl = bubble.querySelector(".wecom-msg-body");
          if (bodyEl) {
            bodyEl.innerHTML = rawContent;
            bodyEl.classList.remove("is-empty");
          }
          applyImageAutoLayout(msg);
          hydrateChatImages(bubble);
        }
      }
    }, { once: true });
  }

  function applyImageAutoLayout(root) {
    if (!root || !isImageAutoLayoutEnabled()) return;
    const messages = root.classList?.contains("wecom-msg")
      ? [root]
      : Array.from(root.querySelectorAll(".wecom-msg"));
    if (!messages.length) return;

    const layoutSize = getImageAutoLayoutSize();

    for (const msg of messages) {
      const bubble = msg.querySelector(".wecom-msg-bubble");
      if (!bubble) continue;
      if (bubble.dataset.layoutMode === "raw") continue;
      if (bubble.querySelector(".wecom-msg-images")) continue;

      const bodyEl = bubble.querySelector(".wecom-msg-body");
      if (!bodyEl) continue;

      if (!bubble.dataset.rawCooked) {
        bubble.dataset.rawCooked = bodyEl.innerHTML;
      }

      const allImgs = Array.from(bodyEl.querySelectorAll("img"));
      const candidateImgs = allImgs.filter((img) => {
        if (!isPreviewableChatImage(img)) return false;
        if (img.matches(".onebox-avatar, .onebox-thumbnail, .site-icon, .badge-icon, .avatar")) return false;
        if (img.closest("aside.onebox, .onebox, .onebox-body, [data-onebox-src], .wecom-reply-reference, table, details, .poll, .poll-ui-container, .lazyYT, .video-container, .audio-container, .chat-transcript, pre, code")) return false;
        const src = img.getAttribute("src") || img.getAttribute("data-orig-src") || img.getAttribute("data-large-src");
        if (!src || src.startsWith("data:image/svg+xml")) return false;
        if (isImageSmallerThanLayout(img, layoutSize)) return false;
        if (!img.complete && !getImageEffectiveDimensions(img)) {
          attachImageAutoLayoutLoadCheck(img, bubble);
        }
        return true;
      });

      if (!candidateImgs.length) {
        bubble.querySelector(".wecom-bubble-layout-toggle")?.remove();
        bubble.removeAttribute("data-layout-mode");
        continue;
      }

      // 按照所在作用域分组：每个 blockquote 各自形成独立画廊，引用框外的图片归入气泡主画廊
      const groups = new Map();
      for (const img of candidateImgs) {
        const bq = img.closest("blockquote");
        const scope = bq || bubble;
        if (!groups.has(scope)) {
          groups.set(scope, []);
        }
        groups.get(scope).push(img);
      }

      for (const [scope, imgs] of groups.entries()) {
        const gallery = document.createElement("div");
        gallery.className = "wecom-msg-images";
        gallery.setAttribute("role", "group");
        gallery.setAttribute("aria-label", scope === bubble ? "帖子图片" : "引用图片");

        for (const img of imgs) {
          const lightboxWrapper = img.closest(".lightbox-wrapper");
          const lightboxLink = img.closest("a.lightbox, .lightbox-wrapper a[href]");
          const normalLink = img.closest("a");
          const linkToMove = lightboxLink || (normalLink && normalLink.textContent.trim() === "" ? normalLink : null);
          const targetToRemove = (lightboxWrapper && lightboxWrapper !== linkToMove) ? lightboxWrapper : null;
          const originalParent = (lightboxWrapper || linkToMove || img).parentElement;

          if (lightboxWrapper) {
            lightboxWrapper.querySelector(".meta")?.remove();
          }

          const thumb = document.createElement("div");
          thumb.className = "wecom-msg-thumb";
          thumb.setAttribute("role", "button");
          thumb.tabIndex = 0;
          const altText = img.getAttribute("alt")?.trim() || img.getAttribute("title")?.trim() || "查看大图";
          thumb.title = altText;
          thumb.setAttribute("aria-label", altText);

          img.setAttribute("loading", "lazy");

          if (linkToMove) {
            thumb.appendChild(linkToMove);
          } else {
            thumb.appendChild(img);
          }

          const imgSrc = img.getAttribute("src") || img.getAttribute("data-orig-src") || "";
          if (/\.gif(\?|$)/i.test(imgSrc)) {
            const badge = document.createElement("span");
            badge.className = "wecom-msg-thumb-badge";
            badge.textContent = "GIF";
            thumb.appendChild(badge);
          }

          gallery.appendChild(thumb);

          if (targetToRemove) {
            targetToRemove.remove();
          }

          let cur = originalParent;
          while (cur && cur !== scope && cur !== bodyEl && isNodeVisuallyEmpty(cur)) {
            const next = cur.parentElement;
            cur.remove();
            cur = next;
          }
        }

        if (scope === bubble) {
          cleanMessageBodyWhitespace(bodyEl);
          bubble.appendChild(gallery);
        } else {
          cleanMessageBodyWhitespace(scope);
          scope.appendChild(gallery);
        }
      }

      cleanMessageBodyWhitespace(bodyEl);
      if (isNodeVisuallyEmpty(bodyEl)) {
        bodyEl.classList.add("is-empty");
      }

      // 添加气泡排版切换悬浮钮
      let toggleBtn = bubble.querySelector(".wecom-bubble-layout-toggle");
      if (!toggleBtn) {
        toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "wecom-bubble-layout-toggle";
        bubble.appendChild(toggleBtn);
      }
      toggleBtn.title = "点击显示原排版";
      toggleBtn.innerHTML = `${ICONS.layoutOriginal}<span>原排版</span>`;
      toggleBtn.classList.remove("is-raw");
      bubble.dataset.layoutMode = "auto";
    }
  }

  function toggleMessageBubbleLayout(btn) {
    const bubble = btn.closest(".wecom-msg-bubble");
    if (!bubble) return;
    const msgEl = bubble.closest(".wecom-msg");
    if (!msgEl) return;
    const postNum = Number(msgEl.dataset.postNumber);
    const post = chatState.postsByNumber.get(postNum);
    const rawContent = post?.cooked || bubble.dataset.rawCooked || "";

    const isRaw = bubble.dataset.layoutMode === "raw";
    if (isRaw) {
      // 切换到自动排版
      bubble.dataset.layoutMode = "auto";
      const bodyEl = bubble.querySelector(".wecom-msg-body");
      if (bodyEl) {
        bodyEl.innerHTML = rawContent;
        bodyEl.classList.remove("is-empty");
      }
      bubble.querySelectorAll(".wecom-msg-images").forEach((el) => el.remove());
      applyImageAutoLayout(msgEl);
      btn.title = "点击显示原排版";
      btn.innerHTML = `${ICONS.layoutOriginal}<span>原排版</span>`;
      btn.classList.remove("is-raw");
    } else {
      // 切换到原排版
      bubble.dataset.layoutMode = "raw";
      bubble.querySelectorAll(".wecom-msg-images").forEach((el) => el.remove());
      const bodyEl = bubble.querySelector(".wecom-msg-body");
      if (bodyEl) {
        bodyEl.innerHTML = rawContent;
        bodyEl.classList.remove("is-empty");
      }
      btn.title = "点击显示自动排版";
      btn.innerHTML = `${ICONS.layoutAuto}<span>自动排版</span>`;
      btn.classList.add("is-raw");
    }
    hydrateChatImages(bubble);
  }

  function refreshChatMessagesLayout() {
    const body = document.querySelector(".wecom-chat-body");
    if (!body) return;
    const messages = body.querySelectorAll(".wecom-msg");
    if (!messages.length) return;
    for (const msgEl of messages) {
      const num = Number(msgEl.dataset.postNumber);
      const post = chatState.postsByNumber.get(num);
      const bubble = msgEl.querySelector(".wecom-msg-bubble");
      if (!bubble) continue;
      const rawContent = post?.cooked || bubble.dataset.rawCooked;
      if (rawContent === undefined || rawContent === null) continue;
      bubble.removeAttribute("data-layout-mode");
      bubble.querySelectorAll(".wecom-msg-images").forEach((el) => el.remove());
      bubble.querySelector(".wecom-bubble-layout-toggle")?.remove();
      const bodyEl = bubble.querySelector(".wecom-msg-body");
      if (bodyEl) {
        bodyEl.innerHTML = rawContent;
        bodyEl.classList.remove("is-empty");
      } else {
        bubble.innerHTML = `${post ? replyReferenceHtml(post) : ""}<div class="wecom-msg-body">${rawContent}</div>`;
      }
    }
    hydrateChatImages(body);
  }

  function hydrateChatImages(root) {
    if (!root) return;
    hydrateChatLinks(root);
    if (isImageAutoLayoutEnabled()) {
      applyImageAutoLayout(root);
    }
    root.querySelectorAll(".wecom-msg-bubble img").forEach((image) => {
      if (!isPreviewableChatImage(image)) return;
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      if (!image.title) image.title = "点击查看大图";
    });
    root.querySelectorAll(".wecom-msg-thumb").forEach((thumb) => {
      if (thumb.dataset.boundKey) return;
      thumb.dataset.boundKey = "1";
      thumb.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const img = thumb.querySelector("img");
          if (img) openImageViewer(img);
        }
      });
    });
  }

  function editUi() {
    const dialog = document.querySelector(".wecom-edit-dialog");
    return {
      dialog,
      input: dialog?.querySelector(".wecom-edit-input"),
      save: dialog?.querySelector(".wecom-edit-save"),
      status: dialog?.querySelector(".wecom-edit-status"),
      title: dialog?.querySelector(".wecom-edit-dialog-title")
    };
  }

  function setEditStatus(message, kind = "") {
    const { status } = editUi();
    if (!status) return;
    status.textContent = message || "";
    status.className = `wecom-edit-status${kind ? ` ${kind}` : ""}`;
  }

  function updateEditSaveState() {
    const { input, save } = editUi();
    if (!input || !save) return;
    save.disabled = editState.loading || editState.saving || editState.uploading || !input.value.trim();
  }

  function closeEditDialog(force = false) {
    if ((editState.saving || editState.uploading) && !force) return;
    const { dialog, input } = editUi();
    const trigger = editState.trigger;
    editState.requestSerial += 1;
    editState.postId = null;
    editState.postNumber = null;
    editState.loading = false;
    editState.saving = false;
    editState.uploading = false;
    editState.trigger = null;
    if (dialog) dialog.hidden = true;
    if (input) {
      input.disabled = false;
      input.value = "";
    }
    setEditStatus("");
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  function handleEditDialogClick(event) {
    const { dialog } = editUi();
    const action = event.target.closest("[data-edit-action]")?.dataset.editAction;
    if (event.target === dialog || action === "close" || action === "cancel") {
      closeEditDialog();
      return;
    }
    if (action === "save") submitEditedPost();
  }

  function handleEditDialogKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEditDialog();
      return;
    }
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    submitEditedPost();
  }

  function ensureEditDialog() {
    let dialog = document.querySelector(".wecom-edit-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("div");
    dialog.className = "wecom-edit-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "wecom-edit-dialog-title");
    dialog.innerHTML = `
      <div class="wecom-edit-dialog-card">
        <div class="wecom-edit-dialog-head">
          <strong id="wecom-edit-dialog-title" class="wecom-edit-dialog-title">编辑消息</strong>
          <button type="button" class="wecom-edit-dialog-close" data-edit-action="close" aria-label="关闭">×</button>
        </div>
        <textarea class="wecom-edit-input" aria-label="消息原文" placeholder="正在读取消息原文…"></textarea>
        <div class="wecom-edit-status" role="alert" aria-live="polite"></div>
        <div class="wecom-edit-dialog-actions">
          <button type="button" data-edit-action="cancel">取消</button>
          <button type="button" class="wecom-edit-save" data-edit-action="save" disabled>保存</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener("click", handleEditDialogClick);
    dialog.addEventListener("keydown", handleEditDialogKeydown);
    const input = dialog.querySelector(".wecom-edit-input");
    input.addEventListener("input", updateEditSaveState);
    input.addEventListener("paste", handleEditPaste);
    return dialog;
  }

  function ensureChatPanel() {
    let panel = document.querySelector(".wecom-chat-panel");
    if (panel && (!panel.querySelector(".wecom-chat-compose") || !panel.querySelector(".wecom-pinned-banner") ||
      !panel.querySelector(".wecom-watermark-panel") || !panel.querySelector(".wecom-image-input") ||
      !panel.querySelector('[data-composer-action="emoji"]') || !panel.querySelector('[data-composer-action="pic"]') ||
      !panel.querySelector('[data-composer-action="doc"]') || !panel.querySelector('[data-composer-action="apps"]') ||
      !panel.querySelector(".wecom-platform-switcher") || !panel.querySelector(".wecom-chat-avatar-toggle") ||
      !panel.querySelector(".wecom-composer-bottom .wecom-compose-status"))) {
      panel.remove();
      panel = null;
    }
    if (panel) {
      if (!panel.dataset.composeBound) {
        panel.dataset.composeBound = "1";
        bindChatPanelEvents(panel);
      }
      bindPlatformSwitcher();
      bindWatermarkSettings(panel);
      renderWatermark(getWatermarkSettings());
      wireComposeButton(panel);
      bindUserCardEvents(panel);
      ensureEditDialog();
      return panel;
    }
    panel = document.createElement("div");
    panel.className = "wecom-chat-panel";
    panel.dataset.empty = "1";
    panel.dataset.composeBound = "1";
    const toolKeys = [
      { key: "emoji", label: "表情", icon: ICONS.emoji, arrow: false },
      { key: "cut", label: "截图", icon: ICONS.cut, arrow: true },
      { key: "pic", label: "发送图片", icon: ICONS.pic, arrow: true },
      { key: "doc", label: "微文档", icon: ICONS.docLine, arrow: false },
      { key: "todo", label: "日程与待办", icon: ICONS.todoLine, arrow: true },
      { key: "folder", label: "发送文件", icon: ICONS.folder, arrow: true },
      { key: "phone", label: "语音视频通话", icon: ICONS.phoneReceiver, arrow: true },
      { key: "apps", label: "工作台", icon: ICONS.appsGrid, arrow: false },
      { key: "history", label: "聊天记录", icon: ICONS.historySearch, arrow: false }
    ];
    const toolsHtml = toolKeys.map(({ key, label, icon, arrow }) => {
      const popup = key === "emoji" ? ' aria-haspopup="dialog" aria-expanded="false"' : "";
      const arrowHtml = arrow ? `<svg class="wecom-tool-arrow" width="6" height="4" viewBox="0 0 6 4" fill="currentColor"><path d="M0 0l3 4 3-4z"/></svg>` : "";
      const extraClass = arrow ? " has-arrow" : "";
      return `<button type="button" class="wecom-icon-btn${extraClass}" data-composer-action="${key}" title="${label}" aria-label="${label}"${popup}>${icon || ""}${arrowHtml}</button>`;
    }).join("");
    panel.innerHTML = `
      <div class="wecom-chat-header">
        <div class="wecom-chat-head-main">
          <span class="wecom-chat-avatar" style="display:none"></span>
          <div class="wecom-chat-titles">
            <div class="wecom-chat-title-row">
              <span class="wecom-chat-title"></span>
              <span class="wecom-chat-count" style="display:none"></span>
              <span class="wecom-chat-chips"></span>
            </div>
            <div class="wecom-chat-sub"></div>
          </div>
        </div>
        <div class="wecom-chat-tools">
          <button type="button" class="wecom-icon-btn wecom-chat-avatar-toggle${isHideChatAvatar() ? " is-active" : ""}" title="${isHideChatAvatar() ? "显示对话头像" : "隐藏对话头像"}" aria-label="隐藏对话头像" aria-pressed="${isHideChatAvatar() ? "true" : "false"}">${ICONS.userOff}</button>
          <button type="button" class="wecom-icon-btn wecom-chat-members-toggle" title="群成员与详情">${ICONS.users}</button>
          <button type="button" class="wecom-icon-btn wecom-topic-bookmark"${IS_V2EX ? ' style="display:none"' : ""} title="收藏话题" aria-label="收藏话题" aria-pressed="false">${ICONS.bookmark}</button>
          <button type="button" class="wecom-icon-btn wecom-watermark-settings" title="背景水印设置" aria-label="背景水印设置" aria-expanded="false" aria-pressed="false">${ICONS.watermark}</button>
          <div class="wecom-platform-switcher">
            <button type="button" class="wecom-icon-btn wecom-platform-btn" aria-haspopup="true" aria-expanded="false" title="切换社区平台">
              ${ICONS.platformSwitch}
            </button>
            <div class="wecom-platform-dropdown" hidden>
              <div class="wecom-platform-dropdown-title">选择社区平台</div>
              <div class="wecom-platform-item${!IS_V2EX ? " is-active" : ""}" data-target-platform="linuxdo">
                <span class="wecom-platform-item-icon">🐧</span>
                <div class="wecom-platform-item-info">
                  <div class="wecom-platform-item-name">Linux DO</div>
                  <div class="wecom-platform-item-desc">linux.do · 新时代技术社区</div>
                </div>
                ${!IS_V2EX ? '<span class="wecom-platform-item-check">✓</span>' : ""}
              </div>
              <div class="wecom-platform-item${IS_V2EX ? " is-active" : ""}" data-target-platform="v2ex">
                <span class="wecom-platform-item-icon">✌️</span>
                <div class="wecom-platform-item-info">
                  <div class="wecom-platform-item-name">V2EX</div>
                  <div class="wecom-platform-item-desc">v2ex.com · 创意工作者社区</div>
                </div>
                ${IS_V2EX ? '<span class="wecom-platform-item-check">✓</span>' : ""}
              </div>
            </div>
          </div>
          <button type="button" class="wecom-icon-btn wecom-chat-scroll-top" title="回到顶部" aria-label="回到顶部">${ICONS.scrollTop}</button>
          <button type="button" class="wecom-icon-btn wecom-chat-refresh" title="刷新本话题">${ICONS.refresh}</button>
        </div>
      </div>
      <section class="wecom-watermark-panel" aria-label="聊天背景水印" hidden>
        <div class="wecom-watermark-head">
          <strong>聊天背景水印</strong>
          <button type="button" class="wecom-watermark-close" title="关闭" aria-label="关闭">×</button>
        </div>
        <label class="wecom-watermark-switch-row">
          <span>启用水印</span>
          <span class="wecom-watermark-switch">
            <input type="checkbox" class="wecom-watermark-enabled">
            <i aria-hidden="true"></i>
          </span>
        </label>
        <label class="wecom-watermark-field">
          <span>水印文字</span>
          <input type="text" class="wecom-watermark-text" maxlength="${WATERMARK_MAX_LENGTH}" placeholder="例如：姓名 / 工号 / 公司名称">
        </label>
        <div class="wecom-watermark-hint">文字会以斜向重复方式显示，仅保存在当前浏览器。</div>
        <div class="wecom-watermark-error" role="alert"></div>
        <div class="wecom-watermark-actions">
          <button type="button" class="wecom-watermark-cancel">取消</button>
          <button type="button" class="wecom-watermark-save">保存</button>
        </div>
      </section>
      <div class="wecom-pinned-banner" style="display:none">
        <span class="wecom-pinned-avatar"></span>
        <span class="wecom-pinned-content"></span>
        <button type="button" class="wecom-pinned-close" title="收起">×</button>
      </div>
      <div class="wecom-chat-body"></div>
      <div class="wecom-composer">
        <div class="wecom-composer-card">
          <div class="wecom-composer-tools">
            ${toolsHtml}
            <button type="button" class="wecom-tool-quick-meet" title="快速会议">${ICONS.bolt}<span>快速会议</span></button>
            <input class="wecom-image-input" type="file" accept="image/*" multiple aria-label="选择图片">
          </div>
          <div class="wecom-reply-target" hidden><span></span><button type="button" class="wecom-reply-cancel" aria-label="取消指定回复">×</button></div>
          <textarea class="wecom-chat-compose" data-wecom-compose="1" rows="3" aria-label="消息" placeholder="发送消息"></textarea>
          <div class="wecom-composer-bottom">
            <span class="wecom-compose-status" aria-live="polite"></span>
            <button type="button" class="wecom-send-btn" disabled>发送(S)</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    bindChatPanelEvents(panel);
    bindPlatformSwitcher();
    bindUserCardEvents(panel);
    bindWatermarkSettings(panel);
    renderWatermark(getWatermarkSettings());
    ensureEditDialog();
    panel.querySelector(".wecom-pinned-close")?.addEventListener("click", () => {
      const banner = panel.querySelector(".wecom-pinned-banner");
      if (banner) banner.style.display = "none";
    });
    wireComposeButton(panel);
    return panel;
  }

  function memberAvatarHtml(user) {
    const name = userDisplayName(user, user?.username || "?");
    if (!isMaskAvatar() && user?.avatar_template) {
      return `<span class="wecom-member-avatar"${userCardAttributes(user)}><img src="${escapeHtml(fullAvatarUrl(user.avatar_template))}" alt=""></span>`;
    }
    return `<span class="wecom-member-avatar" style="background:${avatarColor(name)}"${userCardAttributes(user)}>${escapeHtml(avatarLetter(name))}</span>`;
  }

  function topicParticipants(data, posts) {
    const source = [...(data?.details?.participants || []), ...(posts || [])];
    const seen = new Set();
    return source.filter((user) => {
      const key = normalizeUsername(user?.username) || String(user?.id || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function memberRowHtml(user, role) {
    const name = userDisplayName(user, user?.username || "?");
    const roleHtml = role ? `<span class="wecom-member-role">${escapeHtml(role)}</span>` : "";
    return `<div class="wecom-member-row">${memberAvatarHtml(user)}<span class="wecom-member-name">${escapeHtml(name)}</span>${roleHtml}</div>`;
  }

  function isMembersPanelOpen() {
    try {
      const saved = localStorage.getItem("linuxdo-wecom-members-open");
      return saved !== "0"; // 默认展示，用户主动收起后保持收起
    } catch {
      return true;
    }
  }

  function setMembersPanelOpen(open) {
    try {
      localStorage.setItem("linuxdo-wecom-members-open", open ? "1" : "0");
    } catch {}
    document.documentElement.classList.toggle("wecom-members-open", open);
    const btn = document.querySelector(".wecom-chat-members-toggle");
    if (btn) {
      btn.classList.toggle("active", open);
      btn.setAttribute("aria-pressed", open ? "true" : "false");
    }
  }

  function ensureMemberPanel() {
    let panel = document.querySelector(".wecom-member-panel");
    if (panel) {
      bindUserCardEvents(panel);
      return panel;
    }
    panel = document.createElement("aside");
    panel.className = "wecom-member-panel";
    panel.innerHTML = `
      <div class="wecom-member-announcement">
        <div class="wecom-announcement-header">
          <span>群公告</span>
          <span class="wecom-arrow-icon">${ICONS.chevronRight}</span>
        </div>
        <div class="wecom-announcement-preview">暂无群公告内容</div>
      </div>
      <div class="wecom-member-header">
        <span>群成员 · <b class="wecom-member-count">0</b></span>
        <span class="wecom-member-actions">
          <button type="button" class="wecom-icon-btn" title="邮件">${ICONS.mail}</button>
          <button type="button" class="wecom-icon-btn" title="更多">${ICONS.dots}</button>
        </span>
      </div>
      <div class="wecom-member-category-bar">
        <span class="wecom-member-cat-tag">技术交流</span>
        <span class="wecom-arrow-icon">${ICONS.chevronRight}</span>
      </div>
      <div class="wecom-member-body"></div>`;
    document.body.appendChild(panel);
    bindUserCardEvents(panel);
    panel.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (link && panel.contains(link) && isPlainClick(event)) {
        const href = link.getAttribute("href") || "";
        if (href && href !== "#" && !href.startsWith("javascript:")) {
          consumeClick(event);
          link.setAttribute("target", "_blank");
          if (!link.getAttribute("rel")?.includes("noopener")) {
            link.setAttribute("rel", "noopener noreferrer");
          }
          let fullUrl = href;
          try { fullUrl = new URL(href, location.origin).href; } catch { /* ignore */ }
          window.open(fullUrl, "_blank", "noopener,noreferrer");
        }
      }
    });
    return panel;
  }

  function renderMemberPanel(data, posts) {
    const panel = ensureMemberPanel();
    hydrateChatLinks(panel);
    const users = topicParticipants(data, posts);
    const owner = posts.find((post) => post.post_number === 1) || users[0] || null;
    const others = users.filter((user) => normalizeUsername(user.username) !== normalizeUsername(owner?.username));
    const total = data.participant_count || users.length;
    const countEl = panel.querySelector(".wecom-member-count");
    if (countEl) countEl.textContent = String(total);

    // 群公告 preview
    const firstPost = posts.find((post) => post.post_number === 1);
    const previewEl = panel.querySelector(".wecom-announcement-preview");
    if (previewEl) {
      if (isMaskTitleDetail()) {
        previewEl.textContent = "本群用于项目日常交流及工单跟进，请遵守信息安全规范。";
      } else if (firstPost) {
        const text = String(firstPost.cooked || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        previewEl.textContent = text.slice(0, 80) || "暂无群公告内容";
      } else {
        previewEl.textContent = "暂无群公告内容";
      }
    }

    // 分类 tag
    const catBar = panel.querySelector(".wecom-member-cat-tag");
    if (catBar) {
      if (isMaskTitleDetail()) {
        catBar.textContent = "项目沟通";
      } else {
        const cat = data?.category_id ? categoryById(data.category_id) : null;
        catBar.textContent = cat ? cat.name : (IS_V2EX && data?.node_name ? (data.node_title || data.node_name) : (data?.title ? data.title.slice(0, 10) : "技术交流"));
      }
    }

    const body = panel.querySelector(".wecom-member-body");
    if (body) {
      body.innerHTML =
        `<div class="wecom-member-section"><div class="wecom-member-section-title">群主/管理员</div>${owner ? memberRowHtml(owner, "群主") : ""}</div>` +
        `<div class="wecom-member-section"><div class="wecom-member-section-title">群成员</div>${others.map((user) => memberRowHtml(user, "")).join("")}</div>`;
    }
    hydrateChatLinks(panel);
    setMembersPanelOpen(isMembersPanelOpen());
  }

  function renderPinnedBanner(posts) {
    const banner = document.querySelector(".wecom-pinned-banner");
    if (!banner) return;
    const pinned = posts.find((post) => post.pinned || post.pinned_at);
    if (!pinned) {
      banner.style.display = "none";
      syncUserCardElement(".wecom-pinned-avatar", null);
      return;
    }
    const name = userDisplayName(pinned, pinned.username || "?");
    const text = String(pinned.cooked || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const avatar = banner.querySelector(".wecom-pinned-avatar");
    avatar.textContent = avatarLetter(name);
    syncUserCardElement(".wecom-pinned-avatar", pinned);
    banner.querySelector(".wecom-pinned-content").innerHTML = `<b>${escapeHtml(name)}置顶了</b><span>${escapeHtml(text.slice(0, 96) || "[消息]")}</span>`;
    banner.style.display = "flex";
  }

  function wireComposeButton(panel) {
    const input = panel.querySelector(".wecom-chat-compose");
    if (!input || input.dataset.wired === "1") return;
    input.dataset.wired = "1";
    input.addEventListener("focus", (event) => {
      event.stopPropagation();
    });
    input.addEventListener("input", (event) => {
      event.stopPropagation();
      handleComposerInput(input);
    });
    ["beforeinput", "keypress", "keyup", "compositionstart", "compositionupdate", "compositionend"].forEach((type) => {
      input.addEventListener(type, (event) => event.stopPropagation());
    });
    input.addEventListener("keydown", handleComposerKeydown);
    input.addEventListener("paste", handleComposerPaste);
    input.addEventListener("drop", handleComposerDrop);
    input.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    panel.querySelector(".wecom-image-input")?.addEventListener("change", handleComposerFileChange);
    panel.querySelector(".wecom-send-btn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      submitComposerFromUi(event);
    });
    panel.querySelector(".wecom-reply-cancel")?.addEventListener("click", cancelTargetedReply);
    panel.querySelectorAll(".wecom-composer-tools .wecom-icon-btn").forEach((button) => {
      button.addEventListener("pointerdown", stopComposerPointer, true);
      button.addEventListener("mousedown", stopComposerPointer, true);
      button.addEventListener("click", handleComposerToolClick);
    });
    panel.querySelector(".wecom-tool-quick-meet")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      insertComposerInlineText("【快速会议】已发起会议，欢迎加入沟通\n");
    });
    updateComposeSendState();
  }

  function officialEmojiPickerDependencies() {
    const owner = getEmberOwner();
    const menu = safeLookup(owner, "service:menu");
    const module = discourseRequire("discourse/components/emoji-picker/detached");
    const component = module?.default || module;
    if (!owner) throw new Error("无法连接 Discourse 应用容器");
    if (!menu || typeof menu.show !== "function") throw new Error("站点未提供官方表情菜单服务");
    if (!component) throw new Error("站点未加载官方表情组件");
    return { menu, component };
  }

  function officialEmojiMarkdown(emoji) {
    const code = String(emoji || "").trim().replace(/^:+|:+$/g, "");
    if (!/^[^\s:]+(?::t[1-6])?$/.test(code)) throw new Error("官方表情组件返回了无效表情代码");
    return `:${code}:`;
  }

  function closeOfficialEmojiPicker() {
    const menu = safeLookup(getEmberOwner(), "service:menu");
    if (typeof menu?.close !== "function") return;
    Promise.resolve(menu.close("emoji-picker")).catch((error) => {
      console.error("[linuxdo-wecom] failed to close official emoji picker", error);
    });
  }

  async function showOfficialEmojiPicker(trigger) {
    if (!(trigger instanceof Element)) throw new Error("找不到表情按钮");
    const { menu, component } = officialEmojiPickerDependencies();
    await menu.show(trigger, {
      identifier: "emoji-picker",
      groupIdentifier: "emoji-picker",
      component,
      modalForMobile: true,
      onShow: () => trigger.setAttribute("aria-expanded", "true"),
      onClose: () => trigger.setAttribute("aria-expanded", "false"),
      data: {
        context: "topic",
        didSelectEmoji: (emoji) => insertComposerInlineText(officialEmojiMarkdown(emoji))
      }
    });
  }

  const V2EX_EMOJI_CATEGORIES = Object.freeze([
    {
      id: "smileys",
      name: "常用",
      icon: "😀",
      emojis: [
        "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
        "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋",
        "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
        "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌",
        "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵",
        "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
        "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
        "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
        "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "💀", "💩", "🤡",
        "👻", "👽", "🤖", "🙈", "🙉", "🙊"
      ]
    },
    {
      id: "gestures",
      name: "手势",
      icon: "👍",
      emojis: [
        "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
        "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👌",
        "🤌", "🤏", "👋", "🤚", "🖐️", "✋", "🖖", "✊", "👊", "🤛",
        "🤜", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂",
        "👃", "👀", "👁️", "👅", "👄", "👶", "👧", "🧒", "👦", "👩",
        "🧑", "👨", "👵", "🧓", "👴"
      ]
    },
    {
      id: "symbols",
      name: "符号",
      icon: "❤️",
      emojis: [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
        "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💯",
        "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "💭", "💤", "⚡",
        "🔥", "✨", "🌟", "⭐", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇",
        "🥈", "🥉", "🏅", "🎖️", "☀️", "🌤️", "⛅", "🌧️", "❄️", "⚠️",
        "🚫", "❌", "⭕", "🛑", "✅", "✔️", "☑️", "❓", "❗", "‼️",
        "⁉️", "➕", "➖", "✖️", "➗", "🔗"
      ]
    },
    {
      id: "animals",
      name: "动物",
      icon: "🐱",
      emojis: [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
        "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
        "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
        "🐌", "🐞", "🐜", "🐢", "🐍", "🐙", "🦑", "🦐", "🦀", "🐡",
        "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🐆", "🦓", "🦍", "🐘",
        "🦛", "🐪", "🦒", "🐎", "🐖", "🐑", "🐐", "🦌"
      ]
    },
    {
      id: "food",
      name: "食物",
      icon: "🍔",
      emojis: [
        "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
        "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦",
        "🌽", "🥕", "🍞", "🥐", "🥖", "🧀", "🥚", "🍳", "🥞", "🧇",
        "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮",
        "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟",
        "🍤", "🍙", "🍚", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰",
        "🍫", "🍬", "🍭", "☕", "🍵", "🧋", "🥤", "🍺", "🍻", "🍷",
        "🍸", "🍹"
      ]
    }
  ]);

  let activeV2exEmojiPicker = null;

  function closeV2exEmojiPicker() {
    if (activeV2exEmojiPicker) {
      activeV2exEmojiPicker.remove();
      activeV2exEmojiPicker = null;
    }
    const trigger = document.querySelector('[data-composer-action="emoji"]');
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function toggleV2exEmojiPicker(trigger) {
    if (activeV2exEmojiPicker) {
      closeV2exEmojiPicker();
      return;
    }
    showV2exEmojiPicker(trigger);
  }

  function showV2exEmojiPicker(trigger) {
    closeV2exEmojiPicker();
    if (!(trigger instanceof Element)) return;

    const picker = document.createElement("div");
    picker.className = "wecom-v2ex-emoji-picker";
    picker.setAttribute("role", "dialog");
    picker.setAttribute("aria-label", "表情选择器");

    let activeCatId = V2EX_EMOJI_CATEGORIES[0].id;

    function renderPickerContent() {
      const tabsHtml = V2EX_EMOJI_CATEGORIES.map((cat) => {
        const isActive = cat.id === activeCatId;
        return `<button type="button" class="wecom-emoji-tab-btn${isActive ? " is-active" : ""}" data-cat-id="${escapeHtml(cat.id)}"><span>${cat.icon}</span><span>${escapeHtml(cat.name)}</span></button>`;
      }).join("");

      const curCategory = V2EX_EMOJI_CATEGORIES.find((c) => c.id === activeCatId) || V2EX_EMOJI_CATEGORIES[0];
      const emojisHtml = curCategory.emojis.map((emo) => {
        return `<button type="button" class="wecom-emoji-item-btn" data-emoji="${escapeHtml(emo)}">${emo}</button>`;
      }).join("");

      picker.innerHTML = `
        <div class="wecom-emoji-picker-tabs">
          ${tabsHtml}
        </div>
        <div class="wecom-emoji-picker-body">
          ${emojisHtml}
        </div>
      `;
    }

    renderPickerContent();
    document.body.appendChild(picker);
    activeV2exEmojiPicker = picker;
    trigger.setAttribute("aria-expanded", "true");

    const rect = trigger.getBoundingClientRect();
    const pickerWidth = 340;
    const pickerHeight = picker.offsetHeight || 260;
    let left = Math.round(rect.left);
    if (left + pickerWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - pickerWidth - 12);
    }
    let top = Math.round(rect.top - pickerHeight - 6);
    if (top < 10) {
      top = Math.round(rect.bottom + 6);
    }

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;

    picker.addEventListener("click", (e) => {
      e.stopPropagation();
      const tabBtn = e.target.closest(".wecom-emoji-tab-btn");
      if (tabBtn) {
        const catId = tabBtn.dataset.catId;
        if (catId && catId !== activeCatId) {
          activeCatId = catId;
          renderPickerContent();
        }
        return;
      }
      const emojiBtn = e.target.closest(".wecom-emoji-item-btn");
      if (emojiBtn) {
        const emo = emojiBtn.dataset.emoji;
        if (emo) {
          insertComposerInlineText(emo);
        }
      }
    });

    picker.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
  }

  function bindV2exEmojiPickerEvents() {
    if (window.__wecomV2exEmojiPickerBound) return;
    window.__wecomV2exEmojiPickerBound = true;

    document.addEventListener("pointerdown", (e) => {
      if (!activeV2exEmojiPicker) return;
      if (e.target.closest(".wecom-v2ex-emoji-picker")) return;
      if (e.target.closest('[data-composer-action="emoji"]')) return;
      closeV2exEmojiPicker();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeV2exEmojiPicker) {
        closeV2exEmojiPicker();
      }
    });
  }

  function isPlainClick(event) {
    return !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
  }

  function consumeClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleReplyReferenceClick(event, panel) {
    const reference = event.target.closest("a.wecom-reply-reference");
    if (!reference || !panel.contains(reference) || !isPlainClick(event)) return false;
    if (!focusRenderedReply(reference)) return false;
    consumeClick(event);
    return true;
  }

  function syncWinMaxState() {
    const btn = document.querySelector(".wecom-win-max");
    if (!btn) return;
    const isFs = !!document.fullscreenElement;
    btn.innerHTML = isFs ? ICONS.winRestore : ICONS.winMax;
    btn.title = isFs ? "退出全屏" : "全屏/窗口化";
    btn.setAttribute("aria-label", btn.title);
  }

  function bindPlatformSwitcher() {
    if (window.__wecomPlatformSwitcherBound) return;
    window.__wecomPlatformSwitcherBound = true;
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".wecom-platform-switcher")) {
        document.querySelectorAll(".wecom-platform-switcher.is-open").forEach((switcher) => {
          switcher.classList.remove("is-open");
          const dropdown = switcher.querySelector(".wecom-platform-dropdown");
          if (dropdown) dropdown.hidden = true;
          const btn = switcher.querySelector(".wecom-platform-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.querySelectorAll(".wecom-platform-switcher.is-open").forEach((switcher) => {
          switcher.classList.remove("is-open");
          const dropdown = switcher.querySelector(".wecom-platform-dropdown");
          if (dropdown) dropdown.hidden = true;
          const btn = switcher.querySelector(".wecom-platform-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  function handleChatHeaderClick(event, panel) {
    if (event.target.closest(".wecom-platform-btn")) {
      consumeClick(event);
      const switcher = event.target.closest(".wecom-platform-switcher");
      if (switcher) {
        const dropdown = switcher.querySelector(".wecom-platform-dropdown");
        const isOpen = switcher.classList.toggle("is-open");
        if (dropdown) dropdown.hidden = !isOpen;
        const btn = switcher.querySelector(".wecom-platform-btn");
        if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
      return true;
    }
    if (event.target.closest(".wecom-platform-item")) {
      consumeClick(event);
      const item = event.target.closest(".wecom-platform-item");
      const target = item?.dataset?.targetPlatform;
      const switcher = event.target.closest(".wecom-platform-switcher");
      if (switcher) {
        switcher.classList.remove("is-open");
        const dropdown = switcher.querySelector(".wecom-platform-dropdown");
        if (dropdown) dropdown.hidden = true;
        const btn = switcher.querySelector(".wecom-platform-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
      if (target === "linuxdo" && IS_V2EX) {
        window.location.href = "https://linux.do/";
      } else if (target === "v2ex" && !IS_V2EX) {
        window.location.href = "https://www.v2ex.com/";
      }
      return true;
    }
    if (event.target.closest(".wecom-chat-scroll-top")) {
      consumeClick(event);
      const scrollContainer = panel?.querySelector(".wecom-chat-body, .wecom-chat-messages") || document.querySelector(".wecom-chat-body, .wecom-chat-messages");
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        if (scrollContainer.scrollTop <= 30 && chatState.hasOlder && !chatState.loading) {
          loadOlderPosts();
        }
      }
      return true;
    }
    if (event.target.closest(".wecom-chat-avatar-toggle")) {
      consumeClick(event);
      setHideChatAvatar(!isHideChatAvatar());
      return true;
    }
    if (event.target.closest(".wecom-chat-members-toggle")) {
      consumeClick(event);
      const next = !document.documentElement.classList.contains("wecom-members-open");
      setMembersPanelOpen(next);
      return true;
    }
    if (event.target.closest(".wecom-win-min")) {
      consumeClick(event);
      document.documentElement.classList.toggle("wecom-zen-mode");
      return true;
    }
    if (event.target.closest(".wecom-win-max")) {
      consumeClick(event);
      if (!document.fullscreenElement) {
        try { document.documentElement.requestFullscreen(); } catch { /* ignore */ }
      } else {
        try { document.exitFullscreen(); } catch { /* ignore */ }
      }
      setTimeout(syncWinMaxState, 50);
      return true;
    }
    if (event.target.closest(".wecom-win-close")) {
      consumeClick(event);
      setViewMode("native");
      location.reload();
      return true;
    }
    if (event.target.closest(".wecom-topic-bookmark")) {
      consumeClick(event);
      openOriginalTopicBookmark();
      return true;
    }
    if (event.target.closest(".wecom-chat-refresh")) {
      if (chatState.topicId) {
        rateLimitCooldownUntil = 0;
        deleteCachedTopic(chatState.topicId);
        loadTopic(chatState.topicId, true);
      }
      return true;
    }
    if (event.target.closest(".wecom-chat-native")) {
      openNativeTopicView();
      return true;
    }
    if (event.target.closest(".wecom-chat-error-popup")) {
      consumeClick(event);
      openNativePopup();
      return true;
    }
    if (event.target.closest(".wecom-chat-error-native")) {
      consumeClick(event);
      openNativeTopicView();
      return true;
    }
    if (event.target.closest(".wecom-chat-error-retry")) {
      consumeClick(event);
      const tid = chatState.topicId || topicIdFromPath(location.pathname);
      if (tid) {
        rateLimitCooldownUntil = 0;
        deleteCachedTopic(tid);
        loadTopic(tid, true);
      }
      return true;
    }
    const chip = event.target.closest("a.wecom-chat-chip");
    if (!chip || !panel.contains(chip) || !isPlainClick(event)) return false;
    consumeClick(event);
    const href = chip.getAttribute("href") || "";
    if (href) {
      let fullUrl = href;
      try { fullUrl = new URL(href, location.origin).href; } catch { /* ignore */ }
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
    return true;
  }

  function handleMessageToolClick(event, panel) {
    const button = event.target.closest(".wecom-msg-tool");
    if (!button || !panel.contains(button)) return;
    const message = button.closest(".wecom-msg");
    if (!message) return;
    const action = button.dataset.action;
    if (action === "like") return toggleLike(Number(message.dataset.postId), button);
    consumeClick(event);
    if (action === "reply") return replyToPost(Number(message.dataset.postNumber));
    if (action === "boost") return openBoostPopover(message, button);
    if (action === "bookmark") return openOriginalPostBookmark(message).catch(reportPostBookmarkError);
    if (action === "edit") return openEditPost(message, button);
  }

  function handleChatPanelClick(event, panel) {
    if (handleReplyReferenceClick(event, panel)) return;
    const anchorLink = event.target.closest(".wecom-msg-body a[href*='#reply'], .wecom-msg-body a[href*='#r_'], .wecom-msg-body a[href^='#']");
    if (anchorLink && panel.contains(anchorLink) && isPlainClick(event)) {
      const href = anchorLink.getAttribute("href") || "";
      const target = parseV2exReplyTarget(href);
      if (target.floor || target.replyId || target.anchor) {
        const matchTopic = href.match(/\/t\/(\d+)/);
        const targetTopicId = matchTopic ? Number(matchTopic[1]) : chatState.topicId;
        if (!matchTopic || targetTopicId === Number(chatState.topicId)) {
          const body = panel.querySelector(".wecom-chat-body");
          if (body && locateV2exReply(body, target)) {
            consumeClick(event);
            return;
          }
        }
      }
    }
    const delBoostBtn = event.target.closest(".wecom-boost-delete");
    if (delBoostBtn && panel.contains(delBoostBtn)) {
      consumeClick(event);
      const boostId = Number(delBoostBtn.dataset.boostId);
      const message = delBoostBtn.closest(".wecom-msg");
      deletePostBoost(boostId, message).catch((err) => {
        alert(`删除 Boost 失败: ${err.message}`);
      });
      return;
    }
    const layoutToggle = event.target.closest(".wecom-bubble-layout-toggle");
    if (layoutToggle && panel.contains(layoutToggle)) {
      consumeClick(event);
      toggleMessageBubbleLayout(layoutToggle);
      return;
    }
    const thumb = event.target.closest(".wecom-msg-thumb");
    if (thumb && panel.contains(thumb)) {
      const img = thumb.querySelector("img");
      if (img && isPreviewableChatImage(img)) {
        consumeClick(event);
        openImageViewer(img);
        return;
      }
    }
    const previewImage = event.target.closest(".wecom-msg-bubble img");
    if (isPreviewableChatImage(previewImage)) {
      consumeClick(event);
      openImageViewer(previewImage);
      return;
    }
    if (handleChatHeaderClick(event, panel)) return;
    if (handleMessageToolClick(event, panel)) return;

    // V2EX 点击加载下一页底栏
    const v2exMoreBtn = event.target.closest(".wecom-v2ex-more-bar");
    if (v2exMoreBtn && panel.contains(v2exMoreBtn) && !v2exMoreBtn.classList.contains("is-loading") && !v2exMoreBtn.classList.contains("is-end")) {
      consumeClick(event);
      loadNewerPosts();
      return;
    }

    // 详情所有链接都 _blank 方式打开：拦截聊天面板中所有常规链接
    const generalLink = event.target.closest("a[href]");
    if (generalLink && panel.contains(generalLink) && isPlainClick(event)) {
      if (generalLink.classList.contains("wecom-reply-reference")) return;
      const href = generalLink.getAttribute("href") || "";
      if (href && href !== "#" && !href.startsWith("javascript:")) {
        if (href.startsWith("#")) {
          try {
            const targetEl = panel.querySelector(href);
            if (targetEl) {
              consumeClick(event);
              targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
          } catch { /* ignore */ }
          return;
        }
        consumeClick(event);
        generalLink.setAttribute("target", "_blank");
        if (!generalLink.getAttribute("rel")?.includes("noopener")) {
          generalLink.setAttribute("rel", "noopener noreferrer");
        }
        let fullUrl = href;
        try { fullUrl = new URL(href, location.origin).href; } catch { /* ignore */ }
        window.open(fullUrl, "_blank", "noopener,noreferrer");
      }
    }
  }

  function handleChatImageKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!isPreviewableChatImage(event.target)) return;
    event.preventDefault();
    openImageViewer(event.target);
  }

  function handleChatBodyScroll(panel) {
    if (chatState.pinningScroll || chatState.pinnedPost) return;
    const body = panel.querySelector(".wecom-chat-body");
    if (body.scrollTop < 80) loadOlderPosts();
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 160) loadNewerPosts();
    trackVisibleTopicPost();
  }

  const LONG_PRESS_TITLE_MS = 220;

  function bindChatTitleLongPress(panel) {
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
    window.addEventListener("pointerup", stopPeeking);
    window.addEventListener("pointercancel", stopPeeking);
    window.addEventListener("blur", stopPeeking);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") stopPeeking();
    });

    panel.addEventListener("contextmenu", (e) => {
      if (e.target && typeof e.target.closest === "function" && e.target.closest(".wecom-chat-title") && isMaskTitleDetail()) {
        e.preventDefault();
      }
    });
  }

  function bindChatPanelEvents(panel) {
    panel.addEventListener("click", (event) => handleChatPanelClick(event, panel));
    panel.addEventListener("keydown", handleChatImageKeydown);
    document.removeEventListener("fullscreenchange", syncWinMaxState);
    document.addEventListener("fullscreenchange", syncWinMaxState);
    bindChatTitleLongPress(panel);
    let chatScrollTimer = null;
    let chatBodyScrollThrottleTimer = null;
    const chatBody = panel.querySelector(".wecom-chat-body");
    const cancelPin = () => {
      chatState.pinnedPost = 0;
      chatState.pinningScroll = false;
    };
    chatBody.addEventListener("wheel", cancelPin, { passive: true });
    chatBody.addEventListener("touchstart", cancelPin, { passive: true });
    chatBody.addEventListener("pointerdown", cancelPin, { passive: true });
    chatBody.addEventListener("scroll", () => {
      chatBody.classList.add("is-scrolling");
      clearTimeout(chatScrollTimer);
      chatScrollTimer = setTimeout(() => {
        chatBody.classList.remove("is-scrolling");
      }, 800);
      if (!chatBodyScrollThrottleTimer) {
        chatBodyScrollThrottleTimer = setTimeout(() => {
          chatBodyScrollThrottleTimer = null;
          handleChatBodyScroll(panel);
        }, 120);
      }
    }, { passive: true });
  }

  function refreshMaskedChatTitle() {
    if (!chatState.topicId) return;
    const maskDetail = isMaskTitleDetail();
    const displayTitle = maskDetail ? disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title }) : chatState.title;
    const titleEl = document.querySelector(".wecom-chat-title");
    if (titleEl) {
      titleEl.textContent = displayTitle;
      titleEl.classList.toggle("is-masked", Boolean(maskDetail));
      titleEl.classList.remove("is-peeking-title");
      titleEl.title = maskDetail ? "" : (chatState.title || "");
    }
    const sub = document.querySelector(".wecom-chat-sub");
    if (sub) {
      if (maskDetail) {
        sub.textContent = `企业内部群 · ${chatState.replyTotal || 0} 条消息`;
      } else {
        const cat = chatState.categoryId ? categoryById(chatState.categoryId) : null;
        sub.textContent = cat ? `归属于 ${cat.name} · ${chatState.replyTotal || 0} 条回复` : `归属于 linux.do · ${chatState.replyTotal || 0} 条回复`;
      }
    }
    const chipsBox = document.querySelector(".wecom-chat-chips");
    if (chipsBox) {
      if (maskDetail) {
        chipsBox.innerHTML = "";
      } else if (chatState.categoryId) {
        const cat = categoryById(chatState.categoryId);
        if (cat) {
          chipsBox.innerHTML = `<a class="wecom-chat-chip" target="_blank" rel="noopener noreferrer" href="/c/${escapeHtml(cat.slug)}/${cat.id}"><span class="wecom-nav2-cat-dot" style="background:#${escapeHtml(cat.color || "8F959E")}"></span>${escapeHtml(cat.name)}</a>`;
        }
      }
    }
    document.title = " ";
    enforceBlankTitle();
    setComposerPlaceholder(displayTitle);

    const memberPanel = document.querySelector(".wecom-member-panel");
    if (memberPanel) {
      const previewEl = memberPanel.querySelector(".wecom-announcement-preview");
      const catBar = memberPanel.querySelector(".wecom-member-cat-tag");
      if (maskDetail) {
        if (previewEl) previewEl.textContent = "本群用于项目日常交流及工单跟进，请遵守信息安全规范。";
        if (catBar) catBar.textContent = "项目沟通";
      }
    }
  }

  function renderChatEmpty() {
    closeEditDialog(true);
    ensureChatPanel();
    chatState.topicId = null;
    chatState.slug = "";
    chatState.postsByNumber = new Map();
    chatState.replyTotal = 0;
    setTopicBookmarkState(false);
    chatState.pinnedPost = 0;
    switchComposerTopic(null);
    const panel = document.querySelector(".wecom-chat-panel");
    if (panel) {
      panel.dataset.empty = "1";
      delete panel.dataset.topicId;
    }
    const body = document.querySelector(".wecom-chat-body");
    if (!body) return;
    delete body.dataset.topicId;
    if (body.dataset.state === "empty") return;
    body.dataset.state = "empty";
    const title = document.querySelector(".wecom-chat-title");
    const sub = document.querySelector(".wecom-chat-sub");
    if (title) {
      title.textContent = "";
      title.classList.remove("is-masked", "is-peeking-title");
      title.title = "";
    }
    if (sub) sub.textContent = "";
    const count = document.querySelector(".wecom-chat-count");
    if (count) { count.style.display = "none"; count.textContent = ""; }
    const chips = document.querySelector(".wecom-chat-chips");
    if (chips) chips.innerHTML = "";
    const chatAvatar = document.querySelector(".wecom-chat-avatar");
    if (chatAvatar) chatAvatar.style.display = "none";
    syncUserCardElement(".wecom-chat-avatar", null);
    document.documentElement.classList.remove("wecom-members-open");
    document.querySelector(".wecom-member-panel")?.remove();
    const pinned = document.querySelector(".wecom-pinned-banner");
    if (pinned) pinned.style.display = "none";
    body.innerHTML = `
      <div class="wecom-chat-empty">
        ${ICONS.msg}
        <div>暂无消息</div>
      </div>`;
  }

  function getTopicNativePath() {
    const tid = chatState.topicId || topicIdFromPath(location.pathname);
    if (IS_V2EX) {
      return tid ? `/t/${tid}` : (location.pathname || "/");
    }
    const slug = chatState.slug || "topic";
    const postNumber = chatState.renderedFirstIdx >= 0 ? openingPostNumber(tid, null) : 0;
    let target = tid ? `/t/${slug}/${tid}` : (location.pathname || "/");
    if (tid && postNumber > 1) {
      target = `/t/${slug}/${tid}/${postNumber}`;
    }
    return target;
  }

  function openNativePopup(url) {
    const target = url || getTopicNativePath();
    const popupUrl = new URL(target, location.origin);
    popupUrl.searchParams.set("wecom_view", "native");
    const w = 780;
    const h = 760;
    const left = Math.max(0, Math.round((window.screenX || 0) + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.round((window.screenY || 0) + (window.outerHeight - h) / 2));
    const features = `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`;
    let win = null;
    try {
      win = window.open(popupUrl.toString(), "wecom_native_cf_popup", features);
    } catch { /* popup blocked */ }
    if (!win) {
      win = window.open(popupUrl.toString(), "_blank");
    }
    if (win) {
      try { win.focus(); } catch { /* ignore */ }
      const checkTimer = setInterval(() => {
        try {
          if (!win || win.closed) {
            clearInterval(checkTimer);
            const tid = chatState.topicId || topicIdFromPath(location.pathname);
            if (tid) {
              rateLimitCooldownUntil = 0;
              deleteCachedTopic(tid);
              loadTopic(tid, true);
            }
          }
        } catch {
          clearInterval(checkTimer);
        }
      }, 1000);
    }
    return win;
  }

  function openNativeTopicView() {
    setViewMode("native");
    const target = getTopicNativePath();
    const current = location.pathname + location.search;
    if (current === target || location.pathname === target || location.href === target) {
      location.reload();
    } else {
      location.href = target;
    }
  }

  function renderChatError(err) {
    const body = document.querySelector(".wecom-chat-body");
    if (!body) return;
    const msg = err instanceof Error ? err.message : String(err || "加载失败");
    const isRateLimitOrCf = (err && (err.status === 429 || err.isRateLimit || err.isCloudflare)) ||
      /429|cloudflare|人机验证|频率/i.test(msg);

    let titleText = "话题加载失败";
    let descText = `${msg}，可能无权限或已被删除`;
    if (isRateLimitOrCf) {
      titleText = "触发访问频率限制（HTTP 429）或 Cloudflare 盾";
      descText = "站点开启了人机验证或访问频率限制。请点击下方按钮弹出原生窗口完成验证，验证后会自动重试加载。";
    }

    body.innerHTML = `
      <div class="wecom-chat-error" data-error-type="${isRateLimitOrCf ? "rate-limit" : "generic"}">
        ${ICONS.chat}
        <div style="font-weight:600;font-size:15px;color:var(--wc-text);margin-bottom:4px;">${escapeHtml(titleText)}</div>
        <div style="max-width:420px;line-height:1.5;color:var(--wc-text-3);margin-bottom:12px;">${escapeHtml(descText)}</div>
        <div class="wecom-chat-error-actions">
          <button type="button" class="wecom-chat-error-btn primary wecom-chat-error-popup">弹出原生窗口（过盾）</button>
          <button type="button" class="wecom-chat-error-btn wecom-chat-error-retry">重试加载</button>
          <button type="button" class="wecom-chat-error-btn wecom-chat-error-native" title="切换全屏原生页面">切为原生页面</button>
        </div>
      </div>`;

    const popupBtn = body.querySelector(".wecom-chat-error-popup");
    if (popupBtn) {
      popupBtn.addEventListener("click", () => {
        openNativePopup();
      });
    }

    const nativeBtn = body.querySelector(".wecom-chat-error-native");
    if (nativeBtn) {
      nativeBtn.addEventListener("click", () => {
        openNativeTopicView();
      });
    }

    const retryBtn = body.querySelector(".wecom-chat-error-retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        const tid = chatState.topicId || topicIdFromPath(location.pathname);
        if (tid) {
          rateLimitCooldownUntil = 0;
          deleteCachedTopic(tid);
          loadTopic(tid, true);
        }
      });
    }
  }

  const likedPosts = new Set();

  let highlightedReplyMessage = null;
  let replyHighlightTimer = null;

  function rememberChatPosts(posts) {
    if (!Array.isArray(posts) || !posts.length) return;
    const next = new Map(chatState.postsByNumber);
    for (const post of posts) {
      const number = postNumberOf(post);
      if (number) next.set(number, post);
    }
    chatState.postsByNumber = next;
  }

  function replyPreviewText(post) {
    if (!post) return "点击查看原消息";
    const container = document.createElement("div");
    container.innerHTML = String(post.cooked || "");
    const text = String(container.textContent || "").replace(/\s+/g, " ").trim();
    if (text) {
      const characters = [...text];
      return characters.length > REPLY_PREVIEW_LENGTH
        ? `${characters.slice(0, REPLY_PREVIEW_LENGTH).join("")}…`
        : text;
    }
    if (container.querySelector("img")) return "[图片]";
    if (container.querySelector(".attachment, a[href]")) return "[附件或链接]";
    return "查看原消息";
  }

  function replyPostHref(postNumber) {
    const topicId = Number(chatState.topicId) || 0;
    const slug = chatState.slug || topicRouteFromPath(location.pathname).slug;
    if (!topicId) return `#post_${Number(postNumber)}`;
    return slug
      ? `/t/${encodeURIComponent(slug)}/${topicId}/${Number(postNumber)}`
      : `/t/${topicId}/${Number(postNumber)}`;
  }

  function replyReferenceInfo(post) {
    const number = Number(post?.reply_to_post_number) || 0;
    if (!number || number === postNumberOf(post)) return null;
    const target = chatState.postsByNumber.get(number) || null;
    const user = { ...(target || {}), ...(post.reply_to_user || {}) };
    return Object.freeze({
      number,
      name: userDisplayName(user, `消息 #${number}`),
      preview: replyPreviewText(target),
      href: replyPostHref(number)
    });
  }

  function replyReferenceHtml(post) {
    // 若正文中已包含原生引用块，不再重复渲染引用
    if (post?.cooked && (post.cooked.includes('class="quote') || post.cooked.includes('<aside class="quote') || post.cooked.includes('<blockquote>'))) {
      return "";
    }
    const info = replyReferenceInfo(post);
    if (!info) return "";
    return `<a class="wecom-reply-reference" href="${escapeHtml(info.href)}"` +
      ` data-reply-post-number="${info.number}" title="跳转到原消息 #${info.number}">` +
      `<div class="wecom-reply-author">${escapeHtml(info.name)}:</div>` +
      `<div class="wecom-reply-preview">${escapeHtml(info.preview)}</div></a>`;
  }

  function syncRenderedReplyReferences(posts, body) {
    for (const post of posts) {
      const number = postNumberOf(post);
      const message = body.querySelector(`.wecom-msg[data-post-number="${number}"]`);
      if (!message) continue;
      const current = message.querySelector(".wecom-reply-reference");
      const html = replyReferenceHtml(post);
      if (!html) {
        current?.remove();
      } else if (current) {
        current.outerHTML = html;
      } else {
        message.querySelector(".wecom-msg-bubble")?.insertAdjacentHTML("afterbegin", html);
      }
    }
  }

  function focusRenderedReply(reference) {
    const number = Number(reference?.dataset.replyPostNumber) || 0;
    const message = document.querySelector(`.wecom-msg[data-post-number="${number}"]`);
    if (!message) return false;
    clearTimeout(replyHighlightTimer);
    highlightedReplyMessage?.classList.remove("is-reply-target");
    highlightedReplyMessage = message;
    message.classList.add("is-reply-target");
    message.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    replyHighlightTimer = setTimeout(() => {
      message.classList.remove("is-reply-target");
      if (highlightedReplyMessage === message) highlightedReplyMessage = null;
    }, REPLY_HIGHLIGHT_DURATION_MS);
    return true;
  }

  function parseV2exReplyTarget(urlOrHash) {
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

  function locateV2exReply(body, target) {
    if (!body || !target) return false;
    let el = null;
    if (target.floor) {
      el = body.querySelector(`.wecom-msg[data-floor="${target.floor}"]`);
      if (!el) {
        el = body.querySelector(`.wecom-msg[data-post-number="${target.floor + 1}"]`);
      }
    }
    if (!el && target.replyId) {
      el = body.querySelector(`.wecom-msg[data-post-id="${target.replyId}"]`);
    }
    if (!el && target.anchor) {
      const fMatch = target.anchor.match(/reply(\d+)/i);
      if (fMatch) {
        const f = Number(fMatch[1]);
        el = body.querySelector(`.wecom-msg[data-floor="${f}"], .wecom-msg[data-post-number="${f + 1}"]`);
      }
      const rMatch = target.anchor.match(/r_(\d+)/i);
      if (!el && rMatch) {
        el = body.querySelector(`.wecom-msg[data-post-id="${rMatch[1]}"]`);
      }
    }
    if (!el) return false;

    clearTimeout(replyHighlightTimer);
    highlightedReplyMessage?.classList.remove("is-reply-target");
    highlightedReplyMessage = el;
    el.classList.add("is-reply-target");
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    replyHighlightTimer = setTimeout(() => {
      el.classList.remove("is-reply-target");
      if (highlightedReplyMessage === el) highlightedReplyMessage = null;
    }, REPLY_HIGHLIGHT_DURATION_MS);
    return true;
  }

  function keepChatAtV2exReply(body, target) {
    if (!body || !target) return;
    const targetPost = target.floor ? target.floor + 1 : (target.replyId || 1);
    chatState.pinnedPost = targetPost;
    chatState.pinningScroll = true;
    const pin = () => {
      if (Number(chatState.pinnedPost) !== Number(targetPost)) return;
      locateV2exReply(body, target);
    };
    pin();
    const pending = [...body.querySelectorAll("img")].filter((image) => !image.complete);
    pending.forEach((image) => {
      image.addEventListener("load", pin, { once: true });
      image.addEventListener("error", pin, { once: true });
    });
    [50, 160, 350, 700, 1200].forEach((delay) => setTimeout(pin, delay));
    setTimeout(() => {
      chatState.pinningScroll = false;
      if (Number(chatState.pinnedPost) === Number(targetPost)) chatState.pinnedPost = 0;
    }, 1300);
  }

  function formatBoostCooked(cooked, raw) {
    let content = (cooked || "").trim() || escapeHtml(raw || "");
    if (!content) return "";
    // 移除外层 <p> 标签并清除 Discourse 自动赋予的 only-emoji 大图类名，防止把 boost 气泡撑大撑高
    content = content
      .replace(/^<p\b[^>]*>/i, "")
      .replace(/<\/p>$/i, "")
      .replace(/\bonly-emoji\b/g, "");
    return content;
  }

  function boostsHtml(post) {
    if (!isBoostEnabled()) return "";
    const boosts = Array.isArray(post?.boosts) ? post.boosts : [];
    if (!boosts.length) return "";
    const myUsername = getCurrentUsername();
    const items = boosts.map((b) => {
      const u = b.user || {};
      const uname = userDisplayName(u, u.username || "");
      const avatarSrc = u.avatar_template ? fullAvatarUrl(u.avatar_template) : "";
      const avatarHtml = avatarSrc
        ? `<img class="wecom-boost-avatar" src="${escapeHtml(avatarSrc)}" alt="" loading="lazy">`
        : `<span class="wecom-boost-avatar-text">${escapeHtml(avatarLetter(uname || "?"))}</span>`;
      const canDel = Boolean(b.can_delete || (myUsername && u.username === myUsername));
      const delBtn = canDel
        ? `<button type="button" class="wecom-boost-delete" data-boost-id="${b.id}" title="删除此 Boost" aria-label="删除此 Boost">×</button>`
        : "";
      return `
        <div class="wecom-boost-item" data-boost-id="${b.id || ""}" title="${escapeHtml(uname)}: ${escapeHtml(b.raw || "")}">
          ${avatarHtml}
          <div class="wecom-boost-cooked">${formatBoostCooked(b.cooked, b.raw)}</div>
          ${delBtn}
        </div>`;
    }).join("");
    return `<div class="wecom-msg-boosts">${items}</div>`;
  }

  let activeBoostPopover = null;
  let activeBoostDocClickHandler = null;

  function closeBoostPopover() {
    if (activeBoostDocClickHandler) {
      document.removeEventListener("mousedown", activeBoostDocClickHandler);
      activeBoostDocClickHandler = null;
    }
    if (activeBoostPopover) {
      activeBoostPopover.remove();
      activeBoostPopover = null;
    }
    document.querySelectorAll(".wecom-msg.has-boost-popover").forEach((el) => {
      el.classList.remove("has-boost-popover");
    });
  }

  function openBoostPopover(msgEl, anchorBtn) {
    closeBoostPopover();
    const postId = Number(msgEl?.dataset.postId);
    const postNumber = Number(msgEl?.dataset.postNumber);
    if (!postId) return;

    msgEl?.classList.add("has-boost-popover");

    const popover = document.createElement("div");
    popover.className = "wecom-boost-popover";
    popover.innerHTML = `
      <div class="wecom-boost-popover-head">
        <span>${ICONS.boost} 添加 Boost</span>
        <button type="button" class="wecom-boost-popover-close" aria-label="关闭">×</button>
      </div>
      <div class="wecom-boost-presets">
        <button type="button" class="wecom-boost-preset-btn" data-preset="🚀">🚀</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="👍">👍</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="❤️">❤️</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="🎉">🎉</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="💯">💯</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="666">666</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="加油">加油</button>
        <button type="button" class="wecom-boost-preset-btn" data-preset="收到">收到</button>
      </div>
      <div class="wecom-boost-input-row">
        <input type="text" class="wecom-boost-input" maxlength="16" placeholder="输入 Boost 内容..." />
        <button type="button" class="wecom-boost-send-btn">发送</button>
      </div>
      <div class="wecom-boost-status" role="alert"></div>
    `;

    document.body.appendChild(popover);
    activeBoostPopover = popover;

    const rect = anchorBtn.getBoundingClientRect();
    const popoverWidth = 260;
    const popoverHeight = popover.offsetHeight || 165;
    let left = Math.round(rect.left + rect.width / 2 - popoverWidth / 2);
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) left = window.innerWidth - popoverWidth - 10;

    let top = Math.round(rect.top - popoverHeight - 6);
    if (top < 10) {
      top = Math.round(rect.bottom + 6);
    }
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    const input = popover.querySelector(".wecom-boost-input");
    const sendBtn = popover.querySelector(".wecom-boost-send-btn");
    const statusEl = popover.querySelector(".wecom-boost-status");
    input?.focus();

    async function doSubmit(text) {
      const raw = String(text || "").trim();
      if (!raw) return;
      sendBtn.disabled = true;
      if (input) input.disabled = true;
      statusEl.textContent = "发送中…";
      statusEl.style.color = "var(--wc-text-3)";
      try {
        const newBoost = await submitPostBoost(postId, raw);
        const post = chatState.postsByNumber.get(postNumber);
        if (post) {
          if (!Array.isArray(post.boosts)) post.boosts = [];
          post.boosts.push(newBoost);
        }
        let boostsContainer = msgEl.querySelector(".wecom-msg-boosts");
        if (!boostsContainer) {
          boostsContainer = document.createElement("div");
          boostsContainer.className = "wecom-msg-boosts";
          const bubble = msgEl.querySelector(".wecom-msg-bubble");
          if (bubble) bubble.after(boostsContainer);
          else msgEl.querySelector(".wecom-msg-content")?.appendChild(boostsContainer);
        }
        const u = newBoost.user || { username: getCurrentUsername() };
        const uname = userDisplayName(u, u.username || "");
        const avatarSrc = u.avatar_template ? fullAvatarUrl(u.avatar_template) : "";
        const avatarHtml = avatarSrc
          ? `<img class="wecom-boost-avatar" src="${escapeHtml(avatarSrc)}" alt="" loading="lazy">`
          : `<span class="wecom-boost-avatar-text">${escapeHtml(avatarLetter(uname || "?"))}</span>`;
        const canDel = Boolean(newBoost.can_delete ?? true);
        const delBtn = canDel
          ? `<button type="button" class="wecom-boost-delete" data-boost-id="${newBoost.id}" title="删除此 Boost" aria-label="删除此 Boost">×</button>`
          : "";
        const itemHtml = `
          <div class="wecom-boost-item" data-boost-id="${newBoost.id || ""}" title="${escapeHtml(uname)}: ${escapeHtml(newBoost.raw || raw)}">
            ${avatarHtml}
            <div class="wecom-boost-cooked">${formatBoostCooked(newBoost.cooked, raw)}</div>
            ${delBtn}
          </div>`;
        boostsContainer.insertAdjacentHTML("beforeend", itemHtml);
        closeBoostPopover();
      } catch (err) {
        sendBtn.disabled = false;
        if (input) input.disabled = false;
        statusEl.style.color = "#FA5151";
        statusEl.textContent = err.message || "发送失败";
      }
    }

    popover.querySelectorAll(".wecom-boost-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        doSubmit(btn.dataset.preset);
      });
    });

    sendBtn?.addEventListener("click", () => {
      doSubmit(input?.value);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSubmit(input.value);
      } else if (e.key === "Escape") {
        closeBoostPopover();
      }
    });

    popover.querySelector(".wecom-boost-popover-close")?.addEventListener("click", closeBoostPopover);

    const onDocClick = (e) => {
      if (!popover.contains(e.target) && e.target !== anchorBtn && !anchorBtn.contains(e.target)) {
        closeBoostPopover();
      }
    };
    activeBoostDocClickHandler = onDocClick;
    setTimeout(() => {
      if (activeBoostPopover === popover) {
        document.addEventListener("mousedown", onDocClick);
      }
    }, 50);
  }

  async function submitPostBoost(postId, raw) {
    const resp = await fetch(`/discourse-boosts/posts/${postId}/boosts`, {
      method: "POST",
      credentials: "same-origin",
      headers: bridgeHeaders("application/json"),
      body: JSON.stringify({ raw })
    });
    if (!resp.ok) {
      let errorMsg = `HTTP ${resp.status}`;
      try {
        const data = await resp.json();
        if (data.errors && data.errors.length) {
          errorMsg = data.errors.join(", ");
        } else if (data.failed) {
          errorMsg = "该帖子无法添加 Boost 或已达上限";
        }
      } catch { /* ignore */ }
      throw new Error(errorMsg);
    }
    return await resp.json();
  }

  async function deletePostBoost(boostId, msgEl) {
    if (!boostId) return;
    const resp = await fetch(`/discourse-boosts/boosts/${boostId}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: bridgeHeaders("application/json")
    });
    if (!resp.ok && resp.status !== 204 && resp.status !== 200) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const postNumber = Number(msgEl?.dataset.postNumber);
    const post = chatState.postsByNumber.get(postNumber);
    if (post && Array.isArray(post.boosts)) {
      post.boosts = post.boosts.filter((b) => Number(b.id) !== Number(boostId));
    }
    const item = msgEl.querySelector(`.wecom-boost-item[data-boost-id="${boostId}"]`);
    if (item) {
      const parent = item.closest(".wecom-msg-boosts");
      item.remove();
      if (parent && !parent.children.length) parent.remove();
    }
  }

  function bubbleHtml(post, myName) {
    const me = isMyPost(post, myName);
    const side = me ? "me" : "other";
    const displayName = userDisplayName(post, post.username || "?");
    let avatar;
    let avatarBg = avatarColor(displayName);
    if (isMaskAvatar()) {
      avatar = escapeHtml(avatarLetter(displayName));
    } else if (post.avatar_template) {
      avatar = `<img src="${escapeHtml(fullAvatarUrl(post.avatar_template))}" alt="" loading="lazy">`;
      avatarBg = "transparent";
    } else {
      avatar = escapeHtml(avatarLetter(displayName));
    }
    const liked = post.id && likedPosts.has(post.id) ? " liked" : "";
    const isBookmarked = booleanFlag(post.bookmarked) || Boolean(post.bookmark_id);
    const bookmarkClass = isBookmarked ? " bookmarked" : "";
    const bookmarkLabel = isBookmarked ? "编辑楼层书签" : "收藏本楼层";
    const bookmarkButton = !IS_V2EX && post.id
      ? `<button type="button" class="wecom-msg-tool${bookmarkClass}" data-action="bookmark" title="${bookmarkLabel}" aria-label="${bookmarkLabel}" aria-pressed="${isBookmarked}">${ICONS.bookmark}</button>`
      : "";
    const editButton = !IS_V2EX && me && (post.id || post.post_number)
      ? `<button type="button" class="wecom-msg-tool" data-action="edit" title="编辑">${ICONS.edit}</button>`
      : "";
    const boostButton = !IS_V2EX
      ? `<button type="button" class="wecom-msg-tool" data-action="boost" title="添加 Boost">${ICONS.boost}</button>`
      : "";
    const likeCount = Number(post.like_count) || (post.actions_summary || []).find((a) => a.id === 2)?.count || 0;
    const likeLabel = IS_V2EX ? "感谢回复" : "点赞";
    const likeToolIcon = IS_V2EX ? ICONS.heart : ICONS.like;
    const likesBadgeHtml = likeCount > 0
      ? `<span class="wecom-msg-likes" title="${likeLabel}：${likeCount}"><span class="wecom-msg-like-icon">${ICONS.heart}</span><span class="wecom-msg-like-num">${likeCount}</span></span>`
      : "";
    return `
      <div class="wecom-msg wecom-msg-${side}" data-post-number="${post.post_number}"${post.id ? ` data-post-id="${post.id}"` : ""}${post.floor != null ? ` data-floor="${post.floor}"` : ""}${me ? ' data-mine="1"' : ""}>
        <span class="wecom-msg-avatar" style="background:${avatarBg}"${userCardAttributes(post)}>${avatar}</span>
        <div class="wecom-msg-content">
          <span class="wecom-msg-name"${userCardAttributes(post)}>${escapeHtml(displayName)}</span>
          <div class="wecom-msg-bubble">
            ${replyReferenceHtml(post)}
            <div class="wecom-msg-body">${post.cooked || ""}</div>
          </div>
          ${boostsHtml(post)}
          <span class="wecom-msg-meta">
            <span>#${IS_V2EX && post.floor != null && post.floor > 0 ? post.floor : post.post_number}</span>
            <span>${escapeHtml(formatTime(post.created_at))}</span>
            ${likesBadgeHtml}
          </span>
          <div class="wecom-msg-tools">
            <button type="button" class="wecom-msg-tool${liked}" data-action="like" title="${likeLabel}">${likeToolIcon}</button>
            <button type="button" class="wecom-msg-tool" data-action="reply" title="回复">${ICONS.reply}</button>
            ${boostButton}
            ${bookmarkButton}
            ${editButton}
          </div>
        </div>
      </div>`;
  }

  function csrfToken() {
    const meta = document.querySelector("meta[name='csrf-token']");
    if (meta?.content) return meta.content;
    const session = safeLookup(getEmberOwner(), "service:session");
    return session?.csrfToken || session?.get?.("csrfToken") || "";
  }

  function bridgeHeaders(contentType) {
    const headers = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" };
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
    if (contentType) headers["Content-Type"] = contentType;
    return headers;
  }

  async function responsePayload(response) {
    if (typeof response?.text !== "function") {
      return typeof response?.json === "function" ? response.json() : null;
    }
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }

  function payloadError(payload, fallback) {
    const errors = payload?.errors || payload?.error;
    if (Array.isArray(errors) && errors.length) return errors.join("；");
    if (typeof errors === "string" && errors.trim()) return errors.trim();
    if (typeof payload?.message === "string" && payload.message.trim()) return payload.message.trim();
    if (typeof payload?.raw === "string" && payload.raw.trim()) {
      return payload.raw.replace(/\s+/g, " ").trim().slice(0, COMPOSER_ERROR_PREVIEW_LENGTH);
    }
    return fallback;
  }

  function responseStatus(error) {
    return Number(error?.status) || 0;
  }

  function markResponseError(error, status) {
    error.status = Number(status) || 0;
    return error;
  }

  function retryableEndpointError(error) {
    return error instanceof TypeError || Boolean(error?.retryable) ||
      RETRYABLE_ENDPOINT_STATUS.has(responseStatus(error));
  }

  function postFromPayload(payload) {
    const post = payload?.post || payload?.created_post || payload;
    return post && typeof post === "object" ? post : null;
  }

  function submittedPostFromPayload(payload) {
    const post = postFromPayload(payload);
    if (!post) return null;
    const id = Number(post.id || post.post_id);
    const number = Number(post.post_number || post.postNumber);
    return id > 0 || number > 0 ? post : null;
  }

  async function fetchEditablePost(postId) {
    const response = await fetch(`/posts/${encodeURIComponent(postId)}.json`, {
      credentials: "same-origin",
      headers: bridgeHeaders()
    });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw new Error(payloadError(payload, `读取原文失败（HTTP ${response.status}）`));
    }
    const post = postFromPayload(payload);
    if (!post || typeof post.raw !== "string") throw new Error("站点未返回可编辑原文");
    return post;
  }

  async function resolveEditablePost(postId, postNumber) {
    let resolvedId = Number(postId) || 0;
    if (!resolvedId) {
      const topicId = Number(chatState.topicId);
      if (!topicId || !postNumber) throw new Error("无法确定待编辑消息");
      const payload = await api(`/t/${encodeURIComponent(topicId)}/${encodeURIComponent(postNumber)}.json`, {
        cache: "no-store"
      });
      const posts = payload?.post_stream?.posts || payload?.posts || [];
      const target = posts.find((post) => Number(post?.post_number) === Number(postNumber));
      resolvedId = Number(target?.id) || 0;
    }
    if (!resolvedId) throw new Error(`无法解析消息 #${postNumber} 的帖子 ID`);
    return { postId: resolvedId, post: await fetchEditablePost(resolvedId) };
  }

  async function updateEditablePost(postId, raw) {
    const response = await fetch(`/posts/${encodeURIComponent(postId)}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: bridgeHeaders("application/json; charset=UTF-8"),
      body: JSON.stringify({ post: { raw } })
    });
    const payload = await responsePayload(response);
    if (!response.ok) {
      throw new Error(payloadError(payload, `保存编辑失败（HTTP ${response.status}）`));
    }
    const post = postFromPayload(payload);
    if (!post) throw new Error("站点未返回编辑结果");
    return post;
  }

  function applyEditedPost(postId, post) {
    if (typeof post?.cooked !== "string") return false;
    const message = document.querySelector(`.wecom-msg[data-post-id="${Number(postId)}"]`);
    const bubble = message?.querySelector(".wecom-msg-bubble");
    if (!message || !bubble) return false;
    bubble.innerHTML = post.cooked;
    hydrateChatImages(message);
    return true;
  }

  async function openEditPost(message, trigger) {
    const postId = Number(message?.dataset.postId) || 0;
    const postNumber = Number(message?.dataset.postNumber);
    if (!postNumber || message?.dataset.mine !== "1") {
      setComposeStatus("当前消息不可编辑", "error", false);
      return;
    }
    const dialog = ensureEditDialog();
    const { input, title } = editUi();
    const requestSerial = ++editState.requestSerial;
    Object.assign(editState, {
      postId: postId || null,
      postNumber,
      loading: true,
      saving: false,
      uploading: false,
      trigger
    });
    dialog.hidden = false;
    title.textContent = `编辑消息 #${postNumber}`;
    input.value = "";
    input.disabled = true;
    setEditStatus("正在读取消息原文…", "busy");
    updateEditSaveState();
    try {
      const resolved = await resolveEditablePost(postId, postNumber);
      if (requestSerial !== editState.requestSerial) return;
      editState.postId = resolved.postId;
      message.dataset.postId = String(resolved.postId);
      input.value = resolved.post.raw;
      input.disabled = false;
      editState.loading = false;
      setEditStatus("支持粘贴截图 · Ctrl / ⌘ + Enter 保存");
      updateEditSaveState();
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    } catch (error) {
      if (requestSerial !== editState.requestSerial) return;
      editState.loading = false;
      input.disabled = false;
      setEditStatus(error instanceof Error ? error.message : String(error), "error");
      updateEditSaveState();
      console.error("[linuxdo-wecom] failed to load editable post", error);
    }
  }

  async function submitEditedPost() {
    const { dialog, input } = editUi();
    const raw = input?.value || "";
    if (!dialog || dialog.hidden || !editState.postId || editState.loading || editState.saving || editState.uploading) return;
    if (!raw.trim()) {
      setEditStatus("消息内容不能为空", "error");
      return;
    }
    const postId = editState.postId;
    const requestSerial = editState.requestSerial;
    editState.saving = true;
    input.disabled = true;
    setEditStatus("正在保存…", "busy");
    updateEditSaveState();
    try {
      let post = await updateEditablePost(postId, raw);
      if (requestSerial !== editState.requestSerial) return;
      if (!applyEditedPost(postId, post)) {
        post = await fetchEditablePost(postId);
        if (requestSerial !== editState.requestSerial) return;
        if (!applyEditedPost(postId, post)) throw new Error("站点未返回更新后的消息内容");
      }
      setComposeStatus("消息已编辑", "success", false);
      closeEditDialog(true);
    } catch (error) {
      if (requestSerial !== editState.requestSerial) return;
      editState.saving = false;
      input.disabled = false;
      setEditStatus(error instanceof Error ? error.message : String(error), "error");
      updateEditSaveState();
      input.focus({ preventScroll: true });
      console.error("[linuxdo-wecom] failed to edit post", error);
    }
  }

  async function submitReplyViaApi(raw, replyToPostNumber) {
    const body = { raw, topic_id: Number(chatState.topicId) };
    if (replyToPostNumber) body.reply_to_post_number = Number(replyToPostNumber);
    let lastError = null;
    for (const endpoint of POST_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: bridgeHeaders("application/json; charset=UTF-8"),
          body: JSON.stringify(body)
        });
        const payload = await responsePayload(response);
        if (!response.ok) {
          lastError = markResponseError(new Error(payloadError(payload, `HTTP ${response.status}`)), response.status);
          if (RETRYABLE_ENDPOINT_STATUS.has(response.status)) continue;
          throw lastError;
        }
        const post = submittedPostFromPayload(payload);
        if (post) return post;
        lastError = new Error(payloadError(payload, "站点未确认回复"));
        lastError.retryable = true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!retryableEndpointError(error)) throw lastError;
      }
    }
    throw lastError || new Error("回复接口不可用");
  }

  function imageFile(file) {
    if (!file) return false;
    if (String(file.type || "").toLowerCase().startsWith("image/")) return true;
    return /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(String(file.name || ""));
  }

  function uploadPayload(payload) {
    const first = Array.isArray(payload?.uploads) ? payload.uploads[0] : null;
    return payload?.upload || first || payload;
  }

  function uploadedImageUrl(payload) {
    const upload = uploadPayload(payload);
    const value = upload?.short_url || upload?.url || upload?.thumbnail_url;
    if (/^upload:\/\//i.test(String(value || ""))) return String(value);
    return normalizePreviewImageUrl(value);
  }

  function markdownImageUrl(url) {
    return String(url || "").replace(/[\\()]/g, (char) => `\\${char}`);
  }

  function uploadedImageMarkdown(payload, file) {
    const upload = uploadPayload(payload);
    const url = uploadedImageUrl(upload) || payload?.url || payload?.link || payload?.data?.link;
    if (!url) throw new Error("站点未返回图片地址");
    if (IS_V2EX) {
      return url;
    }
    const rawLabel = String(upload?.original_filename || file?.name || "图片");
    const label = rawLabel.replace(/\.[^.]+$/, "").replace(/[\[\]\\|]/g, "_");
    const width = Number(upload?.thumbnail_width || upload?.width) || 0;
    const height = Number(upload?.thumbnail_height || upload?.height) || 0;
    const dimensions = width > 0 && height > 0 ? `|${width}x${height}` : "";
    return `![${label}${dimensions}](${markdownImageUrl(url)})`;
  }

  async function uploadImageFileToImgur(file) {
    const formData = new FormData();
    formData.set("image", file);
    const resp = await fetch(V2EX_IMGUR_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${V2EX_IMGUR_CLIENT_ID}`
      },
      body: formData
    });
    const payload = await resp.json().catch(() => null);
    if (!resp.ok || !payload?.success || !payload?.data?.link) {
      const errObj = payload?.data?.error;
      const errMsg = (typeof errObj === "string" ? errObj : errObj?.message) ||
        payload?.error?.message ||
        payload?.error ||
        `Imgur upload failed with ${resp.status}`;
      throw new Error(errMsg);
    }
    return String(payload.data.link).replace(/^http:\/\//i, "https://");
  }

  async function uploadImageFile(file) {
    if (IS_V2EX) {
      const link = await uploadImageFileToImgur(file);
      return { url: link, short_url: link, link, data: { link } };
    }
    let lastError = null;
    for (const endpoint of UPLOAD_ENDPOINTS) {
      const form = new FormData();
      form.append("file", file, file.name || "image");
      // 原生 composer 使用 composer 类型；type 仅供旧版 Discourse 兼容读取。
      form.append("upload_type", "composer");
      form.append("type", "composer");
      form.append("synchronous", "true");
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: bridgeHeaders(),
          body: form
        });
        const payload = await responsePayload(response);
        if (!response.ok) {
          lastError = markResponseError(new Error(payloadError(payload, `HTTP ${response.status}`)), response.status);
          if (RETRYABLE_ENDPOINT_STATUS.has(response.status)) continue;
          throw lastError;
        }
        if (uploadedImageUrl(payload)) return payload;
        lastError = new Error("站点未返回图片地址");
        lastError.retryable = true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!retryableEndpointError(error)) throw lastError;
      }
    }
    throw lastError || new Error("图片上传接口不可用");
  }

  function textareaSelection(input) {
    const fallback = input?.value.length || 0;
    const start = Number.isInteger(input?.selectionStart) ? input.selectionStart : fallback;
    const end = Number.isInteger(input?.selectionEnd) ? input.selectionEnd : start;
    return Object.freeze({ start, end });
  }

  function insertTextareaBlock(input, text, selection = textareaSelection(input)) {
    if (!input || !text) return;
    const limit = input.value.length;
    const start = Math.max(0, Math.min(selection.start, limit));
    const end = Math.max(start, Math.min(selection.end, limit));
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const prefix = before && !/[\n ]$/.test(before) ? "\n" : "";
    const suffix = after && !/^[\n ]/.test(after) ? "\n" : "";
    input.value = `${before}${prefix}${text}${suffix}${after}`;
    const caret = (before + prefix + text + suffix).length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus({ preventScroll: true });
  }

  function insertComposerInlineText(text) {
    const input = composeUi().input;
    if (!input || !text) return;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
    input.setRangeText(text, start, end, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus({ preventScroll: true });
  }

  function insertComposerText(text) {
    insertTextareaBlock(composeUi().input, text);
  }

  async function uploadComposerFiles(files) {
    const selected = [...(files || [])];
    const images = selected.filter(imageFile);
    if (!selected.length) return;
    if (composerBridgeState.uploading) {
      setComposeStatus("已有图片正在上传，请等待完成后重试", "error", false);
      return;
    }
    if (!images.length) {
      setComposeStatus("请选择图片文件", "error", false);
      return;
    }
    composerBridgeState.uploading = true;
    updateComposeSendState();
    try {
      const markdown = [];
      for (const file of images) {
        setComposeStatus(IS_V2EX ? `正在通过 Imgur 上传 ${file.name || "图片"}…` : `正在上传 ${file.name || "图片"}…`, "busy", true);
        const payload = await uploadImageFile(file);
        markdown.push(uploadedImageMarkdown(payload, file));
      }
      insertComposerText(markdown.join("\n"));
      setComposeStatus(`已添加 ${markdown.length} 张图片`, "success", false);
    } catch (error) {
      reportComposerError(error, "上传");
    } finally {
      composerBridgeState.uploading = false;
      updateComposeSendState();
    }
  }

  async function uploadEditImages(files, selection) {
    const images = [...(files || [])].filter(imageFile);
    if (!images.length) return;
    if (editState.uploading) {
      setEditStatus("已有图片正在上传，请等待完成后重试", "error");
      return;
    }
    const { dialog, input } = editUi();
    if (!dialog || dialog.hidden || !input || editState.loading || editState.saving) {
      setEditStatus("当前无法上传图片", "error");
      return;
    }
    const requestSerial = editState.requestSerial;
    editState.uploading = true;
    input.disabled = true;
    updateEditSaveState();
    try {
      const markdown = [];
      for (const file of images) {
        setEditStatus(`正在上传 ${file.name || "剪贴板图片"}…`, "busy");
        const payload = await uploadImageFile(file);
        if (requestSerial !== editState.requestSerial) return;
        markdown.push(uploadedImageMarkdown(payload, file));
      }
      insertTextareaBlock(input, markdown.join("\n"), selection);
      setEditStatus(`已插入 ${markdown.length} 张图片，保存后生效`, "success");
    } catch (error) {
      if (requestSerial !== editState.requestSerial) return;
      const message = error instanceof Error ? error.message : String(error);
      setEditStatus(`图片上传失败：${message}`, "error");
      console.error("[linuxdo-wecom] failed to upload edit image", error);
    } finally {
      if (requestSerial === editState.requestSerial) {
        editState.uploading = false;
        input.disabled = false;
        updateEditSaveState();
        input.focus({ preventScroll: true });
      }
    }
  }

  function handleComposerFileChange(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadComposerFiles(event.target.files);
    event.target.value = "";
  }

  function transferImages(event) {
    const transfer = event.clipboardData || event.dataTransfer;
    const files = [...(transfer?.files || [])];
    // Chromium 会同时在 files 和 items 中暴露同一张剪贴板图片，且两者不是同一个 File 实例。
    if (files.length) return files.filter(imageFile);
    const itemFiles = [...(event.clipboardData?.items || [])]
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile?.())
      .filter(Boolean);
    return itemFiles.filter(imageFile);
  }

  function handleComposerPaste(event) {
    const files = transferImages(event);
    if (!files.length) return;
    event.preventDefault();
    event.stopPropagation();
    uploadComposerFiles(files);
  }

  function handleEditPaste(event) {
    const files = transferImages(event);
    if (!files.length) return;
    const selection = textareaSelection(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
    uploadEditImages(files, selection);
  }

  function handleComposerDrop(event) {
    const files = transferImages(event);
    if (!files.length) return;
    event.preventDefault();
    event.stopPropagation();
    uploadComposerFiles(files);
  }

  function stopComposerPointer(event) {
    event.stopPropagation();
  }

  function handleComposerToolClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    const action = button?.dataset.composerAction;
    const panel = button?.closest(".wecom-chat-panel");
    const input = panel?.querySelector(".wecom-chat-compose");
    if (action === "emoji") {
      if (IS_V2EX) {
        toggleV2exEmojiPicker(button);
        return;
      }
      showOfficialEmojiPicker(button).catch(() => {
        toggleV2exEmojiPicker(button);
      });
      return;
    }
    closeOfficialEmojiPicker();
    closeV2exEmojiPicker();
    if (action === "pic" || action === "folder" || action === "doc") {
      panel?.querySelector(".wecom-image-input")?.click();
    } else if (action === "cut") {
      flashComposeHint("提示：直接按 Ctrl+V 即可粘贴剪贴板截图", "info");
      if (input) input.focus({ preventScroll: true });
    } else if (action === "history") {
      flashComposeHint("聊天记录：向上滚动可加载更早消息", "info");
      if (input) input.focus({ preventScroll: true });
    } else if (input) {
      input.focus({ preventScroll: true });
    }
  }

  async function toggleLike(postId, btn) {
    if (!postId) return;
    if (IS_V2EX) {
      const wasLiked = likedPosts.has(postId);
      if (wasLiked) return;
      btn.classList.add("liked");
      likedPosts.add(postId);
      const msg = btn.closest(".wecom-msg");
      let likeNumEl = msg?.querySelector(".wecom-msg-like-num");
      let addedBadge = false;
      if (likeNumEl) {
        likeNumEl.textContent = String((parseInt(likeNumEl.textContent.trim(), 10) || 0) + 1);
      } else if (msg) {
        const meta = msg.querySelector(".wecom-msg-meta");
        if (meta) {
          const badge = document.createElement("span");
          badge.className = "wecom-msg-likes";
          badge.title = "感谢回复：1";
          badge.innerHTML = `<span class="wecom-msg-like-icon">${ICONS.heart}</span><span class="wecom-msg-like-num">1</span>`;
          meta.appendChild(badge);
          addedBadge = true;
        }
      }
      try {
        let once = document.querySelector("#Main form input[name='once'], input[name='once']")?.value;
        if (!once) {
          const res = await fetch(location.pathname, { credentials: "same-origin" });
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          once = doc.querySelector("input[name='once']")?.value;
        }
        if (!once) throw new Error("请先登录 V2EX");
        const resp = await fetch(`/thank/reply/${postId}?once=${once}`, {
          method: "POST",
          credentials: "same-origin"
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      } catch (err) {
        likedPosts.delete(postId);
        btn.classList.remove("liked");
        if (likeNumEl) {
          likeNumEl.textContent = String(Math.max(0, (parseInt(likeNumEl.textContent.trim(), 10) || 1) - 1));
        } else if (addedBadge) {
          msg?.querySelector(".wecom-msg-likes")?.remove();
        }
        console.warn("[v2ex] thank reply failed", err);
      }
      return;
    }
    const wasLiked = likedPosts.has(postId);
    // 乐观更新，失败回滚
    if (wasLiked) likedPosts.delete(postId); else likedPosts.add(postId);
    btn.classList.toggle("liked", !wasLiked);
    try {
      const resp = await fetch(
        wasLiked ? `/post_actions/${postId}?post_action_type_id=2` : "/post_actions",
        wasLiked
          ? {
              method: "DELETE",
              credentials: "same-origin",
              headers: { "X-CSRF-Token": csrfToken(), "X-Requested-With": "XMLHttpRequest" }
            }
          : {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "X-CSRF-Token": csrfToken(),
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: `id=${postId}&post_action_type_id=2`
            }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch {
      if (wasLiked) likedPosts.add(postId); else likedPosts.delete(postId);
      btn.classList.toggle("liked", wasLiked);
    }
  }

  function discourseRequire(moduleId) {
    try {
      if (typeof window.require === "function") return window.require(moduleId);
    } catch { /* module missing */ }
    return null;
  }

  function safeLookup(owner, key) {
    if (!owner || typeof owner.lookup !== "function") return null;
    try {
      return owner.lookup(key);
    } catch {
      return null;
    }
  }

  function getEmberOwner() {
    try {
      if (window.Discourse?.__container__) return window.Discourse.__container__;

      // Ember.Namespace 反查 Discourse 应用
      const Ember = window.Ember;
      const namespaces = Ember?.Namespace?.NAMESPACES;
      if (Array.isArray(namespaces)) {
        const app = namespaces.find((n) =>
          n && (n.name === "Discourse" || n.modulePrefix === "discourse" || n.NAMESPACE === "Discourse")
        );
        if (app?.__container__) return app.__container__;
        if (typeof app?.lookup === "function") return app;
      }

      const mod =
        discourseRequire("discourse-common/lib/get-owner") ||
        discourseRequire("discourse/lib/get-owner");
      if (mod) {
        const owner =
          (typeof mod.getOwnerWithFallback === "function" && mod.getOwnerWithFallback(window.Discourse)) ||
          (typeof mod.getOwner === "function" && mod.getOwner(window.Discourse)) ||
          null;
        if (owner) return owner;
      }

      try {
        const appMod = discourseRequire("discourse/app");
        const app = appMod?.default || appMod;
        if (app?.__container__) return app.__container__;
        if (typeof app?.lookup === "function") return app;
      } catch { /* ignore */ }
    } catch (err) {
      console.warn("[linuxdo-wecom] getEmberOwner failed", err);
    }
    return null;
  }

  function getComposerService(owner) {
    return safeLookup(owner, "service:composer") || safeLookup(owner, "controller:composer");
  }

  function getTopicModel(owner) {
    const topicController = safeLookup(owner, "controller:topic");
    if (!topicController) return null;
    try {
      return topicController.get?.("model") || topicController.model || null;
    } catch {
      return null;
    }
  }

  function syncUserCardElement(selector, user) {
    const element = document.querySelector(selector);
    if (!element) return;
    for (const attribute of ["data-user-card", "role", "tabindex", "aria-label", "title"]) {
      element.removeAttribute(attribute);
    }
    const identity = userCardIdentity(user);
    if (!identity) return;
    element.dataset.userCard = identity.username;
    element.setAttribute("role", "button");
    element.tabIndex = 0;
    element.setAttribute("aria-label", identity.label);
    element.title = identity.label;
  }

  function openOriginalUserCard(trigger, event) {
    const username = String(trigger?.dataset?.userCard || "").trim();
    if (!username) throw new Error("用户头像缺少 data-user-card");
    if (IS_V2EX) {
      window.open(`/member/${encodeURIComponent(username)}`, "_blank");
      return;
    }
    const appEvents = safeLookup(getEmberOwner(), "service:app-events");
    if (typeof appEvents?.trigger !== "function") {
      throw new Error("无法连接 Discourse 原生用户卡事件服务");
    }
    appEvents.trigger("topic-header:trigger-user-card", username, trigger, event);
  }

  function userCardTriggerForEvent(event) {
    if (!(event.target instanceof Element)) return null;
    const trigger = event.target.closest("[data-user-card]");
    return trigger && event.currentTarget.contains(trigger) ? trigger : null;
  }

  function handleUserCardClick(event) {
    if (event.button !== 0) return;
    const trigger = userCardTriggerForEvent(event);
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openOriginalUserCard(trigger, event);
  }

  function handleUserCardKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = userCardTriggerForEvent(event);
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openOriginalUserCard(trigger, event);
  }

  function bindUserCardEvents(root) {
    if (!root || root.dataset.userCardBound === "1") return;
    root.dataset.userCardBound = "1";
    root.addEventListener("click", handleUserCardClick);
    root.addEventListener("keydown", handleUserCardKeydown);
  }

  function topicBookmarkFrom(data) {
    const bookmarks = Array.isArray(data?.bookmarks) ? data.bookmarks : [];
    return bookmarks.find((bookmark) => bookmark?.bookmarkable_type === "Topic") || null;
  }

  function setTopicBookmarkState(bookmarked) {
    chatState.topicBookmarked = Boolean(bookmarked);
    const button = document.querySelector(".wecom-topic-bookmark");
    if (!button) return;
    const active = chatState.topicBookmarked;
    const label = active ? "编辑话题书签" : "收藏话题";
    button.classList.toggle("is-bookmarked", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function handleBookmarksChanged(data, attachedTo) {
    if (attachedTo?.target === "topic") {
      if (Number(attachedTo.targetId) === Number(chatState.topicId)) {
        setTopicBookmarkState(Boolean(data));
      }
      return;
    }
    if (attachedTo?.target === "post") {
      setPostBookmarkState(Number(attachedTo.targetId), Boolean(data));
    }
  }

  const bookmarkEventTarget = Object.freeze({ changed: handleBookmarksChanged });
  let bookmarkEventsService = null;

  function bindBookmarkEvents() {
    const appEvents = safeLookup(getEmberOwner(), "service:app-events");
    if (typeof appEvents?.on !== "function") return false;
    if (bookmarkEventsService === appEvents) return true;
    bookmarkEventsService?.off?.("bookmarks:changed", bookmarkEventTarget, "changed");
    appEvents.on("bookmarks:changed", bookmarkEventTarget, "changed");
    bookmarkEventsService = appEvents;
    return true;
  }

  function originalTopicBookmarkModel(owner, model) {
    const bookmarks = Array.isArray(model?.bookmarks) ? model.bookmarks : [];
    const existing = bookmarks.find((bookmark) => bookmark?.bookmarkable_type === "Topic");
    if (existing) return existing;
    const currentUser = safeLookup(owner, "service:current-user");
    const bookmarkApi = safeLookup(owner, "service:bookmark-api");
    if (!currentUser) throw new Error("登录后才能收藏话题");
    if (typeof bookmarkApi?.buildNewBookmark !== "function") {
      throw new Error("站点未加载 Discourse 原生书签服务");
    }
    return bookmarkApi.buildNewBookmark("Topic", model.id);
  }

  function openOriginalTopicBookmark() {
    const owner = getEmberOwner();
    const controller = safeLookup(owner, "controller:topic");
    const model = getTopicModel(owner);
    const modelId = Number(model?.get?.("id") ?? model?.id);
    if (!controller || typeof controller._modifyTopicBookmark !== "function") {
      throw new Error("无法连接 Discourse 原生话题书签控制器");
    }
    if (modelId !== Number(chatState.topicId)) {
      throw new Error(`原生话题模型 ${modelId || "未知"} 与当前话题 ${chatState.topicId} 不一致`);
    }
    if (!bindBookmarkEvents()) throw new Error("无法监听 Discourse 原生书签状态");
    return controller._modifyTopicBookmark(originalTopicBookmarkModel(owner, model));
  }

  function setPostBookmarkState(postId, bookmarked) {
    if (!Number.isInteger(postId) || postId <= 0) return;
    const message = document.querySelector(`.wecom-msg[data-post-id="${postId}"]`);
    const button = message?.querySelector('[data-action="bookmark"]');
    if (!button) return;
    const active = Boolean(bookmarked);
    const label = active ? "编辑楼层书签" : "收藏本楼层";
    button.classList.toggle("bookmarked", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  async function resolveOriginalPostModel(model, postId, postNumber) {
    const loaded = findLoadedPost(model, postNumber);
    const post = loaded || await model?.postById?.(postId);
    const resolvedId = Number(post?.get?.("id") ?? post?.id);
    if (!post || resolvedId !== postId) {
      throw new Error(`无法载入楼层 #${postNumber} 的原生帖子模型`);
    }
    return post;
  }

  async function openOriginalPostBookmark(message) {
    const postId = Number(message?.dataset?.postId);
    const postNumber = Number(message?.dataset?.postNumber);
    const topicId = Number(chatState.topicId);
    if (!postId || !postNumber || !topicId) throw new Error("无法确定待收藏楼层");
    const owner = getEmberOwner();
    const controller = safeLookup(owner, "controller:topic");
    const model = getTopicModel(owner);
    const modelId = Number(model?.get?.("id") ?? model?.id);
    if (typeof controller?.toggleBookmark !== "function") {
      throw new Error("无法连接 Discourse 原生楼层书签控制器");
    }
    if (modelId !== topicId) throw new Error("原生话题模型与当前话题不一致");
    if (!bindBookmarkEvents()) throw new Error("无法监听 Discourse 原生书签状态");
    const post = await resolveOriginalPostModel(model, postId, postNumber);
    if (Number(chatState.topicId) !== topicId) throw new Error("话题已切换，请重新收藏");
    return controller.toggleBookmark(post);
  }

  function reportPostBookmarkError(error) {
    const message = error instanceof Error ? error.message : String(error || "未知错误");
    console.error("[linuxdo-wecom] post bookmark bridge failed", error);
    setComposeStatus(`打开楼层书签失败：${message}`, "error", true);
  }

  function findLoadedPost(topic, postNumber) {
    if (!topic || !postNumber) return null;
    try {
      const stream = topic.get?.("postStream") || topic.postStream;
      const posts = stream?.get?.("posts") || stream?.posts || [];
      return [...posts].find((p) =>
        Number(p?.get?.("post_number") ?? p?.post_number) === Number(postNumber)
      ) || null;
    } catch { /* ignore */ }
    return null;
  }

  function getOpenComposerModel() {
    const owner = getEmberOwner();
    const composer = owner ? getComposerService(owner) : null;
    if (!composer) return null;
    return composer.model || composer.get?.("model") || null;
  }

  function retargetOpenNativeComposer(postNumber) {
    const model = getOpenComposerModel();
    if (!model) return false;
    const requestedPost = Number(postNumber) || null;
    const topic = getTopicModel(getEmberOwner());
    const post = requestedPost ? findLoadedPost(topic, requestedPost) : null;
    if (requestedPost && !post) {
      throw new Error(`目标楼层 #${requestedPost} 尚未载入原生帖子流`);
    }
    if (typeof model.set === "function") model.set("post", post);
    else model.post = post;
    if (!requestedPost && typeof model.setReplyTo === "function") {
      model.setReplyTo(null, null);
    }
    return true;
  }

  function isComposerOpen() {
    const el = document.querySelector("#reply-control");
    return !!(el && (el.classList.contains("open") || el.classList.contains("fullscreen") || el.classList.contains("edit-title")));
  }

  function composeUi() {
    return {
      input: document.querySelector("textarea.wecom-chat-compose"),
      send: document.querySelector(".wecom-send-btn"),
      status: document.querySelector(".wecom-compose-status"),
      target: document.querySelector(".wecom-reply-target")
    };
  }

  function updateComposeSendState() {
    const { input, send } = composeUi();
    if (!input || !send) return;
    send.disabled = composerBridgeState.submitting || composerBridgeState.uploading || !input.value.trim();
  }

  function setComposeStatus(message, kind, persistent) {
    const { status } = composeUi();
    if (!status) return;
    clearTimeout(setComposeStatus._timer);
    status.textContent = message || "";
    status.className = `wecom-compose-status${kind ? ` ${kind}` : ""}`;
    if (!message || persistent) return;
    setComposeStatus._timer = setTimeout(() => {
      status.textContent = "";
      status.className = "wecom-compose-status";
    }, COMPOSER_STATUS_DURATION_MS);
  }

  function flashComposeHint(message, kind) {
    setComposeStatus(message, kind, false);
  }

  function reportComposerError(error, action = "回复") {
    const message = error instanceof Error ? error.message : String(error || "未知错误");
    console.error("[linuxdo-wecom] composer bridge failed", error);
    setComposeStatus(`${action}失败：${message}`, "error", true);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function nativeComposerTextarea() {
    if (!isComposerOpen()) return null;
    return document.querySelector(NATIVE_COMPOSER_TEXTAREA);
  }

  function nativeComposerMatchesTopic(topicId) {
    const model = getOpenComposerModel();
    if (!model) return true;
    const modelTopicId = model.get?.("topic.id") ?? model.get?.("topic_id") ??
      model.topic?.id ?? model.topic_id;
    const normalized = Number(modelTopicId?.id ?? modelTopicId);
    return !Number.isFinite(normalized) || normalized === Number(topicId);
  }

  function waitForNativeComposer(topicId) {
    const readyTextarea = () => {
      const textarea = nativeComposerTextarea();
      return textarea && nativeComposerMatchesTopic(topicId) ? textarea : null;
    };
    const existing = readyTextarea();
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const textarea = readyTextarea();
        if (!textarea) return;
        clearTimeout(timer);
        clearInterval(interval);
        resolve(textarea);
      }, COMPOSER_POLL_INTERVAL_MS);
      const timer = setTimeout(() => {
        clearInterval(interval);
        reject(new Error("原生回复引擎未在规定时间内就绪"));
      }, COMPOSER_READY_TIMEOUT_MS);
    });
  }

  function setNativeComposerValue(value, options = {}) {
    const textarea = nativeComposerTextarea();
    if (!textarea) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (!setter) throw new Error("无法连接原生回复输入框");
    const changed = textarea.value !== value;
    if (changed) setter.call(textarea, value);
    if (options.notify !== true) return changed;
    const model = getOpenComposerModel();
    if (typeof model?.set === "function") model.set("reply", value);
    else if (model && "reply" in model) model.reply = value;
    if (options.emitInput !== false) {
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return changed;
  }

  function storeComposerDraft(value) {
    const topicId = composerBridgeState.topicId;
    if (!topicId) return;
    composerBridgeState.drafts.set(topicId, value);
  }

  function syncFromNativeComposer(textarea) {
    const { input } = composeUi();
    if (!input) return;
    if (input.value) {
      setNativeComposerValue(input.value);
    } else if (textarea.value) {
      input.value = textarea.value;
      storeComposerDraft(input.value);
    }
    updateComposeSendState();
  }

  function bindNativeComposerInput(textarea) {
    if (textarea.dataset.wecomBridgeBound === "1") return;
    textarea.dataset.wecomBridgeBound = "1";
    textarea.addEventListener("input", () => {
      const { input } = composeUi();
      if (!input || input.value === textarea.value) return;
      input.value = textarea.value;
      storeComposerDraft(input.value);
      updateComposeSendState();
    });
  }

  function clearNativeComposerDraft() {
    if (!nativeComposerTextarea()) return;
    setNativeComposerValue("", { notify: true, emitInput: false });
  }

  function connectNativeComposer(postNumber) {
    const requestedPost = Number(postNumber) || null;
    const ready = nativeComposerTextarea();
    if (ready && composerBridgeState.nativeTopicId === chatState.topicId &&
      composerBridgeState.nativeReplyToPostNumber === requestedPost) {
      return Promise.resolve(ready);
    }
    if (composerBridgeState.connecting) {
      if (composerBridgeState.connectingTarget === requestedPost) return composerBridgeState.connecting;
      return composerBridgeState.connecting.catch(() => null).then(() => connectNativeComposer(postNumber));
    }
    const wrongTopic = composerBridgeState.nativeTopicId !== chatState.topicId;
    const wrongReplyTarget = requestedPost !== composerBridgeState.nativeReplyToPostNumber;
    const composeInput = composeUi().input;
    const restoreFocus = composeInput && document.activeElement === composeInput;
    if (!isComposerOpen() || wrongTopic || wrongReplyTarget) {
      if (!openNativeComposer(requestedPost)) {
        return Promise.reject(new Error("无法启动原生回复引擎"));
      }
    }
    const topicId = chatState.topicId;
    const connectionSerial = ++composerBridgeState.connectionSerial;
    composerBridgeState.connectingTarget = requestedPost;
    const connection = waitForNativeComposer(topicId).then((textarea) => {
      if (chatState.topicId !== topicId) throw new Error("回复目标已切换，请重新输入");
      composerBridgeState.nativeTopicId = topicId;
      composerBridgeState.nativeReplyToPostNumber = requestedPost;
      bindNativeComposerInput(textarea);
      syncFromNativeComposer(textarea);
      if (restoreFocus && composeInput?.isConnected) {
        textarea.blur();
        composeInput.focus({ preventScroll: true });
      }
      return textarea;
    });
    composerBridgeState.connecting = connection.finally(() => {
      if (composerBridgeState.connectionSerial === connectionSerial) {
        composerBridgeState.connecting = null;
        composerBridgeState.connectingTarget = null;
      }
    });
    return composerBridgeState.connecting;
  }

  function handleComposerInput(input) {
    storeComposerDraft(input.value);
    if (composeUi().status?.classList.contains("error")) setComposeStatus("", "", false);
    updateComposeSendState();
    const correctTopic = nativeComposerMatchesTopic(chatState.topicId);
    const correctTarget = composerBridgeState.nativeReplyToPostNumber === composerBridgeState.replyToPostNumber;
    if (nativeComposerTextarea() && correctTopic && correctTarget) {
      // 只写入 DOM，不派发原生 input 事件；否则 Discourse 会在输入 #/@ 时弹出补全层。
      setNativeComposerValue(input.value);
    }
  }

  function handleComposerKeydown(event) {
    if (event.__wecomComposerGuarded) return;
    event.stopPropagation();
    if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    submitComposerFromUi(event);
  }

  function guardComposerShortcut(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("textarea.wecom-chat-compose")) return;
    event.__wecomComposerGuarded = true;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") event.preventDefault();
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      submitComposerFromUi(event);
    }
    event.stopImmediatePropagation();
  }

  function submitComposerFromUi(event) {
    event?.preventDefault?.();
    submitComposer().catch(reportComposerError);
  }

  function replyTargetLabel(postNumber) {
    const message = document.querySelector(`.wecom-msg[data-post-number="${postNumber}"]`);
    const name = message?.querySelector(".wecom-msg-name")?.textContent?.trim();
    return name ? `回复 ${name} · #${postNumber}` : `回复消息 #${postNumber}`;
  }

  function showTargetedReply(postNumber) {
    const { target } = composeUi();
    composerBridgeState.replyToPostNumber = Number(postNumber) || null;
    if (!target || !composerBridgeState.replyToPostNumber) return;
    target.querySelector("span").textContent = replyTargetLabel(postNumber);
    target.hidden = false;
  }

  function hideTargetedReply() {
    const { target } = composeUi();
    composerBridgeState.replyToPostNumber = null;
    if (target) target.hidden = true;
  }

  function cancelTargetedReply(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    hideTargetedReply();
    composeUi().input?.focus();
  }

  function switchComposerTopic(topicId) {
    closeOfficialEmojiPicker();
    closeV2exEmojiPicker();
    const { input } = composeUi();
    const previousTopicId = composerBridgeState.topicId;
    if (input && previousTopicId) {
      composerBridgeState.drafts.set(previousTopicId, input.value);
    }
    composerBridgeState.topicId = topicId || null;
    composerBridgeState.connectionSerial += 1;
    composerBridgeState.connecting = null;
    composerBridgeState.connectingTarget = null;
    if (previousTopicId !== composerBridgeState.topicId) {
      composerBridgeState.nativeTopicId = null;
      composerBridgeState.nativeReplyToPostNumber = null;
    }
    hideTargetedReply();
    if (input) input.value = composerBridgeState.drafts.get(topicId) || "";
    setComposeStatus("", "", false);
    updateComposeSendState();
  }

  function setComposerPlaceholder(title) {
    const { input } = composeUi();
    if (!input) return;
    input.placeholder = title ? `发送给 ${title}` : "发送消息";
  }

  function clickNativeReplyButton(postNumber) {
    if (postNumber) {
      const article = document.querySelector(
        `.post-stream article[data-post-number="${postNumber}"], #post_${postNumber}, article[id="post_${postNumber}"]`
      );
      const postReply = article?.querySelector(
        "button.reply, .post-controls button.reply, button.create.reply, .reply.create"
      );
      if (!postReply) return false;
      postReply.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      return true;
    }
    const topicSelectors = [
      "#topic-footer-buttons button.create",
      "#topic-footer-buttons button.btn-primary.create",
      ".topic-footer-main-buttons button.create",
      ".topic-footer-main-buttons button.btn-primary",
      "button.btn-primary.create.reply",
      "button.create.reply"
    ];
    for (const selector of topicSelectors) {
      const button = document.querySelector(selector);
      if (!button || button.id === "create-topic" || button.closest(".d-header")) continue;
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      return true;
    }
    return false;
  }

  function openComposerViaService(postNumber) {
    const owner = getEmberOwner();
    if (!owner) return false;
    const composer = getComposerService(owner);
    if (!composer) return false;
    const topic = getTopicModel(owner);
    const Composer = discourseRequire("discourse/models/composer");
    const REPLY = Composer?.REPLY || Composer?.default?.REPLY || "reply";

    try {
      if (postNumber) {
        const post = findLoadedPost(topic, postNumber);
        if (!post) return false;
        if (post && typeof composer.replyTo === "function") {
          composer.replyTo(post);
          return true;
        }
        if (post && typeof composer.open === "function") {
          composer.open({
            action: REPLY,
            post,
            draftKey: topic?.get?.("draft_key") || topic?.draft_key || `topic_${chatState.topicId}`,
            draftSequence: topic?.get?.("draft_sequence") ?? topic?.draft_sequence
          });
          return true;
        }
        return false;
      }

      if (topic && typeof composer.replyToTopic === "function") {
        composer.replyToTopic(REPLY, topic);
        return true;
      }
      if (topic && typeof composer.open === "function") {
        composer.open({
          action: REPLY,
          topic,
          draftKey: topic.get?.("draft_key") || topic.draft_key || `topic_${chatState.topicId}`,
          draftSequence: topic.get?.("draft_sequence") ?? topic.draft_sequence,
          title: topic.get?.("title") || topic.title,
          categoryId: topic.get?.("category_id") || topic.category_id
        });
        return true;
      }
    } catch (err) {
      console.warn("[linuxdo-wecom] composer service open failed", err);
    }
    return false;
  }

  function attemptComposerOpen(label, action) {
    try {
      return Boolean(action());
    } catch (error) {
      console.error(`[linuxdo-wecom] ${label} failed`, error);
      return false;
    }
  }

  function tryComposerStrategies(postNumber) {
    const strategies = [
      ["composer service", () => openComposerViaService(postNumber)],
      ["native reply button", () => clickNativeReplyButton(postNumber)]
    ];
    for (const [label, action] of strategies) {
      if (attemptComposerOpen(label, action)) return true;
    }
    return false;
  }

  function closeNativeComposerForTopicSwitch() {
    const owner = getEmberOwner();
    const composer = owner ? getComposerService(owner) : null;
    if (!composer) return false;
    if (typeof composer.saveAndCloseComposer === "function") {
      composer.saveAndCloseComposer();
      return true;
    }
    if (typeof composer.close === "function") {
      composer.close();
      return true;
    }
    return false;
  }

  function retargetActiveComposer(postNumber) {
    const requestedPost = Number(postNumber) || null;
    const wrongTopic = composerBridgeState.nativeTopicId !== chatState.topicId;
    const wrongReplyTarget = requestedPost !== composerBridgeState.nativeReplyToPostNumber;
    if (wrongTopic) {
      if (!closeNativeComposerForTopicSwitch() || !openComposerViaService(requestedPost)) {
        throw new Error("无法切换原生回复话题");
      }
      return;
    }
    if (wrongReplyTarget && !retargetOpenNativeComposer(requestedPost)) {
      throw new Error("无法更新原生回复目标");
    }
  }

  /** 启动后台 Discourse composer；它在 IM 模式中始终保持离屏。 */
  function openNativeComposer(postNumber) {
    try {
      if (isComposerOpen()) {
        retargetActiveComposer(postNumber);
        return true;
      }
      const opened = tryComposerStrategies(postNumber);
      if (opened) return true;
      console.warn("[linuxdo-wecom] openNativeComposer failed", { topicId: chatState.topicId, postNumber });
      return false;
    } catch (err) {
      console.error("[linuxdo-wecom] openNativeComposer crashed", err);
      return false;
    }
  }

  function nativeComposerErrorText() {
    const root = document.querySelector("#reply-control.open, #reply-control.fullscreen, #reply-control.edit-title");
    const error = root?.querySelector(NATIVE_COMPOSER_ERROR);
    return error?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function nativeSubmitButton() {
    const root = document.querySelector("#reply-control.open, #reply-control.fullscreen, #reply-control.edit-title");
    if (!root) return null;
    const buttons = [...root.querySelectorAll(`${NATIVE_COMPOSER_SUBMIT}, button[type='submit']`)];
    return buttons.find((button) => !button.hidden && button.getAttribute("aria-hidden") !== "true") || buttons[0] || null;
  }

  function dismissNativeComposerPopups() {
    closeOfficialEmojiPicker();
    closeV2exEmojiPicker();
    const selectors = [
      ".autocomplete", ".autocomplete-container", ".d-editor-popup", ".tag-chooser"
    ];
    document.querySelectorAll(selectors.join(", ")).forEach((node) => {
      node.hidden = true;
      node.setAttribute("aria-hidden", "true");
    });
  }

  function waitForComposerSubmitOutcome(initialValue) {
    if (!isComposerOpen()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const finish = (error) => {
        clearTimeout(timer);
        observer.disconnect();
        if (error) reject(error); else resolve();
      };
      const inspect = () => {
        if (!isComposerOpen()) {
          finish();
          return;
        }
        const errorText = nativeComposerErrorText();
        if (errorText) {
          finish(new Error(errorText));
          return;
        }
        const textarea = nativeComposerTextarea();
        if (initialValue && textarea && !textarea.value.trim()) finish();
      };
      const observer = new MutationObserver(inspect);
      const timer = setTimeout(() => {
        finish(new Error("发送状态未确认，请切换原生视图查看具体错误"));
      }, COMPOSER_SUBMIT_TIMEOUT_MS);
      observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
      inspect();
    });
  }

  function withSubmittedReplyMetadata(post, requestedPostNumber) {
    if (!post || typeof post !== "object") return post;
    const replyNumber = Number(post.reply_to_post_number || requestedPostNumber) || 0;
    if (!replyNumber) return post;
    const target = chatState.postsByNumber.get(replyNumber);
    const replyUser = post.reply_to_user || (target ? {
      id: postUserId(target),
      username: postUsername(target),
      name: target.name,
      avatar_template: target.avatar_template
    } : null);
    return {
      ...post,
      reply_to_post_number: replyNumber,
      ...(replyUser ? { reply_to_user: replyUser } : {})
    };
  }

  function completeComposerSubmission(input, submittedPost) {
    const topicId = chatState.topicId;
    const requestedReply = composerBridgeState.replyToPostNumber;
    input.value = "";
    storeComposerDraft("");
    hideTargetedReply();
    clearNativeComposerDraft();
    composerBridgeState.nativeTopicId = null;
    composerBridgeState.nativeReplyToPostNumber = null;
    setComposeStatus("已发送", "success", false);
    if (topicId && !IS_V2EX) {
      const rawPost = submittedPost?.post || submittedPost;
      const post = withSubmittedReplyMetadata(rawPost, requestedReply);
      if (post && (post.id || post.post_number)) {
        appendFreshPosts([post], document.querySelector(".wecom-chat-body"), { scroll: true });
      }
      syncNewPostsFromDom();
      scheduleSubmittedPostSync(topicId);
      refreshTopicAfterSubmission(topicId).catch((error) => {
        console.error("[linuxdo-wecom] submitted post refresh failed", error);
        setComposeStatus("已发送，但当前页同步失败，请点击刷新", "error", true);
      });
    }
  }

  async function submitNativeReply(raw) {
    const requestedPost = composerBridgeState.replyToPostNumber;
    let clicked = false;
    try {
      await connectNativeComposer(requestedPost);
      setNativeComposerValue(raw, { notify: true, emitInput: false });
      await delay(COMPOSER_INPUT_SETTLE_MS);
      let button = nativeSubmitButton();
      if (!button) throw new Error("找不到原生发送按钮");
      if (button.disabled || button.getAttribute("aria-disabled") === "true") {
        setNativeComposerValue(raw, { notify: true, emitInput: true });
        dismissNativeComposerPopups();
        await delay(COMPOSER_INPUT_SETTLE_MS);
        button = nativeSubmitButton();
      }
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") {
        throw new Error(nativeComposerErrorText() || "内容未达到站点发送要求");
      }
      dismissNativeComposerPopups();
      clicked = true;
      button.click();
      await waitForComposerSubmitOutcome(raw);
    } catch (error) {
      if (error && typeof error === "object") error.submissionStarted = clicked;
      throw error;
    }
  }

  function isSubmissionTimeout(error) {
    return /发送状态未确认|未在规定时间内就绪/.test(String(error?.message || error || ""));
  }

  async function recoverTimedOutSubmission(raw, replyTo) {
    const beforeStreamLength = chatState.stream.length;
    const refreshed = await refreshTopicOnce(chatState.topicId).catch(() => 0);
    if (refreshed > 0 || chatState.stream.length > beforeStreamLength) return null;
    return submitReplyViaApi(raw, replyTo);
  }

  async function submitComposer() {
    const { input } = composeUi();
    if (!input || !input.value.trim() || composerBridgeState.submitting || composerBridgeState.uploading) return;
    if (!chatState.topicId) throw new Error("请先打开一个话题");
    composerBridgeState.submitting = true;
    updateComposeSendState();
    setComposeStatus("正在发送…", "busy", true);
    const raw = input.value;
    const replyTo = composerBridgeState.replyToPostNumber;
    try {
      if (IS_V2EX) {
        await submitV2exReply(chatState.topicId, raw);
        completeComposerSubmission(input);
        await loadTopic(chatState.topicId, true);
        const chatBody = document.querySelector(".wecom-chat-body");
        if (chatBody) {
          setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
          }, 100);
        }
        return;
      }
      let apiError = null;
      try {
        const post = await submitReplyViaApi(raw, replyTo);
        completeComposerSubmission(input, post);
        return;
      } catch (error) {
        apiError = error;
      }
      try {
        await submitNativeReply(raw);
        completeComposerSubmission(input);
      } catch (error) {
        if (error?.submissionStarted && isSubmissionTimeout(error)) {
          try {
            const post = await recoverTimedOutSubmission(raw, replyTo);
            completeComposerSubmission(input, post);
            return;
          } catch (fallbackError) {
            throw new Error(`${error.message || "原生回复失败"}；备用路径：${fallbackError.message}`);
          }
        }
        if (error?.submissionStarted) throw error;
        try {
          const post = await submitReplyViaApi(raw, replyTo);
          completeComposerSubmission(input, post);
        } catch (fallbackError) {
          const details = [apiError, fallbackError]
            .filter(Boolean)
            .map((item) => item.message)
            .join("；");
          throw new Error(`${error.message || "原生回复失败"}${details ? `；备用路径：${details}` : ""}`);
        }
      }
    } finally {
      composerBridgeState.submitting = false;
      updateComposeSendState();
    }
  }

  function replyToPost(postNumber) {
    showTargetedReply(postNumber);
    const { input } = composeUi();
    if (IS_V2EX && input) {
      const message = document.querySelector(`.wecom-msg[data-post-number="${postNumber}"]`);
      const name = message?.querySelector(".wecom-msg-name")?.textContent?.trim();
      if (name && !input.value.includes(`@${name}`)) {
        input.value = `@${name} ` + input.value;
      }
    }
    input?.focus();
  }

  const TIME_SEP_GAP = 10 * 60 * 1000;

  function renderBubbles(posts, myName) {
    rememberChatPosts(posts);
    const frag = [];
    let lastTime = 0;
    for (const post of posts) {
      if (post.id && (post.actions_summary || []).some((a) => a.id === 2 && a.acted)) {
        likedPosts.add(post.id);
      }
      const t = new Date(post.created_at).getTime();
      if (t - lastTime > TIME_SEP_GAP) {
        frag.push(`<div class="wecom-msg-time-sep">${escapeHtml(formatClock(post.created_at))}</div>`);
      }
      lastTime = t;
      frag.push(bubbleHtml(post, myName));
    }
    return frag.join("");
  }

  const TOPIC_CACHE_MAX = 30;
  const TOPIC_CACHE_TTL_MS = 3 * 60 * 1000;
  const topicDataCache = new Map();

  function normalizeTopicCacheKey(topicId) {
    if (topicId == null) return "";
    return String(topicId).trim();
  }

  function getCachedTopic(topicId) {
    const key = normalizeTopicCacheKey(topicId);
    if (!key) return null;
    const entry = topicDataCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TOPIC_CACHE_TTL_MS) {
      topicDataCache.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCachedTopic(topicId, data) {
    if (!topicId || !data) return;
    const key = normalizeTopicCacheKey(topicId);
    if (!key) return;
    topicDataCache.delete(key);
    if (topicDataCache.size >= TOPIC_CACHE_MAX) {
      const oldestKey = topicDataCache.keys().next().value;
      if (oldestKey) topicDataCache.delete(oldestKey);
    }
    topicDataCache.set(key, { data, timestamp: Date.now() });
  }

  function deleteCachedTopic(topicId) {
    const key = normalizeTopicCacheKey(topicId);
    if (!key) return;
    topicDataCache.delete(key);
    for (const k of Array.from(topicDataCache.keys())) {
      if (k === key || k.startsWith(`${key}_`)) {
        topicDataCache.delete(k);
      }
    }
  }

  async function fetchPostsByIds(topicId, ids, signal) {
    if (!ids.length) return [];
    const query = ids.map((id) => `post_ids[]=${encodeURIComponent(id)}`).join("&");
    const opts = signal ? { signal } : {};
    const data = await api(`/t/${topicId}/posts.json?${query}`, opts);
    return data?.post_stream?.posts || data?.posts || [];
  }

  async function postsForTopicOpening(topicId, stream, posts, aroundPostNumber, signal) {
    if (IS_V2EX) return posts;
    const ordered = orderedTopicPosts(posts, stream);
    const target = Number(aroundPostNumber) || 0;
    if (target > 1) return ordered;
    if (!stream.length || ordered.some((post) => postNumberOf(post) === 1)) return ordered;
    const loaded = new Set(ordered.map(postIdOf));
    const missing = stream.slice(0, POST_SYNC_BATCH_SIZE)
      .filter((id) => !loaded.has(String(id)));
    if (!missing.length) return ordered;
    try {
      const fetched = await fetchPostsByIds(topicId, missing, signal);
      return orderedTopicPosts(ordered.concat(fetched), stream);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      console.error("[linuxdo-wecom] failed to load the topic opening posts", error);
      return ordered;
    }
  }

  /* ============================== V2EX 社区适配器 ============================== */

  function extractV2exTopicsFromDoc(doc) {
    if (!doc) return [];
    const dockAreas = doc.querySelectorAll("#Main .dock_area");
    if (dockAreas.length) {
      const topics = [];
      const seen = new Set();
      dockAreas.forEach((dock, idx) => {
        const topicLink = dock.querySelector("a[href*='/t/']");
        if (!topicLink) return;
        const rawHref = topicLink.getAttribute("href") || "";
        const match = rawHref.match(/\/t\/(\d+)/);
        if (!match) return;
        const id = Number(match[1]);
        const target = parseV2exReplyTarget(rawHref);
        const dedupKey = `${id}_${target.anchor || ""}_${idx}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        const nextInner = dock.nextElementSibling?.classList.contains("inner") ? dock.nextElementSibling : null;
        const replyContent = nextInner?.querySelector(".reply_content")?.textContent?.trim() || "";
        const timeEl = dock.querySelector(".fade, .ago");
        const nodeLink = dock.querySelector("a[href^='/go/']");
        const title = topicLink.textContent.trim() || `话题 #${id}`;

        topics.push({
          id,
          target_floor: target.floor,
          target_reply_id: target.replyId,
          target_anchor: target.anchor,
          target_page: target.page || (target.floor ? Math.max(1, Math.floor((target.floor - 1) / 100) + 1) : 1),
          title,
          posts_count: target.floor ? target.floor + 1 : 1,
          reply_count: target.floor || 0,
          created_at: timeEl?.textContent?.trim() || "",
          bumped_at: timeEl?.textContent?.trim() || "",
          last_poster_username: "",
          node_name: nodeLink?.textContent?.trim() || "回复",
          v2ex_avatar: "",
          notification_text: replyContent,
          posters: [{ user_id: id, description: "V2EX member reply" }]
        });
      });
      if (topics.length) return topics;
    }

    const items = doc.querySelectorAll("#Main .cell, #Main .item");
    const topics = [];
    items.forEach((item) => {
      const titleLink = item.querySelector(".item_title a, a.topic-link");
      if (!titleLink) return;
      const href = titleLink.getAttribute("href") || "";
      const idMatch = href.match(/\/t\/(\d+)/);
      if (!idMatch) return;
      const id = Number(idMatch[1]);
      const title = titleLink.textContent.trim();
      const avatarImg = item.querySelector("img.avatar");
      const avatar = avatarImg?.getAttribute("src") || "";
      const authorLink = item.querySelector(".topic_info strong a, a[href^='/member/']");
      const author = authorLink?.textContent.trim() || "";
      const nodeLink = item.querySelector("a.node");
      const nodeName = nodeLink?.textContent.trim() || "";
      const countLink = item.querySelector("a.count_livid, a.count_orange");
      const replies = countLink ? parseInt(countLink.textContent.trim(), 10) || 0 : 0;
      const timeEl = item.querySelector(".topic_info span[title], .topic_info .ago");
      const infoText = timeEl?.getAttribute("title") || timeEl?.textContent?.trim() || item.querySelector(".topic_info")?.textContent?.trim() || "";

      topics.push({
        id,
        title,
        posts_count: replies + 1,
        reply_count: replies,
        created_at: infoText,
        bumped_at: infoText,
        last_poster_username: author,
        node_name: nodeName,
        v2ex_avatar: avatar,
        posters: [{ user_id: id, description: "Original Poster" }]
      });
    });
    return topics;
  }

  function mapV2exJsonTopics(list) {
    return (list || []).map((t) => ({
      id: t.id,
      title: t.title,
      posts_count: (t.replies || 0) + 1,
      reply_count: t.replies || 0,
      created_at: t.created ? new Date(t.created * 1000).toISOString() : "",
      bumped_at: t.created ? new Date(t.created * 1000).toISOString() : "",
      last_poster_username: t.member?.username || "",
      node_name: t.node?.title || t.node?.name || "",
      v2ex_avatar: t.member?.avatar_normal || t.member?.avatar_large || "",
      posters: [{ user_id: t.id, description: "Original Poster" }]
    }));
  }

  function extractV2exNotificationsFromDoc(doc) {
    if (!doc) return [];
    const topics = [];
    const seen = new Set();
    const cells = doc.querySelectorAll("#Main .cell, #Main .item, #Main li");
    cells.forEach((cell, idx) => {
      const topicLink = [...cell.querySelectorAll("a[href]")].find((a) => /\/t\/\d+/.test(a.getAttribute("href") || ""));
      if (!topicLink) return;
      const rawHref = topicLink.getAttribute("href") || "";
      const match = rawHref.match(/\/t\/(\d+)/);
      const id = match ? Number(match[1]) : 0;
      if (!id) return;
      const target = parseV2exReplyTarget(rawHref);
      const dedupKey = cell.id || `${id}_${target.anchor || ""}_${idx}`;
      if (seen.has(dedupKey)) return;
      seen.add(dedupKey);

      const memberLink = cell.querySelector("a[href^='/member/']");
      const avatar = cell.querySelector("img.avatar")?.getAttribute("src") || "";
      const timeEl = cell.querySelector("[title], .ago, .fade");
      const payloadEl = cell.querySelector(".payload");
      const text = payloadEl?.textContent?.trim() || (cell.textContent || "").replace(/\s+/g, " ").trim();

      topics.push({
        id,
        target_floor: target.floor,
        target_reply_id: target.replyId,
        target_anchor: target.anchor,
        target_page: target.page || (target.floor ? Math.max(1, Math.floor((target.floor - 1) / 100) + 1) : 1),
        title: (topicLink.textContent || "").replace(/\s+/g, " ").trim() || `话题 #${id}`,
        posts_count: target.floor ? target.floor + 1 : 1,
        reply_count: target.floor || 0,
        created_at: timeEl?.getAttribute("title") || timeEl?.textContent?.trim() || "",
        bumped_at: timeEl?.getAttribute("title") || timeEl?.textContent?.trim() || "",
        last_poster_username: memberLink?.textContent?.trim() || "",
        node_name: "通知",
        v2ex_avatar: avatar,
        notification_text: text,
        posters: [{ user_id: id, description: "V2EX notification" }]
      });
    });
    return topics;
  }

  function parseV2exTopicDoc(topicId, doc, page = 1) {
    if (!doc) return null;
    const title = doc.querySelector("#Main .header h1, #Main h1")?.textContent?.trim() || `主题 #${topicId}`;
    const opUsername = doc.querySelector("#Main .header .gray a, #Main .header a[href^='/member/']")?.textContent?.trim() || "楼主";
    const opAvatar = doc.querySelector("#Main .header img.avatar")?.getAttribute("src") || "";
    const opContent = doc.querySelector("#Main .topic_content, #Main .entry-content")?.innerHTML || "<p>（无正文）</p>";
    const opCreated = doc.querySelector("#Main .header .gray")?.textContent?.trim() || "";
    const opNode = doc.querySelector("#Main .header a[href^='/go/']")?.textContent?.trim() || "";

    const opLikesEl = doc.querySelector("#Main .topic_thank, #Main .votes, #Main .header .fade, #Main .topic_buttons .fade");
    let opLikesCount = 0;
    if (opLikesEl && (opLikesEl.textContent.includes("感谢") || opLikesEl.querySelector("img[alt='❤️']"))) {
      opLikesCount = parseInt(opLikesEl.textContent.trim().replace(/\D/g, ""), 10) || 0;
    }

    const opPost = {
      id: Number(topicId),
      post_number: 1,
      floor: 0,
      username: opUsername,
      name: opUsername,
      avatar_template: opAvatar,
      cooked: opContent,
      created_at: opCreated,
      like_count: opLikesCount,
      actions_summary: opLikesCount > 0 ? [{ id: 2, count: opLikesCount }] : []
    };
    const posts = [opPost];

    const replyCells = doc.querySelectorAll("#Main .cell[id^='r_'], #Main div[id^='r_']");
    replyCells.forEach((cell, idx) => {
      const rid = Number(cell.id.replace("r_", "")) || (idx + 2);
      const username = cell.querySelector("a.dark, a[href^='/member/']")?.textContent?.trim() || `用户_${idx + 2}`;
      const avatar = cell.querySelector("img.avatar")?.getAttribute("src") || "";
      const content = cell.querySelector(".reply_content")?.innerHTML || "";
      const timeText = cell.querySelector(".ago, .fade")?.textContent?.trim() || "";
      const likesEl = cell.querySelector(".small.fade") || cell.querySelector("img[alt='❤️']")?.closest(".small, .fade, span");
      const likesCount = likesEl ? parseInt(likesEl.textContent.trim().replace(/\D/g, ""), 10) || 0 : 0;
      const floorEl = cell.querySelector(".no");
      const floorNo = floorEl ? parseInt(floorEl.textContent.trim(), 10) : ((page - 1) * 100 + idx + 1);

      posts.push({
        id: rid,
        floor: floorNo,
        post_number: floorNo + 1,
        username,
        name: username,
        avatar_template: avatar,
        cooked: content,
        created_at: timeText,
        like_count: likesCount,
        actions_summary: likesCount > 0 ? [{ id: 2, count: likesCount }] : []
      });
    });

    // 提取总回复数（例如 "199 replies" 或 "199 条回复"）
    let totalReplies = 0;
    const countMatch = doc.querySelector("#Main .gray, #Main .cell")?.textContent?.match(/(\d+)\s*(?:replies|条回复|回复)/i) ||
      doc.body?.textContent?.match(/(\d+)\s*(?:replies|条回复|回复)/i);
    if (countMatch) {
      totalReplies = Number(countMatch[1]) || 0;
    }

    // 提取分页输入框中的最大页码（例如 <input class="page_input" max="2">）
    const pageInput = doc.querySelector("input.page_input");
    const inputMax = pageInput ? (Number(pageInput.getAttribute("max") || pageInput.max) || 0) : 0;

    // 提取链接中的所有页码（包括 a[href] 和 link[href]，匹配 ?p= 或 /t/:id?p=）
    const pageNumbers = [...doc.querySelectorAll("a[href], link[href]")]
      .map((el) => (el.getAttribute("href") || "").match(/(?:^|[?&])p=(\d+)/))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    const maxP = pageNumbers.length ? Math.max(...pageNumbers) : 0;

    // 下一页按钮（.normal_page_right, [title='Next Page'] 且未包含 .disable_now）
    const nextBtn = doc.querySelector(".normal_page_right, [title='Next Page']");
    const hasNextBtn = Boolean(nextBtn && !nextBtn.classList.contains("disable_now"));

    const totalPages = Math.max(inputMax, maxP, totalReplies > 0 ? Math.ceil(totalReplies / 100) : 0);
    const hasNextPage = (totalPages > page) || hasNextBtn;

    return {
      id: Number(topicId),
      title,
      posts_count: totalReplies > 0 ? (totalReplies + 1) : posts.length,
      total_replies: totalReplies || Math.max(0, posts.length - 1),
      total_pages: totalPages || (hasNextPage ? page + 1 : page),
      node_name: opNode,
      post_stream: {
        posts,
        stream: posts.map((p) => p.id)
      },
      v2ex_page: page,
      v2ex_has_more: hasNextPage
    };
  }

  async function fetchV2exTopicHtml(topicId, signal, page = 1) {
    const path = page > 1 ? `/t/${topicId}?p=${page}` : `/t/${topicId}`;
    const resp = await fetch(path, {
      signal,
      credentials: "same-origin"
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    if (resp.redirected && (resp.url.includes("/signin") || resp.url.includes("/login"))) {
      throw new Error("查看该主题需要先登录 V2EX");
    }
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (doc.querySelector("form[action*='signin']") || (doc.querySelector(".message")?.textContent?.includes("登录"))) {
      const msg = doc.querySelector(".message")?.textContent?.trim() || "查看该主题需要先登录 V2EX";
      throw new Error(msg);
    }
    const parsed = parseV2exTopicDoc(topicId, doc, page);
    if (!parsed || !parsed.posts_count || !parsed.post_stream?.posts?.length) {
      throw new Error(`未能解析主题 #${topicId} 的内容`);
    }
    return parsed;
  }

  function mapV2exTopicApiResponse(topicObj, replies = []) {
    if (!topicObj) return null;
    const opUsername = topicObj.member?.username || "楼主";
    const opAvatar = topicObj.member?.avatar_normal || topicObj.member?.avatar_large || "";
    const opContent = topicObj.content_rendered || (topicObj.content ? `<p>${escapeHtml(topicObj.content)}</p>` : "<p>（无正文）</p>");
    const opCreated = topicObj.created ? new Date(topicObj.created * 1000).toISOString() : "";
    const opNode = topicObj.node?.title || topicObj.node?.name || "";

    const opPost = {
      id: Number(topicObj.id),
      post_number: 1,
      floor: 0,
      username: opUsername,
      name: opUsername,
      avatar_template: opAvatar,
      cooked: opContent,
      created_at: opCreated,
      like_count: 0,
      actions_summary: []
    };
    const posts = [opPost];

    (replies || []).forEach((r, idx) => {
      const rid = Number(r.id) || (idx + 2);
      const username = r.member?.username || `用户_${idx + 2}`;
      const avatar = r.member?.avatar_normal || r.member?.avatar_large || "";
      const content = r.content_rendered || (r.content ? `<p>${escapeHtml(r.content)}</p>` : "");
      const timeText = r.created ? new Date(r.created * 1000).toISOString() : "";
      const likesCount = Number(r.thanks) || 0;
      const floorNo = idx + 1;

      posts.push({
        id: rid,
        floor: floorNo,
        post_number: floorNo + 1,
        username,
        name: username,
        avatar_template: avatar,
        cooked: content,
        created_at: timeText,
        like_count: likesCount,
        actions_summary: likesCount > 0 ? [{ id: 2, count: likesCount }] : []
      });
    });

    return {
      id: Number(topicObj.id),
      title: topicObj.title || `主题 #${topicObj.id}`,
      posts_count: posts.length,
      node_name: topicObj.node?.name || "",
      node_title: opNode,
      post_stream: {
        posts,
        stream: posts.map((p) => p.id)
      },
      v2ex_page: 1,
      v2ex_has_more: false
    };
  }

  async function fetchV2exTopicApi(topicId, signal) {
    const id = Number(topicId);
    const opts = signal ? { signal } : {};
    const [topicRes, repliesRes] = await Promise.all([
      api(`/api/topics/show.json?id=${id}`, opts),
      api(`/api/replies/show.json?topic_id=${id}`, opts).catch(() => [])
    ]);
    const topicObj = Array.isArray(topicRes) ? topicRes[0] : topicRes;
    if (!topicObj || !topicObj.id) {
      throw new Error(`未能获取主题 #${id} 的内容`);
    }
    const replies = Array.isArray(repliesRes) ? repliesRes : [];
    return mapV2exTopicApiResponse(topicObj, replies);
  }

  async function fetchV2exTopicData(topicId, signal, page = 1) {
    try {
      return await fetchV2exTopicHtml(topicId, signal, page);
    } catch (htmlErr) {
      if (htmlErr?.name === "AbortError" || signal?.aborted) throw htmlErr;
      console.warn("[v2ex-wecom] html fetch failed, falling back to JSON API:", htmlErr);
      try {
        return await fetchV2exTopicApi(topicId, signal);
      } catch (apiErr) {
        if (apiErr?.name === "AbortError" || signal?.aborted) throw apiErr;
        throw htmlErr || apiErr;
      }
    }
  }

  async function submitV2exReply(topicId, content) {
    let once = document.querySelector("#Main form input[name='once'], input[name='once']")?.value;
    if (!once) {
      const res = await fetch(`/t/${topicId}`, { credentials: "same-origin" });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      once = doc.querySelector("input[name='once']")?.value;
    }
    if (!once) throw new Error("未能获取 V2EX 发帖 once token，请先登录 V2EX");
    const params = new URLSearchParams();
    params.append("content", content);
    params.append("once", once);
    const postRes = await fetch(`/t/${topicId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      credentials: "same-origin"
    });
    if (!postRes.ok && postRes.status !== 302 && postRes.status !== 200) {
      throw new Error(`回复提交失败 (HTTP ${postRes.status})`);
    }
  }

  function openingPostNumber(topicId, topicData) {
    const route = topicRouteFromPath(location.pathname);
    if (route.topicId && Number(route.topicId) === Number(topicId) && route.postNumber > 0) {
      return route.postNumber;
    }
    const remembered = getRememberedPost(topicId);
    if (remembered > 0) return remembered;
    const fromList = listState.topics.find((topic) => Number(topic.id) === Number(topicId));
    const fromTopic = Number(fromList?.last_read_post_number || topicData?.last_read_post_number) || 0;
    return fromTopic > 0 ? fromTopic : 0;
  }

  async function fetchTopicJson(topicId, postNumber, force, signal, targetPage = 1) {
    const id = Number(topicId);
    if (IS_V2EX) {
      const page = targetPage || 1;
      const cacheKey = `${id}_p${page}`;
      if (!force) {
        const cached = getCachedTopic(cacheKey) || (page === 1 ? getCachedTopic(id) : null);
        if (cached) return cached;
      }
      if (!force && page === 1 && id === INITIAL_V2EX_TOPIC_ID && !initialV2exTopicConsumed &&
          document.querySelector("#Main .topic_content") &&
          topicIdFromPath(location.pathname) === id) {
        const parsed = parseV2exTopicDoc(id, document, 1);
        if (parsed && parsed.posts_count > 0 && (parsed.post_stream?.posts?.length || 0) > 0) {
          initialV2exTopicConsumed = true;
          setCachedTopic(id, parsed);
          setCachedTopic(cacheKey, parsed);
          return parsed;
        }
      }
      const data = await fetchV2exTopicData(id, signal, page);
      if (page === 1) setCachedTopic(id, data);
      setCachedTopic(cacheKey, data);
      return data;
    }

    if (!force) {
      const preloaded = getPreloadedTopic(id);
      if (preloaded && preloaded.id) {
        setCachedTopic(id, preloaded);
        return preloaded;
      }
      const cached = getCachedTopic(id);
      if (cached) return cached;
    }

    const opts = force ? { cache: "no-store" } : {};
    if (signal) opts.signal = signal;
    const n = Number(postNumber) || 0;
    let data = null;
    if (n > 1) {
      try {
        data = await api(`/t/${topicId}/${n}.json`, opts);
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        console.warn("[linuxdo-wecom] failed to load topic at post", n, error);
      }
    }
    if (!data) {
      data = await api(`/t/${topicId}.json`, opts);
    }
    if (data && data.id) {
      setCachedTopic(id, data);
    }
    return data;
  }

  function rememberTopicPost(topicId, postNumber) {
    const id = Number(topicId);
    const n = Number(postNumber) || 0;
    if (!id || n < 1) return;
    const map = readLastReadMap();
    if (Number(map[id]) === n) {
      syncTopicLastReadHref(id, n);
      return;
    }
    map[id] = n;
    const keys = Object.keys(map);
    if (keys.length > LAST_READ_MAX_TOPICS) {
      for (const key of keys.slice(0, keys.length - LAST_READ_MAX_TOPICS)) delete map[key];
    }
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(map));
    } catch { /* ignore quota */ }
    const topic = listState.topics.find((item) => Number(item.id) === id);
    if (topic) topic.last_read_post_number = n;
    syncTopicLastReadHref(id, n);
  }

  function syncTopicLastReadHref(topicId, postNumber) {
    const row = document.querySelector(`.wecom-conv[data-topic-id="${topicId}"]`);
    if (!row) return;
    if (IS_V2EX) {
      const floor = Math.max(0, postNumber - 1);
      const page = floor > 100 ? Math.floor((floor - 1) / 100) + 1 : 1;
      const pagePart = page > 1 ? `?p=${page}` : "";
      const anchorPart = floor > 0 ? `#reply${floor}` : "";
      row.setAttribute("href", `/t/${topicId}${pagePart}${anchorPart}`);
      if (floor > 0) {
        row.dataset.targetFloor = String(floor);
        row.dataset.targetPage = String(page);
        row.dataset.targetAnchor = `reply${floor}`;
      } else {
        delete row.dataset.targetFloor;
        delete row.dataset.targetPage;
        delete row.dataset.targetAnchor;
      }
      return;
    }
    const current = row.getAttribute("href") || "";
    const slug = topicRouteFromPath(current).slug || chatState.slug || "topic";
    const next = postNumber > 1 ? `/t/${slug}/${topicId}/${postNumber}` : `/t/${slug}/${topicId}`;
    if (current !== next) row.setAttribute("href", next);
  }

  function replaceTopicPostUrl(topicId, postNumber) {
    if (IS_V2EX) {
      if (location.pathname !== `/t/${topicId}`) {
        try { history.replaceState(history.state, "", `/t/${topicId}`); } catch { /* ignore */ }
      }
      return;
    }
    const current = topicRouteFromPath(location.pathname);
    if (Number(current.topicId) !== Number(topicId)) return;
    const n = Number(postNumber) || 0;
    if ((current.postNumber || 0) === n || (n <= 1 && current.postNumber <= 1)) return;
    const slug = current.slug || chatState.slug || "topic";
    const path = n > 1 ? `/t/${slug}/${topicId}/${n}` : `/t/${slug}/${topicId}`;
    const next = path + location.search + location.hash;
    if (`${location.pathname}${location.search}${location.hash}` === next) return;
    suppressHistoryApply = true;
    try {
      history.replaceState(history.state, "", next);
    } finally {
      suppressHistoryApply = false;
    }
  }

  function visibleTopicPosts(body) {
    if (!body) return [];
    const rect = body.getBoundingClientRect();
    const posts = [];
    for (const msg of body.querySelectorAll(".wecom-msg[data-post-number]")) {
      const box = msg.getBoundingClientRect();
      if (box.bottom <= rect.top + 8 || box.top >= rect.bottom - 8) continue;
      const number = Number(msg.dataset.postNumber) || 0;
      if (number) posts.push(number);
    }
    return posts;
  }

  function scrollChatToPost(body, postNumber) {
    if (!body || !postNumber) return false;
    let el = body.querySelector(`.wecom-msg[data-post-number="${postNumber}"], .wecom-msg[data-floor="${postNumber - 1}"]`);
    if (!el) {
      const msgs = [...body.querySelectorAll(".wecom-msg[data-post-number]")];
      let closest = null;
      let minDiff = Infinity;
      for (const msg of msgs) {
        const num = Number(msg.dataset.postNumber) || 0;
        if (!num) continue;
        const diff = Math.abs(num - postNumber);
        if (diff < minDiff) {
          minDiff = diff;
          closest = msg;
        }
      }
      el = closest;
    }
    if (!el) return false;
    clearTimeout(replyHighlightTimer);
    highlightedReplyMessage?.classList.remove("is-reply-target");
    highlightedReplyMessage = el;
    el.classList.add("is-reply-target");
    replyHighlightTimer = setTimeout(() => {
      el.classList.remove("is-reply-target");
      if (highlightedReplyMessage === el) highlightedReplyMessage = null;
    }, REPLY_HIGHLIGHT_DURATION_MS);

    const delta = el.getBoundingClientRect().top - body.getBoundingClientRect().top;
    chatState.pinningScroll = true;
    body.scrollTop = Math.max(0, body.scrollTop + delta - 12);
    requestAnimationFrame(() => {
      chatState.pinningScroll = false;
    });
    return true;
  }

  function keepChatAtPost(body, postNumber) {
    if (!body || !postNumber) return;
    chatState.pinnedPost = postNumber;
    chatState.pinningScroll = true;
    const pin = () => {
      if (Number(chatState.pinnedPost) !== Number(postNumber)) return;
      scrollChatToPost(body, postNumber);
    };
    pin();
    const pending = [...body.querySelectorAll("img")].filter((image) => !image.complete);
    pending.forEach((image) => {
      image.addEventListener("load", pin, { once: true });
      image.addEventListener("error", pin, { once: true });
    });
    [50, 160, 400, 800].forEach((delay) => setTimeout(pin, delay));
    setTimeout(() => {
      chatState.pinningScroll = false;
      if (Number(chatState.pinnedPost) === Number(postNumber)) chatState.pinnedPost = 0;
    }, 1000);
  }

  function markPostsOnscreen(postNumbers) {
    const owner = getEmberOwner();
    const screenTrack = owner ? safeLookup(owner, "service:screen-track") : null;
    if (!screenTrack || typeof screenTrack.setOnscreen !== "function") return false;
    try {
      screenTrack.setOnscreen(postNumbers, postNumbers);
      return true;
    } catch {
      return false;
    }
  }

  function reportReadTimings(topicId, postNumbers) {
    if (IS_V2EX || !topicId || !postNumbers.length) return;
    if (markPostsOnscreen(postNumbers)) return;
    const body = new URLSearchParams();
    body.set("topic_id", String(topicId));
    body.set("topic_time", "400");
    for (const number of postNumbers) body.set(`timings[${number}]`, "400");
    fetch("/topics/timings", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-CSRF-Token": csrfToken(),
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: body.toString()
    }).catch(() => {});
  }

  function saveCurrentTopicReadingPosition() {
    if (!chatState.topicId || chatState.pinnedPost || chatState.pinningScroll) return;
    const body = document.querySelector(".wecom-chat-body");
    const visible = visibleTopicPosts(body);
    if (!visible.length) return;
    const isAtBottom = body.scrollHeight - (body.scrollTop + body.clientHeight) <= 16;
    const postNumber = isAtBottom ? visible[visible.length - 1] : visible[0];
    if (!postNumber) return;
    rememberTopicPost(chatState.topicId, postNumber);
    replaceTopicPostUrl(chatState.topicId, postNumber);
  }

  const trackVisibleTopicPost = debounce(() => {
    if (!chatState.topicId || chatState.pinnedPost || chatState.pinningScroll) return;
    const body = document.querySelector(".wecom-chat-body");
    const visible = visibleTopicPosts(body);
    if (!visible.length) return;
    const isAtBottom = body.scrollHeight - (body.scrollTop + body.clientHeight) <= 16;
    const postNumber = isAtBottom ? visible[visible.length - 1] : visible[0];
    if (!postNumber) return;
    rememberTopicPost(chatState.topicId, postNumber);
    replaceTopicPostUrl(chatState.topicId, postNumber);
    reportReadTimings(chatState.topicId, visible);
  }, 200);

  let topicAbortController = null;

  async function loadTopic(topicId, force = false, targetOption = null) {
    const numericTopicId = Number(topicId);
    if (!numericTopicId) return;
    topicId = numericTopicId;
    removeLoadingSliderDom();
    let target = targetOption;
    if (!target && IS_V2EX) {
      target = parseV2exReplyTarget(location.href);
    }
    if (IS_V2EX && (!target || (!target.floor && !target.replyId && !target.anchor))) {
      const remembered = getRememberedPost(topicId);
      if (remembered > 1) {
        const remFloor = remembered - 1;
        const remPage = remFloor > 100 ? Math.floor((remFloor - 1) / 100) + 1 : 1;
        target = {
          floor: remFloor,
          page: remPage,
          replyId: 0,
          anchor: `reply${remFloor}`
        };
      }
    }
    const initialBody = document.querySelector(".wecom-chat-body");
    const hasRenderedMsgs = Boolean(
      initialBody &&
      Number(initialBody.dataset.topicId) === topicId &&
      initialBody.querySelector(".wecom-msg") &&
      !initialBody.querySelector(".wecom-chat-loading, .wecom-chat-error, .wecom-chat-empty")
    );
    if (!force && chatState.loading && Number(chatState.topicId) === topicId) return;
    if (!force && Number(chatState.topicId) === topicId && chatState.renderedLastIdx >= 0 && hasRenderedMsgs) {
      syncListActive();
      return;
    }
    if (topicAbortController) {
      topicAbortController.abort();
      topicAbortController = null;
    }
    const controller = new AbortController();
    topicAbortController = controller;
    const signal = controller.signal;

    const sameTopic = Number(chatState.topicId) === topicId;
    if (!sameTopic) {
      saveCurrentTopicReadingPosition();
      chatState.postsByNumber = new Map();
      chatState.renderedFirstIdx = -1;
      chatState.renderedLastIdx = -1;
      chatState.renderedLastNumber = 0;
      chatState.stream = [];
      chatState.hasOlder = false;
      chatState.hasNewer = false;
      closeEditDialog(true);
    }
    const requestedPost = openingPostNumber(topicId, null);
    chatState.loading = true;
    chatState.topicId = topicId;
    ensureChatPanel();
    if (!sameTopic) switchComposerTopic(topicId);
    const body = document.querySelector(".wecom-chat-body");
    if (body && (!sameTopic || force)) {
      body.dataset.topicId = String(topicId);
      delete body.dataset.state;
      body.innerHTML = `
        <div class="wecom-chat-loading">
          <div class="wecom-chat-spinner"></div>
          <div>加载中…</div>
        </div>`;
    }
    const chatPanel = document.querySelector(".wecom-chat-panel");
    if (chatPanel) chatPanel.dataset.topicId = String(topicId);
    const subEl = document.querySelector(".wecom-chat-sub");
    if (subEl && !sameTopic) subEl.textContent = "加载中…";
    try {
      const targetPage = (IS_V2EX && target && target.page) ? target.page : 1;
      let data = await fetchTopicJson(topicId, requestedPost, force, signal, targetPage);
      if (signal.aborted || Number(chatState.topicId) !== topicId) return; // 路由已切走或已取消
      let openPost = openingPostNumber(topicId, data);
      if (!openPost && target && target.floor) {
        openPost = target.floor + 1;
      }
      if (!requestedPost && openPost > 1 && !((data.post_stream && data.post_stream.posts) || [])
        .some((post) => postNumberOf(post) === openPost)) {
        try {
          data = await fetchTopicJson(topicId, openPost, force, signal);
        } catch (err) {
          if (err?.name === "AbortError") throw err;
          /* 保留首页 */
        }
        if (signal.aborted || Number(chatState.topicId) !== topicId) return;
      }
      const stream = (data.post_stream && data.post_stream.stream) || [];
      const posts = await postsForTopicOpening(
        topicId,
        stream,
        (data.post_stream && data.post_stream.posts) || [],
        openPost,
        signal
      );
      if (signal.aborted || Number(chatState.topicId) !== topicId) return;
      renderPinnedBanner(posts);
      renderMemberPanel(data, posts);
      chatState.stream = stream.length ? stream.slice() : posts.map((post) => post.id);
      chatState.slug = data.slug || chatState.slug || topicRouteFromPath(location.pathname).slug || "";
      const loadedIndexes = posts.map((post) => streamIndexOf(post.id)).filter((index) => index >= 0);
      chatState.renderedFirstIdx = loadedIndexes.length ? Math.min(...loadedIndexes) : 0;
      chatState.renderedLastIdx = loadedIndexes.length ? Math.max(...loadedIndexes) : -1;
      chatState.renderedLastNumber = posts.reduce(
        (max, post) => Math.max(max, Number(post.post_number) || 0),
        0
      );
      chatState.hasOlder = chatState.renderedFirstIdx > 0;
      chatState.v2exPage = Number(data.v2ex_page) || 1;
      chatState.v2exHasMore = Boolean(data.v2ex_has_more);
      chatState.hasNewer = IS_V2EX
        ? chatState.v2exHasMore
        : (chatState.renderedLastIdx >= 0 && chatState.renderedLastIdx < chatState.stream.length - 1);
      chatState.title = data.title || "";
      chatState.categoryId = data.category_id || null;
      setTopicBookmarkState(Boolean(topicBookmarkFrom(data)));
      bindBookmarkEvents();
      recordTopicHistory(data, posts);
      if (listState.listMode === "history") {
        renderHistoryList();
      }

      const panel = document.querySelector(".wecom-chat-panel");
      if (panel) {
        panel.dataset.empty = "0";
        panel.dataset.topicId = String(topicId);
      }
      const title = document.querySelector(".wecom-chat-title");
      const sub = document.querySelector(".wecom-chat-sub");
      const maskDetail = isMaskTitleDetail();
      const displayTitle = maskDetail ? disguiseTitleForTopic({ id: chatState.topicId, title: chatState.title }) : chatState.title;
      if (title) {
        title.textContent = displayTitle;
        title.classList.toggle("is-masked", Boolean(maskDetail));
        title.classList.remove("is-peeking-title");
        title.title = maskDetail ? "" : (chatState.title || "");
      }
      const participants = data.participant_count ||
        (data.details && data.details.participants ? data.details.participants.length : 0);
      const count = document.querySelector(".wecom-chat-count");
      if (count) {
        if (participants) {
          count.style.display = "";
          count.innerHTML = `${ICONS.users}${participants}`;
        } else {
          count.style.display = "none";
          count.textContent = "";
        }
      }
      const replyTotal = (IS_V2EX && data.total_replies != null)
        ? data.total_replies
        : (data.posts_count || posts.length);
      chatState.replyTotal = replyTotal;
      const orgName = IS_V2EX ? (data.node_title || data.node_name || "v2ex.com") : "linux.do";
      if (sub) {
        sub.textContent = maskDetail
          ? `企业内部群 · ${replyTotal} 条消息`
          : `归属于 ${orgName} · ${replyTotal} 条回复`;
      }
      document.title = " ";
      enforceBlankTitle();

      setComposerPlaceholder(displayTitle);

      const chatAvatar = document.querySelector(".wecom-chat-avatar");
      if (chatAvatar) {
        chatAvatar.style.display = "";
        const op = posts.find((p) => p.post_number === 1) || posts[0] || null;
        const authorName = userDisplayName(op, (op && op.username) || chatState.title || "?");
        syncUserCardElement(".wecom-chat-avatar", op);
        if (!isMaskAvatar() && op && op.avatar_template) {
          chatAvatar.style.background = "transparent";
          chatAvatar.innerHTML = `<img src="${escapeHtml(fullAvatarUrl(op.avatar_template))}" alt="" loading="lazy">`;
        } else {
          chatAvatar.style.background = avatarColor(authorName);
          chatAvatar.textContent = avatarLetter(authorName);
        }
      }
      loadCategories().then(() => {
        if (Number(chatState.topicId) !== topicId) return;
        const cat = data.category_id ? categoryById(data.category_id) : null;
        const chipsBox = document.querySelector(".wecom-chat-chips");
        const maskDetail = isMaskTitleDetail();
        if (chipsBox) {
          if (IS_V2EX && data.node_name && !maskDetail) {
            chipsBox.innerHTML = `<a class="wecom-chat-chip" target="_blank" rel="noopener noreferrer" href="/go/${escapeHtml(data.node_name)}"><span class="wecom-nav2-cat-dot" style="background:#1A87FF"></span>${escapeHtml(data.node_title || data.node_name)}</a>`;
          } else {
            chipsBox.innerHTML = (cat && !maskDetail)
              ? `<a class="wecom-chat-chip" target="_blank" rel="noopener noreferrer" href="/c/${escapeHtml(cat.slug)}/${cat.id}"><span class="wecom-nav2-cat-dot" style="background:#${escapeHtml(cat.color || "8F959E")}"></span>${escapeHtml(cat.name)}</a>`
              : "";
          }
        }
        if (sub) {
          if (maskDetail) {
            sub.textContent = `企业内部群 · ${chatState.replyTotal || replyTotal} 条消息`;
          } else if (IS_V2EX) {
            const nodePart = (data.node_title || data.node_name) ? `归属于 ${data.node_title || data.node_name} · ` : "归属于 v2ex.com · ";
            sub.textContent = `${nodePart}${chatState.replyTotal || replyTotal} 条回复`;
          } else if (cat) {
            sub.textContent = `归属于 ${cat.name} · ${chatState.replyTotal || replyTotal} 条回复`;
          }
        }
      });

      if (body && Number(chatState.topicId) === topicId) {
        body.dataset.topicId = String(topicId);
        body.innerHTML = renderBubbles(posts, getCurrentUsername()) ||
          `<div class="wecom-chat-empty">${ICONS.msg}<div>暂无消息</div></div>`;
        hydrateChatImages(body);
        if (IS_V2EX) {
          syncV2exPaginationFooter(body, false);
        }
        syncRenderedWindow(body);
        if (IS_V2EX && target && (target.floor || target.replyId || target.anchor)) {
          const postNum = target.floor ? target.floor + 1 : (openPost || 1);
          rememberTopicPost(topicId, postNum > 0 ? postNum : 1);
          keepChatAtV2exReply(body, target);
        } else if (sameTopic) {
          body.scrollTop = Math.min(body.scrollTop, body.scrollHeight);
        } else if (openPost > 1) {
          rememberTopicPost(topicId, openPost);
          replaceTopicPostUrl(topicId, openPost);
          keepChatAtPost(body, openPost);
        } else {
          body.scrollTop = 0;
          rememberTopicPost(topicId, openPost || 1);
          replaceTopicPostUrl(topicId, openPost || 1);
        }
      }
      syncListActive();
    } catch (err) {
      if (err?.name === "AbortError" || signal.aborted) {
        if (topicAbortController === controller) {
          chatState.loading = false;
        }
        return;
      }
      renderChatError(err);
    } finally {
      if (topicAbortController === controller || !topicAbortController) {
        topicAbortController = null;
        chatState.loading = false;
      }
    }
  }

  function postNumberOf(post) {
    return Number(post?.post_number) || 0;
  }

  function postIdOf(post) {
    const id = post?.id;
    return id == null ? "" : String(id);
  }

  function sortPostsByStream(posts, ids = []) {
    const order = new Map(ids.map((id, index) => [String(id), index]));
    return posts.slice().sort((a, b) => {
      const ai = order.has(postIdOf(a)) ? order.get(postIdOf(a)) : Number.MAX_SAFE_INTEGER;
      const bi = order.has(postIdOf(b)) ? order.get(postIdOf(b)) : Number.MAX_SAFE_INTEGER;
      return ai - bi || postNumberOf(a) - postNumberOf(b);
    });
  }

  function orderedTopicPosts(posts, stream) {
    return sortPostsByStream(posts, stream);
  }

  function syncRenderedWindow(body) {
    if (!body) return;
    const indexes = new Set();
    let maxNumber = 0;
    for (const message of body.querySelectorAll(".wecom-msg[data-post-number]")) {
      maxNumber = Math.max(maxNumber, Number(message.dataset.postNumber) || 0);
      const index = streamIndexOf(message.dataset.postId);
      if (index >= 0) indexes.add(index);
    }
    if (!indexes.size) {
      chatState.renderedLastNumber = Math.max(chatState.renderedLastNumber, maxNumber);
      return;
    }
    let first = Infinity;
    let last = -1;
    for (const index of indexes) first = Math.min(first, index);
    for (let index = first; indexes.has(index); index += 1) last = index;
    chatState.renderedFirstIdx = first;
    chatState.renderedLastIdx = last;
    chatState.renderedLastNumber = maxNumber;
    if (IS_V2EX) {
      chatState.hasNewer = Boolean(chatState.v2exHasMore);
      chatState.hasOlder = (Number(chatState.v2exPage) > 1 && !chatState.postsByNumber.has(2)) || first > 0;
    } else {
      chatState.hasOlder = first > 0;
      chatState.hasNewer = last < chatState.stream.length - 1;
    }
  }

  function syncV2exPaginationFooter(body, loading = false) {
    if (!IS_V2EX || !body) return;
    let bar = body.querySelector(".wecom-v2ex-more-bar");
    const hasMore = Boolean(chatState.v2exHasMore);
    const currentPage = Number(chatState.v2exPage) || 1;
    const total = chatState.replyTotal || 0;

    if (loading) {
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "wecom-v2ex-more-bar is-loading";
        body.appendChild(bar);
      }
      bar.className = "wecom-v2ex-more-bar is-loading";
      bar.innerHTML = `<div class="wecom-chat-spinner"></div><span>正在加载第 ${currentPage + 1} 页回复…</span>`;
      return;
    }

    if (hasMore) {
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "wecom-v2ex-more-bar";
        body.appendChild(bar);
      }
      bar.className = "wecom-v2ex-more-bar";
      bar.setAttribute("role", "button");
      bar.setAttribute("title", "下滑或点击加载下一页回复");
      bar.innerHTML = `<span>下滑或点击加载下一页 (第 ${currentPage + 1} 页)</span>`;
    } else {
      const renderedCount = body.querySelectorAll(".wecom-msg[data-post-number]").length;
      if (renderedCount > 100 || (total && total > 100)) {
        if (!bar) {
          bar = document.createElement("div");
          bar.className = "wecom-v2ex-more-bar is-end";
          body.appendChild(bar);
        }
        bar.className = "wecom-v2ex-more-bar is-end";
        bar.removeAttribute("role");
        bar.removeAttribute("title");
        bar.innerHTML = `<span>— 已加载全部回复（共 ${total || renderedCount - 1} 条）—</span>`;
      } else if (bar) {
        bar.remove();
      }
    }
  }

  let lastPaginationTime = 0;
  const PAGINATION_THROTTLE_MS = 600;

  /** 向上滚动加载更早的帖子 */
  async function loadOlderPosts() {
    if (chatState.loading || !chatState.topicId) return;
    if (Date.now() < rateLimitCooldownUntil) return;
    if (Date.now() - lastPaginationTime < PAGINATION_THROTTLE_MS) return;
    lastPaginationTime = Date.now();
    if (IS_V2EX) {
      const currentPage = Number(chatState.v2exPage) || 1;
      if (currentPage <= 1 || chatState.postsByNumber.has(2)) return;
      const prevPage = currentPage - 1;
      chatState.loading = true;
      const body = document.querySelector(".wecom-chat-body");
      try {
        const data = await fetchV2exTopicHtml(chatState.topicId, null, prevPage);
        const posts = (data?.post_stream?.posts || []).filter((post) => postNumberOf(post) > 1);
        const fresh = posts.filter((post) => !chatState.postsByNumber.has(postNumberOf(post)));
        if (body && fresh.length) {
          const prevHeight = body.scrollHeight;
          rememberChatPosts(fresh);
          chatState.stream = fresh.map((p) => p.id).concat(chatState.stream);
          const opEl = body.querySelector(".wecom-msg[data-post-number='1']");
          const html = renderBubbles(fresh, getCurrentUsername());
          if (opEl && opEl.nextSibling) {
            opEl.insertAdjacentHTML("afterend", html);
          } else if (opEl) {
            body.insertAdjacentHTML("beforeend", html);
          } else {
            body.insertAdjacentHTML("afterbegin", html);
          }
          hydrateChatImages(body);
          body.scrollTop += body.scrollHeight - prevHeight;
          chatState.v2exPage = prevPage;
          syncRenderedWindow(body);
        }
      } catch (err) {
        console.warn("[v2ex-wecom] loadOlderPosts failed:", err);
      } finally {
        chatState.loading = false;
      }
      return;
    }
    if (!chatState.hasOlder) return;
    const ids = chatState.stream.slice(Math.max(0, chatState.renderedFirstIdx - 20), chatState.renderedFirstIdx);
    if (!ids.length) return;
    chatState.loading = true;
    const body = document.querySelector(".wecom-chat-body");
    try {
      const qs = ids.map((id) => `post_ids[]=${id}`).join("&");
      const data = await api(`/t/${chatState.topicId}/posts.json?${qs}`);
      const posts = sortPostsByStream(
        (data.post_stream && data.post_stream.posts) || data.posts || [],
        ids
      );
      if (body && posts.length) {
        const prevHeight = body.scrollHeight;
        body.insertAdjacentHTML("afterbegin", renderBubbles(posts, getCurrentUsername()));
        hydrateChatImages(body);
        body.scrollTop += body.scrollHeight - prevHeight;
        syncRenderedWindow(body);
      }
    } catch { /* 保留现状 */ } finally {
      chatState.loading = false;
    }
  }

  /** 向下滚动加载更新的帖子（话题很长时不能只留首屏一页） */
  async function loadNewerPosts() {
    if (chatState.loading || !chatState.topicId) return;
    if (IS_V2EX) {
      if (!chatState.v2exHasMore) return;
    } else {
      if (!chatState.hasNewer) return;
    }
    if (Date.now() < rateLimitCooldownUntil) return;
    if (Date.now() - lastPaginationTime < PAGINATION_THROTTLE_MS) return;
    lastPaginationTime = Date.now();
    if (IS_V2EX) {
      const body = document.querySelector(".wecom-chat-body");
      const nextPage = (Number(chatState.v2exPage) || 1) + 1;
      chatState.loading = true;
      syncV2exPaginationFooter(body, true);
      try {
        const data = await fetchV2exTopicHtml(chatState.topicId, null, nextPage);
        const posts = (data?.post_stream?.posts || []).filter((post) => postNumberOf(post) > 1);
        const fresh = posts.filter((post) => !chatState.postsByNumber.has(postNumberOf(post)));
        if (fresh.length) {
          chatState.stream = chatState.stream.concat(fresh.map((post) => post.id));
          appendFreshPosts(fresh, body, { scroll: false });
        }
        chatState.v2exPage = nextPage;
        chatState.v2exHasMore = Boolean(data?.v2ex_has_more) && posts.length > 0;
        chatState.hasNewer = chatState.v2exHasMore;
        setCachedTopic(`${chatState.topicId}_p${nextPage}`, data);
      } catch (err) {
        console.warn("[v2ex-wecom] loadNewerPosts failed:", err);
      } finally {
        chatState.loading = false;
        syncV2exPaginationFooter(body, false);
      }
      return;
    }
    const start = chatState.renderedLastIdx + 1;
    if (start <= 0 || start >= chatState.stream.length) {
      chatState.hasNewer = false;
      return;
    }
    const ids = chatState.stream.slice(start, start + 20);
    if (!ids.length) {
      chatState.hasNewer = false;
      return;
    }
    chatState.loading = true;
    const body = document.querySelector(".wecom-chat-body");
    try {
      const qs = ids.map((id) => `post_ids[]=${id}`).join("&");
      const data = await api(`/t/${chatState.topicId}/posts.json?${qs}`);
      const posts = sortPostsByStream(
        (data.post_stream && data.post_stream.posts) || data.posts || [],
        ids
      );
      // 用户滚动触底触发分页时，保留当前位置，避免追加后再次自动触底。
      appendFreshPosts(posts, body, { scroll: false });
    } catch { /* 保留现状 */ } finally {
      chatState.loading = false;
    }
  }

  function streamIndexOf(id) {
    if (id == null) return -1;
    return chatState.stream.findIndex((candidate) => String(candidate) === String(id));
  }

  function appendFreshPosts(posts, body, options = {}) {
    if (!body || !Array.isArray(posts) || !posts.length) return 0;
    if (body.dataset.topicId && chatState.topicId && Number(body.dataset.topicId) !== Number(chatState.topicId)) {
      return 0;
    }
    rememberChatPosts(posts);
    syncRenderedReplyReferences(posts, body);
    const renderedNumbers = new Set(
      [...body.querySelectorAll(".wecom-msg[data-post-number]")]
        .map((node) => Number(node.dataset.postNumber))
        .filter((number) => number > 0)
    );
    const fresh = posts
      .filter((post) => {
        const number = postNumberOf(post);
        return number > 0 && !renderedNumbers.has(number);
      })
      .sort((a, b) => postNumberOf(a) - postNumberOf(b));
    if (!fresh.length) {
      syncRenderedWindow(body);
      return 0;
    }

    const prevScrollTop = body.scrollTop;
    const prevScrollHeight = body.scrollHeight;
    // 判定用户此前是否已经在最底部附近（32px 以内），以此判断是否应该跟随最新回复
    const wasNearBottom = body.clientHeight > 0 && (prevScrollHeight - (prevScrollTop + body.clientHeight) <= 32);

    body.querySelector(".wecom-chat-empty")?.remove();
    const currentMax = Math.max(...renderedNumbers, 0);
    const moreBar = body.querySelector(".wecom-v2ex-more-bar");
    let insertedAbove = false;

    if (fresh.every((post) => postNumberOf(post) > currentMax)) {
      if (moreBar) {
        moreBar.insertAdjacentHTML("beforebegin", renderBubbles(fresh, getCurrentUsername()));
      } else {
        body.insertAdjacentHTML("beforeend", renderBubbles(fresh, getCurrentUsername()));
      }
    } else {
      for (const post of fresh) {
        const target = [...body.querySelectorAll(".wecom-msg[data-post-number]")]
          .find((node) => Number(node.dataset.postNumber) > postNumberOf(post));
        const html = bubbleHtml(post, getCurrentUsername());
        if (target) {
          target.insertAdjacentHTML("beforebegin", html);
          if (target.offsetTop <= prevScrollTop + body.clientHeight) {
            insertedAbove = true;
          }
        } else if (moreBar) {
          moreBar.insertAdjacentHTML("beforebegin", html);
        } else {
          body.insertAdjacentHTML("beforeend", html);
        }
      }
    }
    hydrateChatImages(body);
    syncRenderedWindow(body);

    // 仅当用户主动发帖（options.scroll === true）或此前已在最底部跟随时滚动至底部；
    // 用户在浏览上方历史楼层时，绝对禁止自动跳跃到底部，保护阅读进度与体验。
    const shouldScroll = options.scroll === true || (options.scroll !== false && wasNearBottom);
    if (shouldScroll) {
      body.scrollTop = body.scrollHeight;
    } else if (insertedAbove && !wasNearBottom) {
      const heightDiff = body.scrollHeight - prevScrollHeight;
      if (heightDiff > 0) {
        body.scrollTop = prevScrollTop + heightDiff;
      }
    }
    return fresh.length;
  }

  function nativeTopicPostElements() {
    const selectors = [
      ".post-stream article.topic-post",
      "#main-outlet article.topic-post",
      ".post-stream .topic-post[data-post-number]",
      "#main-outlet .topic-post[data-post-number]",
      ".post-stream article[data-post-number]",
      "#main-outlet article[data-post-number]"
    ];
    const elements = new Set();
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => elements.add(element));
    }
    return [...elements].filter((element) => {
      const parent = element.parentElement?.closest("article.topic-post, .topic-post[data-post-number]");
      return !parent || parent === element;
    });
  }

  function nativePostIdentity(article) {
    const postArticle = nativePostArticle(article);
    const author = article.querySelector(
      ".topic-meta-data a[href*='/u/'], .names a[href*='/u/'], " +
      ".topic-meta-data [data-user-card], .names [data-user-card], " +
      "a[data-user-card], [data-username]"
    );
    const username = usernameFromElement(author);
    const id = userIdFromElement(postArticle) || userIdFromElement(author);
    const fullName = article.querySelector(
      ".topic-meta-data .full-name, .names .full-name"
    )?.textContent?.trim() || author?.textContent?.trim() || username || "?";
    return { username: username || "", id, name: fullName };
  }

  function nativePostArticle(element) {
    if (element.matches("article[data-post-id]")) return element;
    return element.querySelector("article[data-post-id]") || element;
  }

  function nativePostIsMine(article, author, identity) {
    const postArticle = nativePostArticle(article);
    if (article.classList.contains("current-user-post") || postArticle.classList.contains("current-user-post")) return true;
    const articleFlag = article.getAttribute("data-current-user-post");
    if (booleanFlag(articleFlag)) return true;
    const authorId = author.id || userIdFromElement(postArticle);
    if (authorId && identity.id && authorId === identity.id) return true;
    return Boolean(author.username && identity.username &&
      normalizeUsername(author.username) === normalizeUsername(identity.username));
  }

  function nativeDomTopicId(article) {
    if (article) {
      const postArticle = nativePostArticle(article);
      const direct = Number(postArticle?.dataset?.topicId || article?.dataset?.topicId || 0);
      if (direct > 0) return direct;
      const closestContainer = article.closest("[data-topic-id]");
      if (closestContainer?.dataset?.topicId) {
        const fromClosest = Number(closestContainer.dataset.topicId);
        if (fromClosest > 0) return fromClosest;
      }
    }
    const topicContainer = document.querySelector("#topic[data-topic-id], .container.posts[data-topic-id]");
    if (topicContainer?.dataset?.topicId) {
      const fromContainer = Number(topicContainer.dataset.topicId);
      if (fromContainer > 0) return fromContainer;
    }
    try {
      const emberOwner = getEmberOwner();
      const topicCtrl = emberOwner ? safeLookup(emberOwner, "controller:topic") : null;
      const modelId = Number(topicCtrl?.get?.("model.id") || topicCtrl?.model?.id || 0);
      if (modelId > 0) return modelId;
    } catch { /* ignore */ }
    return 0;
  }

  /** 发帖后：原生隐藏流里出现的新帖 → 追加为气泡 */
  function syncNewPostsFromDom() {
    if (IS_V2EX || !chatState.topicId) return 0;
    const body = document.querySelector(".wecom-chat-body");
    if (!body || body.querySelector(".wecom-chat-loading")) return 0;
    if (body.dataset.topicId && Number(body.dataset.topicId) !== Number(chatState.topicId)) return 0;

    const nativeTopicId = nativeDomTopicId(null);
    if (nativeTopicId && nativeTopicId !== Number(chatState.topicId)) {
      // 原生 DOM 容器当前属于其他话题，绝对不跨话题注入回复！
      return 0;
    }

    const articles = nativeTopicPostElements();
    if (!articles.length) return 0;
    const current = getCurrentUserIdentity();
    const posts = [];
    for (const article of articles) {
      const number = Number(
        article.dataset.postNumber || (article.id || "").replace("post_", "")
      );
      if (!number || number <= chatState.renderedLastNumber) continue;
      const postArticle = nativePostArticle(article);
      const articleTopicId = nativeDomTopicId(article);
      if (!articleTopicId || articleTopicId !== Number(chatState.topicId)) continue;
      const cooked = article.querySelector(".cooked");
      if (!cooked) continue;
      const author = nativePostIdentity(article);
      const avatarImg = article.querySelector(".topic-avatar img, .post-avatar img");
      const timeEl = article.querySelector(".post-info .relative-date, .relative-date");
      const username = author.username || "?";
      const mine = nativePostIsMine(article, author, current);
      const post = {
        id: Number(postArticle.dataset.postId || article.dataset.postIdValue) || undefined,
        post_number: number,
        username,
        name: author.name,
        avatar_template: avatarImg?.currentSrc || avatarImg?.src || "",
        cooked: cooked.innerHTML,
        created_at: (timeEl && (timeEl.getAttribute("title") || timeEl.dataset.time)) || new Date().toISOString(),
        yours: mine
      };
      posts.push(post);
    }
    return appendFreshPosts(posts, body);
  }

  function scheduleSubmittedPostSync(topicId) {
    for (const delayMs of POST_SYNC_RETRY_DELAYS_MS) {
      setTimeout(() => {
        if (chatState.topicId === topicId) syncNewPostsFromDom();
      }, delayMs);
    }
  }

  function updateReplySummary(data) {
    const sub = document.querySelector(".wecom-chat-sub");
    if (!sub) return;
    const stream = data?.post_stream?.stream || [];
    const total = Number(data?.posts_count) || stream.length;
    if (!total) return;
    chatState.replyTotal = total;
    const current = sub.textContent.trim();
    const prefix = current.split(" · ")[0] || "归属于 linux.do";
    sub.textContent = `${prefix} · ${total} 条回复`;
  }

  function setRefreshedStream(stream, body) {
    if (!Array.isArray(stream) || !stream.length) return [];
    const previousStream = chatState.stream;
    const previousLastId = previousStream[chatState.renderedLastIdx];
    const anchor = previousLastId == null
      ? -1
      : stream.findIndex((id) => String(id) === String(previousLastId));
    chatState.stream = stream.slice();
    if (body) syncRenderedWindow(body);
    if (!body || chatState.renderedLastIdx < 0) {
      chatState.renderedLastIdx = anchor >= 0 ? anchor : Math.min(chatState.renderedLastIdx, stream.length - 1);
    }
    chatState.hasNewer = chatState.renderedLastIdx < stream.length - 1;
    return stream.slice(Math.max(0, chatState.renderedLastIdx + 1), chatState.renderedLastIdx + 1 + POST_SYNC_BATCH_SIZE);
  }

  async function loadSubmittedTail(topicId, ids, loadedIds, body) {
    const missing = ids.filter((id) => !loadedIds.has(String(id)));
    if (!missing.length) return 0;
    const posts = sortPostsByStream(await fetchPostsByIds(topicId, missing), missing);
    return appendFreshPosts(posts, body);
  }

  async function refreshTopicOnce(topicId) {
    const data = await api(`/t/${topicId}.json`, { cache: "no-store" });
    if (chatState.topicId !== topicId) return;
    const body = document.querySelector(".wecom-chat-body");
    const stream = data?.post_stream?.stream || [];
    const posts = data?.post_stream?.posts || data?.posts || [];
    const tailIds = setRefreshedStream(stream, body);
    let appended = appendFreshPosts(posts, body);
    const loadedIds = new Set(posts.map((post) => post?.id).filter(Boolean).map(String));
    appended += await loadSubmittedTail(topicId, tailIds, loadedIds, body);
    if (chatState.topicId === topicId) {
      chatState.hasNewer = chatState.renderedLastIdx < chatState.stream.length - 1;
      updateReplySummary(data);
      appended += syncNewPostsFromDom();
    }
    return appended;
  }

  async function refreshTopicAfterSubmission(topicId) {
    if (!topicId || chatState.topicId !== topicId) return;
    await delay(COMPOSER_INPUT_SETTLE_MS);
    let lastError = null;
    for (const delayMs of POST_SYNC_RETRY_DELAYS_MS) {
      if (delayMs) await delay(delayMs);
      if (chatState.topicId !== topicId) return;
      try {
        if (await refreshTopicOnce(topicId)) return;
      } catch (error) {
        lastError = error;
        console.error("[linuxdo-wecom] submitted post refresh attempt failed", error);
      }
    }
    if (lastError) throw lastError;
  }

  /* ============================== 原生视图切换 ============================== */

  function toggleViewModeByShortcut() {
    if (otherThemeActive()) return;
    if (getViewMode() === "native") {
      setViewMode("im");
      location.reload();
    } else {
      openNativeTopicView();
    }
  }

  function bindViewModeShortcut() {
    if (window.__wecomViewModeShortcutBound) return;
    window.__wecomViewModeShortcutBound = true;
    window.addEventListener("keydown", (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const key = (e.key || "").toLowerCase();
      const code = e.code || "";
      if (key === "w" || key === "o" || code === "KeyW" || code === "KeyO") {
        e.preventDefault();
        e.stopPropagation();
        toggleViewModeByShortcut();
      }
    }, true);
  }

  function ensureModeFab() {
    let fab = document.querySelector(".wecom-mode-fab");
    if (getViewMode() !== "native") {
      fab?.remove();
      return;
    }
    if (fab) return;
    fab = document.createElement("button");
    fab.className = "wecom-mode-fab";
    fab.title = "切回企业微信 IM 视图 (快捷键: Alt+W / Alt+O)";
    fab.setAttribute("aria-label", "切回企业微信 IM 视图");
    fab.innerHTML = ICONS.chat;
    fab.addEventListener("click", () => {
      setViewMode("im");
      location.reload();
    });
    document.body.appendChild(fab);
  }

  /* ============================== 编排 ============================== */

  function ensureWcoManifest() {
    try {
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink && manifestLink.dataset.wecomWco === "1") return;
      const manifestData = {
        name: "Linux DO",
        short_name: "Linux DO",
        start_url: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        theme_color: isDarkMode() ? "#2B2D31" : "#F7F8FA",
        background_color: isDarkMode() ? "#1E1F22" : "#FFFFFF",
        icons: [
          {
            src: "https://linux.do/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon"
          }
        ]
      };
      const blob = new Blob([JSON.stringify(manifestData)], { type: "application/manifest+json" });
      const manifestUrl = URL.createObjectURL(blob);
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        document.head?.appendChild(manifestLink);
      }
      manifestLink.dataset.wecomWco = "1";
      manifestLink.href = manifestUrl;
    } catch {
      /* ignore */
    }
  }

  function setupWindowControlsOverlay() {
    ensureWcoManifest();
    if (window.__wecomWcoBound) return;
    window.__wecomWcoBound = true;

    const updateWcoState = () => {
      const isWco = Boolean(
        navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible
      );
      document.documentElement.classList.toggle("wecom-wco-active", isWco);
      if (isWco && navigator.windowControlsOverlay.getTitlebarAreaRect) {
        const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
        document.documentElement.style.setProperty("--wc-titlebar-width", `${rect.width}px`);
        document.documentElement.style.setProperty("--wc-titlebar-height", `${rect.height}px`);
      } else {
        document.documentElement.style.removeProperty("--wc-titlebar-width");
        document.documentElement.style.removeProperty("--wc-titlebar-height");
      }
    };

    if (navigator.windowControlsOverlay) {
      navigator.windowControlsOverlay.addEventListener("geometrychange", updateWcoState);
      updateWcoState();
    }
  }

  function removePanels() {
    closeNotifMenu();
    closeImageViewer();
    closeEditDialog(true);
    closeOfficialEmojiPicker();
    closeV2exEmojiPicker();
    document.documentElement.classList.remove("wecom-members-open", "wecom-composing-new", "wecom-mask-composing");
    document.querySelector(".wecom-list-panel")?.remove();
    document.querySelector(".wecom-chat-panel")?.remove();
    document.querySelector(".wecom-member-panel")?.remove();
    document.querySelector(".wecom-rail")?.remove();
    document.querySelector(".wecom-rail-resizer")?.remove();
    document.querySelector(".wecom-list-resizer")?.remove();
    document.querySelector(".wecom-strip")?.remove();
    document.querySelector(".wecom-titlebar")?.remove();
    document.querySelector(".wecom-theme-menu")?.remove();
    document.querySelector(".wecom-update-notice")?.remove();
    document.querySelector(".wecom-edit-dialog")?.remove();
  }

  let initialNewTopicChecked = false;
  function checkInitialNewTopicParam() {
    if (initialNewTopicChecked || IS_V2EX) return;
    initialNewTopicChecked = true;
    try {
      if (new URLSearchParams(location.search).get("create_topic") === "true") {
        setTimeout(openNewTopic, 600);
      }
    } catch { /* ignore */ }
  }

  function applyTheme() {
    if (otherThemeActive()) {
      console.warn("[linuxdo-wecom] 检测到 IDEA / 飞书 / 钉钉主题脚本已启用，企业微信主题自动避让。请只保留其中一个。");
      document.documentElement.classList.remove(ROOT_CLASS, LOCK_CLASS, "wecom-topic-open", "wecom-dark");
      document.body?.classList.remove("wecom-dark");
      removePanels();
      return;
    }

    // 只要本脚本在跑（含切回原生布局），同步当前颜色模式。
    applySiteColorMode();

    if (getViewMode() === "native") {
      document.documentElement.classList.remove(ROOT_CLASS, LOCK_CLASS, "wecom-topic-open");
      removePanels();
      ensureModeFab();
      return;
    }

    injectStyle();
    document.documentElement.classList.add(ROOT_CLASS);
    document.documentElement.classList.toggle("wecom-nav2-open", isNav2Open());
    document.documentElement.classList.toggle("wecom-hide-boost", !isBoostEnabled());
    document.documentElement.classList.toggle("wecom-hide-chat-avatar", isHideChatAvatar());
    applyImageAutoLayoutSizeCss(getImageAutoLayoutSize());
    setupWindowControlsOverlay();
    disablePageLoadingIndicator();
    removeLoadingSliderDom();
    restyleSplash();
    makeFavicon();
    enforceBlankTitle();
    ensureModeFab();
    if (!document.body) return;

    ensureRail();
    ensureStrip();
    ensureRailResizer();
    applyRailWidth(getRailWidth());

    const pathname = location.pathname;
    const isTopic = isTopicPath(pathname);
    const isHome = isHomePath(pathname);
    const supported = isTopic || isHome;

    document.documentElement.classList.toggle(LOCK_CLASS, supported);
    document.documentElement.classList.toggle("wecom-topic-open", isTopic);

    if (!supported) {
      // rail 常驻，展开栏为原生侧栏；仅移除中右栏
      document.querySelector(".wecom-list-panel")?.remove();
      document.querySelector(".wecom-chat-panel")?.remove();
      document.querySelector(".wecom-member-panel")?.remove();
      document.querySelector(".wecom-list-resizer")?.remove();
      document.documentElement.classList.remove("wecom-members-open");
      return;
    }

    ensureListPanel();
    ensureChatPanel();
    ensureListResizer();
    applyListWidth(getListWidth());
    syncListNav();

    if (isTopic) {
      // 进帖子：保留当前会话列表，只更新选中态 + 加载右栏
      if (listState.topics.length && listState.apiPath) {
        syncListActive();
      } else {
        loadList(listState.apiPath || (IS_V2EX ? "/?tab=all" : "/latest.json"), false);
      }
      const targetTopicId = topicIdFromPath(pathname);
      if (targetTopicId) {
        if (Number(chatState.topicId) === Number(targetTopicId) && chatState.loading) {
          // 当前话题正在加载中，避免重复触发 loadTopic 并打断请求
        } else {
          loadTopic(targetTopicId);
        }
      }
      syncNewPostsFromDom();
    } else {
      loadList(listApiForPath(pathname, location.search), false);
      renderChatEmpty();
    }
    syncListActive();
    checkInitialNewTopicParam();
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyTheme();
    });
  }

  const scheduleSyncNewPosts = debounce(syncNewPostsFromDom, 600);

  function isEditableTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (target.getAttribute("type") || "text").toLowerCase();
      const nonTextTypes = ["button", "submit", "reset", "checkbox", "radio", "range", "color", "image", "file"];
      return !nonTextTypes.includes(type);
    }
    if (target.isContentEditable || (typeof target.closest === "function" && target.closest("[contenteditable='true']"))) {
      return true;
    }
    return false;
  }

  function isModalOrViewerOpen() {
    return Boolean(
      document.querySelector(
        ".wecom-image-viewer:not([hidden]), .wecom-edit-dialog:not([hidden]), .wecom-watermark-dialog:not([hidden]), .wecom-boost-popover:not([hidden]), .wecom-base64-popover:not([hidden]), .wecom-v2ex-emoji-picker:not([hidden]), .dialog-holder, #discourse-modal-container .modal.show, #discourse-modal-container .modal.in, .d-modal"
      )
    );
  }

  function handleChatNavigationKeydown(event) {
    const isHome = event.key === "Home" || event.keyCode === 36;
    const isEnd = event.key === "End" || event.keyCode === 35;
    if (!isHome && !isEnd) return;
    if (event.altKey || event.metaKey || event.shiftKey) return;
    if (getViewMode() === "native" || otherThemeActive()) return;
    if (isEditableTarget(event.target)) return;
    if (isModalOrViewerOpen()) return;
    if (!chatState.topicId || !document.documentElement.classList.contains("wecom-topic-open")) return;

    const chatBody = document.querySelector(".wecom-chat-body, .wecom-chat-messages");
    if (!chatBody) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    if (isHome) {
      chatBody.scrollTo({ top: 0, behavior: "smooth" });
      if (chatBody.scrollTop <= 30 && chatState.hasOlder && !chatState.loading) {
        loadOlderPosts();
      }
    } else if (isEnd) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      if (chatState.hasNewer && !chatState.loading) {
        loadNewerPosts();
      }
    }
  }

  function bootstrap() {
    if (!document.documentElement) {
      setTimeout(bootstrap, 0);
      return;
    }
    injectStyle();
    if (!otherThemeActive()) {
      // document-start 尽早应用用户选择，减少主题闪烁。
      applySiteColorMode();
    }
    if (getViewMode() !== "native" && !otherThemeActive()) {
      document.documentElement.classList.add(ROOT_CLASS);
      document.documentElement.classList.toggle("wecom-hide-boost", !isBoostEnabled());
      document.documentElement.classList.toggle("wecom-hide-chat-avatar", isHideChatAvatar());
      restyleSplash();
      makeFavicon(); // document-start 尽早换标，减少未聚焦标签仍显示原 icon
      setupTitleGuard(); // document-start 守护标题为空白，彻底隐藏详情页标题
      setupWindowControlsOverlay();
    }

    // 标签重新可见时再刷一次（部分浏览器未聚焦时会缓存旧 favicon 与 title）
    if (!window.__wecomFaviconVisibilityBound) {
      window.__wecomFaviconVisibilityBound = true;
      window.addEventListener("focus", () => {
        if (getViewMode() !== "native" && !otherThemeActive()) {
          makeFavicon();
          enforceBlankTitle();
        }
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && getViewMode() !== "native" && !otherThemeActive()) {
          makeFavicon();
          enforceBlankTitle();
        }
      });
    }

    const WECOM_UI_SEL = ".wecom-list-panel, .wecom-chat-panel, .wecom-member-panel, .wecom-image-viewer, .wecom-edit-dialog, .wecom-rail, .wecom-strip, .wecom-titlebar, .wecom-mode-fab, .wecom-theme-menu, .wecom-update-notice, #linuxdo-wecom-theme";
    const NATIVE_BRIDGE_SEL = "#reply-control, .dialog-holder, .dialog-container, #discourse-modal-container, .d-modal, .bootbox, .autocomplete, .autocomplete-container, .d-editor-popup, [data-identifier='emoji-picker'], .tag-chooser";
    const observer = new MutationObserver((mutations) => {
      // 忽略我们自己面板内部的 DOM 变动，否则点开筛选会立刻触发 applyTheme 回写/闪断
      const external = mutations.some((m) => {
        const t = m.target;
        if (!(t instanceof Element) && !(t instanceof CharacterData)) return true;
        const el = t instanceof Element ? t : t.parentElement;
        if (!el) return true;
        if (el.closest(WECOM_UI_SEL) || el.closest(NATIVE_BRIDGE_SEL)) return false;
        if (el.id === "linuxdo-wecom-theme") return false;
        return true;
      });
      if (external) {
        removeLoadingSliderDom();
        scheduleApply();
        scheduleSyncNewPosts();
      }
      scheduleSyncChatBadge();
    });
    disablePageLoadingIndicator();
    removeLoadingSliderDom();
    observer.observe(document.documentElement, { childList: true, subtree: true });

    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      history[method] = function (...args) {
        const result = original.apply(this, args);
        if (!suppressHistoryApply) scheduleApply();
        return result;
      };
    }
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("hashchange", scheduleApply);
    window.addEventListener("beforeunload", saveCurrentTopicReadingPosition);
    document.addEventListener("DOMContentLoaded", scheduleApply, { once: true });
    document.addEventListener("turbo:load", scheduleApply);
    document.addEventListener("page:changed", scheduleApply);
    scheduleScriptUpdateCheck();

    // 在 window 捕获阶段截断站点快捷键，避免 #/@/Ctrl+K 等按键打开原生弹窗。
    if (!window.__wecomComposerShortcutGuardBound) {
      window.__wecomComposerShortcutGuardBound = true;
      window.addEventListener("keydown", guardComposerShortcut, true);
    }
    // 在 window 捕获阶段拦截 Home / End 键：在对话详情中仅平滑滚动消息体，防止列表被动滚动或误触穿透点开
    if (!window.__wecomHomeKeyNavBound) {
      window.__wecomHomeKeyNavBound = true;
      window.addEventListener("keydown", handleChatNavigationKeydown, true);
    }
    // 划词自动解码 Base64 字符串
    bindBase64Selection();
    // V2EX 内置表情选择器外部点击与快捷键监听
    bindV2exEmojiPickerEvents();
    // 快捷键 Alt+W / Alt+O：在企微 IM 视图与原站风格间快速切换
    bindViewModeShortcut();
    // 定时同步头像通知角标与新主题角标（3 秒轮询）
    if (!window.__wecomNotifBadgeTimer) {
      window.__wecomNotifBadgeTimer = setInterval(() => {
        if (getViewMode() === "native" || otherThemeActive()) return;
        if (!document.querySelector(".wecom-rail")) return;
        syncRail();
      }, 3000);
    }

    // ⌘/Ctrl+K → 会话栏搜索（并同步原生 welcome-banner）
    window.addEventListener("keydown", (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if ((e.key || "").toLowerCase() !== "k") return;
      if (getViewMode() === "native" || otherThemeActive()) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "TEXTAREA" || (tag === "INPUT" && e.target.type !== "search")) return;
      e.preventDefault();
      e.stopPropagation();
      const input = document.querySelector(".wecom-list-search input") || getNativeSearchInput();
      if (input) {
        input.focus();
        input.select();
      }
    }, true);

    scheduleApply();
  }

  bootstrap();
})();
