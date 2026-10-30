import { cookies } from "next/headers";
export async function POST() {
  cookies().delete("n_session");
  return Response.json({ ok: true });
}