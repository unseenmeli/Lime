export default function RegisterPage() {
  const handleBackHome = () => {
    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  return (
    <div className="flex-1 flex justify-center items-center">
      <div className="border-2 border-gray-300 rounded-lg p-8 w-96">
        <h1 className="text-3xl mb-6">Register</h1>
        <button
          onClick={handleBackHome}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}