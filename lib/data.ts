import type { User, Concept, Course, Quiz, Review, Lesson, LiveClass, Article, MockExam, SupportTicket } from "./types";

// ─── آرایه‌های خالی (محتوای واقعی از دیتابیس خوانده می‌شود) ───
export const users: User[] = [];
export const concepts: Concept[] = [];
export const courses: Course[] = [];
export const quizzes: Quiz[] = [];
export const reviews: Review[] = [];
export const liveClasses: LiveClass[] = [];
export const articles: Article[] = [];
export const mockExams: MockExam[] = [];
export const supportTickets: SupportTicket[] = [];

// ─── توابع کمکی عمومی ───
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getTeacher = (id: string) => users.find(u => u.id === id);
export const getReviews = (courseId: string) => reviews.filter(r => r.courseId === courseId);
export const getCourseQuizzes = (courseId: string, extra: Quiz[] = []) =>
  [...quizzes, ...extra].filter(q => q.courseId === courseId);
export const getArticle = (slug: string) => articles.find(a => a.slug === slug);
export const getLiveForTeacher = (teacherId: string) =>
  liveClasses.filter(l => l.teacherId === teacherId);
export const getMockForGrade = (grade: number) =>
  mockExams.filter(m => m.grade === grade);

export const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;
export const MAJORS = ["عمومی", "ریاضی", "تجربی", "انسانی", "فنی", "هنر"] as const;

export function gradeLabel(g: number): string {
  const names: Record<number, string> = {
    6: "ششم", 7: "هفتم", 8: "هشتم", 9: "نهم",
    10: "دهم", 11: "یازدهم", 12: "دوازدهم",
  };
  return names[g] ?? String(g);
}

export function majorsForGrade(grade: number): string[] {
  if (grade <= 9) return ["عمومی"];
  return ["ریاضی", "تجربی", "انسانی", "فنی", "هنر"];
}