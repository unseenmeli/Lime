"use client";

import { usePathname } from "next/navigation";
import Login from "./components/login";
import HomePage from "./components/HomePage";
import RegisterPage from "./components/RegisterPage";
import ProfilePage from "./components/ProfilePage";

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

  return <HomePage />;
}
