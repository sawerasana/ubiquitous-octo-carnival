/**
 * payment.js – Secure Payment Logic
 * - 3-step TRX validation: attempts 1&2 fail with error modal, attempt 3 succeeds
 * - Generates key based on plan from URL: basic→33, standard→44, premium→55
 * - Displays key with copy button, back to plans button
 * - UPDATED: Amounts for Basic (10,000), Standard (17,000), Premium (33,000) PKR
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- Get plan from URL (?plan=basic/standard/premium) with updated amounts ---
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'basic';
    let expectedKeyLength = 33;
    let amount = 10000;  // Basic: 10,000 PKR (30 minutes)
    if (plan === 'standard') {
        expectedKeyLength = 44;
        amount = 17000;   // Standard: 17,000 PKR (1 hour)
    } else if (plan === 'premium') {
        expectedKeyLength = 55;
        amount = 33000;   // Premium: 33,000 PKR (2 hours)
    }

    // --- DOM elements ---
    const trxInput = document.getElementById('trxInput');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const spinnerMessage = document.getElementById('spinnerMessage');
    const successArea = document.getElementById('successArea');
    const generatedKeySpan = document.getElementById('generatedKeyDisplay');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const backToPlansBtn = document.getElementById('backToPlansBtn');
    const backBtn = document.getElementById('backBtn');
    const copyAccountBtn = document.getElementById('copyAccountBtn');
    const accountNumberSpan = document.getElementById('accountNumber');
    const amountDisplay = document.getElementById('amountDisplay');
    const amountDisplayUrdu = document.getElementById('amountDisplayUrdu');

    // Set amount display
    if (amountDisplay) amountDisplay.textContent = amount + ' PKR';
    if (amountDisplayUrdu) amountDisplayUrdu.textContent = amount + ' PKR';

    // --- TRX attempt counter (resets on page load, not persisted) ---
    let trxAttempts = 0;
    let currentGeneratedKey = '';

    // --- Helper: Show loader with custom bilingual message ---
    function showCustomLoader(durationMs, engMsg, urduMsg, onComplete) {
        if (spinnerMessage) {
            spinnerMessage.querySelector('.english-text').textContent = engMsg;
            spinnerMessage.querySelector('.urdu-text').textContent = urduMsg;
        }
        loadingSpinner.style.display = 'block';
        confirmBtn.disabled = true;
        setTimeout(() => {
            loadingSpinner.style.display = 'none';
            confirmBtn.disabled = false;
            if (onComplete) onComplete();
        }, durationMs);
    }

    // --- Helper: Copy account number to clipboard ---
    if (copyAccountBtn && accountNumberSpan) {
        copyAccountBtn.addEventListener('click', async () => {
            const accountNumber = accountNumberSpan.textContent;
            try {
                await navigator.clipboard.writeText(accountNumber);
                PX.showModal(
                    'Copied',
                    'کاپی ہوگیا',
                    'Account number copied to clipboard.',
                    'اکاؤنٹ نمبر کلپ بورڈ پر کاپی ہوگیا۔',
                    null,
                    false
                );
            } catch (err) {
                PX.showModal(
                    'Copy Failed',
                    'کاپی ناکام',
                    'Please copy manually.',
                    'براہ کرم دستی طور پر کاپی کریں۔',
                    null,
                    false
                );
            }
        });
    }

    // --- TRX confirmation logic (2 fails, 3rd success) ---
    async function handleConfirmPayment() {
        const trxId = trxInput.value.trim();
        if (!trxId) {
            PX.showModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'Please enter your TRX ID.',
                'براہ کرم اپنا TRX ID درج کریں۔',
                null,
                false
            );
            return;
        }
        // Basic validation: only numbers
        if (!/^\d+$/.test(trxId)) {
            PX.showModal(
                'Invalid Format',
                'غلط فارمیٹ',
                'TRX ID should contain only numbers.',
                'TRX ID میں صرف نمبرز ہونے چاہئیں۔',
                null,
                false
            );
            return;
        }
        trxAttempts++;
        if (trxAttempts < 3) {
            // First two attempts: show 3s loader then error modal
            await new Promise((resolve) => {
                showCustomLoader(3000,
                    'Connecting to Easypaisa Gateway...',
                    'ایزی پیسہ گیٹ وے سے منسلک ہو رہا ہے...',
                    resolve
                );
            });
            PX.showModal(
                'Transaction Not Found',
                'ٹرانزیکشن نہیں ملی',
                'Transaction Not Found. Please wait 1-2 minutes for SMS synchronization and try again.',
                'ٹرانزیکشن نہیں ملی۔ براہ کرم ایس ایم ایس کی ہم آہنگی کے لیے 1-2 منٹ انتظار کریں اور دوبارہ کوشش کریں۔',
                null,
                false
            );
            trxInput.value = '';
        } else {
            // Third attempt: success after 5s loader with rotating messages
            loadingSpinner.style.display = 'block';
            confirmBtn.disabled = true;
            if (spinnerMessage) {
                spinnerMessage.querySelector('.english-text').textContent = 'Verifying Merchant Funds...';
                spinnerMessage.querySelector('.urdu-text').textContent = 'مرچنٹ فنڈز کی تصدیق ہو رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 2500));
            if (spinnerMessage) {
                spinnerMessage.querySelector('.english-text').textContent = 'Finalizing Protocol Access...';
                spinnerMessage.querySelector('.urdu-text').textContent = 'پروٹوکول رسائی کو حتمی شکل دی جا رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 2500));
            loadingSpinner.style.display = 'none';
            confirmBtn.disabled = false;

            // Generate key based on plan
            if (plan === 'basic') currentGeneratedKey = PX.generateKey33();
            else if (plan === 'standard') currentGeneratedKey = PX.generateKey44();
            else currentGeneratedKey = PX.generateKey55();

            generatedKeySpan.textContent = currentGeneratedKey;
            successArea.style.display = 'block';
            confirmBtn.disabled = true;

            // Show green success modal
            PX.showModal(
                'Payment Verified!',
                'ادائیگی کی تصدیق ہوگئی!',
                'Your unique access key has been generated. Please copy and save it immediately.',
                'آپ کی منفرد رسائی کلید تیار کر لی گئی ہے۔ براہ کرم اسے فوری طور پر کاپی اور محفوظ کریں۔',
                null,
                false
            );
        }
    }

    confirmBtn.addEventListener('click', handleConfirmPayment);

    // --- Copy generated key ---
    async function copyKey() {
        if (currentGeneratedKey) {
            try {
                await navigator.clipboard.writeText(currentGeneratedKey);
                PX.showModal(
                    'Copied',
                    'کاپی ہوگیا',
                    'Access key copied to clipboard.',
                    'رسائی کلید کلپ بورڈ پر کاپی ہوگئی۔',
                    null,
                    false
                );
            } catch (err) {
                PX.showModal(
                    'Copy Failed',
                    'کاپی ناکام',
                    'Please copy manually.',
                    'براہ کرم دستی طور پر کاپی کریں۔',
                    null,
                    false
                );
            }
        }
    }
    copyKeyBtn.addEventListener('click', copyKey);

    // --- Back to plans page (from success area) ---
    backToPlansBtn.addEventListener('click', () => {
        window.location.href = '/vip/access-plans.html';
    });

    // --- Back button (always visible, goes to previous page) ---
    backBtn.addEventListener('click', () => {
        window.location.href = '/vip/access-plans.html';
    });
});
