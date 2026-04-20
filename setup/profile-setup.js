/**
 * profile-setup.js - 6‑step identification wizard
 * - Step transitions use PX.showLoader (1.5s)
 * - Mobile validation: Pakistan numbers (+92) exactly 13 chars, others 10-15 digits
 * - Password min 8 chars, no incorrect loop
 * - Final proceed redirects to /engine/loading.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: must have 99-char key from signup ---
    if (!PX.getCurrentUserKey()) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const steps = document.querySelectorAll('.step-container');
    const stepLabels = document.querySelectorAll('.step-label');
    const progressFill = document.getElementById('progressFill');
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    const skipBtn = document.querySelector('.skip-step');
    const proceedBtn = document.getElementById('proceedBtn');
    const agreeCheckbox = document.getElementById('agreeCheckbox');

    // Input fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const aviatorSelect = document.getElementById('aviatorSelect');
    const inviteLinkInput = document.getElementById('inviteLink');
    const mobileInput = document.getElementById('mobileNumber');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // --- Populate Aviator platforms (40+) ---
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
        aviatorSelect.appendChild(opt);
    });

    // --- State ---
    let currentStep = 0;
    let collectedData = {};

    // --- Helper: update progress bar and labels ---
    function updateProgress() {
        const percent = ((currentStep + 1) / steps.length) * 100;
        progressFill.style.width = `${percent}%`;
        stepLabels.forEach((label, idx) => {
            label.classList.toggle('active', idx === currentStep);
        });
    }

    // --- Validate current step (returns true/false, shows error modal) ---
    function validateStep(step) {
        switch(step) {
            case 0: // Name
                const first = firstNameInput.value.trim();
                const last = lastNameInput.value.trim();
                if (!first || !last) {
                    PX.showModal(
                        'Input Required',
                        'درج کرنا ضروری ہے',
                        'Please enter both first and last name.',
                        'براہ کرم پہلا اور آخری نام دونوں درج کریں۔',
                        null, false
                    );
                    return false;
                }
                collectedData.firstName = first;
                collectedData.lastName = last;
                return true;
            case 1: // Platform
                if (!aviatorSelect.value) {
                    PX.showModal(
                        'Selection Required',
                        'انتخاب ضروری ہے',
                        'Please select an aviator platform.',
                        'براہ کرم ایک ایوی ایٹر پلیٹ فارم منتخب کریں۔',
                        null, false
                    );
                    return false;
                }
                collectedData.aviatorName = aviatorSelect.value;
                return true;
            case 2: // Invitation link (optional)
                collectedData.inviteLink = inviteLinkInput.value.trim();
                return true;
            case 3: // Mobile number with Pakistan strict validation
                const mobile = mobileInput.value.trim();
                if (!mobile.startsWith('+')) {
                    PX.showModal(
                        'Invalid Format',
                        'غلط فارمیٹ',
                        'Mobile number must start with a plus sign (+).',
                        'موبائل نمبر پلس (+) سے شروع ہونا چاہیے۔',
                        null, false
                    );
                    return false;
                }
                const digitsOnly = mobile.replace(/\D/g, '');
                if (digitsOnly.length < 10 || digitsOnly.length > 15) {
                    PX.showModal(
                        'Invalid Length',
                        'غلط لمبائی',
                        'Mobile number must contain 10-15 digits after the country code.',
                        'ملک کے کوڈ کے بعد موبائل نمبر 10-15 ہندسوں پر مشتمل ہونا چاہیے۔',
                        null, false
                    );
                    return false;
                }
                // Pakistan specific: +92 must be exactly 13 total characters (including +)
                if (mobile.startsWith('+92') && mobile.length !== 13) {
                    PX.showModal(
                        'Pakistan Format Error',
                        'پاکستان فارمیٹ کی خرابی',
                        'For Pakistan, mobile number must be exactly 13 characters (e.g., +923128942224).',
                        'پاکستان کے لیے موبائل نمبر بالکل 13 حروف کا ہونا چاہیے (مثال: +923128942224)۔',
                        null, false
                    );
                    return false;
                }
                collectedData.mobileNumber = mobile;
                return true;
            case 4: // Password & confirm
                const pwd = passwordInput.value;
                const conf = confirmPasswordInput.value;
                if (!pwd || !conf) {
                    PX.showModal(
                        'Password Required',
                        'پاس ورڈ درکار ہے',
                        'Please fill both password fields.',
                        'براہ کرم دونوں پاس ورڈ فیلڈز پر کریں۔',
                        null, false
                    );
                    return false;
                }
                if (pwd !== conf) {
                    PX.showModal(
                        'Password Mismatch',
                        'پاس ورڈ مماثل نہیں',
                        'Passwords do not match.',
                        'پاس ورڈ مماثل نہیں ہیں۔',
                        null, false
                    );
                    return false;
                }
                if (pwd.length < 8) {
                    PX.showModal(
                        'Weak Password',
                        'کمزور پاس ورڈ',
                        'Password must be at least 8 characters.',
                        'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
                        null, false
                    );
                    return false;
                }
                // No "incorrect" loop – just accept
                collectedData.password = pwd;
                return true;
            default:
                return true;
        }
    }

    // --- Move to a specific step with loader transition ---
    function goToStep(targetStep) {
        if (targetStep === currentStep) return;
        // Validate current step before moving forward
        if (targetStep > currentStep && !validateStep(currentStep)) return;
        PX.showLoader(1500, () => {
            steps.forEach((step, idx) => {
                step.classList.toggle('active', idx === targetStep);
            });
            currentStep = targetStep;
            updateProgress();
        });
    }

    // --- Event listeners for Next / Prev / Skip ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                goToStep(currentStep + 1);
            }
        });
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                goToStep(currentStep - 1);
            }
        });
    });
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (currentStep === 2) { // invitation step
                goToStep(currentStep + 1);
            }
        });
    }

    // --- Enable proceed button only when checkbox checked ---
    agreeCheckbox.addEventListener('change', () => {
        proceedBtn.disabled = !agreeCheckbox.checked;
    });

    // --- Final proceed: redirect to loading page (no extra delay) ---
    function handleProceed() {
        if (!agreeCheckbox.checked) {
            PX.showModal(
                'Agreement Required',
                'معاہدہ ضروری ہے',
                'You must agree to the Privacy Policy and Terms & Conditions.',
                'آپ کو رازداری کی پالیسی اور شرائط و ضوابط سے متفق ہونا ضروری ہے۔',
                null, false
            );
            return;
        }
        // Save all collected data to the user's profile (using current 99-char key)
        const userKey = PX.getCurrentUserKey();
        if (!userKey) {
            window.location.href = '/';
            return;
        }
        const existing = PX.getUser(userKey) || {};
        const updated = {
            ...existing,
            firstName: collectedData.firstName,
            lastName: collectedData.lastName,
            aviatorName: collectedData.aviatorName,
            inviteLink: collectedData.inviteLink || '',
            mobileNumber: collectedData.mobileNumber,
            profileCompleted: true,
            completedAt: Date.now()
        };
        PX.saveUser(userKey, updated);
        // Redirect to loading page with 2s loader transition
        PX.showLoader(2000, () => {
            window.location.href = '/engine/loading.html';
        });
    }

    proceedBtn.addEventListener('click', handleProceed);

    // Initialize first step
    goToStep(0);
});
