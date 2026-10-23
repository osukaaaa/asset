// ==UserScript==
// @name         dark sea theme
// @namespace    http://tampermonkey.net/
// @author       0_0
// @version      0.1
// @description  dark theme with animated background and fixed icons
// @match        https://pekora.pro/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      pekora.pro
// @connect      tcdn.pekora.pro
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const GIF = 'https://files.catbox.moe/4oxms6.gif';

    const GREETINGS = ['wsp', 'hi', 'yo', 'hey', 'sup', 'hiya', 'ayo', 'howdy', 'heyo'];

    const EXCLUDE = '[class*="gamesContainer-"], [class*="gameCardContainer-"], [class*="gameCardLink-"], [class*="authContainer-"]';

    const SLIDE_DISTANCE = 60;
    const SLIDE_OUT_MS = 160;
    const SLIDE_IN_MS = 450;
    const SLIDE_BLUR = 8;

    GM_addStyle(`
        html {
            background-color: #e3e3e3 !important;
        }

        body {
            overflow-x: clip !important;
        }

        :where(body, body *:not(#gif-bg-layer)) {
            background-color: transparent !important;
        }

        #gif-bg-layer {
            position: fixed;
            inset: 0;
            z-index: -1;
            pointer-events: none;
            background-image: url("${GIF}");
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
        }

        @keyframes cardZoomIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
        }

        a[class*="gameCardLink-"] {
            animation: cardZoomIn 0.4s ease backwards;
        }

        a[class*="gameCardLink-"] {
            transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease !important;
            will-change: transform;
        }

        a[class*="gameCardLink-"]:hover {
            transform: translateY(-6px) scale(1.04) !important;
            box-shadow: 0 10px 24px rgba(255, 255, 255, 0.25) !important;
            filter: brightness(1.1) !important;
            z-index: 2;
        }

        a[class*="gameCardLink-"]:active {
            transform: translateY(-2px) scale(1.01) !important;
        }

        [class*="linkEntry-"] > span[class*="icon-"] {
            transition: transform 0.2s ease !important;
            transform-origin: center center;
        }

        a[class*="link-"]:hover [class*="linkEntry-"] > span[class*="icon-"] {
            transform: scale(1.25) !important;
        }

        [class*="goForward-"],
        [class*="goBack-"] {
            cursor: pointer;
            user-select: none;
        }

        @media (prefers-reduced-motion: reduce) {
            a[class*="gameCardLink-"],
            a[class*="gameCardLink-"]:hover,
            a[class*="gameCardLink-"]:active,
            [class*="linkEntry-"] > span[class*="icon-"],
            a[class*="link-"]:hover [class*="linkEntry-"] > span[class*="icon-"] {
                animation: none !important;
                transition: none !important;
                transform: none !important;
            }
        }

        button[class*="seeAllButton-"],
        [class*="upgradeNowButton-"],
        [class*="buttonShared-"],
        [class*="acceptButton-"] {
            background-color: #808080 !important;
            background-image: none !important;
            border-color: #808080 !important;
        }

        button[class*="seeAllButton-"]:hover,
        [class*="upgradeNowButton-"]:hover,
        [class*="buttonShared-"]:hover,
        [class*="acceptButton-"]:hover {
            background-color: #6b6b6b !important;
            border-color: #6b6b6b !important;
        }

        a[class*="imgDesktop-"],
        a[class*="imgMobile-"] {
            filter: brightness(0) invert(0.5) !important;
        }

        html, body, body *,
        body *::before,
        body *::after {
            color: #fff !important;
            -webkit-text-fill-color: #fff !important;
            text-decoration-color: #fff !important;
        }

        svg text,
        svg tspan {
            fill: #fff !important;
        }

        ::placeholder {
            color: #fff !important;
            -webkit-text-fill-color: #fff !important;
            opacity: 1 !important;
        }

        option,
        optgroup {
            background-color: #333 !important;
        }

        [class*="linkEntry-"] > span[class*="icon-"],
        [class*="linkEntry-"] > span[class^="icon-nav-"] {
            filter: brightness(0) invert(1) !important;
        }

        span[class*="icon-play"],
        span[class*="smallPlayButton-"] {
            filter: brightness(0) invert(1) !important;
        }

        li.list-item img {
            filter: brightness(0) invert(1) !important;
        }

        li.list-item svg,
        li.list-item svg * {
            fill: #fff !important;
        }

        [class^="alertBg-"],
        [class*=" alertBg-"] {
            display: none !important;
        }

        a[href*="/userads/redirect"],
        img[class*="adImage-"] {
            display: none !important;
        }
    `);

    const addLayer = () => {
        if (document.getElementById('gif-bg-layer')) return;
        const layer = document.createElement('div');
        layer.id = 'gif-bg-layer';
        document.documentElement.appendChild(layer);
    };
    addLayer();

    const chosen = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

    const swapHello = () => {
        document.querySelectorAll('a[class*="helloMessage-"]').forEach(a => {
            for (const node of a.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && /^\s*Hello\b/.test(node.nodeValue)) {
                    node.nodeValue = node.nodeValue.replace(/^(\s*)Hello/, '$1' + chosen);
                    break;
                }
            }
        });
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const busy = new WeakSet();

    const findRow = btn => {
        let box = btn.parentElement;
        for (let i = 0; i < 3 && box; i++, box = box.parentElement) {
            const row = box.querySelector('[class*="gameRow-"]');
            if (row) return { row, box };
        }
        return null;
    };

    const slideRow = (row, box, dir) => {
        if (busy.has(box)) return;
        busy.add(box);
        const t0 = performance.now();

        const out = row.animate([
            { transform: 'translateX(0)', filter: 'blur(0px)', opacity: 1 },
            { transform: `translateX(${-SLIDE_DISTANCE * dir}px)`, filter: `blur(${SLIDE_BLUR}px)`, opacity: 0.25 }
        ], { duration: SLIDE_OUT_MS, easing: 'ease-in', fill: 'forwards' });

        let done = false;

        const finish = () => {
            if (done) return;
            done = true;
            observer.disconnect();
            clearTimeout(timer);
            const wait = Math.max(0, SLIDE_OUT_MS - (performance.now() - t0));
            setTimeout(() => {
                out.cancel();
                const current = box.querySelector('[class*="gameRow-"]') || row;
                current.animate([
                    { transform: `translateX(${SLIDE_DISTANCE * dir}px)`, filter: `blur(${SLIDE_BLUR + 2}px)`, opacity: 0.2 },
                    { transform: 'translateX(0)', filter: 'blur(0px)', opacity: 1 }
                ], { duration: SLIDE_IN_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
                busy.delete(box);
            }, wait);
        };

        const observer = new MutationObserver(finish);
        observer.observe(box, { childList: true, subtree: true });
        const timer = setTimeout(finish, 700);
    };

    document.addEventListener('click', e => {
        if (reduceMotion) return;
        const btn = e.target.closest && e.target.closest('[class*="goForward-"], [class*="goBack-"]');
        if (!btn) return;
        if (/opacity-25/.test(btn.className)) return;
        const found = findRow(btn);
        if (!found) return;
        const dir = /goForward-/.test(btn.className) ? 1 : -1;
        slideRow(found.row, found.box, dir);
    }, true);

    const cache = new Map();

    const loadBlobUrl = src => new Promise((resolve, reject) => {
        if (src.startsWith('data:') || src.startsWith('blob:')) return resolve({ url: src, revoke: false });
        GM_xmlhttpRequest({
            method: 'GET',
            url: src,
            responseType: 'blob',
            onload: r => r.response ? resolve({ url: URL.createObjectURL(r.response), revoke: true }) : reject(),
            onerror: reject
        });
    });

    const isBlackImage = src => {
        if (cache.has(src)) return cache.get(src);
        const p = loadBlobUrl(src).then(({ url, revoke }) => new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => {
                try {
                    const S = 32;
                    const c = document.createElement('canvas');
                    c.width = c.height = S;
                    const ctx = c.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(im, 0, 0, S, S);
                    const d = ctx.getImageData(0, 0, S, S).data;
                    let visible = 0, dark = 0;
                    for (let i = 0; i < d.length; i += 4) {
                        if (d[i + 3] < 40) continue;
                        visible++;
                        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                        if (lum < 50) dark++;
                    }
                    resolve(visible > 0 && dark / visible >= 0.97);
                } catch (e) { reject(e); }
                if (revoke) URL.revokeObjectURL(url);
            };
            im.onerror = reject;
            im.src = url;
        })).catch(() => false);
        cache.set(src, p);
        return p;
    };

    const checkImage = img => {
        if (img.dataset.blackChecked === img.currentSrc) return;
        const src = img.currentSrc || img.src;
        if (!src || img.closest(EXCLUDE)) return;
        img.dataset.blackChecked = src;
        isBlackImage(src).then(black => {
            if (black) img.style.setProperty('filter', 'brightness(0) invert(1)', 'important');
        });
    };

    const scanImages = () => {
        document.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalWidth) checkImage(img);
            else img.addEventListener('load', () => checkImage(img), { once: true });
        });
    };

    let queued = false;
    const schedule = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            swapHello();
            scanImages();
        });
    };

    const start = () => {
        addLayer();
        swapHello();
        scanImages();
        new MutationObserver(schedule).observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
