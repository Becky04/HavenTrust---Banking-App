"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-gray-500">
        We couldn't load this page. Please check your connection.
      </p>
      <button onClick={reset} className="rounded bg-black px-4 py-2 text-white">
        Try again
      </button>
    </div>
  );
}
