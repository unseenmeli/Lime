"use client";

import { useState, useEffect } from "react";
import Login from "./login";
import HomePage from "./components/HomePage";
import RegisterPage from "./components/RegisterPage";

export default function Home() {
  const [page, setPage] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/login" || path === "/Login") {
        return "login";
      } else if (path === "/register") {
        return "register";
      }
    }
    return "";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/login" || path === "/Login") {
        setPage("login");
      } else if (path === "/register") {
        setPage("register");
      } else {
        setPage("");
      }
    };

    handlePopState();

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (newPage: string) => {
    setPage(newPage);
    window.history.pushState({}, "", `/${newPage}`);
  };

  if (page === "login") {
    return <Login />;
  }

  if (page === "register") {
    return <RegisterPage />;
  }

  return <HomePage navigateTo={navigateTo} />;
}
