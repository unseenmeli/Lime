"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function Events() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  const events = [
    {
      id: 1,
      name: "muse live concert",
      date: "november 15, 2025",
      image: "/muse.jpeg",
    },
    {
      id: 2,
      name: "summer music festival",
      date: "december 1, 2025",
      image: "/muse1.jpeg",
    },
    {
      id: 3,
      name: "underground sessions",
      date: "december 10, 2025",
      image: "/panther1.png",
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-white text-black p-8">
      <h1 className="text-4xl font-bold mb-12">events!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col space-y-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="relative w-full h-64 overflow-hidden">
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold px-6">{event.name}</h2>
            <p className="text-gray-600 px-6 pb-6">{event.date}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="mb-4 mx-auto w-24 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <p className="text-gray-400 text-lg font-medium tracking-wide">more events coming soon...</p>
      </div>
    </div>
  );
}
