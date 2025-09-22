"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "../services/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    role: "LISTENER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBackHome = () => {
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.password2) {
      setError("Passwords must match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(formData);
      console.log("Register response:", response);

      if (response.error) {
        setError(response.error);
      } else if (response.username) {
        setError(
          Array.isArray(response.username)
            ? response.username[0]
            : response.username
        );
      } else if (response.email) {
        setError(
          Array.isArray(response.email) ? response.email[0] : response.email
        );
      } else if (response.password) {
        setError(
          Array.isArray(response.password)
            ? response.password[0]
            : response.password
        );
      } else if (response.password2) {
        setError(
          Array.isArray(response.password2)
            ? response.password2[0]
            : response.password2
        );
      } else if (response.detail) {
        setError(response.detail);
      } else if (response.access) {
        router.push("/");
      } else {
        setError("Registration failed. Please check your information.");
      }
    } catch (err) {
      console.error("Registration error:", err);
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
      <img
        src="splash.png"
        className="absolute -z-10 scale-115 rotate-180 translate-x-65"
      />
      <img
        src="splash.png"
        className="absolute rotate-90 opacity-70 h-auto w-120 -z-10 -translate-x-70 -translate-y-30"
      />
      <form
        onSubmit={handleSubmit}
        className="border-2 border-gray-300 rounded-lg p-8 w-96"
      >
        <h1 className="text-2xl mb-6">Register</h1>

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
          className="border-2 w-full bg-white rounded-lg border-gray-300 px-3 py-1 mb-3"
          required
        />

        <h2>Email</h2>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="border-2 w-full bg-white rounded-lg border-gray-300 px-3 py-1 mb-3"
          required
        />

        <h2>Password</h2>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="border-2 w-full bg-white rounded-lg border-gray-300 px-3 py-1 mb-3"
          required
        />

        <h2>Repeat Password</h2>
        <input
          name="password2"
          type="password"
          value={formData.password2}
          onChange={handleChange}
          className="border-2 w-full bg-white rounded-lg border-gray-300 px-3 py-1 mb-3"
          required
        />

        <h2>Role</h2>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange as any}
          className="border-2 w-full bg-white rounded-lg border-gray-300 px-3 py-1 mb-4"
          required
        >
          <option value="LISTENER">Listener</option>
          <option value="ARTIST">Artist</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 mb-4"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <button
          type="button"
          onClick={handleBackHome}
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          ← Back to home
        </button>
      </form>
    </div>
  );
}
