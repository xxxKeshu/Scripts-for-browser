// ==UserScript==
// @name         Ubuntu Light для всех сайтов
// @namespace    https://github.com/SolasFor/my-youtube-tweaks
// @version      1.0.0
// @description  Применяет шрифт Ubuntu Light ко всему контенту на всех сайтах
// @author       Solas
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/SolasFor/Scripts-for-browser/main/ubuntu-light-font.user.js
// @downloadURL  https://raw.githubusercontent.com/SolasFor/Scripts-for-browser/main/ubuntu-light-font.user.js
// ==/UserScript==

(function() {
    'use strict';

    const css = `
        @font-face {
            font-family: "Ubuntu Light";
            src: url("https://raw.githubusercontent.com/Eject37/ReTube/main/Ubuntu%20Light.woff2") format("woff2");
            font-weight: 300;
            font-style: normal;
            font-display: swap;
        }

        *:not([class*="icon"]):not([class*="fa-"]):not(i):not(svg):not(code):not(pre) {
            font-family: "Ubuntu Light", "Ubuntu", sans-serif !important;
            font-weight: 300 !important;
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
    } else {
        const style = document.createElement('style');
        style.textContent = css;
        document.documentElement.appendChild(style);
    }
})();
