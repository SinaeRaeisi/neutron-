import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import type { Role } from "@/lib/types";

const RULES: Array<[RegExp, Role[]]> = [
  [/^\/teacher/, ["teacher", "admin"]],
  [/^\/admin/, ["admin"]],
  [/^\/app/, ["student", "teacher", "admin"]],
];

export async function middleware(req: NextRequest) {
  const rule = RULES.find(([re]) => re.test(req.nextUrl.pathname));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("n_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("n_session");
    return res;
  }

  if (!rule[1].includes(session.role)) {
    return NextResponse.redirect(new URL("/login?denied=1", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-user-id", session.userId);
  headers.set("x-user-role", session.role);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/app/:path*", "/teacher/:path*", "/admin/:path*"] };