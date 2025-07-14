document.addEventListener('DOMContentLoaded', () => {

    // --- Unsplash Gallery Loader ---
    const loadUnsplashGallery = async () => {
        const UNSPLASH_ACCESS_KEY = '6nfjVgoDX5ERToVMGXVrRIrqhXHZbszv2uyr_3tW874'; 
        const galleryContainer = document.querySelector('.gallery-container');
        
        if (!galleryContainer) return;

        if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
            galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Please add your Unsplash API key to main.js to load the gallery.</p>`;
            return;
        }

        const query = 'experimental photography';
        const count = 6;
        // FIX: Correct Unsplash API URL
        const apiUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`;
        
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.errors[0]}`);
            }
            
            const photos = await response.json();

            // --- THIS IS THE FIX ---
            // First, check if we actually got an array with photos in it.
            if (Array.isArray(photos) && photos.length > 0) {
                
                // Only clear the gallery AFTER we confirm we have new images.
                galleryContainer.innerHTML = ''; 

                photos.forEach(photo => {
                    const title = photo.alt_description || 'Untitled';
                    const author = photo.user.name || 'Unknown Artist';

                    const galleryItem = `
                        <div class="group relative flex-shrink-0 w-full max-w-xl aspect-video overflow-hidden rounded-lg">
                            <img src="${photo.urls.regular}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110">
                            <div class="gallery-item-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out flex flex-col justify-end p-8">
                                <h3 class="text-2xl font-semibold text-white capitalize">${title}</h3>
                                <p class="text-gray-300 mt-1">Photo by ${author}</p>
                            </div>
                        </div>
                    `;
                    galleryContainer.insertAdjacentHTML('beforeend', galleryItem);
                });
            } else {
                // If Unsplash returns an empty array, throw an error to be displayed.
                throw new Error("No photos were found for this query.");
            }

        } catch (error) {
            console.error("Error loading Unsplash gallery:", error);
            galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Could not load images. ${error.message}</p>`;
        }
    };

    loadUnsplashGallery();


    // --- Three.js Void Animation ---
    const canvas = document.getElementById('void-canvas');
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particlesGeometry = new THREE.BufferGeometry();
        const count = 7000;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.025,
            sizeAttenuation: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        camera.position.z = 5;

        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        const clock = new THREE.Clock();
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            
            particles.position.z += 0.01;
            if(particles.position.z > 5) particles.position.z = -5;

            camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
            window.requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }

    // --- Hero Text Scroll & Parallax Animation ---
    const heroText = document.getElementById('hero-text');
    const heroTextTop = document.getElementById('hero-text-top');
    const heroTextBottom = document.getElementById('hero-text-bottom');
    let collisionFired = false;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scrollThreshold = 50;
        const opacity = Math.max(0, 1 - (scrollY / (window.innerHeight * 0.5)));
        
        if(heroText) heroText.style.opacity = opacity;

        if (scrollY > scrollThreshold) {
            heroTextTop.style.transform = 'translateY(50%)';
            heroTextTop.style.opacity = '0';
            heroTextBottom.style.transform = 'translateY(-50%)';
        } else {
            heroTextTop.style.transform = 'translateY(0)';
            heroTextTop.style.opacity = '1';
            heroTextBottom.style.transform = 'translateY(0)';
        }
    });

    const hero = document.getElementById('home');
     if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { offsetWidth, offsetHeight } = hero;
            const x = (clientX / offsetWidth - 0.5) * 2; // -1 to 1
            const y = (clientY / offsetHeight - 0.5) * 2; // -1 to 1
            const strength = 15;
            if(heroText) heroText.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
    }

    // --- Scroll Animations for other sections ---
    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1
    });
    scrollElements.forEach(el => observer.observe(el));

    // --- Graffiti Popup Logic ---
    const popup = document.getElementById('graffiti-popup');
    const closeBtn = document.getElementById('close-popup-btn');
    const popupContactLink = document.getElementById('popup-contact-link');

    const showPopup = (e) => { 
        e.preventDefault();
        popup.classList.remove('hidden'); 
        popup.classList.add('flex'); 
    };
    const hidePopup = () => { 
        popup.classList.add('hidden');
        popup.classList.remove('flex');
    };

    document.querySelectorAll('a[href="#contact"]').forEach(el => el.addEventListener('click', showPopup));
    
    if (closeBtn) closeBtn.addEventListener('click', hidePopup);
    if (popupContactLink) popupContactLink.addEventListener('click', (e) => {
        hidePopup();
        document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
    });
    popup.addEventListener('click', (event) => { if (event.target === popup) hidePopup(); });

    // --- Gemini API Logic ---
    const setupGeminiFeature = async (buttonId, inputId, loaderId, resultsId, promptGenerator) => {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        const loader = document.getElementById(loaderId);
        const results = document.getElementById(resultsId);

        const handleAPICall = async () => {
            const value = input.value;
            if (value.trim().length < 3) {
                results.innerHTML = '<p class="text-red-500">Please enter a few more characters to get inspired!</p>';
                results.classList.remove('hidden');
                return;
            }

            loader.style.display = 'block';
            results.classList.add('hidden');
            button.disabled = true;

            try {
                const prompt = promptGenerator(value);
                let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
                const payload = { contents: chatHistory };
                const apiKey = "AIzaSyA7rlussqhkkqn8wTFhTJY_R4AMC24-Bs4"; // Updated Gemini API key
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
                const result = await response.json();
                
                if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                    results.innerHTML = result.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid response structure from API.");
                }

            } catch (error) {
                console.error("Gemini API Error:", error);
                results.innerHTML = '<p class="text-red-500">Sorry, the muse is quiet right now. Please try again later.<br><span style="font-size:0.9em;">' + error.message + '</span></p>';
            } finally {
                loader.style.display = 'none';
                results.classList.remove('hidden');
                button.disabled = false;
            }
        };

        if (button) button.addEventListener('click', handleAPICall);
        
        if (buttonId === 'gemini-button' && input) {
            input.addEventListener('input', () => {
                if (input.value.trim().length > 2) {
                    button.classList.remove('hidden');
                } else {
                    button.classList.add('hidden');
                }
            });
        }
    };

    // Setup "Visual Idea Spark" Feature (in contact form)
    setupGeminiFeature(
        'gemini-button',
        'project-description',
        'gemini-loader',
        'gemini-results',
        (theme) => `
            As an experimental art muse, take the following keyword or theme and generate creative prompts for a visual artist.
            The tone should be abstract, poetic, and inspiring.
            Keyword/Theme: "${theme}"
            Please generate the following, formatted in clean HTML with <h3> for titles and <ul>/<li> for lists:
            1.  **Visual Concepts:** 2-3 abstract visual ideas based on the theme.
            2.  **Poetic Prompts:** 2-3 short, poetic phrases or questions to inspire a piece.
            3.  **Technical Experiments:** 2-3 photography or digital art techniques to try.`
    );

    // Setup "Void Engine" Feature
    setupGeminiFeature(
        'dream-button',
        'dream-keywords',
        'dream-loader',
        'dream-results',
        (keywords) => `
            You are The Void. The user is speaking to you. Based on their input of "${keywords}", respond with a short, cryptic, poetic, and abstract message, as if you are a vast, ancient, and mysterious consciousness. Speak in the first person. Do not offer advice or lists. Just speak your nature in response to the user's words. Keep it under 50 words.`
    );

    // --- Mobile Menu Toggle Logic ---
    const mobileMenuIcon = document.querySelector('header .md:hidden');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    if (mobileMenuIcon && mobileMenuOverlay) {
        mobileMenuIcon.addEventListener('click', () => {
            mobileMenuOverlay.classList.toggle('hidden');
            mobileMenuOverlay.classList.toggle('flex');
        });
        mobileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === mobileMenuOverlay) {
                mobileMenuOverlay.classList.add('hidden');
                mobileMenuOverlay.classList.remove('flex');
            }
        });
        mobileMenuOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.add('hidden');
                mobileMenuOverlay.classList.remove('flex');
            });
        });
    }

    // --- Add data-animate to key elements for micro-interactions ---
    document.querySelectorAll('.gallery-container > div, .nav-link, button, .btn, .form-input, .popup-gradient-border').forEach(el => {
        el.setAttribute('data-animate', '');
    });
});
Correct Unsplash API URL
        const apiUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`;
        // ... existing code ...
                const apiKey = "AIzaSyA7rlussqhkkqn8wTFhTJY_R4AMC24-Bs4"; // Updated Gemini API key
        // ... existing code ...
            } catch (error) {
                console.error("Gemini API Error:", error);
                results.innerHTML = '<p class="text-red-500">Sorry, the muse is quiet right now. Please try again later.<br><span style="font-size:0.9em;">' + error.message + '</span></p>';
            } finally {
// ... existing code ...
