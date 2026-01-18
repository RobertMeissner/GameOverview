// ==UserScript==
// @name         GameOverview - Auto Store Export
// @namespace    http://gameoverview.local
// @version      1.0.0
// @description  Automatically export game libraries from Epic, Steam, and GOG directly to GameOverview
// @author       GameOverview
// @match        https://www.epicgames.com/account/transactions*
// @match        https://steamcommunity.com/id/*/games/*
// @match        https://steamcommunity.com/profiles/*/games/*
// @match        https://store.steampowered.com/account/familymanagement*
// @match        https://www.gog.com/*/account*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const API_BASE_URL = GM_getValue('apiBaseUrl', 'http://localhost:8080');

    // Name cleanup helper
    const cleanName = (name) => {
        if (!name) return name;
        return name
            .replace(/ - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/i, '')
            .replace(/Limited Free Promotional Packag(e)?/gi, '')
            .replace(/ - Free$/i, '')
            .replace(/ Demo$/i, '')
            .replace(/ - $/g, '')
            .trim();
    };

    // Create floating export button
    function createExportButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        button.onmouseover = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        };
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };
        button.onclick = onClick;
        document.body.appendChild(button);
        return button;
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10001;
            padding: 16px 24px;
            background: ${bgColor};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Send games to GameOverview API
    function sendToGameOverview(games, storeName) {
        showNotification(`Exporting ${games.length} games to GameOverview...`, 'info');

        GM_xmlhttpRequest({
            method: 'POST',
            url: `${API_BASE_URL}/import/bulk`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(games),
            onload: function(response) {
                if (response.status === 200) {
                    const result = JSON.parse(response.responseText);
                    showNotification(
                        `✓ Success! Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
                        'success'
                    );
                } else {
                    showNotification(`✗ Error: ${response.status} ${response.statusText}`, 'error');
                }
            },
            onerror: function(error) {
                console.error('Export failed:', error);
                showNotification('✗ Export failed. Is GameOverview running on ' + API_BASE_URL + '?', 'error');
            }
        });
    }

    // Epic Games export
    async function exportEpicGames() {
        showNotification('Fetching Epic Games library...', 'info');

        const fetchGamesList = async (pageToken = '', existingList = []) => {
            const response = await fetch(
                `https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=${pageToken}&locale=en-US`
            );
            const data = await response.json();

            const gamesList = data.orders.reduce((acc, order) => [
                ...acc,
                ...order.items.map(item => ({
                    name: cleanName(item.description),
                    store: 'epic',
                    storeId: item.offerId || item.id || null
                }))
            ], []);

            console.log(`Games on page: ${gamesList.length}, Next: ${data.nextPageToken || 'none'}`);
            const newList = [...existingList, ...gamesList];

            if (!data.nextPageToken) return newList;
            return await fetchGamesList(data.nextPageToken, newList);
        };

        try {
            const games = await fetchGamesList();
            sendToGameOverview(games, 'Epic Games');
        } catch (error) {
            console.error('Epic export error:', error);
            showNotification('✗ Failed to fetch Epic Games library', 'error');
        }
    }

    // Steam export
    async function exportSteamGames() {
        showNotification('Scanning Steam library... Scroll to bottom first!', 'info');

        // Wait a bit for user to scroll
        await new Promise(resolve => setTimeout(resolve, 1000));

        let gameRows = document.querySelectorAll('[data-appid]');
        if (!gameRows.length) gameRows = document.querySelectorAll('.gameListRow');

        if (!gameRows.length) {
            showNotification('✗ No games found. Scroll to the bottom of the page first!', 'error');
            return;
        }

        const games = [...gameRows].map(row => {
            const appid = row.dataset?.appid || row.getAttribute('data-appid') || null;
            const nameEl = row.querySelector('.gameListRowItemName') || row.querySelector('[class*="GameName"]');
            const rawName = nameEl ? nameEl.textContent.trim() : 'Unknown';
            return {
                name: cleanName(rawName),
                store: 'steam',
                storeId: appid
            };
        }).filter(g => g.name !== 'Unknown');

        sendToGameOverview(games, 'Steam');
    }

    // Steam Family Library export
    async function exportSteamFamilyGames() {
        showNotification('Scanning Steam Family Library (auto-scroll)...', 'info');

        const games = new Map();
        let lastCount = 0;
        let noNewItemsCount = 0;
        const maxNoNewItems = 5;

        const collectVisibleGames = () => {
            const images = document.querySelectorAll('img[src*="steam/apps"]');
            images.forEach(img => {
                const alt = img.getAttribute('alt');
                const src = img.getAttribute('src');
                if (alt && src) {
                    const match = src.match(/\/steam\/apps\/(\d+)\//);
                    const appId = match ? match[1] : null;
                    if (appId && !games.has(appId)) {
                        games.set(appId, {
                            name: cleanName(alt),
                            store: 'steam-family',
                            storeId: appId
                        });
                    }
                }
            });
        };

        const scrollAndCollect = () => {
            return new Promise(resolve => {
                collectVisibleGames();
                window.scrollBy(0, window.innerHeight * 0.8);
                setTimeout(() => {
                    collectVisibleGames();
                    resolve();
                }, 300);
            });
        };

        // Auto-scroll loop
        while (noNewItemsCount < maxNoNewItems) {
            await scrollAndCollect();

            if (games.size === lastCount) {
                noNewItemsCount++;
            } else {
                noNewItemsCount = 0;
                showNotification(`Found ${games.size} games...`, 'info');
            }
            lastCount = games.size;
        }

        window.scrollTo(0, 0);
        const uniqueGames = [...games.values()];
        sendToGameOverview(uniqueGames, 'Steam Family');
    }

    // GOG export
    async function exportGogGames() {
        showNotification('Fetching GOG library...', 'info');

        try {
            let page = 1;
            let allGames = [];
            let totalPages = 1;

            do {
                const response = await fetch(
                    `https://www.gog.com/account/getFilteredProducts?mediaType=1&page=${page}`
                );
                const data = await response.json();
                totalPages = data.totalPages;

                const games = data.products.map(p => ({
                    name: cleanName(p.title),
                    store: 'gog',
                    storeId: String(p.id)
                }));

                allGames = allGames.concat(games);
                console.log(`Page ${page}/${totalPages}: Found ${games.length} games`);
                page++;
            } while (page <= totalPages);

            sendToGameOverview(allGames, 'GOG');
        } catch (error) {
            console.error('GOG export error:', error);
            showNotification('✗ Failed to fetch GOG library', 'error');
        }
    }

    // Detect store and add appropriate button
    function init() {
        const url = window.location.href;

        if (url.includes('epicgames.com/account/transactions')) {
            createExportButton('📤 Export to GameOverview', exportEpicGames);
        }
        else if (url.includes('steamcommunity.com') && url.includes('/games')) {
            createExportButton('📤 Export to GameOverview', exportSteamGames);
        }
        else if (url.includes('store.steampowered.com/account/familymanagement')) {
            createExportButton('📤 Export to GameOverview', exportSteamFamilyGames);
        }
        else if (url.includes('gog.com') && url.includes('account')) {
            createExportButton('📤 Export to GameOverview', exportGogGames);
        }
    }

    // Initialize when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
