export default function ProfilePage() {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden relative">
      <img
        className="absolute opacity-100 inset-0 w-full h-full object-cover -z-10"
        src="/profile_background.jpg"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white -z-[9]"></div>
      <div className=" h-30 w-full flex gap-10 justify-center py-10">
        <p className="font-bold text-2xl">follow</p>
        <p className="font-bold text-2xl">message</p>
        <p className="font-bold text-2xl">invite</p>
      </div>
      <div className="flex-row flex">
        <div className="h-full w-100">
          <div className="flex justify-center items-center h-full flex-col">
            <p className="font-bold text-3xl pb-2">unseenmeli, 24k</p>
            {/* es ricxvebi listens iqneba */}
            <img
              className="border-2 w-70 h-70 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              src="/panther1.png"
            />
          </div>
        </div>
        <div className=" flex-1">
          <p className="font-bold text-3xl px-10 py-5">tracks</p>
          <div className="px-10 flex items-center gap-4 py-2">
            <img
              className="w-30 h-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              src="/muse.jpeg"
            />
            <button className="text-2xl hover:opacity-70">▶</button>
            <div className="flex items-center gap-[2px] flex-1 h-12 relative">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-400"
                  style={{
                    height: `${Math.random() * 70 + 30}%`,
                  }}
                />
              ))}
              <p
                className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-lg pointer-events-none"
                style={{
                  textShadow:
                    "2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 0 2px 0 black, 0 -2px 0 black, 2px 0 0 black, -2px 0 0 black",
                }}
              >
                song name
              </p>
            </div>
          </div>
          <div className="px-10 flex items-center gap-4 py-2">
            <img
              className="w-30 h-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              src="/muse1.jpeg"
            />
            <button className="text-2xl hover:opacity-70">▶</button>
            <div className="flex items-center gap-[2px] flex-1 h-12 relative">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-400"
                  style={{
                    height: `${Math.random() * 70 + 30}%`,
                  }}
                />
              ))}
              <p
                className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-lg pointer-events-none"
                style={{
                  textShadow:
                    "2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 0 2px 0 black, 0 -2px 0 black, 2px 0 0 black, -2px 0 0 black",
                }}
              >
                song name
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
