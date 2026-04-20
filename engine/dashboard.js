/**
 * dashboard.js – Radar Hub (Full file)
 * - Radar sweep with floating numbers (opacity fades to 0 at edge)
 * - 220+ pre-loaded English logs
 * - Free user: redirect to /vip/access-plans.html on "Get Prediction"
 * - VIP user: weighted multiplier with cooldown
 * - Invite & Earn and Profile navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }
    const userData = PX.getUser(userKey) || {};

    // --- DOM elements ---
    const userNameSpan = document.getElementById('userNameDisplay');
    const platformNameSpan = document.getElementById('platformName');
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const predictBtn = document.getElementById('predictBtn');
    const predictStatus = document.getElementById('predictStatus');
    const inviteEarnBtn = document.getElementById('inviteEarnBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');
    const logContainer = document.getElementById('logContainer');
    const radarCanvas = document.getElementById('radarCanvas');
    const ctx = radarCanvas.getContext('2d');

    // --- Radar dimensions ---
    let width = 600, height = 600;
    radarCanvas.width = width;
    radarCanvas.height = height;
    let angle = 0;
    let floatingNumbers = [];

    // --- User info & subscription ---
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Pilot';
    userNameSpan.textContent = fullName;
    platformNameSpan.textContent = userData.aviatorName || 'Aviator';
    let subscriptionActive = PX.isSubscriptionActive();
    let subscriptionPlan = 'free';
    const subObj = PX.getSubscription();
    if (subObj && subObj.plan) subscriptionPlan = subObj.plan;

    function updateSubscriptionUI() {
        subscriptionActive = PX.isSubscriptionActive();
        if (subscriptionActive && subObj && subObj.plan) {
            subscriptionPlan = subObj.plan;
            subscriptionBadge.textContent = subscriptionPlan.toUpperCase();
            subscriptionBadge.className = `badge ${subscriptionPlan}`;
            predictBtn.classList.remove('disabled');
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<i class="fas fa-chart-simple"></i> GET PREDICTION';
            predictBtn.style.background = '';
            predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
            predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
        } else {
            subscriptionPlan = 'free';
            subscriptionBadge.textContent = 'FREE';
            subscriptionBadge.className = 'badge free';
            // Button is clickable but looks locked
            predictBtn.classList.remove('disabled');
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<i class="fas fa-lock"></i> GET PREDICTION (LOCKED)';
            predictBtn.style.background = '#555';
            predictStatus.querySelector('.english-text').textContent = 'Upgrade to VIP to unlock';
            predictStatus.querySelector('.urdu-text').textContent = 'VIP میں اپگریڈ کریں';
        }
    }
    updateSubscriptionUI();

    // --- Weighted multiplier from PX_CONFIG ---
    function getWeightedMultiplier() {
        const cfg = PX.CONFIG?.radarMultipliers || {
            low: { min: 1.00, max: 10.00, weight: 0.80 },
            mid: { min: 10.01, max: 30.00, weight: 0.15 },
            high: { min: 30.01, max: 60.00, weight: 0.05 }
        };
        const rand = Math.random();
        let range;
        if (rand < cfg.low.weight) range = cfg.low;
        else if (rand < cfg.low.weight + cfg.mid.weight) range = cfg.mid;
        else range = cfg.high;
        const val = range.min + Math.random() * (range.max - range.min);
        return val.toFixed(2);
    }

    // --- Prediction logic (VIP only) ---
    let isCooldown = false;
    let cooldownTimer = null;

    async function startPrediction() {
        if (!subscriptionActive || isCooldown) return;
        isCooldown = true;
        predictBtn.disabled = true;
        predictBtn.classList.add('cooldown');
        predictStatus.querySelector('.english-text').textContent = 'Calculating neural path...';
        predictStatus.querySelector('.urdu-text').textContent = 'نیورل پاتھ کا حساب لگایا جا رہا ہے...';
        multiplierDisplay.textContent = '---';
        await new Promise(resolve => setTimeout(resolve, 2000));
        const multiplier = getWeightedMultiplier();
        multiplierDisplay.textContent = `${multiplier}x`;
        predictStatus.querySelector('.english-text').textContent = `Prediction: ${multiplier}x - Cooling down`;
        predictStatus.querySelector('.urdu-text').textContent = `پیشن گوئی: ${multiplier}x - ٹھنڈا ہو رہا ہے`;
        const cooldownSec = PX.CONFIG?.predictionCooldownSec || 10;
        let remaining = cooldownSec;
        cooldownTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(cooldownTimer);
                isCooldown = false;
                predictBtn.disabled = false;
                predictBtn.classList.remove('cooldown');
                predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
                predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
            } else {
                predictStatus.querySelector('.english-text').textContent = `Ready in ${remaining}s`;
                predictStatus.querySelector('.urdu-text').textContent = `${remaining} سیکنڈ میں تیار`;
            }
        }, 1000);
    }

    // --- PREDICTION BUTTON LOGIC (FREE → REDIRECT, VIP → PREDICT) ---
    predictBtn.addEventListener('click', () => {
        if (!subscriptionActive) {
            // Free user: show loader, then redirect to plans
            PX.showLoader(1000, () => {
                window.location.href = '/vip/access-plans.html';
            });
            return;
        }
        if (!isCooldown) startPrediction();
    });

    // --- Invite & Earn button ---
    inviteEarnBtn.addEventListener('click', () => {
        window.location.href = '/user/invite-earn.html';
    });

    // --- Profile and logout ---
    profileBtn.addEventListener('click', () => {
        window.location.href = '/user/profile.html';
    });
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
    logoutCancel.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
    logoutConfirm.addEventListener('click', () => {
        PX.logout();
    });

    // --- Log Stream: 220+ pre-loaded English logs ---
    const logMessages = [
        "[SECURE] Signal detected at 4.2x", "[INFO] Satellite Uplink Stable",
        "[RADAR] Echo return 0.42ms", "[ALERT] Anomaly at bearing 045",
        "[SYNC] Neural engine calibrated", "[DATA] Processing 12.7k signals/sec",
        "[SECURE] Handshake complete", "[RADAR] New contact, heading 330",
        "[INFO] Doppler shift: 87Hz", "[ALERT] Target locked, confidence 98%",
        "[SYNC] Aviator stream synced", "[SECURE] Encryption layer verified",
        "[RADAR] Sweep frequency adjusted", "[DATA] Bandwidth: 2400 MHz",
        "[INFO] Power output: 92%", "[ALERT] Signal strength fluctuation",
        "[SYNC] Neural network online", "[SECURE] Firewall bypassed",
        "[RADAR] Long-range scan initiated", "[DATA] 245 active contacts"
    ];
    for (let i = 0; i < 220; i++) {
        const msg = logMessages[i % logMessages.length] + ` (${Math.floor(Math.random() * 100)}%)`;
        const logLine = document.createElement('div');
        logLine.className = 'log-line';
        const time = new Date(Date.now() - (220 - i) * 1000).toLocaleTimeString();
        logLine.textContent = `[${time}] ${msg}`;
        logContainer.appendChild(logLine);
    }

    // --- Radar Canvas with sweep and fading numbers ---
    function generateRandomNumberValue() {
        const cfg = PX.CONFIG?.radarMultipliers || {
            low: { min: 1.00, max: 10.00, weight: 0.80 },
            mid: { min: 10.01, max: 30.00, weight: 0.15 },
            high: { min: 30.01, max: 60.00, weight: 0.05 }
        };
        const rand = Math.random();
        let range;
        if (rand < cfg.low.weight) range = cfg.low;
        else if (rand < cfg.low.weight + cfg.mid.weight) range = cfg.mid;
        else range = cfg.high;
        const val = range.min + Math.random() * (range.max - range.min);
        return val.toFixed(2);
    }

    function createFloatingNumber() {
        const cx = width/2, cy = height/2;
        const radius = Math.random() * 260;
        const angleRad = Math.random() * Math.PI * 2;
        const x = cx + radius * Math.cos(angleRad);
        const y = cy + radius * Math.sin(angleRad);
        const maxRadius = 260;
        const opacity = Math.max(0, 1 - (radius / maxRadius));
        const value = generateRandomNumberValue();
        return { x, y, value, opacity, life: 1.0 };
    }

    function updateFloatingNumbers() {
        if (Math.random() < 0.12) {
            floatingNumbers.push(createFloatingNumber());
        }
        for (let i = 0; i < floatingNumbers.length; i++) {
            floatingNumbers[i].life -= 0.01;
            if (floatingNumbers[i].life <= 0) {
                floatingNumbers.splice(i,1);
                i--;
            }
        }
    }

    function drawRadar() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#ff0000aa';
        ctx.lineWidth = 1;
        for (let r = 50; r <= 250; r += 50) {
            ctx.beginPath();
            ctx.arc(width/2, height/2, r, 0, 2*Math.PI);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        for (let num of floatingNumbers) {
            const alpha = num.opacity * num.life;
            ctx.font = `bold ${12 + 6 * num.life}px monospace`;
            ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'red';
            ctx.fillText(`${num.value}x`, num.x - 12, num.y - 6);
        }
        ctx.shadowBlur = 0;
        const centerX = width/2, centerY = height/2;
        const radius = 240;
        const rad = angle * Math.PI / 180;
        const endX = centerX + radius * Math.cos(rad);
        const endY = centerY + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();
        angle = (angle + 2) % 360;
        updateFloatingNumbers();
        requestAnimationFrame(drawRadar);
    }
    drawRadar();
});
