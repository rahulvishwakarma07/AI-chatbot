import { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function AuthModal({ show, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        onLoginSuccess();
        onClose();
      } else {
        await axios.post(`${API_URL}/signup`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        setIsLogin(true); // Switch to login after signup success
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isLogin ? "Login" : "Sign Up"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isLogin && (
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
            />
          </Form.Group>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
        </Form.Group>
        {error && <p className="text-danger mt-2">{error}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
        </Button>
        <Button variant="dark" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : isLogin ? "Login" : "Sign Up"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
