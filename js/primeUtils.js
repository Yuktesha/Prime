/**
 * primeUtils.js
 * Contains all core prime logic: checks, generation, PrimesDB array loading (simulated or real).
 */

class PrimeUtils {
    constructor() {
        this.primeCache = new Set();
        this.maxSieve = 1000000; // Generate up to 1M initially for fast lookup
        this.sieveLoaded = false;

        // Extended DB
        this.dbView = null; // Will hold Uint8Array for PrimesDB
        this.dbMaxPrime = 0;
    }

    async init() {
        if (!this.sieveLoaded) {
            console.log("Generating initial prime cache...");
            this._generateSieve(this.maxSieve);
            this.sieveLoaded = true;
            console.log(`Cached ${this.primeCache.size} primes up to ${this.maxSieve}`);
        }
    }

    _generateSieve(limit) {
        const sieve = new Uint8Array(limit + 1);
        sieve[0] = 1; sieve[1] = 1;
        for (let p = 2; p * p <= limit; p++) {
            if (sieve[p] === 0) {
                for (let i = p * p; i <= limit; i += p) {
                    sieve[i] = 1; // 1 means not prime
                }
            }
        }
        for (let p = 2; p <= limit; p++) {
            if (sieve[p] === 0) {
                this.primeCache.add(p);
            }
        }
    }

    // Load external binary DB
    async loadDbFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const buffer = e.target.result;
                    this.dbView = new Uint8Array(buffer); // PrimesDB is a byte-array bitmap
                    // PrimesDB format: 1 byte covers 2 decades (20 numbers)
                    // The maximum checkable number is bytes * 20
                    this.dbMaxPrime = this.dbView.length * 20;

                    console.log(`Loaded PrimesDB with ${this.dbView.length.toLocaleString()} bytes, max support: ${this.dbMaxPrime.toLocaleString()}`);
                    // We don't have the exact prime "count", so we return the max supported number or byte size
                    resolve({ bytes: this.dbView.length, max: this.dbMaxPrime });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    // PrimesDB O(1) bitwise lookup
    _checkPrimesDb(n) {
        if (n === 2 || n === 3 || n === 5 || n === 7) return true;

        const lastDigit = n % 10;
        if (lastDigit === 0 || lastDigit === 2 || lastDigit === 4 || lastDigit === 5 || lastDigit === 6 || lastDigit === 8) {
            return false;
        }

        const decade = Math.floor(n / 10);
        // JS precision is fine here since max is 1.3 billion
        const address = Math.floor(decade / 2 + 0.5) - 1;

        if (address >= this.dbView.length) return false;

        let bitPos = 0;
        if (lastDigit === 1) bitPos = 0;
        else if (lastDigit === 3) bitPos = 1;
        else if (lastDigit === 7) bitPos = 2;
        else if (lastDigit === 9) bitPos = 3;

        if (decade % 2 === 0) {
            bitPos += 4;
        }

        const byte = this.dbView[address];
        const bitVal = (byte >> bitPos) & 1;

        return bitVal === 1;
    }

    // Standard prime check
    isPrime(n) {
        if (n < 2) return false;
        if (n === 2 || n === 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;

        // Check external DB first if loaded and within range
        if (this.dbView && n <= this.dbMaxPrime) {
            return this._checkPrimesDb(n);
        }

        // Fallback to internal fast sieve
        if (n <= this.maxSieve && this.sieveLoaded) {
            return this.primeCache.has(n);
        }

        // Standard 6k +/- 1 check for larger numbers (fallback)
        let i = 5;
        while (i * i <= n) {
            if (n % i === 0 || n % (i + 2) === 0) {
                return false;
            }
            i += 6;
        }
        return true;
    }

    // Find primes near a number
    findPrimesNear(number, count, direction) {
        const result = [];
        let current = number;
        const step = direction === 'larger' ? 1 : -1;

        if (direction === 'smaller') current -= 1;
        else current += 1;

        while (result.length < count && current > 1) {
            if (this.isPrime(current)) {
                result.push(current);
            }
            current += step;
        }

        return result;
    }

    findClosestPrimes(number, count = 5) {
        const largerPrimes = this.findPrimesNear(number, count, 'larger');
        const smallerPrimes = this.findPrimesNear(number, count, 'smaller');

        const combined = [];
        largerPrimes.forEach(p => combined.push({ prime: p, distance: p - number }));
        smallerPrimes.forEach(p => combined.push({ prime: p, distance: number - p }));

        // Sort by distance
        combined.sort((a, b) => a.distance - b.distance);

        // Return top 'count'
        return combined.slice(0, count);
    }
}

// License Plate specific Base36 logic
const Base36 = {
    toBase10: (str) => {
        return parseInt(str.toUpperCase(), 36);
    },
    toBase36: (num) => {
        return num.toString(36).toUpperCase();
    },
    hasLetters: (str) => {
        return /[a-zA-Z]/.test(str);
    }
};

// Text specific logic for exact reversible mapping
const TextLogic = {
    textToNumber: (text) => {
        if (!text) return 0;
        // Universal UTF-16 packing for ALL languages, spaces, symbols
        let hex = '';
        for (let i = 0; i < text.length; i++) {
            hex += text.charCodeAt(i).toString(16).padStart(4, '0');
        }
        const num = parseInt(hex, 16);
        return num; // Note: JS max safe int is 9e15 (fits exactly 3-4 characters per chunk)
    },

    numberToText: (num) => {
        let hex = num.toString(16);
        if (hex.length % 4 !== 0) {
            hex = hex.padStart(hex.length + (4 - hex.length % 4), '0');
        }
        let str = '';
        for (let i = 0; i < hex.length; i += 4) {
            str += String.fromCharCode(parseInt(hex.substr(i, 4), 16));
        }
        return str;
    }
}

// Confetti Generator
function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.classList.add('confetti-canvas');
    document.body.appendChild(canvas);

    // In a real app we'd use a confetti library like canvas-confetti
    // For now, let's inject script tag to load it from CDN
    if (!window.confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = () => {
            playConfetti();
        };
        document.head.appendChild(script);
    } else {
        playConfetti();
    }

    function playConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#28a745', '#ffc107', '#007bff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#28a745', '#ffc107', '#007bff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            } else {
                setTimeout(() => canvas.remove(), 1000);
            }
        }());
    }
}

window.primeUtils = new PrimeUtils();
window.Base36 = Base36;
window.TextLogic = TextLogic;
window.triggerConfetti = triggerConfetti;
