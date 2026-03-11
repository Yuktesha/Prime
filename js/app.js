/**
 * app.js
 * Main UI Controller for Unified Prime App
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App Initialized. Initializing prime sieve...");
    await window.primeUtils.init();

    const dbStatus = document.getElementById('dbStatus');
    const dbFileInput = document.getElementById('dbFileInput');
    const clearDbBtn = document.getElementById('clearDbBtn');

    // Attempt to load from cache
    try {
        dbStatus.classList.remove('d-none', 'text-success', 'text-danger');
        dbStatus.classList.add('text-primary');
        dbStatus.textContent = '檢查在地快取...';

        const cachedResult = await primeUtils.tryLoadFromCache();
        if (cachedResult) {
            dbStatus.classList.remove('text-primary');
            dbStatus.classList.add('text-success');
            dbStatus.innerHTML = `✅ 自動載入快取資料庫！此資料庫支援驗證至數值: <strong>${cachedResult.max.toLocaleString()}</strong>`;
            if (clearDbBtn) clearDbBtn.classList.remove('d-none');

            // Update limits
            const limitInput = document.getElementById('sumLimit');
            if (limitInput) {
                limitInput.max = primeUtils.dbMaxPrime > 0 ? primeUtils.dbMaxPrime : 1000000000;
                limitInput.value = Math.min(limitInput.max, 5000000);
                const sumMaxLen = document.getElementById('sumMaxLen');
                if (sumMaxLen) sumMaxLen.max = 5000;
            }
        } else {
            dbStatus.classList.add('d-none');
        }
    } catch (e) {
        dbStatus.classList.add('d-none');
    }

    // UI Elements
    const themeToggle = document.getElementById('themeToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.tool-section');

    // Theme Management
    const savedTheme = localStorage.getItem('prime-theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('prime-theme', newTheme);
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            const targetId = link.getAttribute('data-target');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(sec => {
                if (sec.id === targetId) sec.classList.add('active');
                else sec.classList.remove('active');
            });

            // Update URL hash for sharing (prevents page jump)
            if (e) {
                history.replaceState(null, null, `#${targetId}`);
            }
        });
    });

    // Deep Linking / URL Parameter handling
    function activateTabAndScroll(targetId) {
        const link = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (link) link.click();
    }

    const rawHash = window.location.hash;
    const hashParts = rawHash.split('?');
    const hashBase = decodeURIComponent(hashParts[0]).toLowerCase();
    const hashParams = new URLSearchParams(hashParts[1] || "");
    
    const searchParams = new URLSearchParams(window.location.search);
    const searchStr = window.location.search.toLowerCase();

    // Helper to get param from either search or hash
    const getParam = (name) => searchParams.get(name) || hashParams.get(name);

    let activeToolId = null;

    // Map keywords to their corresponding tab IDs
    if (hashBase.includes('app-text') || hashBase.includes('文字轉換探索') || searchStr.includes('prmec') || searchStr.includes('text')) {
        activeToolId = 'app-text';
    } else if (hashBase.includes('app-phone') || hashBase.includes('電話號碼質距') || searchStr.includes('phone')) {
        activeToolId = 'app-phone';
    } else if (hashBase.includes('app-sum') || hashBase.includes('連續質數和') || searchStr.includes('sum')) {
        activeToolId = 'app-sum';
    } else if (hashBase.includes('app-plate') || hashBase.includes('車牌找質數') || searchStr.includes('plate')) {
        activeToolId = 'app-plate';
    } else if (hashBase) {
        // If there's an exact hash match with standard IDs
        activeToolId = hashBase.substring(1);
    }

    if (activeToolId) {
        activateTabAndScroll(activeToolId);
    }

    // Attempt Auto-Fill and Auto-Execute based on URL Parameters
    // We delay slightly to ensure DOM bindings are fully active
    setTimeout(() => {
        if (activeToolId === 'app-text') {
            const textVal = getParam('text') || getParam('prmec');
            if (textVal) {
                // If it looks like typical encrypted string (numbers and underscores), put it in decrypt
                if (/^[\d_+-]+$/.test(textVal)) {
                    const decInput = document.getElementById('textInputDecrypt');
                    const decBtn = document.getElementById('btnDecrypt');
                    if (decInput && decBtn) {
                        decInput.value = textVal;
                        decBtn.click();
                    }
                } else {
                    const encInput = document.getElementById('textInputEncrypt');
                    const encBtn = document.getElementById('btnEncrypt');
                    if (encInput && encBtn) {
                        encInput.value = textVal;
                        encBtn.click();
                    }
                }
            }
        }
        else if (activeToolId === 'app-phone') {
            // Support both ?phone=VAL and shorthand #app-phone?VAL
            let phoneVal = getParam('phone') || hashParts[1];
            // If hashParts[1] contains an equals sign, it's likely a key-value pair, so we skip the shorthand logic
            if (hashParts[1] && hashParts[1].includes('=') && !hashParams.has('phone')) {
                phoneVal = null; 
            }

            if (phoneVal) {
                const phoneInput = document.getElementById('phoneNumber');
                const phoneForm = document.getElementById('phoneForm');
                if (phoneInput && phoneForm) {
                    phoneInput.value = phoneVal;
                    // Trigger submit event
                    phoneForm.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
        }
        else if (activeToolId === 'app-plate') {
            const plateVal = getParam('plate');
            if (plateVal && plateVal.includes('-')) {
                const parts = plateVal.split('-');
                const p1 = document.getElementById('plate1');
                const p2 = document.getElementById('plate2');
                const plateForm = document.getElementById('plateForm');
                if (p1 && p2 && plateForm && parts.length >= 2) {
                    p1.value = parts[0];
                    p2.value = parts[1];
                    plateForm.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
        }
    }, 100);

    /** -----------------------------------------
     * TOOL 1: License Plate Prime Finder
     * ----------------------------------------- */
    const plateForm = document.getElementById('plateForm');
    const plateResults = document.getElementById('plateResults');

    plateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const part1 = document.getElementById('plate1').value.trim();
        const part2 = document.getElementById('plate2').value.trim();
        const count = parseInt(document.getElementById('plateCount').value) || 10;

        plateResults.innerHTML = '';

        try {
            const p1HasLet = Base36.hasLetters(part1);
            const p2HasLet = Base36.hasLetters(part2);

            const p1Num = p1HasLet ? Base36.toBase10(part1) : parseInt(part1, 10);
            const p2Num = p2HasLet ? Base36.toBase10(part2) : parseInt(part2, 10);

            if (isNaN(p1Num) || isNaN(p2Num)) throw new Error("無效的車牌號碼");

            const p1IsPrime = primeUtils.isPrime(p1Num);
            const p2IsPrime = primeUtils.isPrime(p2Num);

            const closest1 = primeUtils.findClosestPrimes(p1Num, count);
            const closest2 = primeUtils.findClosestPrimes(p2Num, count);

            if (p1IsPrime && p2IsPrime) triggerConfetti();

            renderPlateResults(plateResults, part1, p1Num, p1IsPrime, closest1, p1HasLet, '前半部');
            renderPlateResults(plateResults, part2, p2Num, p2IsPrime, closest2, p2HasLet, '後半部');

        } catch (err) {
            plateResults.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    });

    function renderPlateResults(container, orig, num, isPrime, closest, hasLetters, label) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-4';

        let headerHtml = `<h4 class="mb-3">${label}: ${orig} <small class="text-muted">(基數: ${num})</small></h4>`;

        if (isPrime) {
            headerHtml += `<div class="prime-result-box">🎉 這是一個質數！🎉</div>`;
        } else {
            headerHtml += `<div class="not-prime-result-box">不是質數</div>`;
        }

        let tableRowHtml = closest.map(c => {
            const displayPrime = hasLetters ? Base36.toBase36(c.prime) : c.prime.toString();
            return `<tr><td>${displayPrime}</td><td>${c.prime}</td><td>${c.distance}</td></tr>`;
        }).join('');

        const tableHtml = `
            <table class="table table-bordered table-striped table-hover">
                <thead class="table-light">
                    <tr><th>相近值 (36進位/原格式)</th><th>10進位值</th><th>距離</th></tr>
                </thead>
                <tbody>${tableRowHtml}</tbody>
            </table>
        `;

        wrapper.innerHTML = headerHtml + tableHtml;
        container.appendChild(wrapper);
    }

    /** -----------------------------------------
     * TOOL 2: Phone Prime Finder
     * ----------------------------------------- */
    const phoneForm = document.getElementById('phoneForm');
    const phoneResults = document.getElementById('phoneResults');

    phoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phoneRaw = document.getElementById('phoneNumber').value.trim();
        const count = parseInt(document.getElementById('phoneCount').value) || 5;

        phoneResults.innerHTML = '';
        if (!phoneRaw.replace(/[^0-9]/g, '')) {
            phoneResults.innerHTML = `<div class="alert alert-danger">請輸入有效的電話號碼</div>`;
            return;
        }

        const hasSeparators = /[- ]/.test(phoneRaw);
        let groups = [];
        let cleanPhone = phoneRaw.replace(/[^0-9\- ]/g, '');
        let isSmartGrouped = false;
        let altPartitions = [];

        if (hasSeparators) {
            groups = cleanPhone.split(/[- ]+/).filter(g => g.length > 0);
        } else {
            // Smart grouping: find ALL partitions and rank by total distance
            let allPartitions = [];

            function searchAll(index, currentPartition, currentDist) {
                if (index === phoneRaw.length) {
                    allPartitions.push({
                        parts: [...currentPartition],
                        dist: currentDist
                    });
                    return;
                }

                for (let i = phoneRaw.length; i > index; i--) {
                    const part = phoneRaw.substring(index, i);
                    const num = parseInt(part, 10);
                    if (isNaN(num)) continue;

                    let dist = 0;
                    let bestP = num;
                    if (!primeUtils.isPrime(num)) {
                        const closest = primeUtils.findClosestPrimes(num, 1);
                        if (closest.length > 0) {
                            dist = closest[0].distance;
                            bestP = closest[0].prime;
                        } else {
                            dist = Infinity;
                        }
                    }

                    currentPartition.push({
                        orig: part,
                        num: num,
                        bestPrime: bestP,
                        dist: dist
                    });
                    searchAll(i, currentPartition, currentDist + dist);
                    currentPartition.pop();
                }
            }

            if (phoneRaw.length <= 15) {
                // Find all combos for strings up to 15 chars
                searchAll(0, [], 0);

                if (allPartitions.length > 0) {
                    allPartitions.sort((a, b) => {
                        if (a.dist !== b.dist) return a.dist - b.dist;
                        // Tie breaker: prefer fewer groups
                        return a.parts.length - b.parts.length;
                    });

                    const best = allPartitions[0];
                    groups = best.parts.map(p => p.orig);
                    isSmartGrouped = true;

                    // The rest go to alternatives
                    altPartitions = allPartitions.slice(1, count); // up to count - 1 items

                    if (best.dist === 0) {
                        phoneResults.innerHTML += `<div class="alert alert-success border-success shadow-sm mb-4">🤖 <b>完美智慧拆組：</b> 系統為您找到了整組皆為質數的幸運組合！ <br>最佳組合: ${groups.join(' - ')}</div>`;
                    } else {
                        phoneResults.innerHTML += `<div class="alert alert-info border-info shadow-sm mb-4">🤖 <b>智慧距離拆組：</b> 系統為您找到修改幅度最小的拆分法 (總共只需改動 ${best.dist})！ <br>最佳還原組合: ${groups.join(' - ')}</div>`;
                    }
                }
            }

            if (!isSmartGrouped && phoneRaw.length >= 8) { // standard fallback for long numbers
                if (phoneRaw.length === 10) {
                    groups = [phoneRaw.substring(0, 4), phoneRaw.substring(4, 7), phoneRaw.substring(7, 10)];
                } else {
                    groups = [phoneRaw.substring(0, Math.floor(phoneRaw.length / 2)), phoneRaw.substring(Math.floor(phoneRaw.length / 2))];
                }
                phoneResults.innerHTML += `<div class="alert alert-secondary border-secondary shadow-sm mb-4">💡 <b>常規分組：</b> 號碼過長，採用預設常規長度為您分析。</div>`;
            } else if (!isSmartGrouped) {
                groups = [phoneRaw];
            }
        }

        let analyzeHtml = `<h4>電話分析結果：</h4>`;
        let groupCardsHtml = `<div class="row g-3 mb-4">`;
        let allGroupsPrime = true;
        let bestCombinationParts = [];

        groups.forEach((g, idx) => {
            const num = parseInt(g, 10);
            const isPrime = primeUtils.isPrime(num);
            const closest = primeUtils.findClosestPrimes(num, count);

            if (!isPrime) allGroupsPrime = false;

            const padLen = g.length;
            const formatStr = (val) => val.toString().padStart(padLen, '0');
            const bestPrimeDisplay = isPrime ? formatStr(num) : (closest.length > 0 ? formatStr(closest[0].prime) : formatStr(num));
            bestCombinationParts.push(bestPrimeDisplay);

            let groupStatus = isPrime ? `<span class="badge bg-success">✅ 質數</span>` : `<span class="badge bg-secondary">非質數</span>`;

            let listHtml = `<ul class="list-group list-group-flush mt-2">` + closest.map(c => `
                <li class="list-group-item d-flex justify-content-between align-items-center px-2 py-1 bg-transparent text-muted small">
                    ${c.prime}
                    <span class="badge bg-light text-dark shadow-sm">距離: ${c.distance}</span>
                </li>
            `).join('') + `</ul>`;

            groupCardsHtml += `
            <div class="col-md-${groups.length === 1 ? '12' : groups.length === 2 ? '6' : '4'}">
                <div class="card shadow-sm h-100 border-${isPrime ? 'success' : 'light'}">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="text-muted small">第 ${idx + 1} 組</span>
                            ${groupStatus}
                        </div>
                        <h4 class="card-title fw-bold mb-0">${g}</h4>
                        ${isPrime ? `<div class="text-success small mt-2 fw-bold">✨ 完美吻合！<span class="text-muted fw-normal ms-1">其他的鄰近質數：</span></div>${listHtml}` : `<div class="text-muted small mt-2">最接近的質數：</div>${listHtml}`}
                    </div>
                </div>
            </div>`;
        });
        groupCardsHtml += `</div>`;

        if (allGroupsPrime) triggerConfetti();

        if (allGroupsPrime && !isSmartGrouped && groups.length > 1) {
            analyzeHtml += `<div class="prime-result-box mb-3 shadow-sm">🎉 完美！這組號碼全部是質數！🎉</div>`;
        } else if (!allGroupsPrime) {
            analyzeHtml += `<div class="alert alert-secondary border-secondary shadow-sm mb-3">
                <strong>💡 最佳質數組合 (取最近)：</strong> <br/>
                <span class="fs-4 text-primary fw-bold mx-2">${bestCombinationParts.join(' <span class="text-muted fs-6">-</span> ')}</span>
            </div>`;
        }

        let altHtml = '';
        if (isSmartGrouped && altPartitions.length > 0) {
            altHtml += `<div class="mt-4">
                <h5 class="mb-3 text-primary fw-bold">🌟 找出的其他 ${altPartitions.length} 組全組最佳方案：</h5>
                <div class="list-group shadow-sm">
            `;
            altPartitions.forEach((alt, idx) => {
                const combinedStr = alt.parts.map(p => {
                    const padLen = p.orig.length;
                    return p.bestPrime === p.num ?
                        `<span class="text-success fw-bold">${p.orig}</span>` :
                        `<span class="text-primary fw-bold">${p.bestPrime.toString().padStart(padLen, '0')}</span> <small class="text-muted">(原${p.orig}, 距${p.dist})</small>`;
                }).join(' <span class="text-muted mx-1">-</span> ');

                altHtml += `
                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
                        <div>
                            <span class="badge bg-secondary me-2">#${idx + 2}</span>
                            <span class="fs-5">${combinedStr}</span>
                        </div>
                        <span class="badge bg-info text-dark rounded-pill shadow-sm px-3 py-2">總距離: ${alt.dist}</span>
                    </div>
                `;
            });
            altHtml += `</div></div>`;
        }

        phoneResults.innerHTML += analyzeHtml + groupCardsHtml + altHtml;
    });

    /** -----------------------------------------
     * TOOL 3: Text Prime Finder
     * ----------------------------------------- */
    const textForm = document.getElementById('textForm');
    const textResults = document.getElementById('textResults');
    const btnEncrypt = document.getElementById('btnEncrypt');
    const btnDecrypt = document.getElementById('btnDecrypt');

    if (btnEncrypt) {
        btnEncrypt.addEventListener('click', (e) => {
            e.preventDefault();
            processTextMode('encrypt');
        });
    }

    if (btnDecrypt) {
        btnDecrypt.addEventListener('click', (e) => {
            e.preventDefault();
            processTextMode('decrypt');
        });
    }

    const enterSubmitToggle = document.getElementById('enterSubmitToggle');
    const inputEncrypt = document.getElementById('textInputEncrypt');
    const inputDecrypt = document.getElementById('textInputDecrypt');

    const handleKeydown = (e, mode) => {
        if (!enterSubmitToggle || !enterSubmitToggle.checked) return;

        if (e.key === 'Enter') {
            if (e.shiftKey || e.ctrlKey) {
                // allow newline, do nothing
            } else {
                e.preventDefault();
                processTextMode(mode);
            }
        }
    };

    if (inputEncrypt) inputEncrypt.addEventListener('keydown', (e) => handleKeydown(e, 'encrypt'));
    if (inputDecrypt) inputDecrypt.addEventListener('keydown', (e) => handleKeydown(e, 'decrypt'));

    function processTextMode(mode) {
        const inputId = mode === 'encrypt' ? 'textInputEncrypt' : 'textInputDecrypt';
        const exactText = document.getElementById(inputId).value.trim();
        if (!exactText) return;
        textResults.innerHTML = '';

        if (mode === 'encrypt') {
            const tokens = [];
            // Regex: \d+ (numbers), [a-zA-Z]+ (English), . (any other char)
            const matches = exactText.match(/\d+|[a-zA-Z]+|./gu);
            if (matches) {
                matches.forEach(m => {
                    if (/^\d+$/.test(m)) {
                        // Numbers kept as numbers!
                        tokens.push({ type: 'number', text: m, chunks: [{ text: m, val: parseInt(m, 10) }] });
                    } else if (/^[a-zA-Z]+$/.test(m)) {
                        const chunks = [];
                        for (let i = 0; i < m.length; i += 3) { // limit English words to 3 chars
                            let cText = m.substr(i, 3);
                            chunks.push({ text: cText, val: TextLogic.textToNumber(cText) });
                        }
                        tokens.push({ type: 'english', text: m, chunks: chunks });
                    } else {
                        if (m.trim() !== '') {
                            tokens.push({ type: 'char', text: m, chunks: [{ text: m, val: TextLogic.textToNumber(m) }] });
                        }
                    }
                });
            }

            const fullCipherNum = [];
            const fullCipherChar = [];
            const cardsContainer = document.createElement('div');

            tokens.forEach(tokenObj => {
                const cipherNumChunks = [];
                const cipherCharChunks = [];
                let cardHtml = `<div class="card-body">
                    <h5 class="card-title fw-bold">「${tokenObj.text}」 
                    <span class="badge ${tokenObj.type === 'number' ? 'bg-secondary' : 'bg-info'} ms-2">${tokenObj.type === 'number' ? '數值' : '文字'}</span></h5>`;

                let isAllPrime = true;

                tokenObj.chunks.forEach((chunk, index) => {
                    const num = chunk.val;
                    if (num > Number.MAX_SAFE_INTEGER || isNaN(num)) {
                        cipherNumChunks.push('ERROR');
                        cipherCharChunks.push('ERROR');
                        return;
                    }

                    const isPrime = primeUtils.isPrime(num);
                    let cipherStrNum = num.toString();
                    let cipherStrChar = (tokenObj.type === 'number') ? num.toString() : chunk.text;

                    if (!isPrime) {
                        isAllPrime = false;

                        // Find closest before and after
                        let primeBefore = null;
                        let primeAfter = null;
                        let temp = num - 1;
                        while (temp > 1) {
                            if (primeUtils.isPrime(temp)) { primeBefore = temp; break; }
                            temp--;
                        }
                        temp = num + 1;
                        while (true) {
                            if (primeUtils.isPrime(temp)) { primeAfter = temp; break; }
                            temp++;
                        }

                        // Determine the absolute closest
                        const diffBefore = num - primeBefore;
                        const diffAfter = primeAfter - num;
                        let closestPrime = (primeBefore && diffBefore <= diffAfter) ? primeBefore : primeAfter;

                        const diff = num - closestPrime;
                        const sign = diff >= 0 ? '+' : '-';
                        const absDiff = Math.abs(diff);

                        cipherStrNum = `${closestPrime}${sign}${absDiff}`;

                        if (tokenObj.type === 'number') {
                            cipherStrChar = cipherStrNum;
                        } else {
                            const primeUnicode = TextLogic.numberToText(closestPrime);
                            cipherStrChar = `${primeUnicode}${sign}${absDiff}`;
                        }

                        cardHtml += `<div class="mt-3 p-2 bg-light rounded text-sm mb-2">
                            <strong>${chunk.text}</strong> (值: ${num}) 的前後質數：
                            <br/><span class="text-danger">往下找：${primeBefore} (距離 ${diffBefore})</span>
                            <br/><span class="text-primary">往上找：${primeAfter} (距離 ${diffAfter})</span><br/>
                            👉 系統採用最接近的：<strong>${cipherStrNum}</strong>
                        </div>`;
                    } else {
                        cardHtml += `<div class="mt-2 text-success">✨ <strong>${chunk.text}</strong> 本身就是完美的質數！(${num})</div>`;
                    }

                    cipherNumChunks.push(cipherStrNum);
                    cipherCharChunks.push(cipherStrChar);
                });

                if (isAllPrime && tokenObj.text === "愛") triggerConfetti();

                const finalNumStr = cipherNumChunks.join('_');
                const finalCharStr = cipherCharChunks.join('_');

                if (!isAllPrime) {
                    cardHtml += `<div class="mt-2">
                        <span class="badge bg-light text-dark border">組合密碼：${finalNumStr}</span>
                    </div>`;
                }

                cardHtml += `</div>`;

                const card = document.createElement('div');
                card.className = 'card mb-3';
                card.innerHTML = cardHtml;
                cardsContainer.appendChild(card);

                fullCipherNum.push(finalNumStr);
                fullCipherChar.push(finalCharStr);
            });

            const summaryCard = document.createElement('div');
            summaryCard.className = 'card mb-4 border-primary shadow';
            summaryCard.style.gridColumn = "1 / -1";
            summaryCard.innerHTML = `<div class="card-header bg-primary text-white fw-bold">✨ 整句轉換結果 (點擊全選複製)</div>
                <div class="card-body">
                    <p class="mb-1 small text-muted">🔢 數字密碼版本：</p>
                    <textarea class="form-control mb-3 fw-bold text-primary fs-5 bg-light copy-area" rows="2" readonly onclick="this.select();">${fullCipherNum.join(' ')}</textarea>
                    <p class="mb-1 small text-muted">🔤 文字密碼版本：</p>
                    <textarea class="form-control fw-bold text-success fs-5 bg-light copy-area" rows="2" readonly onclick="this.select();">${fullCipherChar.join(' ')}</textarea>
                </div>`;

            textResults.appendChild(summaryCard);
            while (cardsContainer.firstChild) {
                textResults.appendChild(cardsContainer.firstChild);
            }

        } else {
            // Decrypt Mode
            const fullDecodedUni = [];
            const cardsContainer = document.createElement('div');

            const words = exactText.split(/[\s,，]+/).filter(w => w);
            // Figure out if the user pasted a Character format string
            // by checking if ANY chunk contains a character instead of just numbers
            let isCharacterFormatUsed = false;
            words.forEach(word => {
                const chunks = word.split('_');
                chunks.forEach(chunk => {
                    let parsedLeft = chunk;
                    if (chunk.includes('+')) parsedLeft = chunk.split('+')[0];
                    else if (chunk.includes('-') && chunk.indexOf('-') > 0) parsedLeft = chunk.split('-')[0];
                    if (isNaN(parseInt(parsedLeft, 10))) {
                        isCharacterFormatUsed = true;
                    }
                });
            });

            words.forEach(word => {
                const chunks = word.split('_');
                let wordDecodedText = '';
                let wordDecodedNum = '';

                let cardBody = `<div class="card-body"><h6 class="card-subtitle mb-2 text-muted">解密複合算式: <span class="fw-bold text-dark">${word}</span></h6>`;

                chunks.forEach(chunk => {
                    let num = NaN;
                    let parsedLeft = chunk;
                    let mathOp = '';
                    let rightNum = 0;

                    if (chunk.includes('+')) {
                        const parts = chunk.split('+');
                        parsedLeft = parts[0];
                        mathOp = '+';
                        rightNum = parseInt(parts[1], 10);
                    } else if (chunk.includes('-') && chunk.indexOf('-') > 0) {
                        const parts = chunk.split('-');
                        parsedLeft = parts[0];
                        mathOp = '-';
                        rightNum = parseInt(parts[1], 10);
                    }

                    // if parsedLeft is a number string, parseInt handles it. 
                    // if it's a character, parseInt is NaN.
                    let baseNum = parseInt(parsedLeft, 10);
                    if (isNaN(baseNum)) {
                        baseNum = TextLogic.textToNumber(parsedLeft);
                    }

                    if (isNaN(baseNum) || baseNum > Number.MAX_SAFE_INTEGER || baseNum <= 0) {
                        cardBody += `<div class="text-danger small">[${chunk}] 無效或過大</div>`;
                        return;
                    }

                    if (mathOp === '+') {
                        num = baseNum + rightNum;
                    } else if (mathOp === '-') {
                        num = baseNum - rightNum;
                    } else {
                        num = baseNum;
                    }

                    const decodedUni = TextLogic.numberToText(num);
                    const isParsedLeftDigit = /^\d+$/.test(parsedLeft);
                    let bestGuess = '';

                    // Smart Decryption Guessing Logic
                    if (isCharacterFormatUsed) {
                        // If character format is detected, only pure digits are meant to be numbers.
                        if (isParsedLeftDigit) {
                            bestGuess = num.toString();
                        } else {
                            bestGuess = decodedUni;
                        }
                    } else {
                        // Numeric format detected (could be all mixed): try checking if textual value is standard
                        // using regex for valid printable CJK, English, and wide punctuation.
                        const isValidText = /^[\u4E00-\u9FFF\u3400-\u4DBF\u0020-\u007E\uFF00-\uFFEF\u3000-\u303F]+$/.test(decodedUni);
                        if (isValidText) {
                            bestGuess = decodedUni;
                        } else {
                            bestGuess = num.toString();
                        }
                    }

                    wordDecodedText += bestGuess;
                    wordDecodedNum += num;

                    cardBody += `<div class="small text-muted mb-1 mt-2">片段 ${chunk} → 數值: <strong>${num}</strong> → 文字/數字: <strong>${bestGuess}</strong></div>`;
                });

                cardBody += `<hr class="my-2"/><p class="mb-1">✨ 文字還原: <strong class="fs-4 text-success">${wordDecodedText}</strong></p>
                <p class="mb-1 text-muted small">🔢 數值還原: ${wordDecodedNum}</p></div>`;

                const card = document.createElement('div');
                card.className = 'card mb-3';
                card.innerHTML = cardBody;
                cardsContainer.appendChild(card);

                fullDecodedUni.push(wordDecodedText);
            });

            // Reconstruct smartly adding spaces between english tokens
            let finalOutputString = '';
            for (let i = 0; i < fullDecodedUni.length; i++) {
                const cur = fullDecodedUni[i];
                if (i > 0) {
                    const prev = fullDecodedUni[i - 1];
                    // Basic heuristic: if both previous and current are English words, add a space
                    if (/^[a-zA-Z]+$/.test(cur) && /^[a-zA-Z]+$/.test(prev)) {
                        finalOutputString += ' ';
                    }
                }
                finalOutputString += cur;
            }

            const summaryCard = document.createElement('div');
            summaryCard.className = 'card mb-4 border-success shadow';
            summaryCard.style.gridColumn = "1 / -1";
            summaryCard.innerHTML = `<div class="card-header bg-success text-white fw-bold">✨ 整句解密結果 (點擊全選複製)</div>
                <div class="card-body">
                    <p class="mb-1 small text-muted">✨ 完美還原：</p>
                    <textarea class="form-control mb-3 fw-bold text-success fs-5 bg-light copy-area" rows="2" readonly onclick="this.select();">${finalOutputString}</textarea>
                </div>`;

            textResults.appendChild(summaryCard);
            while (cardsContainer.firstChild) {
                textResults.appendChild(cardsContainer.firstChild);
            }
        }
    }

    /** -----------------------------------------
     * TOOL 4: Prime Sum Explorer
     * ----------------------------------------- */
    const sumForm = document.getElementById('sumForm');
    const sumResults = document.getElementById('sumResultsBody');
    const searchStatus = document.getElementById('searchStatus');

    if (dbFileInput) {
        dbFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            dbStatus.classList.remove('d-none', 'text-success', 'text-danger');
            dbStatus.classList.add('text-primary');
            dbStatus.textContent = '載入並快取檔案中，請稍候...';

            try {
                const result = await primeUtils.loadDbFromFile(file);
                dbStatus.classList.remove('text-primary');
                dbStatus.classList.add('text-success');
                dbStatus.innerHTML = `✅ 成功載入與快取！此資料庫支援驗證至數值: <strong>${result.max.toLocaleString()}</strong>`;
                if (clearDbBtn) clearDbBtn.classList.remove('d-none');

                // Update limits
                const limitInput = document.getElementById('sumLimit');
                limitInput.max = primeUtils.dbMaxPrime > 0 ? primeUtils.dbMaxPrime : 1000000000;
                limitInput.value = Math.min(limitInput.max, 5000000); // provide a bigger default
                document.getElementById('sumMaxLen').max = 5000;
            } catch (err) {
                console.error(err);
                dbStatus.classList.remove('text-primary');
                dbStatus.classList.add('text-danger');
                dbStatus.textContent = `❌ 載入失敗: ${err.message}`;
            }
        });
    }

    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', async () => {
            await primeUtils.clearCache();
            dbFileInput.value = '';
            clearDbBtn.classList.add('d-none');
            dbStatus.classList.remove('text-primary', 'text-success', 'text-danger');
            dbStatus.classList.add('text-muted');
            dbStatus.textContent = '快取已清除，恢復內建快速搜尋模式。';

            // Revert limits
            const limitInput = document.getElementById('sumLimit');
            if (limitInput) {
                limitInput.max = 1000000;
                limitInput.value = 2000;
                const sumMaxLen = document.getElementById('sumMaxLen');
                if (sumMaxLen) sumMaxLen.max = 1000;
            }
        });
    }

    sumForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const minL = parseInt(document.getElementById('sumMinLen').value);
        const maxL = parseInt(document.getElementById('sumMaxLen').value);
        const limit = parseInt(document.getElementById('sumLimit').value);

        sumResults.innerHTML = '<tr><td colspan="4" class="text-center">搜尋中...</td></tr>';
        searchStatus.textContent = '準備計算中...';

        const submitBtn = sumForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await runPrimeSumAsync(minL, maxL, limit, searchStatus);
        } catch (err) {
            console.error(err);
            searchStatus.textContent = `❌ 計算錯誤: ${err.message}`;
        } finally {
            submitBtn.disabled = false;
        }
    });

    async function runPrimeSumAsync(minLen, maxLen, limit, statusEl) {
        statusEl.textContent = `開始收集範圍內的質數 (至 ${limit.toLocaleString()})...`;
        await new Promise(r => setTimeout(r, 10)); // yield to UI

        const primes = [];
        let chunkLimit = 500000;
        for (let i = 2; i <= limit; i++) {
            if (primeUtils.isPrime(i)) primes.push(i);

            if (i % chunkLimit === 0) {
                statusEl.textContent = `收集質數中... (目前掃描至 ${i.toLocaleString()}, 找到 ${primes.length.toLocaleString()} 個)`;
                await new Promise(r => setTimeout(r, 0));
            }
        }

        statusEl.textContent = `質數收集完成 (共 ${primes.length.toLocaleString()} 個)。開始組合計算...`;
        await new Promise(r => setTimeout(r, 10));

        const results = [];
        let comboCount = 0;
        chunkLimit = 1000; // process 1000 base primes per UI yield

        for (let i = 0; i < primes.length; i++) {
            let currentSum = primes[i];

            for (let j = i + 1; j < Math.min(primes.length, i + maxLen); j++) {
                currentSum += primes[j];
                const length = j - i + 1;

                if (length >= minLen && length <= maxLen && currentSum <= limit) {
                    if (primeUtils.isPrime(currentSum)) {
                        const seq = primes.slice(i, j + 1);
                        results.push({
                            sum: currentSum,
                            length: length,
                            sequence: seq.join(' + ')
                        });
                        comboCount++;
                        if (comboCount > 5000) break; // Arbitrary UI limit securely
                    }
                }
                if (currentSum > limit) break;
            }

            if (comboCount > 5000) break; // stop early

            if (i % chunkLimit === 0 && i > 0) {
                statusEl.textContent = `計算中... 進度: ${((i / primes.length) * 100).toFixed(1)}% (已找到 ${results.length} 組)`;
                await new Promise(r => setTimeout(r, 0));
            }
        }

        statusEl.textContent = `組合計算完成！正在整理並輸出結果...`;
        await new Promise(r => setTimeout(r, 10));

        // Group & Sort
        results.sort((a, b) => b.length - a.length || a.sum - b.sum);

        sumResults.innerHTML = '';
        if (results.length === 0) {
            sumResults.innerHTML = '<tr><td colspan="4" class="text-center">沒有找到結果</td></tr>';
        } else {
            const fragment = document.createDocumentFragment();
            results.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                     <td class="fw-bold">${r.sum}</td>
                     <td>${r.length}</td>
                     <td>${r.sequence}</td>
                 `;
                fragment.appendChild(tr);
            });
            sumResults.appendChild(fragment);
        }
        statusEl.textContent = `搜尋完成。找到 ${results.length} 組連續質數和。`;
    }

});
