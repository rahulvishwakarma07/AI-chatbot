import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button, Form, InputGroup, Card, Spinner } from "react-bootstrap";
import { Mic, MicOff, Send, MessageCircle } from "lucide-react";
import AuthModal from "./AuthModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "👋 Hello! I'm your AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  // const [isSpeaking, setIsSpeaking] = useState(false); // 🆕 For stopping speech

  const recognition = useRef(null);
  const scrollRef = useRef(null);

  // 🎤 Voice setup
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

  // 🔽 Auto-scroll
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

   // 🗣️ Text-to-Speech function
  const speakText = (text) => {
    if (!text || typeof text !== "string") return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel(); // stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
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
        content: res.data.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // let spokenText = "";

      // if (typeof res.data.response === "object" && msg.content.type !== "html") {
      //   spokenText = res.data.response.content;
      //   speakText(spokenText);
      // } else {
      //   spokenText = res.data.response;
      // } 


    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "⚠️ Error: Unable to reach API",
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
    <div
      style={{
        width: "1000px",
        height: "630px",
        borderRadius: "20px",
        border: "3px solid #525af7ff",
        boxShadow: "0 0 25px rgba(78, 84, 200, 0.4)",
        overflow: "hidden",
      }}
      className="d-flex flex-column bg-light"
    >
      {/* 🔹 Header */}
      <div
        className="p-3 d-flex justify-content-between align-items-center text-white"
        style={{
          // background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
          background: "linear-gradient(135deg, #525af7ff 0%, #764ba2 100%)"

        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center shadow"
            style={{ width: "45px", height: "45px", backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <MessageCircle className="text-white" />
          </div>
          <h5 className="mb-0 fw-bold">AI Assistant</h5>
        </div>

        {isLoggedIn ? (
          <Button variant="light" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => setIsAuthOpen(true)}
            className="fw-semibold"
          >
            Login / Signup
          </Button>
        )}
      </div>

      {/* 💬 Chat Messages */}
      <div
        // For Chrome, Safari, and Edge
        className="scroll-hide flex-grow-1 overflow-auto p-3"
        ref={scrollRef}
        style={{
          backgroundColor: "#f7f9fc",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
        }}
        
      >

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`d-flex mb-2 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
          >
            <Card
              className={`px-3 py-2 shadow-sm ${msg.role === "user" ? "text-black" : "bg-white text-dark border"
                }`}
              style={{
                maxWidth: "75%",
                borderRadius: "18px",
                width: "fit-content",
                // background: msg.role === "user"
                // ? "linear-gradient(135deg, #9543e7ff, #0e62f2ff)"  // ✅ gradient for user bubble
                // : "white",
              }}
            >

              {typeof msg.content === "object" && msg.content.type === "html" ? (
                <div dangerouslySetInnerHTML={{ __html: msg.content.content }} />
              ) : (
                <p className="mb-1">{typeof msg.content === "object" ? msg.content.content : msg.content}</p>
              )}

              <small
                className={`d-block mt-1 ${msg.role === "user" ? "text-dark opacity-75" : "text-muted"}`}
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

      {/* ✍ Input */}
      <div className="p-3 border-top bg-white">
        <InputGroup>
          <Form.Control
            as="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={isLoading}
            className="rounded-pill pe-5 shadow-sm"
            style={{ resize: "none" }}
          />

          <Button
            variant="light"
            onClick={handleVoiceInput}
            disabled={isLoading}
            className="ms-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: "42px", height: "42px",
              background: "linear-gradient(135deg, #6a11cb, #2575fc)", // ✅ gradient purple-blue
              color: "white",
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          {/* ⏹ Stop Voice */}
          {/* {isSpeaking && (
            <Button
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
              className="ms-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: "42px",
                height: "42px",
                backgroundColor: "#dc3545",
                color: "white",
              }}
            >
              <StopCircle size={18} />
            </Button>
          )} */}

          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="ms-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm border-0"
            style={{
              width: "42px",
              height: "42px",
              background: "linear-gradient(135deg, #6a11cb, #2575fc)", // ✅ gradient purple-blue
              color: "white",
            }}
          >
            <Send size={18} />
          </Button>

        </InputGroup>
      </div>

      {/* 🔹 Footer */}
      <div
        className="text-center p-2 small"
        style={{
          background: "linear-gradient(135deg, #525af7ff 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        Powered by Rahul’s AI ✨ | Stay productive 🚀
      </div>
      {/* 🔐 Auth Modal */}
      <AuthModal
        show={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </div>
  );
}
