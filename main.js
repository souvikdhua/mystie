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
            const apiKey = "AIzaSyA7rlussqhkkqn8wTFhTJY_R4AMC24-Bs4"; // Gemini API key
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) {
                let errorMsg = result.error && result.error.message ? result.error.message : `API request failed with status ${response.status}`;
                throw new Error(errorMsg);
            }

            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                results.innerHTML = result.candidates[0].content.parts[0].text;
            } else {
                console.error("Full Gemini API response:", result);
                throw new Error("Invalid response structure from Gemini API.");
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
