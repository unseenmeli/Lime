"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "../services/api";

type Event = {
  id: number;
  title: string;
  artist: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  ticketPrice: string;
};

const upcomingEvents: Event[] = [
  {
    id: 1,
    title: "Muse World Tour 2024",
    artist: "Muse",
    date: "Nov 15, 2024",
    time: "8:00 PM",
    location: "Los Angeles, CA",
    venue: "Crypto.com Arena",
    image: "/muse.jpeg",
    ticketPrice: "$85 - $250",
  },
  {
    id: 2,
    title: "Muse Live in Concert",
    artist: "Muse",
    date: "Nov 22, 2024",
    time: "7:30 PM",
    location: "New York, NY",
    venue: "Madison Square Garden",
    image: "/muse1.jpeg",
    ticketPrice: "$95 - $300",
  },
  {
    id: 3,
    title: "Black Panther Soundtrack Live",
    artist: "Various Artists",
    date: "Dec 5, 2024",
    time: "9:00 PM",
    location: "Atlanta, GA",
    venue: "State Farm Arena",
    image: "/panther1.png",
    ticketPrice: "$75 - $200",
  },
  {
    id: 4,
    title: "Summer Music Festival",
    artist: "Multiple Artists",
    date: "Dec 12, 2024",
    time: "6:00 PM",
    location: "Miami, FL",
    venue: "Bayfront Park",
    image: "/profile_background.jpg",
    ticketPrice: "$120 - $350",
  },
];

export default function ExplorePage() {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="w-full min-h-screen pb-10 pt-5">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upcoming Events</h1>
        <p className="text-gray-600">Discover live music events near you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onMouseEnter={() => setHoveredId(event.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  hoveredId === event.id ? "scale-110" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold mb-1">{event.title}</h2>
                <p className="text-lg">{event.artist}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">{event.date}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700">{event.time}</span>
              </div>

              <div className="flex items-center gap-2 mb-3 text-gray-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium">{event.venue}</p>
                  <p className="text-sm text-gray-500">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-lg font-bold text-gray-900">
                    {event.ticketPrice}
                  </p>
                </div>
                <button
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    hoveredId === event.id
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Get Tickets
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
