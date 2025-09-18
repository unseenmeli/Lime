"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { useState, useCallback } from "react";
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
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = useCallback(
    (page: string) => {
      if (page === "home") {
        router.push("/");
      } else {
        router.push(`/${page}`);
      }
    },
    [router]
  );

  const handleHover = useCallback((element: string | null) => {
    setHoveredElement(element);
  }, []);

  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex justify-center fixed top-0 left-0 right-0 bg-white z-40">
            <div className="h-16 w-2/3 border-b-2 border-gray-300 flex items-end">
              <div
                className="flex justify-center items-end cursor-pointer"
                onMouseEnter={() => handleHover("lime")}
                onMouseLeave={() => handleHover(null)}
                onClick={() => navigateTo("home")}
              >
                <h1 className="text-2xl px-10 py-3">lime</h1>
                <Image
                  className={`absolute -z-10 w-20 -my-2 transition-opacity duration-300 ${
                    hoveredElement === "lime" ? "opacity-75" : "opacity-50"
                  }`}
                  src="/lime.png"
                  alt="Lime logo"
                  width={40}
                  height={40}
                />
                <div
                  className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                    hoveredElement === "lime" ? "opacity-100" : "opacity-0"
                  }`}
                ></div>
              </div>
              <div className="w-full h-full flex items-end">
                <div className="flex-1 py-0.5 flex-row flex items-center gap-2">
                  <h1
                    className={`text-4xl cursor-pointer transition-colors duration-200 ${
                      hoveredElement === "search" ? "text-gray-400" : ""
                    }`}
                    onMouseEnter={() => handleHover("search")}
                    onMouseLeave={() => handleHover(null)}
                  >
                    ⌕
                  </h1>
                  <input
                    type="text"
                    placeholder="Search here..."
                    className={`px-2 py-3 border-2 w-11/12 h-8 border-black rounded-lg bg-black/5 cursor-text transition-opacity duration-200 focus:outline-none focus:border-black ${
                      hoveredElement === "searchBar" ? "opacity-50" : ""
                    }`}
                    onMouseEnter={() => handleHover("searchBar")}
                    onMouseLeave={() => handleHover(null)}
                  />
                </div>
              </div>
              <div className="justify-end items-end h-30 flex">
                <div
                  className="flex justify-center items-end cursor-pointer"
                  onMouseEnter={() => handleHover("login")}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => navigateTo("login")}
                >
                  <h1 className="text-xl py-3">login</h1>
                  <div
                    className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                      hoveredElement === "login" ? "opacity-100" : "opacity-0"
                    }`}
                  ></div>
                </div>

                <div
                  className="flex justify-center items-end cursor-pointer"
                  onMouseEnter={() => handleHover("register")}
                  onMouseLeave={() => handleHover(null)}
                  onClick={() => navigateTo("register")}
                >
                  <h1 className="text-xl px-10 py-3">register</h1>
                  <div
                    className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                      hoveredElement === "register"
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <main className="flex-1 flex justify-center pt-16 pb-20">
            <div className="w-2/3">{children}</div>
          </main>
          <div className="flex fixed bottom-0 left-0 right-0 z-30 justify-center bg-white">
            <footer className="border-t-2 border-gray-300 w-2/3 h-20 flex items-center">
              <AudioPlayer />
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
