import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-row py-20">
        <div className="flex-1 flex-row">
          <img
            src="/bubbles.png"
            alt="Bubbles"
            className="w-120 -my-15 h-auto opacity-70 absolute -z-10"
          />
          <div className="h-60 flex justify-center flex-col px-10 gap-4">
            <p className="font-bold text-5xl w-20">upcoming events!</p>
            <p>upcoming music events in georgia.</p>
            <button
              className="bg-black w-40 h-15 rounded-lg text-white active:opacity-70 transition-opacity duration-200"
              onClick={() => router.push("/explore")}
            >
              explore
            </button>
          </div>
          <div className="h-60 flex justify-center flex-col px-10 gap-4">
            <p className="font-bold text-5xl">discover rising music!</p>
            <p>find artists you might be interested in.</p>
            <button
              className="bg-black w-40 h-15 rounded-lg text-white active:opacity-70 transition-opacity duration-200"
              onClick={() => router.push("/explore")}
            >
              scroll
            </button>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-end">
            <div className="w-65 h-65 border-black/50 border-2 overflow-hidden">
              <img
                src="/addplaceholder.webp"
                alt="adds"
                className="w-full h-full opacity-100 object-cover"
              />
            </div>
          </div>
          <div className=" h-70 flex gap-10 justify-end pt-10">
            <div className="flex flex-col items-center">
              <img
                src="/muse.jpeg"
                className="w-50 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              />
              <p className="text-xl font-bold"> cave</p>
              <p> muse 2:54 </p>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="/addplaceholder.webp"
                className="w-50 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              />
              <p className="text-xl font-bold"> the song</p>
              <p> the artist (duration) </p>
            </div>
          </div>
        </div>
      </div>
      <div className=" w-full h-200">
        <hr className="scale-y-300" />
        <div className="h-full p-2">
          <div>
            <p className="w-100 font-bold text-3xl hover:opacity-50 cursor-pointer ">
              artists which you may like →
            </p>
            <div className="flex flex-row items-center relative">
              <div className="w-60 pt-3">
                <img
                  className="w-30 h-30 rounded-full border-2 border-gray-500"
                  src="/pfp.png"
                />
                <p className="font-bold text-2xl break-all">unseenmeli</p>
              </div>
              <div className="w-60 pt-3">
                <img
                  className="w-30 h-30 rounded-full border-2 border-gray-500"
                  src="/pfp.png"
                />
                <p className="font-bold text-2xl break-all">unseenmeli</p>
              </div>
              <div className="w-60 pt-3">
                <img
                  className="w-30 h-30 rounded-full border-2 border-gray-500"
                  src="/pfp.png"
                />
                <p className="font-bold text-2xl break-all">unseenmeli</p>
              </div>
              <div className="w-60 pt-3">
                <img
                  className="w-30 h-30 rounded-full border-2 border-gray-500"
                  src="/pfp.png"
                />
                <p className="font-bold text-2xl break-all">unseenmeli</p>
              </div>
              <div className="absolute bg-gradient-to-r from-white to-blue-100 w-75 h-50 right-0 -z-10 overflow-hidden">
                <img
                  src="/splash.png"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white to-white/0"></div>
              </div>
              <div className="flex items-center justify-center w-32 h-50">
                <p className="text-6xl font-bold -rotate-90 whitespace-nowrap hover:opacity-70 cursor-pointer transition-opacity duration-200">
                  MORE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-100 border-t-2 border-gray-300 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-12">
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold">Meli</p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/meli"
                  target="_blank"
                  className="hover:opacity-70 transition-opacity"
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/meli"
                  target="_blank"
                  className="hover:opacity-70 transition-opacity"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:meli@example.com"
                  className="hover:opacity-70 transition-opacity"
                >
                  Email
                </a>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold">Lieh</p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/lieh"
                  target="_blank"
                  className="hover:opacity-70 transition-opacity"
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com/in/lieh"
                  target="_blank"
                  className="hover:opacity-70 transition-opacity"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:lieh@example.com"
                  className="hover:opacity-70 transition-opacity"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            © 2024 Lime. Made by Meli & Lieh. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
