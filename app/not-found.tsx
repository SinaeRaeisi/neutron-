import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="card max-w-md text-center space-y-4">
        <div className="text-5xl font-black text-lime">۴۰۴</div>
        <h1 className="text-xl font-bold">صفحه پیدا نشد</h1>
        <Link href="/" className="btn-primary inline-flex">بازگشت به خانه</Link>
      </div>
    </div>
  );
}