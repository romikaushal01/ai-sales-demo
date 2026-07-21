function randomReply(replies) {
  return replies[Math.floor(Math.random() * replies.length)];
}

function detectConversation(text = "") {
  text = text.toLowerCase().trim();

  // Greetings
  if (["hi", "hello", "hey", "hii", "hey there"].includes(text)) {
    return {
      type: "greeting",
      reply: randomReply([
        "👋 Hi! I'm your AI Shopping Assistant.\nHow can I help you today?",
        "👋 Welcome! What product are you looking for today?",
        "Hello! 😊 Tell me what you'd like to shop for.",
      ]),
    };
  }
  // Good Morning
	if (
		text.includes("good morning") ||
		text === "gm" ||
		text === "morning"
	) {
		return {
			type: "good-morning",
			reply: randomReply([
				"☀️ Good morning! How can I help you find the perfect product today?",
				"Good morning! 😊 What are you shopping for today?",
				"☀️ Good morning! I'm here to help you find exactly what you need.",
			]),
		};
	}

	// Good Afternoon
	if (text.includes("good afternoon")) {
		return {
			type: "good-afternoon",
			reply: randomReply([
				"🌤️ Good afternoon! What can I help you find today?",
				"Good afternoon! 😊 Looking for something specific?",
			]),
		};
	}

	// Good Evening
	if (
		text.includes("good evening") ||
		text === "ge" ||
		text === "evening"
	) {
		return {
			type: "good-evening",
			reply: randomReply([
				"🌙 Good evening! How can I assist you today?",
				"Good evening! 😊 What product are you looking for?",
			]),
		};
	}

  // Thanks
  if (["thanks", "thank you", "thx", "ty"].includes(text)) {
    return {
      type: "thanks",
      reply: randomReply([
        "😊 You're welcome! Happy shopping!",
        "Glad I could help! Let me know if you need anything else.",
        "You're very welcome! 👌",
      ]),
    };
  }

  // Goodbye
  if (["bye", "goodbye", "see you", "see ya"].includes(text)) {
    return {
      type: "bye",
      reply: randomReply([
        "👋 Thanks for visiting! Have a wonderful day!",
        "See you again soon! 😊",
        "Bye! Happy shopping! 🛍️",
      ]),
    };
  }

  // Positive
  if (["ok", "okay", "great", "awesome", "nice", "cool"].includes(text)) {
    return {
      type: "positive",
      reply: randomReply([
        "😊 Great! What would you like to explore next?",
        "Perfect! Tell me what you're looking for.",
        "Awesome! I'm ready to help.",
      ]),
    };
  }

  // Yes
  if (["yes", "yeah", "yep", "sure"].includes(text)) {
    return {
      type: "yes",
      reply: null, // handled later by query.routes
    };
  }

  // No
  if (["no", "nope"].includes(text)) {
    return {
      type: "no",
      reply: randomReply([
        "No problem! 😊 Let me know if you need anything else.",
        "That's okay! Feel free to ask me about any product.",
      ]),
    };
  }

  return null;
}

module.exports = {
  detectConversation,
};