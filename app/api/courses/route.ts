import { NextResponse } from "next/server";
import { getAllCourses } from "@/lib/content";

export async function GET() {
  const courses = await getAllCourses(); // ← await اضافه شد
  return NextResponse.json({ courses });
}