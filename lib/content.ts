import {
  dbListCustomArticles, dbListCustomCourses,
  dbGetArticleOverrides, dbGetArticleDeleted,
  dbGetCourseOverrides, dbGetCourseDeleted,
} from "./db-file";
import type { Article, Course } from "./types";

export async function getAllArticles(): Promise<Article[]> {
  const overrides = await dbGetArticleOverrides();
  const deleted = new Set(await dbGetArticleDeleted());

  const custom = (await dbListCustomArticles())
    .filter(a => !deleted.has(a.slug))
    .map(a => ({ ...a, ...(overrides[a.slug] ?? {}) }));

  return custom;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find(a => a.slug === slug) ?? null;
}

export async function getAllCourses(): Promise<Course[]> {
  const overrides = await dbGetCourseOverrides();
  const deleted = new Set(await dbGetCourseDeleted());

  const custom = (await dbListCustomCourses())
    .filter(c => !deleted.has(c.id))
    .map(c => ({ ...c, ...(overrides[c.id] ?? {}) }));

  return custom;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const courses = await getAllCourses();
  return courses.find(c => c.id === id) ?? null;
}

export function isSeedArticle(slug: string): boolean {
  return false; // دیگر داده تستی نداریم
}

export function isSeedCourse(id: string): boolean {
  return false; // دیگر داده تستی نداریم
}