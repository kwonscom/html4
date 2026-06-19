/**
 * audio-control.js
 * Persistent background audio manager using LocalStorage and SessionStorage.
 * Handles autoplay policies gracefully by listening to the first user interaction.
 */

(function () {
    const AUDIO_SRC = 'bgm.mp3';
    const STATE_KEY = 'batech_audio_playing';
    const TIME_KEY = 'batech_audio_current_time';

    let audio = null;
    let toggleBtn = null;

    // Initialize Audio Control
    function init() {
        // Create audio element if not exists
        audio = document.getElementById('batech-bg-audio');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'batech-bg-audio';
            audio.src = AUDIO_SRC;
            audio.loop = true;
            audio.volume = 0.5; // Premium moderate volume
            document.body.appendChild(audio);
        }

        // Restore playback time from session storage (smooth page transition)
        const savedTime = sessionStorage.getItem(TIME_KEY);
        if (savedTime) {
            audio.currentTime = parseFloat(savedTime);
        }

        // Create UI widget
        createWidget();

        // Check playing state from localStorage
        const isPlaying = localStorage.getItem(STATE_KEY) === 'true';

        if (isPlaying) {
            // Attempt to play immediately
            attemptPlay();
        } else {
            updateWidgetUI(false);
        }

        // Save progress before unloading page
        window.addEventListener('beforeunload', saveState);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                saveState();
            }
        });
    }

    // Attempt to play audio (handles browser autoplay blocks)
    function attemptPlay() {
        audio.play().then(() => {
            updateWidgetUI(true);
            localStorage.setItem(STATE_KEY, 'true');
        }).catch(() => {
            // Autoplay blocked by browser. Wait for user interaction.
            updateWidgetUI(false);
            const startPlayOnInteract = () => {
                // Double check if user hasn't explicitly clicked pause in the meantime
                if (localStorage.getItem(STATE_KEY) !== 'false') {
                    audio.play().then(() => {
                        updateWidgetUI(true);
                        localStorage.setItem(STATE_KEY, 'true');
                    }).catch(err => console.log("Playback failed on interaction: ", err));
                }
                // Clean up listeners
                document.removeEventListener('click', startPlayOnInteract);
                document.removeEventListener('touchstart', startPlayOnInteract);
                document.removeEventListener('keydown', startPlayOnInteract);
            };
            document.addEventListener('click', startPlayOnInteract);
            document.addEventListener('touchstart', startPlayOnInteract);
            document.addEventListener('keydown', startPlayOnInteract);
        });
    }

    // Save playing state and current time
    function saveState() {
        if (audio) {
            sessionStorage.setItem(TIME_KEY, audio.currentTime.toString());
            // We only want to save the state (playing/paused) in localStorage if it was explicitly toggled
        }
    }

    // Create the floating visual controller (bottom-right)
    function createWidget() {
        toggleBtn = document.getElementById('batech-audio-toggle');
        if (toggleBtn) return; // Prevent duplicate widgets

        toggleBtn = document.createElement('button');
        toggleBtn.id = 'batech-audio-toggle';
        toggleBtn.className = 'audio-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle background music');
        
        // Premium equalizer style bars + Play/Pause iconography
        toggleBtn.innerHTML = `
            <i class="fas fa-volume-mute mute-icon"></i>
            <div class="audio-waves">
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
                <span class="wave-bar"></span>
            </div>
            <div class="audio-tooltip">BGM Toggle</div>
        `;

        document.body.appendChild(toggleBtn);

        // Click event listener
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused || audio.muted) {
                // Fade in volume for premium feel
                audio.muted = false;
                audio.volume = 0;
                audio.play().then(() => {
                    updateWidgetUI(true);
                    localStorage.setItem(STATE_KEY, 'true');
                    fadeVolume(0.5, 300);
                }).catch(err => console.error("Playback failed: ", err));
            } else {
                // Exponential fade out over 150ms then hard mute
                fadeVolume(0, 150, () => {
                    audio.muted = true;
                    audio.volume = 0;
                    audio.pause();
                    updateWidgetUI(false);
                    localStorage.setItem(STATE_KEY, 'false');
                }, true);
            }
        });
    }

    // Toggle button UI state
    function updateWidgetUI(isPlaying) {
        if (!toggleBtn) return;

        if (isPlaying) {
            toggleBtn.classList.add('playing');
        } else {
            toggleBtn.classList.remove('playing');
        }
    }

    // Smooth volume fade helper
    function fadeVolume(targetVolume, duration, callback, exponential = false) {
        const startVolume = audio.volume;
        const diff = targetVolume - startVolume;
        const interval = 15; // 15ms step
        const steps = Math.max(1, duration / interval);
        let step = 0;

        const fadeTimer = setInterval(() => {
            step++;
            const progress = step / steps;
            
            if (exponential) {
                // Exponential fade (if fading to 0, use 0.01 to avoid log(0))
                const startVolExp = Math.max(startVolume, 0.01);
                const endVolExp = Math.max(targetVolume, 0.01);
                audio.volume = startVolExp * Math.pow(endVolExp / startVolExp, progress);
            } else {
                audio.volume = startVolume + (diff * progress);
            }

            if (step >= steps) {
                clearInterval(fadeTimer);
                audio.volume = targetVolume;
                if (callback) callback();
            }
        }, interval);
    }

    // Run on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
