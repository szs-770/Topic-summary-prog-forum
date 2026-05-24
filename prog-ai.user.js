// ==UserScript==
// @name         Prog Forum Topic Summarizer - Professional Edition
// @namespace    http://prog.co.il/*
// @version      1.4
// @description  AI topic summarizer for Prog Forum: Native Isolated UI, Chat, Versions, Dark Mode Support, Auto-Reply & Custom Prompts
// @match        https://www.prog.co.il/threads/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @connect      generativelanguage.googleapis.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // הגדרת הנחיית ברירת המחדל (Default Prompt)
    // ==========================================
    const defaultPromptText = `סכם את הדיון בעברית תקנית, בצורה תמציתית, ברורה ועובדתית.

פורמט הפלט:
- אל תפתח במשפטים כמו "להלן סיכום" או "סיכום הדיון" - גש ישר לתוכן.
- מותר ומומלץ להשתמש ב-Markdown בסיסי בלבד לפי הצורך:
  - **טקסט מודגש** להדגשת מונחים מרכזיים או החלטות.
  - *טקסט נטוי* לשמות, ציטוטים קצרים, או דגשים משניים.
  - רשימה לא ממוספרת עם מקף ורווח (- פריט) כשיש 3 פריטים או יותר באותה קטגוריה.
  - רשימה ממוספרת (1. פריט) כשיש סדר או שלבים.
  - כותרת משנה בסולמית כפולה (## כותרת) רק בדיון ארוך עם כמה נושאים נפרדים.
  - \`קוד\` בגרשיים אחוריים לפקודות, שמות קבצים, או מונחים טכניים.
  - קישורים בפורמט [תיאור](כתובת) רק אם הופיעו במקור.
- אל תשתמש בטבלאות, ב-blockquote (>), בקווי הפרדה (---), או ברשימות מקוננות.
- הפרד בין פסקאות בשורה ריקה.

תוכן הסיכום:
- התחל מהנושא המרכזי של הדיון.
- המשך לנקודות העיקריות, נקודות מחלוקת או הסכמה, ופרטים מהותיים.
- סיים במסקנה, החלטה, או בסטטוס הנוכחי - אם קיים.
- ציין שם משתמש רק אם זהותו מהותית להבנת הדיון. אחרת השתמש ב"משתמש" או "משתתף".
- אל תמציא מידע שאינו מופיע בטקסט. אם משהו לא ברור, דלג עליו.
- אורך: 3 עד 6 משפטים, או 2 עד 4 פריטים ברשימה אם הדיון מנייתי באופיו.`;

    // SVGs for fully isolated custom icons
    const ICONS = {
        magic: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 5.2l-1.4 1.4M6.2 12.8l-1.4 1.4M17.8 12.8l-1.4-1.4M6.2 5.2l-1.4 1.4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>`,
        robot: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><path d="M12 2v4M12 6H8M12 6h4M6 16h.01M18 16h.01"></path></svg>`,
        history: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline><line x1="12" y1="7" x2="12" y2="12"></line><line x1="12" y1="12" x2="16" y2="14"></line></svg>`,
        sliders: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
        close: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        copy: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        reply: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>`,
        send: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        refresh: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
        info: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="12" x2="12.01" y2="12"></line></svg>`
    };

    // ==========================================
    // מערכת העיצוב המבודדת לחלוטין (Isolated CSS System)
    // ==========================================
    const customStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&display=swap');

        /* כפתור ה-AI המעוצב בפורום */
        .prog-ai-btn {
            background: linear-gradient(135deg, #045c73 0%, #034455 100%) !important;
            color: #ffffff !important;
            font-family: 'Heebo', sans-serif !important;
            font-weight: 700 !important;
            padding: 6px 14px !important;
            border-radius: 4px !important;
            border: none !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            font-size: 13px !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 2px 5px rgba(4, 92, 115, 0.25) !important;
            text-decoration: none !important;
            vertical-align: middle !important;
        }
        .prog-ai-btn:hover {
            background: linear-gradient(135deg, #05728f 0%, #045c73 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(4, 92, 115, 0.35) !important;
            color: #ffffff !important;
        }
        .prog-ai-btn svg {
            transition: transform 0.3s ease !important;
        }
        .prog-ai-btn:hover svg {
            transform: rotate(15deg) scale(1.1) !important;
        }

        /* Toast מעודן ולא חוסם */
        #prog-ai-toast {
            position: fixed;
            bottom: 30px;
            left: 30px;
            z-index: 999999;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            color: #ffffff;
            padding: 12px 22px;
            border-radius: 50px;
            font-family: 'Heebo', sans-serif;
            font-weight: 500;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            direction: rtl;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            transform: translateY(120px) scale(0.9);
            opacity: 0;
            pointer-events: none;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        #prog-ai-toast.show {
            transform: translateY(0) scale(1);
            opacity: 1;
            pointer-events: auto;
        }

        .prog-ai-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: prog-ai-spin 0.8s linear infinite;
        }

        @keyframes prog-ai-spin {
            to { transform: rotate(360deg); }
        }

        /* מנגנון דיאלוג מבודד מבוסס Overlay */
        .prog-ai-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(8px);
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Heebo', sans-serif;
            direction: rtl;
        }
        .prog-ai-overlay.show {
            opacity: 1;
        }

        .prog-ai-modal {
            background: #ffffff;
            width: 90%;
            max-width: 720px;
            max-height: 85vh;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.95) translateY(20px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .prog-ai-overlay.show .prog-ai-modal {
            transform: scale(1) translateY(0);
        }

        /* מודל בהיר/כהה (Dark Mode Support) */
        @media (prefers-color-scheme: dark) {
            .prog-ai-modal {
                background: #1e293b;
                color: #f1f5f9;
                border-color: rgba(255, 255, 255, 0.05);
            }
        }

        /* כותרת מודל */
        .prog-ai-modal-header {
            background: linear-gradient(135deg, #045c73 0%, #023643 100%);
            color: #ffffff;
            padding: 18px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .prog-ai-modal-title {
            font-size: 18px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
        }
        .prog-ai-modal-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .prog-ai-modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transform: rotate(90deg);
        }

        /* תוכן מודל */
        .prog-ai-modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
            max-height: calc(85vh - 140px);
        }

        /* חיווי אורך קריאה */
        .prog-ai-indicator {
            background: #eef8fc;
            border-right: 4px solid #045c73;
            color: #023643;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-indicator {
                background: rgba(4, 92, 115, 0.15);
                color: #e0f2fe;
                border-right-color: #0ea5e9;
            }
        }

        /* סרגל ניווט גרסאות */
        .prog-ai-version-nav {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 12px;
            margin-bottom: 18px;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-version-nav {
                background: #0f172a;
                border-color: #334155;
            }
        }

        .prog-ai-ver-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .prog-ai-ver-btn:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #94a3b8;
        }
        .prog-ai-ver-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-ver-btn {
                background: #1e293b;
                border-color: #475569;
                color: #cbd5e1;
            }
            .prog-ai-ver-btn:hover:not(:disabled) {
                background: #334155;
            }
        }

        .prog-ai-ver-label {
            font-size: 13px;
            font-weight: 500;
            color: #475569;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-ver-label {
                color: #94a3b8;
            }
        }

        /* טקסט סיכום */
        .prog-ai-summary-content {
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 24px;
            color: #334155;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-summary-content {
                color: #cbd5e1;
            }
        }
        .prog-ai-summary-content p {
            margin-bottom: 12px;
        }
        .prog-ai-summary-content ul, .prog-ai-summary-content ol {
            padding-right: 20px;
            margin-bottom: 12px;
        }
        .prog-ai-summary-content li {
            margin-bottom: 6px;
        }
        .prog-ai-summary-content strong {
            color: #045c73;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-summary-content strong {
                color: #38bdf8;
            }
        }
        .prog-ai-summary-content code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 90%;
            color: #db2777;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-summary-content code {
                background: #0f172a;
                color: #f472b6;
            }
        }

        /* אזור הצ'אט */
        .prog-ai-chat-section {
            border-top: 1px dashed #cbd5e1;
            margin-top: 24px;
            padding-top: 20px;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-chat-section {
                border-color: #475569;
            }
        }

        .prog-ai-chat-title {
            font-size: 14px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-chat-title {
                color: #94a3b8;
            }
        }

        .prog-ai-chat-history {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 14px;
            padding-left: 6px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        /* בועות צ'אט */
        .prog-ai-bubble {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .prog-ai-bubble-user {
            background: #e6f6f9;
            color: #023643;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
            border: 1px solid #bce1e8;
        }
        .prog-ai-bubble-ai {
            background: #f1f5f9;
            color: #1e293b;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
            border: 1px solid #e2e8f0;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-bubble-user {
                background: rgba(4, 92, 115, 0.2);
                color: #e0f2fe;
                border-color: rgba(4, 92, 115, 0.3);
            }
            .prog-ai-bubble-ai {
                background: #334155;
                color: #f1f5f9;
                border-color: #475569;
            }
        }

        /* שורת קלט של הצ'אט */
        .prog-ai-chat-input-row {
            display: flex;
            gap: 8px;
        }
        .prog-ai-chat-input {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 24px;
            padding: 8px 16px;
            font-size: 14px;
            outline: none;
            background: #ffffff;
            color: #1e293b;
            transition: border-color 0.2s;
        }
        .prog-ai-chat-input:focus {
            border-color: #045c73;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-chat-input {
                background: #0f172a;
                border-color: #475569;
                color: #f1f5f9;
            }
            .prog-ai-chat-input:focus {
                border-color: #0ea5e9;
            }
        }

        .prog-ai-chat-send {
            background: #045c73;
            color: #ffffff;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
        }
        .prog-ai-chat-send:hover {
            background: #05728f;
            transform: scale(1.05);
        }
        .prog-ai-chat-send:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
        }

        /* פוטר דיאלוג */
        .prog-ai-modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: flex-start;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-modal-footer {
                background: #0f172a;
                border-color: #334155;
            }
        }

        .prog-ai-footer-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .prog-ai-footer-btn:hover {
            background: #f1f5f9;
            border-color: #94a3b8;
        }
        .prog-ai-footer-btn-primary {
            background: #045c73;
            color: #ffffff;
            border-color: #045c73;
        }
        .prog-ai-footer-btn-primary:hover {
            background: #05728f;
            border-color: #05728f;
            color: #ffffff;
        }
        .prog-ai-footer-btn-success {
            background: #16a34a;
            color: #ffffff;
            border-color: #16a34a;
        }
        .prog-ai-footer-btn-success:hover {
            background: #15803d;
            border-color: #15803d;
            color: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-footer-btn {
                background: #1e293b;
                border-color: #475569;
                color: #cbd5e1;
            }
            .prog-ai-footer-btn:hover {
                background: #334155;
            }
        }

        /* דיאלוג היסטוריה מותאם */
        .prog-ai-history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 350px;
            overflow-y: auto;
        }
        .prog-ai-history-item {
            display: block;
            padding: 12px 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            text-decoration: none !important;
            transition: all 0.2s;
        }
        .prog-ai-history-item:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            transform: translateX(-2px);
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-history-item {
                background: #0f172a;
                border-color: #334155;
            }
            .prog-ai-history-item:hover {
                background: #1e293b;
            }
        }
        .prog-ai-history-title {
            color: #045c73;
            font-weight: 700;
            font-size: 14px;
            margin: 0 0 4px 0;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-history-title {
                color: #38bdf8;
            }
        }
        .prog-ai-history-date {
            font-size: 11px;
            color: #64748b;
        }

        /* עורך הנחיה מותאם */
        .prog-ai-prompt-textarea {
            width: 100%;
            min-height: 250px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            font-family: monospace;
            font-size: 13px;
            line-height: 1.5;
            outline: none;
            resize: vertical;
            background: #ffffff;
            color: #1e293b;
        }
        .prog-ai-prompt-textarea:focus {
            border-color: #045c73;
        }
        @media (prefers-color-scheme: dark) {
            .prog-ai-prompt-textarea {
                background: #0f172a;
                border-color: #475569;
                color: #cbd5e1;
            }
            .prog-ai-prompt-textarea:focus {
                border-color: #0ea5e9;
            }
        }
    `;

    // הזרקת הסטייל לדף
    const styleSheet = document.createElement("style");
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    // סטטוס פנימי
    let isFetching = false;
    window.progCurrentThreadText = null;
    window.progCurrentThreadTid = null;

    // ==========================================
    // ניהול מפתח API השמור ב-Tampermonkey
    // ==========================================
    function getApiKey() {
        let key = GM_getValue('gemini_api_key_v2');
        if (!key) {
            key = prompt('אנא הכנס את מפתח ה-Gemini API שלך (הוא יישמר מקומית בדפדפן):');
            if (key) {
                key = key.trim();
                GM_setValue('gemini_api_key_v2', key);
            }
        }
        return key;
    }

    // אבטחת HTML (הגנה מפני XSS)
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, function(tag) {
            const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
            return charsToReplace[tag] || tag;
        });
    }

    // המרת Markdown בסיסי ל-HTML תואם
    function formatSummaryText(text) {
        let html = escapeHTML(text);
        html = html.replace(/^### (.*?)$/gm, '<h4 style="margin-top:15px; margin-bottom:5px; font-weight:700; color:#045c73;">$1</h4>');
        html = html.replace(/^## (.*?)$/gm, '<h3 style="margin-top:15px; margin-bottom:5px; font-weight:800; color:#045c73;">$1</h3>');
        html = html.replace(/^# (.*?)$/gm, '<h2 style="margin-top:15px; margin-bottom:5px; font-weight:900; color:#045c73;">$1</h2>');
        html = html.replace(/^[\*\-]\s+(.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>(?:\n<li>.*<\/li>)*)/g, '<ul style="padding-right: 20px; margin-bottom: 12px;">$1</ul>');
        html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ol-item">$1</li>');
        html = html.replace(/(<li class="ol-item">.*<\/li>(?:\n<li class="ol-item">.*<\/li>)*)/g, '<ol style="padding-right: 20px; margin-bottom: 12px;">$1</ol>');
        html = html.replace(/class="ol-item"/g, '');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#0ea5e9; text-decoration:underline;">$1</a>');
        html = html.replace(/\n\n/g, '<p></p>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    // שליפת מזהה האשכול (TID) של XenForo מה-URL בצורה בטוחה
    function getTid() {
        const cleanPath = window.location.pathname;
        const match = cleanPath.match(/\/threads\/[^\/]*\.(\d+)/) || cleanPath.match(/\/threads\/(\d+)/);
        return match ? match[1] : null;
    }

    // ==========================================
    // מנגנון Toast יפהפה (לא מפריע לעבודה)
    // ==========================================
    function showToast(msg) {
        let toast = document.getElementById('prog-ai-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'prog-ai-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<div class="prog-ai-spinner"></div> <span>${msg}</span>`;
        setTimeout(() => toast.classList.add('show'), 50);
    }

    function hideToast() {
        let toast = document.getElementById('prog-ai-toast');
        if (toast) toast.classList.remove('show');
    }

    // ==========================================
    // בניית Overlay ו-Modal עצמאי (Vanilla isolated modal)
    // ==========================================
    class ProgModal {
        constructor(title, size = 'medium') {
            this.size = size;

            this.overlay = document.createElement('div');
            this.overlay.className = 'prog-ai-overlay';

            this.modal = document.createElement('div');
            this.modal.className = 'prog-ai-modal';
            if (size === 'large') this.modal.style.maxWidth = '850px';

            this.header = document.createElement('div');
            this.header.className = 'prog-ai-modal-header';
            this.header.innerHTML = `
                <h3 class="prog-ai-modal-title">${ICONS.robot} <span>${title}</span></h3>
                <button class="prog-ai-modal-close">${ICONS.close}</button>
            `;

            this.body = document.createElement('div');
            this.body.className = 'prog-ai-modal-body';

            this.footer = document.createElement('div');
            this.footer.className = 'prog-ai-modal-footer';

            this.modal.appendChild(this.header);
            this.modal.appendChild(this.body);
            this.modal.appendChild(this.footer);
            this.overlay.appendChild(this.modal);

            this.header.querySelector('.prog-ai-modal-close').onclick = () => this.close();
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) this.close();
            };
        }

        setContent(html) {
            this.body.innerHTML = html;
        }

        addButton(label, className, callback) {
            const btn = document.createElement('button');
            btn.className = `prog-ai-footer-btn ${className}`;
            btn.innerHTML = label;
            btn.onclick = () => {
                const closeAfter = callback(this, btn);
                if (closeAfter !== false) this.close();
            };
            this.footer.appendChild(btn);
            return btn;
        }

        show() {
            document.body.appendChild(this.overlay);
            setTimeout(() => {
                this.overlay.classList.add('show');
            }, 50);
        }

        close() {
            this.overlay.classList.remove('show');
            setTimeout(() => {
                this.overlay.remove();
            }, 300);
        }
    }

    function progAlert(title, text) {
        const modal = new ProgModal(title);
        modal.setContent(`<div style="font-size:15px; line-height:1.6;">${escapeHTML(text)}</div>`);
        modal.addButton('אישור', 'prog-ai-footer-btn-primary', () => true);
        modal.show();
    }

    // ==========================================
    // משיכת כל עמודי הדיון עם מנגנון מניעת חסימות (Batching)
    // ==========================================
    async function fetchThreadText(tid) {
        let threadText = '';
        let fetchedPostsCount = 0;
        let totalPostsCount = 0;

        try {
            const cleanUrl = window.location.href.split('?')[0].split('#')[0];
            let baseUrl = cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl;
            baseUrl = baseUrl.replace(/\/page-\d+$/, '');

            let maxPage = 1;
            const pageNavElements = document.querySelectorAll('.pageNav-main .pageNav-page');
            if (pageNavElements.length > 0) {
                const lastPageElement = pageNavElements[pageNavElements.length - 1];
                const pageNum = parseInt(lastPageElement.innerText.trim());
                if (!isNaN(pageNum)) maxPage = pageNum;
            }

            // יצירת מערך פונקציות fetch ולא הפעלה מיידית
            const pageFetchFunctions = [];
            for (let p = 1; p <= maxPage; p++) {
                const pageUrl = p === 1 ? baseUrl + '/' : `${baseUrl}/page-${p}`;
                pageFetchFunctions.push(() => 
                    fetch(pageUrl)
                        .then(res => res.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const posts = doc.querySelectorAll('article.message--post');

                            const pagePosts = [];
                            posts.forEach((post, index) => {
                                const author = post.getAttribute('data-author') || 'משתמש';
                                const contentEl = post.querySelector('.bbWrapper');
                                if (contentEl) {
                                    const cleanContent = contentEl.cloneNode(true);
                                    cleanContent.querySelectorAll('blockquote').forEach(bq => bq.remove());
                                    const text = cleanContent.innerText.replace(/\s+/g, ' ').trim();
                                    if (text) {
                                        const globalIndex = (p - 1) * 20 + (index + 1);
                                        pagePosts.push({
                                            index: globalIndex,
                                            author: author,
                                            text: text
                                        });
                                    }
                                }
                            });
                            return { postsCount: posts.length, pagePosts: pagePosts };
                        })
                        .catch(err => {
                            console.error(`Error fetching page ${p}:`, err);
                            return { postsCount: 0, pagePosts: [] };
                        })
                );
            }

            // משיכה באצוות (Batches) למניעת עומס (Rate Limit / DDoS Protection)
            const results = [];
            const BATCH_SIZE = 3; 
            for (let i = 0; i < pageFetchFunctions.length; i += BATCH_SIZE) {
                const batch = pageFetchFunctions.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(batch.map(fn => fn()));
                results.push(...batchResults);
                
                // הוספת השהייה קלה בין קבוצות
                if (i + BATCH_SIZE < pageFetchFunctions.length) {
                    await new Promise(r => setTimeout(r, 400));
                }
            }

            let allPosts = [];
            results.forEach(res => {
                totalPostsCount += res.postsCount;
                fetchedPostsCount += res.pagePosts.length;
                allPosts = allPosts.concat(res.pagePosts);
            });

            allPosts.sort((a, b) => a.index - b.index);
            threadText = allPosts.map(p => `--- פוסט ${p.index} מאת ${p.author} ---\n${p.text}`).join('\n\n');

            const MAX_CHARS = 80000;
            if (threadText.length > MAX_CHARS) {
                threadText = threadText.substring(0, MAX_CHARS) + "\n...[הטקסט נחתך עקב מגבלת אורך הדיון]...";
            }
        } catch (e) {
            console.error('Scraping thread error', e);
        }

        return { text: threadText, fetched: fetchedPostsCount, total: totalPostsCount };
    }

    // ==========================================
    // שמירה והיסטוריית סיכומים גלובלית
    // ==========================================
    function saveSummaryToHistory(tid, summaryText) {
        const titleEl = document.querySelector('h1.p-title-value') || document.querySelector('title');
        let title = titleEl ? titleEl.textContent.trim() : 'דיון ללא כותרת';

        title = title.replace('דרוש מידע - ', '').replace(' | פרוג • קהילה עסקית', '').trim();

        let history = JSON.parse(GM_getValue('prog_ai_history_v1', '[]'));
        history = history.filter(h => h.tid !== tid);
        history.unshift({ tid, title, date: Date.now(), summary: summaryText });
        if (history.length > 20) history = history.slice(0, 20);

        GM_setValue('prog_ai_history_v1', JSON.stringify(history));
    }

    function openHistoryDialog() {
        let history = JSON.parse(GM_getValue('prog_ai_history_v1', '[]'));
        if (history.length === 0) {
            progAlert('היסטוריה', 'אין עדיין היסטוריית סיכומים.');
            return;
        }

        const historyModal = new ProgModal('היסטוריית סיכומים (20 אחרונים)');

        let html = '<div class="prog-ai-history-list">';
        history.forEach(h => {
            html += `<a href="#" class="prog-ai-history-item" data-tid="${h.tid}">
                <h5 class="prog-ai-history-title">${escapeHTML(h.title)}</h5>
                <span class="prog-ai-history-date">${ICONS.info} ${new Date(h.date).toLocaleString('he-IL')}</span>
            </a>`;
        });
        html += '</div>';

        historyModal.setContent(html);
        historyModal.addButton('סגור', '', () => true);
        historyModal.show();

        historyModal.body.querySelectorAll('.prog-ai-history-item').forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                const tid = item.getAttribute('data-tid');
                historyModal.close();
                startSummaryCore(String(tid), getApiKey(), false);
            };
        });
    }

    // ==========================================
    // הצגת עורך ההנחיה (Prompt Editor)
    // ==========================================
    function showPromptEditor(tid) {
        const currentPrompt = GM_getValue('custom_ai_prompt_prog_v1') || defaultPromptText;
        const promptModal = new ProgModal('הגדרות מתקדמות: התאמת הנחיה (Prompt)');

        const html = `
            <div style="text-align: right; margin-bottom: 12px; font-size:13px; color:#475569;">
                כאן תוכל לערוך את ההוראות שנשלחות לבינה המלאכותית לפני סיכום האשכול.<br>
                <strong>טיפ:</strong> אם תמחק את כל הטקסט ותשמור, המערכת תחזור אוטומטית להנחיית ברירת המחדל.
            </div>
            <textarea id="prog-custom-prompt-textarea" class="prog-ai-prompt-textarea" rows="12">${escapeHTML(currentPrompt)}</textarea>
        `;

        promptModal.setContent(html);
        promptModal.addButton('ביטול', '', () => true);
        promptModal.addButton('שמור וסכם מחדש', 'prog-ai-footer-btn-primary', () => {
            const newPrompt = document.getElementById('prog-custom-prompt-textarea').value.trim();
            if (newPrompt) {
                GM_setValue('custom_ai_prompt_prog_v1', newPrompt);
            } else {
                GM_setValue('custom_ai_prompt_prog_v1', '');
            }
            startSummaryCore(tid, getApiKey(), true);
            return true;
        });
        promptModal.show();
    }

    // ==========================================
    // ניהול צ'אט (שאלות על הדיון)
    // ==========================================
    async function handleChatSubmit(tid, text, apiKey, modalInstance) {
        if (!apiKey) return;

        const input = document.getElementById('prog-ai-chat-input');
        const sendBtn = document.getElementById('prog-ai-chat-send');
        const chatHistory = document.getElementById('prog-ai-chat-history');

        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        chatHistory.innerHTML += `
            <div class="prog-ai-bubble prog-ai-bubble-user">${escapeHTML(text)}</div>
        `;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const loadingId = 'prog-loading-' + Date.now();
        chatHistory.innerHTML += `
            <div id="${loadingId}" class="prog-ai-bubble prog-ai-bubble-ai">
                <span style="display:flex; align-items:center; gap:8px;">
                    <div class="prog-ai-spinner" style="border-top-color:#045c73; border-width:1.5px; width:12px; height:12px;"></div>
                    מעבד תשובה...
                </span>
            </div>
        `;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        let threadText = window.progCurrentThreadText;
        if (!threadText || window.progCurrentThreadTid !== tid) {
            const fetched = await fetchThreadText(tid);
            threadText = fetched.text;
            window.progCurrentThreadText = threadText;
            window.progCurrentThreadTid = tid;
        }

        const promptText = `אתה עוזר וירטואלי (AI) חכם. עליך לענות על שאלת המשתמש בהתבסס **אך ורק** על תוכן הדיון הבא מתוך הפורום. אם התשובה לא נמצאת בדיון, אמור זאת ואל תמציא מידע. ענה בעברית, בצורה עניינית, קצרה ומועילה. תוכל להשתמש בעיצוב בסיסי של טקסט ממודגש או רשימות.
שאלה: ${text}

דיון להסתמכות:
${threadText}`;

        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
            onload: function(response) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();

                try {
                    const res = JSON.parse(response.responseText);
                    if (res.error) {
                        chatHistory.innerHTML += `<div class="prog-ai-bubble prog-ai-bubble-ai" style="color:red;">שגיאה: ${res.error.message}</div>`;
                    } else if (res.candidates && res.candidates.length > 0) {
                        const answer = res.candidates[0].content.parts[0].text;
                        const formattedAnswer = formatSummaryText(answer);
                        chatHistory.innerHTML += `
                            <div class="prog-ai-bubble prog-ai-bubble-ai">${formattedAnswer}</div>
                        `;
                    }
                } catch (e) {
                     chatHistory.innerHTML += `<div class="prog-ai-bubble prog-ai-bubble-ai" style="color:red;">שגיאה בפענוח תגובה.</div>`;
                }
                chatHistory.scrollTop = chatHistory.scrollHeight;
            },
            onerror: function() {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();
                input.disabled = false;
                sendBtn.disabled = false;
                chatHistory.innerHTML += `<div class="prog-ai-bubble prog-ai-bubble-ai" style="color:red;">שגיאת תקשורת עם שרתי Google.</div>`;
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        });
    }

    // ==========================================
    // הצגת חלון הסיכום הראשי (Ultimate Modal Dialog)
    // ==========================================
    function showSummaryDialog(tid, versions, currentIndex, isCached) {
        const apiKey = getApiKey();
        const currentVer = versions[currentIndex];

        let titleText = 'סיכום הנושא באמצעות בינה מלאכותית';
        if (isCached) titleText += ' (מתוך הזיכרון)';

        const dialog = new ProgModal(titleText, 'large');

        const fetchedCount = currentVer.fetched || '?';
        const totalCount = currentVer.total || '?';
        const indicatorHtml = `
            <div class="prog-ai-indicator">
                ${ICONS.info} הסיכום מבוסס על סריקת ${fetchedCount} מתוך ${totalCount} תגובות בדיון.
            </div>
        `;

        let navHtml = '';
        if (versions.length > 1) {
            navHtml = `
            <div class="prog-ai-version-nav">
                <button id="prog-ai-btn-prev-ver" class="prog-ai-ver-btn" ${currentIndex === 0 ? 'disabled' : ''}>${ICONS.reply} ישן יותר</button>
                <div id="prog-ai-ver-label" class="prog-ai-ver-label">גרסה ${currentIndex + 1} מתוך ${versions.length} <span style="font-size:11px; opacity:0.7;">(${new Date(currentVer.date).toLocaleString('he-IL')})</span></div>
                <button id="prog-ai-btn-next-ver" class="prog-ai-ver-btn" ${currentIndex === versions.length - 1 ? 'disabled' : ''}>חדש יותר <span style="transform:scaleX(-1); display:inline-block;">${ICONS.reply}</span></button>
            </div>`;
        }

        const formattedHTML = formatSummaryText(currentVer.text);

        const bodyContent = `
            ${indicatorHtml}
            ${navHtml}
            <div class="prog-ai-summary-content" id="prog-ai-summary-content">${formattedHTML}</div>

            <div class="prog-ai-chat-section">
                <h5 class="prog-ai-chat-title">${ICONS.history} שאלות והבהרות על הדיון</h5>
                <div id="prog-ai-chat-history" class="prog-ai-chat-history"></div>
                <div class="prog-ai-chat-input-row">
                    <input type="text" id="prog-ai-chat-input" class="prog-ai-chat-input" placeholder="משהו לא ברור? שאל שאלה על הדיון...">
                    <button id="prog-ai-chat-send" class="prog-ai-chat-send" title="שלח">${ICONS.send}</button>
                </div>
            </div>
        `;

        dialog.setContent(bodyContent);
        dialog.rawSummary = currentVer.text;

        dialog.addButton(`${ICONS.reply} פרסם בפורום`, 'prog-ai-footer-btn-success', () => {
            const replyPublished = insertIntoEditor(dialog.rawSummary + '\n\n> _סוכם באמצעות בינה מלאכותית 🤖_');
            if (replyPublished) {
                const editorArea = document.querySelector('.js-editor') || document.querySelector('.fr-element');
                if (editorArea) {
                    editorArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return true;
            } else {
                alert('לא הצלחתי למצוא את עורך ההודעות בדף. האשכול נעול או שאינך מחובר?');
                return false;
            }
        });

        dialog.addButton(`${ICONS.copy} העתק סיכום`, 'prog-ai-copy-btn', (modal, btn) => {
            GM_setClipboard(dialog.rawSummary);
            btn.innerHTML = `<span style="color:#22c55e; display:flex; align-items:center; gap:4px;"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg> הועתק!</span>`;
            setTimeout(() => {
                btn.innerHTML = `${ICONS.copy} העתק סיכום`;
            }, 2000);
            return false;
        });

        dialog.addButton(`${ICONS.history} היסטוריה`, '', () => {
            openHistoryDialog();
            return true;
        });

        dialog.addButton(`${ICONS.sliders} התאם הנחיה`, '', () => {
            showPromptEditor(tid);
            return true;
        });

        dialog.addButton(`${ICONS.refresh} רענן סיכום`, '', () => {
            startSummaryCore(tid, apiKey, true);
            return true;
        });

        const closeBtn = dialog.addButton('סגור', '', () => true);
        closeBtn.style.marginRight = 'auto';

        dialog.show();

        setTimeout(() => {
            let activeIdx = currentIndex;

            if (versions.length > 1) {
                const prevBtn = document.getElementById('prog-ai-btn-prev-ver');
                const nextBtn = document.getElementById('prog-ai-btn-next-ver');
                const contentDiv = document.getElementById('prog-ai-summary-content');
                const labelDiv = document.getElementById('prog-ai-ver-label');

                const updateVerUI = () => {
                    const v = versions[activeIdx];
                    contentDiv.innerHTML = formatSummaryText(v.text);
                    dialog.rawSummary = v.text;
                    labelDiv.innerHTML = `גרסה ${activeIdx + 1} מתוך ${versions.length} <span style="font-size:11px; opacity:0.7;">(${new Date(v.date).toLocaleString('he-IL')})</span>`;

                    prevBtn.disabled = (activeIdx === 0);
                    nextBtn.disabled = (activeIdx === versions.length - 1);
                };

                if (prevBtn && nextBtn) {
                    prevBtn.onclick = () => { if (activeIdx > 0) { activeIdx--; updateVerUI(); } };
                    nextBtn.onclick = () => { if (activeIdx < versions.length - 1) { activeIdx++; updateVerUI(); } };
                }
            }

            const sendBtn = document.getElementById('prog-ai-chat-send');
            const inputField = document.getElementById('prog-ai-chat-input');
            if (sendBtn && inputField) {
                const sendChat = () => {
                    const text = inputField.value.trim();
                    if (text) handleChatSubmit(tid, text, apiKey, dialog);
                };
                sendBtn.onclick = sendChat;
                inputField.onkeypress = (e) => { if (e.key === 'Enter') sendChat(); };
            }
        }, 150);
    }

    // ==========================================
    // אינטגרציה מעמיקה עם עורך ההודעות של XenForo (Froala/XF Editor)
    // ==========================================
    function insertIntoEditor(text) {
        try {
            const $editor = window.jQuery?.('.js-editor');
            if ($editor && $editor.length) {
                const ed = window.XF?.Element?.get($editor[0], 'editor');
                if (ed && typeof ed.insertContent === 'function') {
                    ed.insertContent(text);
                    return true;
                }
            }
        } catch (e) {
            console.error("XF Editor API insertion failed:", e);
        }

        const frElement = document.querySelector('.fr-element');
        if (frElement) {
            const html = text.replace(/\n/g, '<br>');
            frElement.innerHTML = html;
            frElement.dispatchEvent(new Event('input', { bubbles: true }));
            frElement.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        const textarea = document.querySelector('textarea[name="message"]');
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        return false;
    }

    // ==========================================
    // תהליך הפקת סיכום מרכזי
    // ==========================================
    async function startSummaryCore(tid, apiKey, forceNew = false) {
        if (isFetching) return;

        const cacheKey = `prog_ai_versions_tid_${tid}_v2`;

        let versions = [];
        try {
            versions = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        } catch (e) {
            versions = [];
        }

        if (!forceNew && versions.length > 0) {
            showSummaryDialog(tid, versions, versions.length - 1, true);
            return;
        }

        isFetching = true;
        showToast('ה-AI סורק ומסכם כעת את כל הדיון באשכול...');

        const fetchedData = await fetchThreadText(tid);
        window.progCurrentThreadText = fetchedData.text;
        window.progCurrentThreadTid = tid;

        if (!fetchedData.text) {
            hideToast();
            isFetching = false;
            progAlert('שגיאה', 'לא הצלחתי לקרוא את תוכן הדיון.');
            return;
        }

        const customPrompt = GM_getValue('custom_ai_prompt_prog_v1') || defaultPromptText;
        const finalPrompt = `${customPrompt}\n\nהנה פוסטי האשכול לסיכום:\n\n${fetchedData.text}`;

        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
            onload: function(response) {
                isFetching = false;
                hideToast();
                try {
                    const res = JSON.parse(response.responseText);
                    if (res.error) {
                        if (res.error.code === 400 && res.error?.message?.includes("API key not valid")) {
                            progAlert('שגיאה', 'מפתח ה-API לא תקין. הוא אופס. רענן את העמוד ונסה שוב.');
                            GM_setValue('gemini_api_key_v2', '');
                        } else {
                            progAlert('שגיאה', res.error.message);
                        }
                    } else if (res.candidates && res.candidates.length > 0) {
                        const summary = res.candidates[0].content.parts[0].text;

                        versions.push({
                            text: summary,
                            date: Date.now(),
                            fetched: fetchedData.fetched,
                            total: fetchedData.total
                        });
                        if (versions.length > 5) versions.shift();
                        localStorage.setItem(cacheKey, JSON.stringify(versions));

                        saveSummaryToHistory(tid, summary);
                        showSummaryDialog(tid, versions, versions.length - 1, false);
                    } else {
                        progAlert('שגיאה', 'התקבלה תשובה ריקה מהשרת.');
                    }
                } catch (e) {
                    progAlert('שגיאה', 'שגיאה בפענוח התשובה מ-Gemini.');
                }
            },
            onerror: function() {
                isFetching = false;
                hideToast();
                progAlert('שגיאה', 'שגיאת תקשורת עם שרתי Google.');
            }
        });
    }

    // ==========================================
    // הזרקת כפתורים (עליון ותחתון) לסרגל הכלים של XenForo
    // ==========================================
    function injectInlineButtons() {
        const buttonGroups = document.querySelectorAll('.block-outer-opposite .buttonGroup, .p-title-opposite .buttonGroup');

        buttonGroups.forEach((group, index) => {
            const btnId = `prog-ai-btn-injected-${index}`;
            let btn = document.getElementById(btnId);

            if (!btn) {
                btn = document.createElement('button');
                btn.id = btnId;
                btn.className = 'prog-ai-btn';
                btn.innerHTML = `${ICONS.magic} <span>סכם דיון ב-AI</span>`;
                btn.style.marginRight = '8px';

                btn.onclick = (e) => {
                    e.preventDefault();
                    const tid = getTid();
                    if (tid) {
                        const apiKey = getApiKey();
                        if (apiKey) startSummaryCore(tid, apiKey, false);
                    }
                };
                group.appendChild(btn);
            }
        });
    }

    // MutationObserver יעיל עם Debounce לזיהוי שינויים דינמיים בדף
    let debounceTimer;
    const globalObserver = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            injectInlineButtons();
        }, 300);
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });

    // הרצה ראשונית
    injectInlineButtons();

})();
