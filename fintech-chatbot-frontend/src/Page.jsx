import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button, Form, InputGroup, Card, Spinner } from "react-bootstrap";
import { Mic, MicOff, Send } from "lucide-react";
import AuthModal from "./AuthModal"; // ✅ Import

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const recognition = useRef(null);
  const scrollRef = useRef(null);

  // ✅ Voice setup
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-US";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
  }, []);

  // ✅ Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceInput = () => {
    if (!recognition.current) return;
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !isLoggedIn) {
      if (!isLoggedIn) setIsAuthOpen(true);
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/chat`,
        { message: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: res.data.response || "Sorry, no response from API.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "Error: Unable to reach API",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <div style={{ width: "1000px", height: "600px" }} className="d-flex flex-column bg-light">
      {/* Header */}
      <div className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle bg-dark p-2 d-flex align-items-center justify-content-center">
            <Mic className="text-white" />
          </div>
          <h5 className="mb-0">AI Assistant</h5>
        </div>

        {/* ✅ Auth buttons */}
        {isLoggedIn ? (
          <Button variant="outline-dark" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button variant="dark" onClick={() => setIsAuthOpen(true)}>
            Login / Signup
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-grow-1 overflow-auto p-3 rounded"
        ref={scrollRef}
        style={{ backgroundColor: "#f7f7f7" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`d-flex mb-2 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
          >
            <Card
              className={`px-3 py-2 shadow-sm ${
                msg.role === "user" ? "bg-dark text-white" : "bg-white text-dark border"
              }`}
              style={{
                maxWidth: "75%",
                borderRadius: "16px",
                width: "fit-content",
                wordBreak: "break-word",
              }}
            >
              <p className="mb-1">{msg.content}</p>
              <small
                className={`d-block mt-1 ${
                  msg.role === "user" ? "text-light opacity-75" : "text-muted"
                }`}
              >
                {formatTime(msg.timestamp)}
              </small>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="d-flex justify-content-start mb-2">
            <Card
              className="px-3 py-2 bg-white border shadow-sm"
              style={{ borderRadius: "16px", maxWidth: "60%" }}
            >
              <Spinner animation="grow" size="sm" className="me-2" />
              AI is thinking...
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-top bg-white">
        <InputGroup>
          <Form.Control
            as="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            disabled={isLoading}
            className="rounded-pill pe-5"
            style={{ resize: "none" }}
          />

          <Button
            variant="light"
            onClick={handleVoiceInput}
            disabled={isLoading}
            className="ms-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="ms-2 rounded-circle d-flex align-items-center justify-content-center bg-dark text-white border-0"
            style={{ width: "40px", height: "40px" }}
          >
            <Send size={18} />
          </Button>
        </InputGroup>
      </div>

      {/* ✅ Auth Modal */}
      <AuthModal
        show={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </div>
  );
}
