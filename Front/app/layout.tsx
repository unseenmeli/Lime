"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AudioPlayer from "./components/AudioPlayer";
import { authService } from "./services/api";
import SearchBox from "./components/SearchBox";
import Login from "./components/login";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [profileHover, setProfileHover] = useState(false);
  const [themeSetting, setThemeSetting] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setUser(authService.getUser());
      }
    };

    checkAuth();
  }, [pathname]);

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

  const handleSignOut = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

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
                  <SearchBox
                    hoveredElement={hoveredElement}
                    handleHover={handleHover}
                    onSelect={(u) => router.push(`/u/${u.username}`)}
                    onSearch={(q) =>
                      router.push(`/search?q=${encodeURIComponent(q)}`)
                    }
                  />
                </div>
              </div>
              <div className="justify-end items-end h-30 flex">
                {isAuthenticated ? (
                  <>
                    <div
                      className="flex justify-center items-end cursor-pointer"
                      onMouseEnter={() => handleHover("signout")}
                      onMouseLeave={() => handleHover(null)}
                      onClick={handleSignOut}
                    >
                      <h1 className="text-xl py-3 whitespace-nowrap">
                        sign out
                      </h1>
                      <div
                        className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-20 transition-opacity duration-300 ${
                          hoveredElement === "signout"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      ></div>
                    </div>

                    <div
                      className="flex justify-center items-end cursor-pointer"
                      onMouseEnter={() => {
                        handleHover("profile");
                        setProfileHover(true);
                      }}
                      onMouseLeave={() => {
                        handleHover(null);
                        setProfileHover(false);
                        setThemeSetting(false);
                      }}
                    >
                      <h1
                        className="text-xl px-10 py-3"
                        onClick={() => navigateTo("profile")}
                      >
                        profile
                      </h1>
                      {profileHover && (
                        <div className="absolute translate-y-62 w-30 h-60 bg-white border-2 border-gray-300 flex flex-col">
                          <div className="pt-5 flex-1 flex flex-col items-center border-b-1 pb-1 border-gray-300">
                            <img
                              className="w-20 rounded-full"
                              src="muse.jpeg"
                            />
                            <p>unseenmeli</p>
                          </div>
                          <div className="flex-1 flex flex-col pt-2">
                            <div
                              className="pl-2 pb-2 flex items-center gap-2 hover:bg-gray-200"
                              onClick={() => navigateTo("profile")}
                            >
                              <img className="w-4 h-4" src="user.png" />
                              <p>profile</p>
                            </div>
                            <div
                              className="pl-2 pb-2 flex items-center gap-2 hover:bg-gray-200"
                              onClick={() => setThemeSetting(true)}
                            >
                              <img className="w-4 h-4" src="sleep-mode.png" />
                              <p>theme</p>
                            </div>
                            {themeSetting && (
                              <div className="w-30 h-14 absolute bg-white flex flex-col translate-x-28 translate-y-4.5 border-t-2 border-r-2 border-b-2 border-gray-300 -z-50">
                                <div className="flex justify-center hover:bg-gray-200">
                                  <p>dark</p>
                                </div>
                                <div className="flex justify-center hover:bg-gray-200">
                                  <p>light</p>
                                </div>
                              </div>
                            )}
                            <div className="pl-2 pb-2 flex items-center gap-2 hover:bg-gray-200">
                              <img className="w-4 h-4" src="setting.png" />
                              <p>settings</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                          hoveredElement === "profile"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      ></div>
                    </div>
                    <div
                      className="flex justify-center items-end cursor-pointer"
                      onMouseEnter={() => handleHover("post")}
                      onMouseLeave={() => handleHover(null)}
                      onClick={() => navigateTo("post")}
                    >
                      <h1 className="text-xl px-10 py-3">post</h1>
                      <div
                        className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                          hoveredElement === "post"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex justify-center items-end cursor-pointer"
                      onMouseEnter={() => handleHover("login")}
                      onMouseLeave={() => handleHover(null)}
                      onClick={() => setLoginModal(true)}
                    >
                      <h1 className="text-xl py-3">login</h1>
                      <div
                        className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                          hoveredElement === "login"
                            ? "opacity-100"
                            : "opacity-0"
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
                  </>
                )}
              </div>
            </div>
          </div>
          <main className="flex-1 flex justify-center pt-16 pb-20">
            {loginModal && (
              <div
                onClick={() => setLoginModal(false)}
                className="w-screen h-svh fixed top-0 left-0 z-[100] bg-black/50 flex justify-center items-center"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-24rem h-fit z-150 rounded-xl"
                >
                  <Login />
                </div>
              </div>
            )}
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
