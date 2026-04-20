/**
 * loading.js - 20‑second cinematic transition
 * - SVG progress ring fills exactly over 20 seconds (from PX_CONFIG)
 * - Rotating bilingual messages every 4 seconds
 * - Optional ping sound on message change
 * - Redirects to /engine/dashboard.html after completion
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: only logged‑in users can see this page ---
    if (!PX.getCurrentUserKey()) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const statusEng = document.getElementById('statusEng');
    const statusUrdu = document.getElementById('statusUrdu');
    const progressRing = document.querySelector('.progress-ring-fill');
    const pingAudio = document.getElementById('pingSound');

    // --- Load config ---
    const TOTAL_DURATION = (PX.CONFIG?.mainLoadingSec || 20) * 1000; // default 20 seconds
    const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88 => approx 553.0
    let startTime = null;
    let animationFrame = null;
    let messageInterval = null;
    let currentMessageIndex = 0;

    // --- Bilingual message pairs (5 pairs, rotate every 4 seconds) ---
    const messagePairs = [
        { eng: "Connecting to Neural Network...", urdu: "نیورل نیٹ ورک سے منسلک ہو رہا ہے..." },
        { eng: "Analyzing Platform Data...", urdu: "پلیٹ فارم ڈیٹا کا تجزیہ کیا جا رہا ہے..." },
        { eng: "Bypassing Security Layers...", urdu: "سیکیورٹی لیئرز کو بائی پاس کیا جا رہا ہے..." },
        { eng: "Calibrating Radar Precision...", urdu: "ریڈار کی درستگی کی پیمائش ہو رہی ہے..." },
        { eng: "Accessing Live Intelligence...", urdu: "لائیو انٹیلیجنس تک رسائی حاصل کی جا رہی ہے..." }
    ];

    // --- Function to change message (every 4 seconds) ---
    function rotateMessage() {
        currentMessageIndex = (currentMessageIndex + 1) % messagePairs.length;
        const pair = messagePairs[currentMessageIndex];
        statusEng.textContent = pair.eng;
        statusUrdu.textContent = pair.urdu;

        // Optional ping sound (if file exists, otherwise silent fail)
        if (pingAudio) {
            pingAudio.currentTime = 0;
            pingAudio.play().catch(e => console.log("Audio play blocked:", e));
        }
    }

    // --- Progress ring update based on elapsed time ---
    function updateProgress(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / TOTAL_DURATION);
        const offset = CIRCUMFERENCE * (1 - progress);
        progressRing.style.strokeDashoffset = offset;

        if (elapsed < TOTAL_DURATION) {
            animationFrame = requestAnimationFrame(updateProgress);
        } else {
            // Complete: set to 0 offset (full ring)
            progressRing.style.strokeDashoffset = 0;
            finishLoading();
        }
    }

    // --- Finish loading: stop intervals, show final loader, redirect to dashboard ---
    function finishLoading() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (messageInterval) clearInterval(messageInterval);

        // Final status update
        statusEng.textContent = "Access Granted. Redirecting...";
        statusUrdu.textContent = "رسائی دی گئی۔ ری ڈائریکٹ ہو رہا ہے...";

        // Use global loader for smooth transition
        PX.showLoader(1000, () => {
            window.location.href = '/engine/dashboard.html';
        });
    }

    // --- Start the loading sequence ---
    function startLoading() {
        // Set initial ring state
        progressRing.style.strokeDasharray = CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = CIRCUMFERENCE;

        // Start progress animation
        startTime = null;
        animationFrame = requestAnimationFrame(updateProgress);

        // Rotate messages every 4 seconds
        messageInterval = setInterval(rotateMessage, 4000);

        // Set first message immediately
        const firstPair = messagePairs[0];
        statusEng.textContent = firstPair.eng;
        statusUrdu.textContent = firstPair.urdu;
    }

    startLoading();
});
