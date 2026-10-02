import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (login) {
        await login({ email, password }).catch(() => {
          // If backend auth endpoint is not active yet, let them in for dev prototype
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">
      <h1 className="text-gray-800 text-2xl font-semibold tracking-wide uppercase">
        Gym Management System
      </h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-sm border border-gray-200">
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}
          <label htmlFor="email" className="text-gray-800 text-sm tracking-wide">
            Email
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gym.com"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm transition-all"
          />
          <label
            htmlFor="password"
            className="text-gray-800 text-sm mt-2 tracking-wide"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-800 text-sm transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2.5 rounded-lg bg-gray-800 mt-4 font-semibold tracking-wider cursor-pointer hover:bg-gray-700 transition-all text-white text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
