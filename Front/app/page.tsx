"use client";

import { usePathname } from "next/navigation";
import Login from "./components/login";
import HomePage from "./components/HomePage";
import RegisterPage from "./components/RegisterPage";
import ProfilePage from "./components/ProfilePage";
import SearchResultsPage from "./components/SearchResultsPage";

export default function Home() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/Login") {
    return <Login />;
  }

  if (pathname === "/register") {
    return <RegisterPage />;
  }

  if (pathname === "/profile") {
    return <ProfilePage />;
  }

  if (pathname === "/search") {
    return <SearchResultsPage />;
  }

  return <HomePage />;
}
