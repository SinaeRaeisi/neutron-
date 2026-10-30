"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="card max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold text-danger">خطایی رخ داد</h1>
        <p className="text-muted text-sm break-words">{error.message || "مشکلی پیش آمد."}</p>
        <button onClick={reset} className="btn-primary">تلاش دوباره</button>
      </div>
    </div>
  );
}