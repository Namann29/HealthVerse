class HealthioChatbot {
    constructor() {
        // DOM elements
        this.chatbot = document.querySelector('.healthio-chatbot');
        this.toggle = document.querySelector('.healthio-toggle');
        this.close = document.querySelector('.chatbot-close');
        this.messages = document.querySelector('.chatbot-messages');
        this.input = document.querySelector('.chatbot-text-input');
        this.send = document.querySelector('.chatbot-send');
        this.isTyping = false;

        // API configuration - UPDATED to use basic Gemini model
        this.geminiApiKey = "AIzaSyD7ZHV5e3g5O250UbKAqZARmQJU9G3wwgA"; // Replace with your actual Gemini API key
        this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"; // Using gemini-2.0-flash

        // Chatbot personality
        this.greetings = [
            "Hello there! 💪 I'm Healthio, your friendly fitness buddy! How can I help you feel amazing today?",
            "Hi friend! 💓 I'm Healthio, your personal wellness companion! Ready to crush some fitness goals?",
            "Hey there! 🏃‍♀️ Healthio here, your pocket fitness coach! What shall we work on today?"
        ];

        this.encouragements = [
            "You're doing great! 🌟",
            "That's the spirit! 💪",
            "Keep up that amazing energy! ✨",
            "You've got this! 🔥",
            "I believe in you! 💓"
        ];

        // Conversation history
        this.conversationHistory = [];

        // Initialize chatbot
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        this.toggle.addEventListener('click', () => this.toggleChatbot());
        this.close.addEventListener('click', () => this.closeChatbot());
        this.send.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    toggleChatbot() {
        this.chatbot.classList.toggle('active');
        this.toggle.classList.toggle('active');

        if (this.chatbot.classList.contains('active')) {
            this.chatbot.classList.add('bounce');
            setTimeout(() => {
                this.chatbot.classList.remove('bounce');
            }, 1000);
        }
    }

    closeChatbot() {
        this.chatbot.classList.remove('active');
        this.toggle.classList.remove('active');
    }

    addWelcomeMessage() {
        const greeting = this.greetings[Math.floor(Math.random() * this.greetings.length)];

        const welcomeMessage = `
            <div class="chatbot-message bot">
                <div class="message-avatar">
                    <img src="assets/images/heartbeat.svg" alt="Healthio">
                </div>
                <div class="message-content">
                    <p>${greeting}</p>
                    <p>I can help with workout plans, nutrition advice, and fun health tips! Just ask me anything about fitness! 🏋️‍♀️</p>
                </div>
            </div>
        `;
        this.messages.innerHTML = welcomeMessage;
        this.conversationHistory.push({ role: 'model', parts: [{ text: greeting + "\n\nI can help with workout plans, nutrition advice, and fun health tips! Just ask me anything about fitness! 🏋️‍♀️" }] });
    }

    async handleSend() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        this.addUserMessage(message);
        this.input.value = '';
        this.showTypingIndicator();

        try {
            const aiResponse = await this.fetchGeminiResponse(message);
            this.removeTypingIndicator();
            this.addBotMessage(aiResponse);
        } catch (error) {
            console.error("API Error:", error);
            this.removeTypingIndicator();
            this.addBotMessage(this.getFallbackResponse(message));
        }
    }

    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message user';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHTML(message)}</p>
            </div>
        `;
        this.messages.appendChild(messageElement);
        this.scrollToBottom();
        this.conversationHistory.push({ role: 'user', parts: [{ text: message }] });
    }

    addBotMessage(message) {
        // Sometimes add a cute encouragement to the message
        let finalMessage = message;
        if (Math.random() > 0.7) {
            const encouragement = this.encouragements[Math.floor(Math.random() * this.encouragements.length)];
            finalMessage = `${message}\n\n${encouragement}`;
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message bot';
        messageElement.innerHTML = `
            <div class="message-avatar">
                <img src="assets/images/heartbeat.svg" alt="Healthio">
            </div>
            <div class="message-content">
                <p>${this.formatMessage(finalMessage)}</p>
            </div>
        `;
        this.messages.appendChild(messageElement);
        this.scrollToBottom();

        this.conversationHistory.push({ role: 'model', parts: [{ text: finalMessage }] });

        // Sometimes add a cute bounce animation to the message
        if (Math.random() > 0.8) {
            messageElement.classList.add('bounce-once');
            setTimeout(() => {
                messageElement.classList.remove('bounce-once');
            }, 1000);
        }
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingElement = document.createElement('div');
        typingElement.className = 'chatbot-message bot typing';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <img src="assets/images/heartbeat.svg" alt="Healthio">
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messages.appendChild(typingElement);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        this.isTyping = false;
        const typingElement = document.querySelector('.typing');
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatMessage(text) {
        // Convert line breaks to <br> tags
        let formattedText = text.replace(/\n/g, '<br>');

        // Bold important phrases
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle bullet points - improved regex
        formattedText = formattedText.replace(/- (.*?)(?=<br>|$)/g, '• $1');

        // Add emoji emphasis to certain keywords
        const emojiReplacements = [
            { pattern: /\b(exercise|workout)\b/gi, emoji: ' 💪' },
            { pattern: /\b(healthy|health)\b/gi, emoji: ' 💓' },
            { pattern: /\b(water|hydration)\b/gi, emoji: ' 💧' },
            { pattern: /\b(food|nutrition|diet)\b/gi, emoji: ' 🥗' },
            { pattern: /\b(sleep|rest)\b/gi, emoji: ' 😴' },
            { pattern: /\b(goal|achieve|success)\b/gi, emoji: ' 🏆' }
        ];

        emojiReplacements.forEach(({ pattern, emoji }) => {
            formattedText = formattedText.replace(pattern, match => `${match}${emoji}`);
        });

        return formattedText;
    }

    async fetchGeminiResponse(userMessage) {
        // Log the API request to help with debugging
        console.log(`Sending request to Gemini API: "${userMessage}"`);

        try {
            const response = await fetch(
                `${this.apiUrl}?key=${this.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [...this.conversationHistory, { role: 'user', parts: [{ text: userMessage }] }] }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Status:", response.status);
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            // Validate API response structure
            const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiResponse) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }

            console.log("Successful API Response:", aiResponse);
            return aiResponse;

        } catch (error) {
            console.error('Error in fetchGeminiResponse:', error);
            throw error; // Re-throw to be handled by the calling function
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Enhanced, more specific fallback responses
        const topics = [
            {
                keywords: ["workout", "exercise", "training"],
                response: "For effective workouts, focus on consistency rather than intensity when starting out. Try to include both cardio and strength training in your routine. What specific type of workout are you interested in? 💪"
            },
            {
                keywords: ["diet", "nutrition", "food", "eat"],
                response: "A balanced diet is key to fitness success. Focus on whole foods, adequate protein, and staying hydrated. Would you like some specific nutrition tips for your fitness goals? 🥗"
            },
            {
                keywords: ["weight", "fat", "lose", "loss"],
                response: "Healthy weight management combines regular exercise, nutritious eating, and adequate rest. Remember that sustainable progress is better than quick fixes. What are your specific weight management goals? 🎯"
            },
            {
                keywords: ["motivation", "inspired", "lazy", "habit"],
                response: "Finding your 'why' is key to staying motivated. Consider setting small, achievable goals and tracking your progress. Remember that consistency over time leads to amazing results! What specific fitness goal would you like to achieve? 💓"
            },
            {
                keywords: ["muscle", "strength", "strong", "build"],
                response: "Building strength requires progressive overload, proper nutrition (especially protein), and adequate recovery. Start with compound exercises like squats, deadlifts, and push-ups. What specific muscle groups are you looking to develop? 💪"
            },
            {
                keywords: ["cardio", "running", "endurance", "heart"],
                response: "Cardiovascular exercise improves heart health, burns calories, and boosts your mood. Try to get 150+ minutes of moderate cardio weekly. Mix in both steady-state and interval training for best results. What type of cardio activities do you enjoy? 🏃‍♀️"
            },
            {
                keywords: ["stretch", "flexibility", "mobility", "yoga"],
                response: "Flexibility training improves range of motion, reduces injury risk, and enhances recovery. Consider adding dynamic stretches before workouts and static stretches after. Yoga and foam rolling are also excellent practices. How's your current flexibility routine? 🧘‍♀️"
            },
            {
                keywords: ["protein", "meal", "plan"],
                response: "A protein-rich meal plan is essential for muscle recovery and growth! Include lean meats, fish, eggs, dairy, legumes, and plant-based options like tofu. Aim for 20-30g of protein per meal. For a protein-rich day, try eggs and Greek yogurt for breakfast, a chicken salad for lunch, and salmon with quinoa for dinner. Don't forget protein-rich snacks like cottage cheese or a protein shake! 🥩🥚🐟"
            }
        ];

        // Find matching topic or return default
        for (const topic of topics) {
            if (topic.keywords.some(keyword => lowerMessage.includes(keyword))) {
                return topic.response;
            }
        }

        return "I'm here to help with your fitness journey! You can ask me about workouts, nutrition, tracking your progress, or general wellness tips. What aspect of your health would you like to focus on? 💓";
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthioChatbot();

    // Add debug function to help with troubleshooting
    window.testGeminiAPI = async function() {
        const chatbot = new HealthioChatbot();
        try {
            const response = await chatbot.fetchGeminiResponse("Test message");
            console.log("API Test Response:", response);
            alert("API test successful!");
        } catch (error) {
            console.error("API Test Failed:", error);
            alert("API test failed. Check console for details.");
        }
    };
});