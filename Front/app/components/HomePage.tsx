"use client";

import Image from "next/image";
import { useState } from "react";

interface HomePageProps {
  navigateTo: (page: string) => void;
}

export default function HomePage({ navigateTo }: HomePageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [registerHovered, setRegisterHovered] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-center">
        <div className="h-20 w-2/3 border-b-2 border-gray-300 flex items-end">
          <div
            className="flex justify-center items-end cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <h1 className="text-3xl px-10 py-5">lime</h1>
            <Image
              className={`absolute -z-10 w-24 -my-2 opacity-50 transition-opacity duration-500 ${
                isHovered ? "opacity-75" : null
              }`}
              src="/lime.png"
              alt="Lime logo"
              width={40}
              height={40}
            />
            <div
              className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-20 opacity-0 transition-opacity duration-500 ${
                isHovered ? "opacity-100" : null
              }`}
            ></div>
          </div>
          <div className="justify-end items-end h-30 w-full flex">
            <div
              className="flex justify-center items-end cursor-pointer"
              onMouseEnter={() => setLoginHovered(true)}
              onMouseLeave={() => setLoginHovered(false)}
              onClick={() => navigateTo("login")}
            >
              <h1 className="text-2xl py-5">login</h1>
              <div
                className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-20 opacity-0 transition-opacity duration-500 ${
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
              <h1 className="text-2xl px-10 py-5">register</h1>
              <div
                className={`bg-gray-500 h-0.5 rounded-2xl shadow-2xl shadow-black -my-0.5 absolute w-20 opacity-0 transition-opacity duration-500 ${
                  registerHovered ? "opacity-100" : null
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}