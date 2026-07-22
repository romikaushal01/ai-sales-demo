import React from "react";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { searchProducts } from "./utils/searchProducts";

export default function App() {

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

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
      text: "👋 Welcome to AI Shopping Assistant!\n\nI can help you find products in this store.",
      suggestions: [
        {
          label: "🔥 Best Sellers",
          value: "best sellers",
        },
        {
          label: "🆕 New Arrivals",
          value: "new arrivals",
        },
        {
          label: "💰 Under $50",
          value: "under $50",
        },
        {
          label: "✅ In Stock",
          value: "in stock",
        },
      ],
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const [products, setProducts] = useState([]);

  const handleSend = async (customMessage = null) => {
    const text = customMessage || message;

    if (!text.trim()) return;

    if (text !== "show more") {
      const userMessage = {
        sender: "user",
        text,
      };

      setMessages(prev => [...prev, userMessage]);
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: text,
        }),
      });

      const data = await res.json();

      const aiMessage = {
        sender: "ai",
        text: data.reply,
        products: data.products,
        suggestions: data.suggestions || [],
        hasMore: data.hasMore || false,
        messageType: data.messageType || "",
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);   // ✅ Hamesha yahin
    }

  };
  return (
    <div className="chat-app">
      {isOpen && (

        <>
          <div className="chat-window">
            <div className="header">AI Sales Assistant</div>

            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender} ${
                    msg.messageType === "comparison" ? "comparison-message" : ""
                  }`}
                >
                  <div>
                    {msg.messageType === "comparison"
                      ? msg.text.split("\n").map((line, i) => (
                          <div key={i}>{line}</div>
                        ))
                      : msg.text}
                  </div>
                  {msg.sender === "ai" && (
                    <>
                      {/* Products */}
                      {msg.products?.length > 0 ? (
                        <div className="chat-products">
                          {msg.products.map((product, i) => (
                            <div key={i} className="chat-product-card">

                              <img
                                src={product.image || "https://via.placeholder.com/150"}
                                alt={product.title}
                              />

                              <h4>{product.title}</h4>

                              <p className="product-brand">
                                {product.vendor}
                              </p>

                              <p className="product-price">
                                ${product.price}
                              </p>

                              <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-product-btn"
                              >
                                View Product
                              </a>

                            </div>
                          ))}
                        </div>
                      ) : msg.type === "empty" ? (
                        <p className="no-products">No products found 😕</p>
                      ) : null}

                      {/* Suggestions */}
                      {msg.suggestions?.length > 0 && (
                        <div className="chat-suggestions">
                          {msg.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              className="suggestion-chip"
                              onClick={() => handleSend(suggestion.value || suggestion)}
                            >
                            {suggestion.label || suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Show More */}
                      {msg.hasMore && index === messages.length - 1 && (
                        <button
                          className="show-more-btn"
                          onClick={() => handleSend("show more")}
                        >
                          Show More
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
              {loading && (
                <div className="message ai typing">
                  Searching products...
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="input-area">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleSend();
                  }
                }}
                placeholder="Ask about products..."
                disabled={loading}
              />

              <button
                onClick={() => handleSend()}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </>

      )}
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}