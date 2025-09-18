"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AudioPlayer from "./components/AudioPlayer";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isHovered, setIsHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [registerHovered, setRegisterHovered] = useState(false);
  const [searchIsHovered, setSearchIsHovered] = useState(false);
  const [searchBarIsHovered, setSearchBarIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (page: string) => {
    if (page === "home") {
      router.push("/");
    } else {
      router.push(`/${page}`);
    }
  };

  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex justify-center">
            <div className="h-16 w-2/3 border-b-2 border-gray-300 flex items-end">
              <div
                className="flex justify-center items-end cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => navigateTo("home")}
              >
                <h1 className="text-2xl px-10 py-3">lime</h1>
                <Image
                  className={`absolute -z-10 w-20 -my-2 opacity-50 transition-opacity duration-500 ${
                    isHovered ? "opacity-75" : null
                  }`}
                  src="/lime.png"
                  alt="Lime logo"
                  width={40}
                  height={40}
                />
                <div
                  className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-16 opacity-0 transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : null
                  }`}
                ></div>
              </div>
              <div className="w-full h-full flex items-end">
                <div className="flex-1 py-0.5 flex-row flex items-center gap-2">
                  <h1
                    className={`text-4xl cursor-pointer transition-colors duration-200 ${
                      searchIsHovered ? "text-gray-400" : null
                    }`}
                    onMouseEnter={() => setSearchIsHovered(true)}
                    onMouseLeave={() => setSearchIsHovered(false)}
                  >
                    ⌕
                  </h1>
                  <input
                    type="text"
                    placeholder="Search here..."
                    className={`px-2 py-3 border-2 w-11/12 h-8 border-black rounded-lg bg-black/5 cursor-text transition-opacity duration-200 focus:outline-none focus:border-black ${
                      searchBarIsHovered ? "opacity-50" : null
                    }`}
                    onMouseEnter={() => setSearchBarIsHovered(true)}
                    onMouseLeave={() => setSearchBarIsHovered(false)}
                  />
                </div>
              </div>
              <div className="justify-end items-end h-30 flex">
                <div
                  className="flex justify-center items-end cursor-pointer"
                  onMouseEnter={() => setLoginHovered(true)}
                  onMouseLeave={() => setLoginHovered(false)}
                  onClick={() => navigateTo("login")}
                >
                  <h1 className="text-xl py-3">login</h1>
                  <div
                    className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-16 opacity-0 transition-opacity duration-500 ${
                      loginHovered ? "opacity-100" : null
                    }`}
                  ></div>
                </div>

                <div
                  className="flex justify-center items-end cursor-pointer"
                  onMouseEnter={() => setRegisterHovered(true)}
                  onMouseLeave={() => setRegisterHovered(false)}
                  onClick={() => navigateTo("register")}
                >
                  <h1 className="text-xl px-10 py-3">register</h1>
                  <div
                    className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-16 opacity-0 transition-opacity duration-500 ${
                      registerHovered ? "opacity-100" : null
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <main className="flex-1 flex justify-center">
            <div className="w-2/3">{children}</div>
          </main>
          <div className="flex sticky bottom-0 z-50 justify-center">
            <footer className="border-t-2 border-gray-300 w-2/3 h-20 flex items-center">
              <AudioPlayer />
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
