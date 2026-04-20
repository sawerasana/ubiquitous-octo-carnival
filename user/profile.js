/**
 * profile.js – Personal Hub (Full file)
 * - Wallet balance from PX.getWalletBalance()
 * - Live subscription countdown (canvas ring, pulse when <10 min)
 * - Editable first name, last name, aviator platform
 * - Copy 99‑char ID key
 * - VIP Plans button redirects to /vip/access-plans.html
 * - Withdraw button: opens WhatsApp with pre‑typed message, then shows return modal
 * - Logout with confirmation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }
    let userData = PX.getUser(userKey) || {};

    // --- DOM elements ---
    const walletBalanceSpan = document.getElementById('walletBalance');
    const planNameSpan = document.getElementById('planName');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerCanvas = document.getElementById('timerCanvas');
    const ctx = timerCanvas.getContext('2d');
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const aviatorSelect = document.getElementById('aviatorSelect');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const copyIdKeyBtn = document.getElementById('copyIdKeyBtn');
    const vipPlansBtn = document.getElementById('vipPlansBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');

    // --- Populate aviator platforms ---
    const platforms = [
        "1win", "Pin-Up", "Mostbet", "1xBet", "Parimatch", "Bet365", "Betway", "22Bet", "888casino",
        "Betwinner", "Melbet", "JJ win", "bJbaji", "Stake.com", "BC.Game", "Betpanda", "Lucky Block",
        "Metaspins", "Cloudbet", "Vave Casino", "Cryptorino", "Wild.io", "CoinCasino", "Hollywoodbets",
        "Betfred", "Supabets", "4rabet", "Rajabets", "BlueChip", "10CRIC", "BetMGM", "Unibet",
        "Lottoland", "EstrelaBet", "Betano", "KTO", "Megapari", "Leon", "Bons", "SportyBet"
    ];
    platforms.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (userData.aviatorName === p) opt.selected = true;
        aviatorSelect.appendChild(opt);
    });

    // --- Load user data into form ---
    firstNameInput.value = userData.firstName || '';
    lastNameInput.value = userData.lastName || '';
    if (userData.aviatorName) aviatorSelect.value = userData.aviatorName;

    // --- Wallet balance ---
    function updateWalletDisplay() {
        const balance = PX.getWalletBalance();
        walletBalanceSpan.textContent = balance.toLocaleString() + ' PKR';
    }
    updateWalletDisplay();

    // --- Live subscription timer ---
    let timerInterval = null;
    let expiryNotified = false;

    function drawTimerRing(percent) {
        if (!ctx) return;
        const radius = 30;
        const center = 35;
        const circumference = 2 * Math.PI * radius;
        ctx.clearRect(0, 0, 70, 70);
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        const endAngle = -Math.PI / 2 + (2 * Math.PI * percent);
        ctx.arc(center, center, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    }

    function updateTimer() {
        const sub = PX.getSubscription();
        let isActive = false;
        let remainingMs = 0;
        let plan = 'Free';
        if (sub && sub.expiry && sub.expiry > Date.now()) {
            isActive = true;
            remainingMs = sub.expiry - Date.now();
            plan = sub.plan.toUpperCase();
        }
        planNameSpan.textContent = plan;
        if (!isActive) {
            timerDisplay.textContent = 'Inactive';
            timerDisplay.classList.remove('pulse-timer');
            drawTimerRing(0);
            if (!expiryNotified && sub && sub.expiry && sub.expiry <= Date.now()) {
                expiryNotified = true;
                PX.showModal(
                    'Subscription Expired',
                    'سبسکرپشن ختم',
                    'Your subscription has expired! Please renew to continue using predictions.',
                    'آپ کی سبسکرپشن ختم ہو گئی ہے! پیشن گوئیاں جاری رکھنے کے لیے براہ کرم تجدید کریں۔',
                    null, false
                );
            }
            return;
        }
        expiryNotified = false;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (3600000)) / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        timerDisplay.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        if (remainingMs < 10 * 60 * 1000) {
            timerDisplay.classList.add('pulse-timer');
        } else {
            timerDisplay.classList.remove('pulse-timer');
        }
        let maxDuration = 72 * 60 * 60 * 1000;
        if (sub.plan === 'standard') maxDuration = 24 * 60 * 60 * 1000;
        else if (sub.plan === 'basic') maxDuration = 30 * 60 * 1000;
        const percent = Math.max(0, Math.min(1, remainingMs / maxDuration));
        drawTimerRing(percent);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
    startTimer();

    // --- Save changes to profile ---
    function saveChanges() {
        const newFirstName = firstNameInput.value.trim();
        const newLastName = lastNameInput.value.trim();
        const newAviator = aviatorSelect.value;
        if (!newFirstName || !newLastName) {
            PX.showModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'First name and last name cannot be empty.',
                'پہلا نام اور آخری نام خالی نہیں ہو سکتے۔',
                null, false
            );
            return;
        }
        userData.firstName = newFirstName;
        userData.lastName = newLastName;
        userData.aviatorName = newAviator;
        PX.saveUser(userKey, userData);
        PX.showModal(
            'Profile Updated',
            'پروفائل اپڈیٹ',
            'Your settings have been saved successfully.',
            'آپ کی ترتیبات کامیابی سے محفوظ ہوگئیں۔',
            null, false
        );
    }
    saveChangesBtn.addEventListener('click', saveChanges);

    // --- Copy 99‑char ID key ---
    async function copyIdKey() {
        try {
            await navigator.clipboard.writeText(userKey);
            PX.showModal(
                'Copied',
                'کاپی ہوگیا',
                'Your ID key has been copied to clipboard.',
                'آپ کی شناختی کلید کلپ بورڈ پر کاپی ہوگئی۔',
                null, false
            );
        } catch (err) {
            PX.showModal(
                'Copy Failed',
                'کاپی ناکام',
                'Please copy manually.',
                'براہ کرم دستی طور پر کاپی کریں۔',
                null, false
            );
        }
    }
    copyIdKeyBtn.addEventListener('click', copyIdKey);

    // --- VIP Plans button ---
    if (vipPlansBtn) {
        vipPlansBtn.addEventListener('click', () => {
            window.location.href = '/vip/access-plans.html';
        });
    }

    // --- Withdraw button logic ---
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            const message = "Hello darkecho , I invited people to the website , now I want to withdraw the money , please send me the money";
            const url = `https://wa.me/923128942224?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');

            // Show modal after returning from WhatsApp
            setTimeout(() => {
                PX.showModal(
                    'Pending Approval',
                    'زیر التواء منظوری',
                    'After confirmation from the owner, you will receive your funds. Please send your receiving source (Easypaisa/Jazzcash) to the owner.',
                    'مالک کی تصدیق کے بعد، آپ کو آپ کی رقم مل جائے گی۔ براہ کرم اپنا وصول کرنے کا ذریعہ (ایزی پیسہ/جاز کیش) مالک کو بھیجیں۔',
                    null,
                    false
                );
            }, 1500);
        });
    }

    // --- Logout modal ---
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
    logoutCancel.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
    logoutConfirm.addEventListener('click', () => {
        PX.logout();
    });
});
