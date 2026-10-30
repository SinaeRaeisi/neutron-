import { articles as seedArticles, courses as seedCourses } from "./data";
import {
  dbListCustomArticles, dbListCustomCourses,
  dbGetArticleOverrides, dbGetArticleDeleted,
  dbGetCourseOverrides, dbGetCourseDeleted,
} from "./db-file";
import type { Article, Course } from "./types";

/**
 * همهٔ مقالات: seed (با override) + custom — بدون حذف‌شده‌ها.
 * ترتیب: custom (جدیدتر) اول، بعد seed.
 */
export function getAllArticles(): Article[] {
  const overrides = dbGetArticleOverrides();
  const deleted = new Set(dbGetArticleDeleted());

  const seed = seedArticles
    .filter(a => !deleted.has(a.slug))
    .map(a => ({ ...a, ...(overrides[a.slug] ?? {}) }));

  const custom = dbListCustomArticles()
    .filter(a => !deleted.has(a.slug))
    .map(a => ({ ...a, ...(overrides[a.slug] ?? {}) }));

  return [...custom, ...seed];
}

export function getArticleBySlug(slug: string): Article | null {
  return getAllArticles().find(a => a.slug === slug) ?? null;
}

export function getAllCourses(): Course[] {
  const overrides = dbGetCourseOverrides();
  const deleted = new Set(dbGetCourseDeleted());

  const seed = seedCourses
    .filter(c => !deleted.has(c.id))
    .map(c => ({ ...c, ...(overrides[c.id] ?? {}) }));

  const custom = dbListCustomCourses()
    .filter(c => !deleted.has(c.id))
    .map(c => ({ ...c, ...(overrides[c.id] ?? {}) }));

  return [...custom, ...seed];
}

export function getCourseById(id: string): Course | null {
  return getAllCourses().find(c => c.id === id) ?? null;
}

export function isSeedArticle(slug: string): boolean {
  return seedArticles.some(a => a.slug === slug);
}

export function isSeedCourse(id: string): boolean {
  return seedCourses.some(c => c.id === id);
}