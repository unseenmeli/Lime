"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "../services/api";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBackHome = () => {
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(formData);
      console.log("Login response:", response);

      if (response.error) {
        setError(response.error);
      } else if (response.detail) {
        setError(response.detail);
      } else if (response.access) {
        window.location.href = "/";
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex-1 flex h-full justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="border-2 border-gray-300 rounded-lg p-8 w-96"
      >
        <h1 className="text-2xl mb-6">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <h2>Username</h2>
        <input
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          className="border-2 w-full rounded-lg border-gray-300 px-3 py-1 mb-3"
          required
        />

        <h2>Password</h2>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="border-2 w-full rounded-lg border-gray-300 px-3 py-1 mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-4"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex justify-between">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
      </form>
    </div>
  );
}
