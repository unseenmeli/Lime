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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const storedUser = authService.getUser();
        if (storedUser?.username) {
          try {
            const { userService } = await import("./services/api");
            const fullUserData = await userService.getUser(storedUser.username);
            setUser(fullUserData);
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUser(storedUser);
          }
        } else {
          setUser(storedUser);
        }
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

  console.log("User object:", user);
  console.log("Profile picture URL:", user?.profile_picture);

  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <div className="min-h-screen flex flex-col">
          <div className={`flex justify-center fixed top-0 left-0 right-0 z-40 ${
            theme === 'dark' ? 'bg-black' : 'bg-white'
          }`}>
            <div className={`h-16 w-2/3 border-b-2 flex items-end ${
              theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'
            }`}>
              <div
                className="flex justify-center items-end cursor-pointer"
                onMouseEnter={() => handleHover("lime")}
                onMouseLeave={() => handleHover(null)}
                onClick={() => navigateTo("home")}
              >
                <h1 className={`text-2xl px-10 py-3 relative z-10 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>lime</h1>
                <Image
                  className={`absolute w-20 -my-2 transition-opacity duration-300 pointer-events-none ${
                    theme === 'dark'
                      ? hoveredElement === "lime" ? "opacity-100" : "opacity-80"
                      : hoveredElement === "lime" ? "opacity-75" : "opacity-50"
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
                      <h1 className={`text-xl px-5 py-3 whitespace-nowrap ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>
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
                      className="flex justify-center items-end cursor-pointer relative"
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
                        className={`text-xl px-5 py-3 ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}
                        onClick={() => navigateTo(`./u/${user?.username}`)}
                      >
                        profile
                      </h1>
                      {profileHover && (
                        <div className={`absolute top-full w-30 h-70 border-2 flex flex-col ${
                          theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-300'
                        }`}>
                          <div
                            onClick={() => navigateTo(`./u/${user?.username}`)}
                            className="pt-5 flex-1 flex flex-col items-center border-b-1 pb-1 border-gray-300"
                          >
                            <img
                              className="w-20 h-20 rounded-full object-cover"
                              src={
                                user?.profile_picture
                                  ? user.profile_picture.startsWith("http")
                                    ? user.profile_picture
                                    : `/${user.profile_picture}`
                                  : "/pfp.png"
                              }
                            />
                            <p className={theme === 'dark' ? 'text-white' : 'text-black'}>{user?.username}</p>
                          </div>
                          <div className="flex-1 flex flex-col pt-2">
                            <div
                              className={`pl-2 pb-2 flex items-center gap-2 ${
                                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              }`}
                              onClick={() =>
                                navigateTo(`./u/${user?.username}`)
                              }
                              role="button"
                              tabIndex={0}
                            >
                              <img className="w-4 h-4" src="/user.png" />
                              <p className={theme === 'dark' ? 'text-white' : 'text-black'}>profile</p>
                            </div>
                            {user?.role !== "ARTIST" && (
                              <div
                                className={`pl-2 pb-2 flex items-center gap-2 ${
                                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                }`}
                                onClick={() => navigateTo("post")}
                              >
                                <img className="w-4 h-4" src="/setting.png" />
                                <p className={theme === 'dark' ? 'text-white' : 'text-black'}>post</p>
                              </div>
                            )}
                            <div
                              className={`pl-2 pb-2 flex items-center gap-2 ${
                                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              }`}
                              onClick={() => setThemeSetting(true)}
                            >
                              <img className="w-4 h-4" src="/sleep-mode.png" />
                              <p className={theme === 'dark' ? 'text-white' : 'text-black'}>theme</p>
                            </div>
                            {themeSetting && (
                              <div className={`w-30 h-14 absolute flex flex-col translate-x-28 translate-y-16 border-t-2 border-r-2 border-b-2 -z-50 ${
                                theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-300'
                              }`}>
                                <div
                                  className={`flex justify-center cursor-pointer ${
                                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                  }`}
                                  onClick={() => setTheme("dark")}
                                >
                                  <p className={theme === 'dark' ? 'text-white' : 'text-black'}>dark</p>
                                </div>
                                <div
                                  className={`flex justify-center cursor-pointer ${
                                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                  }`}
                                  onClick={() => setTheme("light")}
                                >
                                  <p className={theme === 'dark' ? 'text-white' : 'text-black'}>light</p>
                                </div>
                              </div>
                            )}
                            <div className={`pl-2 pb-2 flex items-center gap-2 ${
                              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                            }`}>
                              <img className="w-4 h-4" src="/setting.png" />
                              <p className={theme === 'dark' ? 'text-white' : 'text-black'}>settings</p>
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
                    {user?.role === "ARTIST" && (
                      <div
                        className="flex justify-center items-end cursor-pointer"
                        onMouseEnter={() => handleHover("post")}
                        onMouseLeave={() => handleHover(null)}
                        onClick={() => navigateTo("post")}
                      >
                        <h1 className={`text-xl px-5 py-3 ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>post</h1>
                        <div
                          className={`bg-gray-500 h-0.5 rounded-2xl -my-0.5 absolute w-16 transition-opacity duration-300 ${
                            hoveredElement === "post"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        ></div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className="flex justify-center items-end cursor-pointer"
                      onMouseEnter={() => handleHover("login")}
                      onMouseLeave={() => handleHover(null)}
                      onClick={() => setLoginModal(true)}
                    >
                      <h1 className={`text-xl py-3 ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>login</h1>
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
                      <h1 className={`text-xl px-10 py-3 ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>register</h1>
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
          <main className={`flex-1 flex justify-center pt-16 pb-20 ${
            theme === 'dark' ? 'bg-black' : 'bg-white'
          }`}>
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
            <div className="w-2/3">
              {pathname === "/" ? (
                <div data-theme={theme}>{children}</div>
              ) : (
                children
              )}
            </div>
          </main>
          <div className={`flex fixed bottom-0 left-0 right-0 z-30 justify-center ${
            theme === 'dark' ? 'bg-black' : 'bg-white'
          }`}>
            <footer className={`border-t-2 w-2/3 h-20 flex items-center ${
              theme === 'dark' ? 'border-gray-800' : 'border-gray-300'
            }`}>
              <AudioPlayer />
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
