import { useState } from "react";
import "./App.css";
import { searchProducts } from "./utils/searchProducts";

export default function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState("");

  const [sessionId] = useState(() => {
  let id = localStorage.getItem("chat_session");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chat_session", id);
    }

    return id;
  });
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi! What product are you looking for today?",
    },
  ]);

  const [products, setProducts] = useState([]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
    };

    // ✅ 1. show user message first
    setMessages((prev) => [...prev, userMessage]);

    setMessage("");

    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        message,
      }),
    });

    const data = await res.json();

    const aiMessage = {
      sender: "ai",
      text: data.reply,
      products: data.products,
    };

    // ✅ 2. show AI message
    setMessages((prev) => [...prev, aiMessage]);

    setIsTyping(false);
  };

  return (
    <div className="chat-app">
      <div className="chat-section">
        <div className="header">AI Sales Assistant</div>

        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index}
              className={`message ${msg.sender}`}
            >
              {msg.text}

              {msg.sender === "ai" && (
                <>
                  {msg.products?.length > 0 ? (
                    <div className="chat-products">
                      {msg.products.map((product, i) => (
                        <div key={i} className="chat-product-card">
                          <img src={product.image || "https://via.placeholder.com/150"} />
                          <h4>{product.title}</h4>
                          <p>${product.price}</p>
                        </div>
                      ))}
                    </div>
                  ) : msg.type === "empty" ? (
                    <p className="no-products">No products found 😕</p>
                  ) : null}
                </>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="message ai">
              AI is typing...
            </div>
          )}
        </div>

        <div className="input-area">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            placeholder="Ask about products..."
          />

          <button onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}