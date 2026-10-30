import { NextResponse } from "next/server";
import { getAllCourses } from "@/lib/content";

export async function GET() {
  return NextResponse.json({ courses: getAllCourses() });
}