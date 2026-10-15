// ==UserScript==
// @name         YouTube Tweaks
// @namespace    https://github.com/xxxKeshu/my-youtube-tweaks
// @version      1.0.0
// @description  Кастомизация YouTube: скрытие элементов, авто-качество, перевод комментариев и др.
// @author       Solas
// @match        *://*.youtube.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      translate.googleapis.com
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/xxxKeshu/Scripts-for-browser/youtube-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/xxxKeshu/Scripts-for-browser/main/youtube-tweaks.user.js
// @icon         https://www.youtube.com/s/desktop/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 0. ХРАНИЛИЩЕ СТИЛЕЙ И СОСТОЯНИЯ
    // ==========================================

    const activeStyles = {
        smoothAnim: [],
        hideElements: [],
        wheelSpeed: [],
        translateComments: [],
        compactMode: [],
        autoQuality: [],
        speedHotkeys: []
    };

    const STORAGE_KEY = 'retube_clone_settings';
    const POS_KEY = 'retube_clone_position';
    const QUALITY_KEY = 'retube_clone_quality';

    let settings = {
        smoothAnim: false,
        hideElements: false,
        wheelSpeed: false,
        translateComments: false,
        compactMode: false,
        autoQuality: false,
        speedHotkeys: false
    };

    // Выбранное качество (по умолчанию — 1080p)
    let selectedQuality = 'hd1080';
    try {
        const savedQuality = localStorage.getItem(QUALITY_KEY);
        if (savedQuality) selectedQuality = savedQuality;
    } catch (e) {}

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) settings = Object.assign(settings, JSON.parse(saved));
    } catch (e) {
        console.warn('YouTube Tweaks: не удалось загрузить настройки', e);
    }

    // ==========================================
    // 0.1. ОПИСАНИЯ ДЛЯ ПОДСКАЗОК
    // ==========================================

    const TOOLTIPS = {
        smoothAnim: 'Добавляет плавные CSS-переходы для основных контейнеров YouTube.',

        hideElements:
            'Будут скрыты:\n' +
            '• Кнопка голосового поиска\n' +
            '• Страна возле иконки\n' +
            '• Элементы с левой панели (копирайты и прочее)\n' +
            '• Кнопки в плеере (перемотка, вперед и назад, автовоспроизведение, трансляция, мини-плеер)\n' +
            '• Аннотация канала в конце видео\n' +
            '• Панель реакций в чате\n' +
            '• Надпись в поиске \'Пожаловаться на поисковые подсказки\'\n' +
            '• Кнопка клавиатуры в строке поиска\n' +
            '• Кнопка \'Добавить в очередь\' при наведении на видео на главной странице\n' +
            '• Кнопки \'Справка\' и \'Отправить отзыв\' в меню аккаунта\n' +
            '• Кнопки под видео \'Поделиться\', \'Создать клип\', \'Скачать\', \'Спасибо\'',

        wheelSpeed:
            'Позволяет точно настраивать скорость воспроизведения видео с помощью колеса мыши:\n' +
            '• Shift + колесо — изменение скорости на 0.05×\n' +
            '• Обычное колесо — стандартная прокрутка страницы\n' +
            'Работает поверх стандартных горячих клавиш YouTube.',

        translateComments:
            'Добавляет кнопку «Перевести» под каждым комментарием на иностранном языке.\n' +
            'Комментарии на русском и украинском остаются без кнопки.\n' +
            'Перевод выполняется прямо на месте через Google Translate.',

        compactMode:
            'Уменьшает отступы и делает интерфейс более компактным:\n' +
            '• Уменьшает отступы между видео в ленте\n' +
            '• Делает карточки более плотными\n' +
            '• Уменьшает высоту шапки',

        autoQuality:
            'Автоматически устанавливает выбранное качество видео для всех роликов.\n' +
            'Доступные варианты:\n' +
            '• FHD (1080p)\n' +
            '• 2K (1440p)\n' +
            '• 4K (2160p)\n' +
            'Если видео не поддерживает выбранное качество, выбирается ближайшее доступное.',

        speedHotkeys:
            'Горячие клавиши для изменения скорости воспроизведения:\n' +
            '• Ctrl + ↑ — увеличить скорость\n' +
            '• Ctrl + ↓ — уменьшить скорость\n' +
            '• Ctrl + 0 — сбросить на 1×'
    };

    // ==========================================
    // 0.2. БАЗОВЫЕ СТИЛИ И ШРИФТ (ReTube-style)
    // ==========================================

    GM_addStyle(`
        @font-face {
            font-family: "Ubuntu Light Custom";
            src: url("https://raw.githubusercontent.com/Eject37/ReTube/main/Ubuntu%20Light.woff2") format("woff2");
            font-weight: 300;
            font-style: normal;
            font-display: swap;
        }
        @keyframes retubeShow {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `);

    // ==========================================
    // 1. CSS-МОДИФИКАТОРЫ
    // ==========================================

    function applySmoothAnimations() {
        removeStyles('smoothAnim');
        const style = GM_addStyle(`
            #columns, #primary, #secondary, #player, ytd-comments {
                transition: all 0.3s ease-in-out !important;
            }
        `);
        activeStyles.smoothAnim.push(style);
    }

    function applyHideElementsCSS() {
        removeStyles('hideElements');
        const style = GM_addStyle(`
            #voice-search-button { display: none; }
            #country-code { display: none; }

            #footer,
            ytd-guide-section-renderer:nth-child(5) > div > ytd-guide-entry-renderer:nth-child(2),
            ytd-guide-section-renderer:nth-child(5) > div > ytd-guide-entry-renderer:nth-child(3),
            ytd-guide-section-renderer:nth-child(5) > div > ytd-guide-entry-renderer:nth-child(4),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(2),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(3),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(4),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(5),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(6),
            ytd-guide-section-renderer:nth-child(3) > div > ytd-guide-entry-renderer:nth-child(7) { display: none !important; }

            a.ytp-next-button.ytp-button,
            a.ytp-prev-button.ytp-button,
            .ytp-jump-button,
            .ytp-button.ytp-remote-button,
            .ytp-button.ytp-miniplayer-button,
            button[title="Автовоспроизведение выключено"],
            button[title="Автоматичне відтворення вимкнено"],
            .ytp-button:has(.ytp-autonav-toggle-button[aria-checked="false"]),
            button[title="Субтитры недоступны"],
            button[title="Субтитри недоступні"] { display: none !important; }

            .ytp-paid-content-overlay,
            .iv-branding,
            #movie_player > [class^="ytp-ce-"],
            .ytp-cards-teaser-text,
            ytm-paid-content-overlay-renderer,
            .annotation.annotation-type-custom.iv-branding,
            .ytp-fullerscreen-edu-button-subtle { display: none !important; }

            #reaction-control-panel { display: none; }

            .sbfl_a,
            .YtSearchboxComponentReportButton,
            .ytSearchboxComponentReportButton { display: none !important; }

            .gsst_a,
            .YtSearchboxComponentYtdTextInputAssistantWrapper,
            .ytSearchboxComponentYtdTextInputAssistantWrapper { display: none !important; }

            [role="button"][aria-label="Добавить в очередь"],
            [role="button"][aria-label="Додати в чергу"] { display: none; }

            yt-multi-page-menu-section-renderer:nth-child(5) { display: none; }

            ytd-download-button-renderer,
            yt-button-view-model:has(button[aria-label="Поделиться"]),
            yt-button-view-model:has(button[aria-label="Создать клип"]),
            yt-button-view-model:has(button[aria-label="Спасибо"]),
            yt-button-view-model:has(button[aria-label="Показать текст видео"]),
            yt-button-view-model:has(button[aria-label="Share"]),
            yt-button-view-model:has(button[aria-label="Clip"]),
            yt-button-view-model:has(button[aria-label="Thank You"]),
            yt-button-view-model:has(button[aria-label="Show text version"]),
            yt-button-view-model:has(button[aria-label="Поділитися"]),
            yt-button-view-model:has(button[aria-label="Створити кліп"]),
            yt-button-view-model:has(button[aria-label="Дякую"]),
            yt-button-view-model:has(button[aria-label="Показати текстову версію"]) { display: none !important; }

            ytd-search-pyv-renderer,
            [class^="ytd-promoted-"],
            ytd-video-renderer + ytd-shelf-renderer,
            ytd-video-renderer + ytd-reel-shelf-renderer,
            ytd-rich-section-renderer:has(a[href^="/premium/"]),
            #clarify-box,
            .ytd-watch-flexy.attached-message,
            ytd-popup-container tp-yt-paper-dialog ytd-single-option-survey-renderer,
            #donation-shelf ytd-donation-unavailable-renderer,
            .sparkles-light-cta,
            ytd-feed-nudge-renderer,
            .ytp-pause-overlay-container,
            #teaser-carousel:has(> .ytVideoMetadataCarouselViewModelHost),
            #premium-upsell-link,
            .ytd-guide-renderer.style-scope:nth-of-type(4),
            #sponsor-button,
            #newness-dot { display: none !important; }
        `);
        activeStyles.hideElements.push(style);
    }

    // ==========================================
    // 1.1. КОМПАКТНЫЙ РЕЖИМ
    // ==========================================

    function applyCompactMode() {
        removeStyles('compactMode');
        const style = GM_addStyle(`
            ytd-rich-grid-renderer {
                --ytd-rich-grid-item-margin: 8px !important;
                --ytd-rich-grid-gutter-margin: 8px !important;
            }

            ytd-rich-item-renderer {
                margin-bottom: 8px !important;
            }

            ytd-video-renderer,
            ytd-compact-video-renderer {
                margin-bottom: 6px !important;
                padding: 4px 0 !important;
            }

            #masthead-container {
                --ytd-masthead-height: 48px !important;
            }

            #container.ytd-masthead {
                height: 48px !important;
            }

            ytd-comment-thread-renderer {
                margin-bottom: 12px !important;
            }

            #secondary {
                padding-left: 8px !important;
            }
        `);
        activeStyles.compactMode.push(style);
    }

    // ==========================================
    // 1.2. АВТО-КАЧЕСТВО (настраиваемое)
    // ==========================================

    let qualityObserver = null;
    let qualityTimeout = null;
    let qualityInterval = null;

    // Соответствие выбранного качества и кода YouTube
    const QUALITY_MAP = {
        'hd1080': 'FHD (1080p)',
        'hd1440': '2K (1440p)',
        'hd2160': '4K (2160p)'
    };

    function applyAutoQuality() {
        if (qualityObserver) return;

        const setQuality = () => {
            const player = document.querySelector('#movie_player');
            if (!player || !player.getAvailableQualityLevels) return;

            const available = player.getAvailableQualityLevels();
            if (!available || available.length === 0) return;

            const current = player.getPlaybackQuality ? player.getPlaybackQuality() : '';
            if (current === selectedQuality) return;

            // Выбираем целевое качество или ближайшее меньшее
            let target = selectedQuality;
            if (!available.includes(selectedQuality)) {
                const order = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
                const targetIndex = order.indexOf(selectedQuality);
                for (let i = targetIndex + 1; i < order.length; i++) {
                    if (available.includes(order[i])) {
                        target = order[i];
                        break;
                    }
                }
            }

            if (player.setPlaybackQualityRange) {
                player.setPlaybackQualityRange(target, target);
            }
            if (player.setPlaybackQuality) {
                player.setPlaybackQuality(target);
            }
        };

        const checkQuality = () => {
            clearTimeout(qualityTimeout);
            qualityTimeout = setTimeout(setQuality, 1000);
        };

        qualityObserver = new MutationObserver(() => {
            checkQuality();
        });
        qualityObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        checkQuality();

        qualityInterval = setInterval(() => {
            if (!settings.autoQuality) {
                clearInterval(qualityInterval);
                return;
            }
            setQuality();
        }, 5000);
    }

    function removeAutoQuality() {
        if (qualityObserver) {
            qualityObserver.disconnect();
            qualityObserver = null;
        }
        clearTimeout(qualityTimeout);
        clearInterval(qualityInterval);
    }

    // ==========================================
    // 1.3. ГОРЯЧИЕ КЛАВИШИ ДЛЯ СКОРОСТИ
    // ==========================================

    let speedHotkeyHandler = null;

    function applySpeedHotkeys() {
        if (speedHotkeyHandler) return;

        const STEP = 0.25;
        const MIN_SPEED = 0.25;
        const MAX_SPEED = 4;

        speedHotkeyHandler = function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (!e.ctrlKey) return;

            const video = document.querySelector('video');
            if (!video) return;

            let newRate = video.playbackRate || 1;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                newRate = Math.min(MAX_SPEED, newRate + STEP);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                newRate = Math.max(MIN_SPEED, newRate - STEP);
            } else if (e.key === '0') {
                e.preventDefault();
                newRate = 1;
            } else {
                return;
            }

            newRate = Math.round(newRate * 100) / 100;
            video.playbackRate = newRate;
            showSpeedOSD(newRate);
        };

        window.addEventListener('keydown', speedHotkeyHandler, true);
    }

    function removeSpeedHotkeys() {
        if (speedHotkeyHandler) {
            window.removeEventListener('keydown', speedHotkeyHandler, true);
            speedHotkeyHandler = null;
        }
    }

    function showSpeedOSD(rate) {
        let osd = document.getElementById('retube-speed-osd');
        if (!osd) {
            osd = document.createElement('div');
            osd.id = 'retube-speed-osd';
            osd.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 99999;
                background: rgba(28, 31, 42, 0.85);
                color: #c9d0d3;
                padding: 10px 20px;
                border-radius: 8px;
                border: 1px solid rgba(150, 165, 195, 0.18);
                font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
                font-size: 16px;
                font-weight: 300;
                pointer-events: none;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            `;
            document.body.appendChild(osd);
        }
        osd.textContent = 'Скорость: ' + rate.toFixed(2) + '×';
        osd.style.opacity = '1';

        clearTimeout(osd._timer);
        osd._timer = setTimeout(() => {
            osd.style.opacity = '0';
        }, 1000);
    }

    // ==========================================
    // 1.4. ТОЧНАЯ НАСТРОЙКА СКОРОСТИ КОЛЕСОМ
    // ==========================================

    let wheelSpeedHandler = null;

    function applyWheelSpeed() {
        removeStyles('wheelSpeed');
        if (wheelSpeedHandler) return;

        wheelSpeedHandler = function(e) {
            const player = document.querySelector('#movie_player, .html5-video-player');
            if (!player || !player.contains(e.target)) return;
            if (!e.shiftKey) return;

            const video = document.querySelector('video');
            if (!video) return;

            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            let newRate = (video.playbackRate || 1) + delta;
            newRate = Math.max(0.25, Math.min(4, newRate));
            newRate = Math.round(newRate * 100) / 100;

            video.playbackRate = newRate;
            showSpeedOSD(newRate);
        };

        window.addEventListener('wheel', wheelSpeedHandler, { passive: false, capture: true });
    }

    function removeWheelSpeed() {
        if (wheelSpeedHandler) {
            window.removeEventListener('wheel', wheelSpeedHandler, { capture: true });
            wheelSpeedHandler = null;
        }
    }

    // ==========================================
    // 1.5. ПЕРЕВОД КОММЕНТАРИЕВ (GOOGLE TRANSLATE)
    // ==========================================

    let translateObserver = null;

    function isRussian(text) {
        if (/[а-яё]/i.test(text)) return true;
        return false;
    }

    function translateText(text, targetLang, callback) {
        const url = 'https://translate.googleapis.com/translate_a/single' +
            '?client=gtx&sl=auto&tl=' + targetLang + '&dt=t&q=' +
            encodeURIComponent(text.slice(0, 1500));

        if (typeof GM_xmlhttpRequest === 'function') {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        let translated = '';
                        if (data && data[0]) {
                            for (let i = 0; i < data[0].length; i++) {
                                if (data[0][i] && data[0][i][0]) {
                                    translated += data[0][i][0];
                                }
                            }
                        }
                        callback(translated || null);
                    } catch (e) {
                        callback(null);
                    }
                },
                onerror: function() { callback(null); }
            });
        } else {
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    let translated = '';
                    if (data && data[0]) {
                        for (let i = 0; i < data[0].length; i++) {
                            if (data[0][i] && data[0][i][0]) {
                                translated += data[0][i][0];
                            }
                        }
                    }
                    callback(translated || null);
                })
                .catch(() => callback(null));
        }
    }

    function applyTranslateComments() {
        if (translateObserver) return;

        const addTranslateButtons = () => {
            const comments = document.querySelectorAll(
                'ytd-comment-view-model #content-text, ytd-comment-renderer #content-text'
            );

            comments.forEach(textEl => {
                if (textEl.dataset.retubeTranslateAdded) return;
                textEl.dataset.retubeTranslateAdded = '1';

                const originalText = textEl.textContent.trim();
                if (!originalText) return;
                if (isRussian(originalText)) return;

                const btnWrapper = document.createElement('div');
                btnWrapper.className = 'retube-translate-wrapper';
                btnWrapper.style.cssText = 'margin-top: 6px;';

                const btn = document.createElement('button');
                btn.className = 'retube-translate-btn';
                btn.textContent = 'Перевести';
                btn.style.cssText = `
                    display: inline-block;
                    padding: 3px 10px;
                    font-size: 12px;
                    font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
                    font-weight: 300;
                    background: rgba(96, 100, 110, 0.37);
                    color: rgb(201, 208, 211);
                    border: 1px solid rgb(72, 75, 91);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease;
                `;
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(96, 100, 110, 0.6)';
                    btn.style.color = '#fff';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'rgba(96, 100, 110, 0.37)';
                    btn.style.color = 'rgb(201, 208, 211)';
                });

                const translationBox = document.createElement('div');
                translationBox.className = 'retube-translation-box';
                translationBox.style.cssText = `
                    display: none;
                    margin-top: 8px;
                    padding: 10px 12px;
                    background: rgba(87, 133, 186, 0.12);
                    border-left: 3px solid rgba(122, 163, 212, 0.7);
                    border-radius: 6px;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #ddd;
                    white-space: pre-wrap;
                    font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
                    font-weight: 300;
                `;

                let translated = false;
                let loading = false;

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (loading) return;

                    if (translated) {
                        const visible = translationBox.style.display !== 'none';
                        translationBox.style.display = visible ? 'none' : 'block';
                        btn.textContent = visible ? 'Показать перевод' : 'Скрыть перевод';
                        return;
                    }

                    loading = true;
                    btn.textContent = 'Перевод…';
                    btn.disabled = true;
                    translationBox.style.display = 'block';
                    translationBox.textContent = 'Перевод…';

                    translateText(originalText, 'ru', (result) => {
                        loading = false;
                        btn.disabled = false;

                        if (result) {
                            translated = true;
                            translationBox.textContent = result;
                            btn.textContent = 'Скрыть перевод';
                        } else {
                            translationBox.textContent = 'Не удалось перевести. Попробуйте позже.';
                            btn.textContent = 'Повторить';
                        }
                    });
                });

                btnWrapper.appendChild(btn);
                btnWrapper.appendChild(translationBox);

                textEl.parentNode.insertBefore(btnWrapper, textEl.nextSibling);
            });
        };

        addTranslateButtons();

        translateObserver = new MutationObserver(() => {
            addTranslateButtons();
        });
        translateObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function removeTranslateComments() {
        if (translateObserver) {
            translateObserver.disconnect();
            translateObserver = null;
        }
        document.querySelectorAll('.retube-translate-wrapper').forEach(el => el.remove());
        document.querySelectorAll('[data-retube-translate-added]').forEach(el => {
            delete el.dataset.retubeTranslateAdded;
        });
    }

    // ==========================================
    // 1.6. УТИЛИТЫ
    // ==========================================

    function removeStyles(key) {
        activeStyles[key].forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        activeStyles[key] = [];
    }

    function toggleFeature(key, enabled) {
        if (key === 'smoothAnim') {
            if (enabled) applySmoothAnimations(); else removeStyles('smoothAnim');
        }
        if (key === 'hideElements') {
            if (enabled) applyHideElementsCSS(); else removeStyles('hideElements');
        }
        if (key === 'wheelSpeed') {
            if (enabled) applyWheelSpeed(); else removeWheelSpeed();
        }
        if (key === 'translateComments') {
            if (enabled) applyTranslateComments(); else removeTranslateComments();
        }
        if (key === 'compactMode') {
            if (enabled) applyCompactMode(); else removeStyles('compactMode');
        }
        if (key === 'autoQuality') {
            if (enabled) applyAutoQuality(); else removeAutoQuality();
        }
        if (key === 'speedHotkeys') {
            if (enabled) applySpeedHotkeys(); else removeSpeedHotkeys();
        }
    }

    // ==========================================
    // 2. ПАНЕЛЬ НАСТРОЕК (ReTube-style)
    // ==========================================

    let tooltipEl = null;
    let tooltipTimer = null;

    function ensureTooltip() {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'retube-tooltip';
        tooltipEl.style.cssText = `
            position: fixed;
            z-index: 10000;
            max-width: 400px;
            padding: 12px 14px;
            background: rgba(58, 67, 77, 0.75);
            color: #fff;
            border-radius: 13px;
            font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
            font-weight: 300;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-line;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none;
            opacity: 0;
            transform: translateY(-6px);
            transition: opacity 0.25s ease, transform 0.25s ease;
        `;
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    }

    function showTooltip(text, cursorX, cursorY) {
        const tip = ensureTooltip();
        tip.textContent = text;

        tip.style.opacity = '0';
        tip.style.transform = 'translateY(-6px)';
        tip.style.left = '0px';
        tip.style.top = '0px';
        tip.style.visibility = 'hidden';

        const tipRect = tip.getBoundingClientRect();
        const margin = 16;

        let left = cursorX - tipRect.width / 2;
        let top = cursorY + margin;

        if (left < 10) left = 10;
        if (left + tipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tipRect.width - 10;
        }
        if (top + tipRect.height > window.innerHeight - 10) {
            top = cursorY - tipRect.height - margin;
        }

        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        tip.style.visibility = 'visible';

        requestAnimationFrame(() => {
            tip.style.opacity = '1';
            tip.style.transform = 'translateY(0)';
        });
    }

    function hideTooltip() {
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
            tooltipTimer = null;
        }
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'translateY(-6px)';
        }
    }

    // ==========================================
    // 2.1. ПЕРЕТАСКИВАНИЕ
    // ==========================================

    let dragState = null;

    function makeDraggable(panel, handle) {
        handle.style.cursor = 'grab';

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const rect = panel.getBoundingClientRect();
            dragState = {
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top
            };
            handle.style.cursor = 'grabbing';
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
        });

        function onDragMove(e) {
            if (!dragState) return;
            let left = e.clientX - dragState.offsetX;
            let top = e.clientY - dragState.offsetY;

            const maxLeft = window.innerWidth - panel.offsetWidth - 4;
            const maxTop = window.innerHeight - panel.offsetHeight - 4;
            if (left < 4) left = 4;
            if (top < 4) top = 4;
            if (left > maxLeft) left = maxLeft;
            if (top > maxTop) top = maxTop;

            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.right = 'auto';
        }

        function onDragEnd() {
            if (dragState) {
                try {
                    localStorage.setItem(POS_KEY, JSON.stringify({
                        left: panel.style.left,
                        top: panel.style.top
                    }));
                } catch (e) {}
            }
            dragState = null;
            handle.style.cursor = 'grab';
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
        }
    }

    // ==========================================
    // 2.2. СОЗДАНИЕ ПАНЕЛИ
    // ==========================================

    function createSettingsPanel() {
        if (document.getElementById('retube-settings-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'retube-settings-panel';

        panel.style.cssText = `
            position: fixed;
            z-index: 9999;
            width: 300px;
            max-height: 85vh;
            padding: 0 0 14px 0;
            background-color: rgba(37, 37, 45, 0.36);
            color: #fff;
            border-radius: 14px;
            font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
            font-weight: 300;
            display: none;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            filter: drop-shadow(0 0 3px rgba(100, 110, 115, 0.6));
            animation: retubeShow 0.3s ease;
        `;

        let initialLeft, initialTop;
        try {
            const savedPos = localStorage.getItem(POS_KEY);
            if (savedPos) {
                const pos = JSON.parse(savedPos);
                initialLeft = pos.left;
                initialTop = pos.top;
            }
        } catch (e) {}

        if (initialLeft && initialTop) {
            panel.style.left = initialLeft;
            panel.style.top = initialTop;
        } else {
            const w = 300;
            const h = 450;
            panel.style.left = Math.max(20, (window.innerWidth - w) / 2) + 'px';
            panel.style.top = Math.max(20, (window.innerHeight - h) / 2) + 'px';
        }

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            margin: 0 0 10px 0;
            background: rgba(67, 77, 105, 0.25);
            border-radius: 14px 14px 0 0;
            user-select: none;
        `;

        const title = document.createElement('span');
        title.textContent = 'YouTube Tweaks';
        title.style.cssText = `
            font-weight: bold;
            margin-left: 6px;
            font-size: 20px;
            pointer-events: none;
            color: rgb(201, 208, 211);
        `;
        header.appendChild(title);

        const dots = document.createElement('span');
        dots.textContent = '⋮⋮';
        dots.style.cssText = 'opacity: 0.4; font-size: 14px; letter-spacing: -2px; color: rgb(201, 208, 211);';
        header.appendChild(dots);

        panel.appendChild(header);

        const makeCheckbox = (id, labelText, key) => {
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 8px 6px 8px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: background 0.15s ease;
                font-size: 14px;
                color: rgb(201, 208, 211);
                font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
                font-weight: 300;
                -webkit-user-select: none;
                user-select: none;
            `;

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = id;
            cb.checked = settings[key];
            cb.style.cssText = `
                width: 16px;
                height: 16px;
                accent-color: #9ba8c2;
                cursor: pointer;
            `;

            const span = document.createElement('span');
            span.textContent = labelText;
            span.style.cssText = 'font-size: 14px;';

            label.appendChild(cb);
            label.appendChild(span);
            panel.appendChild(label);

            label.addEventListener('mouseenter', (e) => {
                label.style.background = 'rgba(120, 125, 130, 0.15)';
                if (tooltipTimer) clearTimeout(tooltipTimer);
                const x = e.clientX;
                const y = e.clientY;
                tooltipTimer = setTimeout(() => {
                    showTooltip(TOOLTIPS[key], x, y);
                }, 400);
            });

            label.addEventListener('mousemove', (e) => {
                if (tooltipEl && tooltipEl.style.opacity === '1') {
                    const tipRect = tooltipEl.getBoundingClientRect();
                    const margin = 16;
                    let left = e.clientX - tipRect.width / 2;
                    let top = e.clientY + margin;

                    if (left < 10) left = 10;
                    if (left + tipRect.width > window.innerWidth - 10) {
                        left = window.innerWidth - tipRect.width - 10;
                    }
                    if (top + tipRect.height > window.innerHeight - 10) {
                        top = e.clientY - tipRect.height - margin;
                    }

                    tooltipEl.style.left = left + 'px';
                    tooltipEl.style.top = top + 'px';
                }
            });

            label.addEventListener('mouseleave', () => {
                label.style.background = 'transparent';
                hideTooltip();
            });

            return cb;
        };

        const cbAnim = makeCheckbox('retube-smooth-anim', 'Плавные анимации страницы', 'smoothAnim');
        const cbHide = makeCheckbox('retube-hide-elements', 'Скрыть лишние элементы', 'hideElements');
        const cbWheel = makeCheckbox('retube-wheel-speed', 'Точная настройка скорости колесом мыши', 'wheelSpeed');
        const cbTranslate = makeCheckbox('retube-translate-comments', 'Перевод комментариев', 'translateComments');
        const cbCompact = makeCheckbox('retube-compact-mode', 'Компактный режим', 'compactMode');
        const cbAutoQuality = makeCheckbox('retube-auto-quality', 'Авто-качество', 'autoQuality');
        const cbSpeedHotkeys = makeCheckbox('retube-speed-hotkeys', 'Горячие клавиши для скорости', 'speedHotkeys');

        // Выпадающий список выбора качества
        const qualityRow = document.createElement('div');
        qualityRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 0 8px 6px 8px; padding: 4px 8px;';

        const qualityLabel = document.createElement('span');
        qualityLabel.textContent = 'Качество:';
        qualityLabel.style.cssText = 'font-size: 13px; color: rgb(201, 208, 211);';
        qualityRow.appendChild(qualityLabel);

        const qualitySelect = document.createElement('select');
        qualitySelect.id = 'retube-quality-select';
        qualitySelect.style.cssText = `
            flex: 1;
            padding: 4px 8px;
            background: rgb(96, 100, 110, 0.37);
            color: rgb(201, 208, 211);
            border: 1px solid rgb(72, 75, 91);
            border-radius: 5px;
            font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
            font-weight: 300;
            font-size: 13px;
            cursor: pointer;
        `;

        ['hd1080', 'hd1440', 'hd2160'].forEach(q => {
            const opt = document.createElement('option');
            opt.value = q;
            opt.textContent = QUALITY_MAP[q];
            opt.style.cssText = 'background: rgb(37, 37, 45); color: rgb(201, 208, 211);';
            if (q === selectedQuality) opt.selected = true;
            qualitySelect.appendChild(opt);
        });

        qualitySelect.addEventListener('change', (e) => {
            selectedQuality = e.target.value;
            try {
                localStorage.setItem(QUALITY_KEY, selectedQuality);
            } catch (err) {}
            // Если авто-качество включено — применим новое значение сразу
            if (settings.autoQuality) {
                const player = document.querySelector('#movie_player');
                if (player && player.setPlaybackQualityRange) {
                    player.setPlaybackQualityRange(selectedQuality, selectedQuality);
                }
            }
        });

        qualityRow.appendChild(qualitySelect);
        panel.appendChild(qualityRow);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 8px; margin: 12px 8px 0 8px;';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'retube-save';
        saveBtn.textContent = 'Сохранить';
        saveBtn.style.cssText = `
            flex: 1;
            padding: 8px 10px;
            background: rgb(96, 100, 110, 0.37);
            color: rgb(201, 208, 211);
            border-radius: 5px;
            border: 1px solid rgb(72, 75, 91);
            font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
            font-weight: 300;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
        `;
        saveBtn.addEventListener('mouseenter', () => saveBtn.style.background = 'rgb(96, 100, 110, 0.6)');
        saveBtn.addEventListener('mouseleave', () => saveBtn.style.background = 'rgb(96, 100, 110, 0.37)');

        const closeBtn = document.createElement('button');
        closeBtn.id = 'retube-close';
        closeBtn.textContent = 'Закрыть';
        closeBtn.style.cssText = `
            flex: 1;
            padding: 8px 10px;
            background: rgb(96, 100, 110, 0.37);
            color: rgb(201, 208, 211);
            border-radius: 5px;
            border: 1px solid rgb(72, 75, 91);
            font-family: "Ubuntu Light Custom", "Ubuntu", sans-serif;
            font-weight: 300;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
        `;
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgb(96, 100, 110, 0.6)');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'rgb(96, 100, 110, 0.37)');

        btnRow.appendChild(saveBtn);
        btnRow.appendChild(closeBtn);
        panel.appendChild(btnRow);

        document.body.appendChild(panel);

        makeDraggable(panel, header);

        cbAnim.addEventListener('change', (e) => {
            settings.smoothAnim = e.target.checked;
            toggleFeature('smoothAnim', e.target.checked);
        });
        cbHide.addEventListener('change', (e) => {
            settings.hideElements = e.target.checked;
            toggleFeature('hideElements', e.target.checked);
        });
        cbWheel.addEventListener('change', (e) => {
            settings.wheelSpeed = e.target.checked;
            toggleFeature('wheelSpeed', e.target.checked);
        });
        cbTranslate.addEventListener('change', (e) => {
            settings.translateComments = e.target.checked;
            toggleFeature('translateComments', e.target.checked);
        });
        cbCompact.addEventListener('change', (e) => {
            settings.compactMode = e.target.checked;
            toggleFeature('compactMode', e.target.checked);
        });
        cbAutoQuality.addEventListener('change', (e) => {
            settings.autoQuality = e.target.checked;
            toggleFeature('autoQuality', e.target.checked);
        });
        cbSpeedHotkeys.addEventListener('change', (e) => {
            settings.speedHotkeys = e.target.checked;
            toggleFeature('speedHotkeys', e.target.checked);
        });

        saveBtn.addEventListener('click', () => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
                localStorage.setItem(QUALITY_KEY, selectedQuality);
                saveBtn.textContent = 'Сохранено ✓';
                setTimeout(() => { saveBtn.textContent = 'Сохранить'; }, 1200);
            } catch (e) {
                console.warn('YouTube Tweaks: не удалось сохранить настройки', e);
            }
        });

        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            hideTooltip();
        });
    }

    // ==========================================
    // 3. F2 / ESC
    // ==========================================

    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            let panel = document.getElementById('retube-settings-panel');
            if (!panel) {
                createSettingsPanel();
                panel = document.getElementById('retube-settings-panel');
            }
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                if (panel.style.display === 'none') hideTooltip();
            }
        }
        if (e.key === 'Escape') {
            const panel = document.getElementById('retube-settings-panel');
            if (panel) panel.style.display = 'none';
            hideTooltip();
        }
    });

    // ==========================================
    // 4. АВТОПРИМЕНЕНИЕ СОХРАНЁННЫХ НАСТРОЕК
    // ==========================================

    function applySavedSettings() {
        if (settings.smoothAnim) applySmoothAnimations();
        if (settings.hideElements) applyHideElementsCSS();
        if (settings.wheelSpeed) applyWheelSpeed();
        if (settings.translateComments) applyTranslateComments();
        if (settings.compactMode) applyCompactMode();
        if (settings.autoQuality) applyAutoQuality();
        if (settings.speedHotkeys) applySpeedHotkeys();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createSettingsPanel();
            applySavedSettings();
        });
    } else {
        createSettingsPanel();
        applySavedSettings();
    }

})();
