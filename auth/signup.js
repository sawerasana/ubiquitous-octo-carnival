/**
 * signup.js - Key Generation & Signup
 * - Generate unique access key with 3s loader
 * - Copy to clipboard
 * - Paste confirmation enables signup
 * - Save user and redirect to profile setup
 */

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateKeyBtn');
    const keyDisplayArea = document.getElementById('keyDisplayArea');
    const generatedKeySpan = document.getElementById('generatedKey');
    const copyBtn = document.getElementById('copyKeyBtn');
    const pasteInput = document.getElementById('pasteKeyInput');
    const signupBtn = document.getElementById('signupSubmitBtn');

    let currentGeneratedKey = '';

    // Generate key button
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            // Show 3-second loader with custom message
            const loaderOverlay = PX.showLoader(3000, () => {
                currentGeneratedKey = PX.generateKey99();
                generatedKeySpan.textContent = currentGeneratedKey;
                keyDisplayArea.style.display = 'block';
                pasteInput.value = '';
                signupBtn.disabled = true;
                
                // Show success modal
                PX.showModal(
                    'Key Generated',
                    'کلید بن گئی',
                    'Your unique access key is ready. Copy it and paste below to confirm.',
                    'آپ کی منفرد رسائی کلید تیار ہے۔ تصدیق کے لیے اسے کاپی کریں اور نیچے پیسٹ کریں۔',
                    null,
                    false
                );
            });
            
            // Customise the loader message (optional)
            // The loader uses default "Processing..." text. To customise, we can modify the overlay after creation.
            // For simplicity, we keep default – it's fine.
        });
    }

    // Copy key to clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!currentGeneratedKey) {
                PX.showModal(
                    'No Key',
                    'کوئی کلید نہیں',
                    'Please generate a key first.',
                    'براہ کرم پہلے کلید بنائیں۔',
                    null,
                    false
                );
                return;
            }
            try {
                await navigator.clipboard.writeText(currentGeneratedKey);
                PX.showModal(
                    'Copied',
                    'کاپی ہوگیا',
                    'Key copied to clipboard.',
                    'کلید کلپ بورڈ پر کاپی ہوگئی۔',
                    null,
                    false
                );
                copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> COPY';
                }, 2000);
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

    // Paste confirmation: enable signup only if matches
    if (pasteInput) {
        pasteInput.addEventListener('input', () => {
            const pasted = pasteInput.value.trim();
            if (pasted === currentGeneratedKey && currentGeneratedKey !== '') {
                signupBtn.disabled = false;
                pasteInput.style.borderColor = '#00ff00';
            } else {
                signupBtn.disabled = true;
                pasteInput.style.borderColor = pasted.length > 0 ? '#ff0000' : '';
            }
        });
    }

    // Signup & Continue
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            if (!currentGeneratedKey) return;

            // Check if key already exists (safety)
            if (PX.getUser(currentGeneratedKey)) {
                PX.showModal(
                    'Key Exists',
                    'کلید موجود ہے',
                    'This key already exists. Generate a new one.',
                    'یہ کلید پہلے سے موجود ہے۔ نئی کلید بنائیں۔',
                    null,
                    false
                );
                return;
            }

            // Save user profile with initial data
            PX.saveUser(currentGeneratedKey, {
                key: currentGeneratedKey,
                createdAt: Date.now(),
                profileCompleted: false,
                status: 'Free'
            });

            // Set as current logged-in user
            PX.setCurrentUser(currentGeneratedKey);

            // Show success modal, then redirect with loader
            PX.showModal(
                'Signup Successful',
                'سائن اپ کامیاب',
                'Your identity has been forged. Redirecting to profile setup...',
                'آپ کی شناخت بن گئی ہے۔ پروفائل سیٹ اپ پر ری ڈائریکٹ ہو رہا ہے...',
                () => {
                    PX.showLoader(1500, () => {
                        window.location.href = '/setup/profile-setup.html';
                    });
                },
                false
            );
        });
    }
});
