import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  User, Subscription, PlanId, ExamRegistration, MockExamAttempt,
  Quiz, LiveClass, MockExam, SupportTicket, TicketMessage,
  PendingPayment, ContactRequest, Testimonial, Course, Article,
  QandAQuestion, QandAAnswer, Notification,
  LiveChatState, LiveChatMessage,
} from "./types";
import {
  users as seedUsers,
  quizzes as seedQuizzes,
  liveClasses as seedLiveClasses,
  mockExams as seedMockExams,
} from "./data";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

interface DB {
  users: User[];
  subscriptions: Subscription[];
  registrations: ExamRegistration[];
  mockAttempts: MockExamAttempt[];
  customQuizzes: Quiz[];
  customLiveClasses: LiveClass[];
  customMockExams: MockExam[];
  tickets: SupportTicket[];
  pendingPayments: PendingPayment[];
  contacts: ContactRequest[];
  testimonials: Testimonial[];
  customCourses: Course[];
  customArticles: Article[];
  qandaQuestions: QandAQuestion[];
  qandaAnswers: QandAAnswer[];
  notifications: Notification[];
  articleOverrides: Record<string, Partial<Article>>;
  articleDeleted: string[];
  courseOverrides: Record<string, Partial<Course>>;
  courseDeleted: string[];
  liveChatStates: Record<string, LiveChatState>;
  liveChatMessages: LiveChatMessage[];
}

const VALID_GRADES: readonly number[] = [6, 7, 8, 9, 10, 11, 12];

function normalizeUser(u: User): User {
  const g = typeof u.grade === "string" ? Number(u.grade) : u.grade;
  return {
    ...u,
    grade: typeof g === "number" && VALID_GRADES.includes(g) ? (g as User["grade"]) : undefined,
  };
}

function emptyDB(): DB {
  return {
    users: seedUsers.map(u => ({ ...u })),
    subscriptions: [],
    registrations: [],
    mockAttempts: [],
    customQuizzes: [...seedQuizzes],
    customLiveClasses: [...seedLiveClasses],
    customMockExams: [...seedMockExams],
    tickets: [],
    pendingPayments: [],
    contacts: [],
    testimonials: [],
    customCourses: [],
    customArticles: [],
    qandaQuestions: [],
    qandaAnswers: [],
    notifications: [],
    articleOverrides: {},
    articleDeleted: [],
    courseOverrides: {},
    courseDeleted: [],
    liveChatStates: {},
  liveChatMessages: [],
  };
}

function load(): DB {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    return {
      users: Array.isArray(db.users) ? db.users.map(normalizeUser) : [],
      subscriptions: Array.isArray(db.subscriptions) ? db.subscriptions : [],
      registrations: Array.isArray(db.registrations) ? db.registrations : [],
      mockAttempts: Array.isArray(db.mockAttempts) ? db.mockAttempts : [],
      customQuizzes: Array.isArray(db.customQuizzes) ? db.customQuizzes : [],
      customLiveClasses: Array.isArray(db.customLiveClasses) ? db.customLiveClasses : [],
      customMockExams: Array.isArray(db.customMockExams) ? db.customMockExams : [],
      tickets: Array.isArray(db.tickets) ? db.tickets : [],
      pendingPayments: Array.isArray(db.pendingPayments) ? db.pendingPayments : [],
      contacts: Array.isArray(db.contacts) ? db.contacts : [],
      testimonials: Array.isArray(db.testimonials) ? db.testimonials : [],
      customCourses: Array.isArray(db.customCourses) ? db.customCourses : [],
      customArticles: Array.isArray(db.customArticles) ? db.customArticles : [],
      qandaQuestions: Array.isArray(db.qandaQuestions) ? db.qandaQuestions : [],
      qandaAnswers: Array.isArray(db.qandaAnswers) ? db.qandaAnswers : [],
      notifications: Array.isArray(db.notifications) ? db.notifications : [],
      articleOverrides: db.articleOverrides && typeof db.articleOverrides === "object" ? db.articleOverrides : {},
      articleDeleted: Array.isArray(db.articleDeleted) ? db.articleDeleted : [],
      courseOverrides: db.courseOverrides && typeof db.courseOverrides === "object" ? db.courseOverrides : {},
      courseDeleted: Array.isArray(db.courseDeleted) ? db.courseDeleted : [],
      liveChatStates: db.liveChatStates && typeof db.liveChatStates === "object" ? db.liveChatStates : {},
      liveChatMessages: Array.isArray(db.liveChatMessages) ? db.liveChatMessages : [],
    };
  } catch {
    const initial = emptyDB();
    save(initial);
    return initial;
  }
}

function save(db: DB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// ─── Users ───
export function dbGetUserByPhone(phone: string): User | null {
  return load().users.find(u => u.phone === phone) ?? null;
}
export function dbGetUserByEmail(email: string): User | null {
  const norm = email.trim().toLowerCase();
  return load().users.find(u => (u.email ?? "").toLowerCase() === norm) ?? null;
}
export function dbGetUserById(id: string): User | null {
  return load().users.find(u => u.id === id) ?? null;
}
export function dbListUsers(): User[] { return load().users; }

export function dbCreateUser(input: {
  name: string; phone: string;
  grade: NonNullable<User["grade"]>; major: NonNullable<User["major"]>;
}): User {
  const db = load();
  if (db.users.some(u => u.phone === input.phone)) throw new Error("duplicate-phone");
  const user: User = {
    id: "u-" + randomUUID().slice(0, 8),
    name: input.name, phone: input.phone, role: "student",
    grade: input.grade, major: input.major, avatarColor: "lime",
  };
  db.users.push(user);
  save(db);
  return user;
}

export function dbCreateUserWithEmail(input: {
  name: string; email: string;
  grade: NonNullable<User["grade"]>; major: NonNullable<User["major"]>;
  phone?: string;
}): User {
  const db = load();
  const norm = input.email.trim().toLowerCase();
  if (db.users.some(u => (u.email ?? "").toLowerCase() === norm)) throw new Error("duplicate-email");
  const user: User = {
    id: "u-" + randomUUID().slice(0, 8),
    name: input.name, email: norm, phone: input.phone, role: "student",
    grade: input.grade, major: input.major, avatarColor: "lime",
  };
  db.users.push(user);
  save(db);
  return user;
}

export function dbUpdateUser(id: string, patch: Partial<User>): User | null {
  const db = load();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx < 0) return null;
  db.users[idx] = normalizeUser({ ...db.users[idx], ...patch });
  save(db);
  return db.users[idx];
}

// ─── Subscriptions ───
export function dbGetActiveSubscription(userId: string): Subscription | null {
  const db = load();
  const now = Date.now();
  return db.subscriptions.find(s =>
    s.userId === userId && s.status === "active" && new Date(s.expiresAt).getTime() > now
  ) ?? null;
}

export function dbCreateSubscription(input: {
  userId: string; plan: PlanId;
  grade: NonNullable<User["grade"]>; major: NonNullable<User["major"]>;
  months: number; price: number;
}): Subscription {
  const db = load();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + input.months);
  db.subscriptions = db.subscriptions.map(s =>
    s.userId === input.userId && s.status === "active"
      ? { ...s, status: "expired" as const } : s
  );
  const sub: Subscription = {
    id: "s-" + randomUUID().slice(0, 8),
    userId: input.userId, plan: input.plan,
    grade: input.grade, major: input.major,
    startedAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
    durationDays: input.months * 30, price: input.price, status: "active",
  };
  db.subscriptions.push(sub);
  save(db);
  return sub;
}

// ─── Registrations / Mock attempts ───
export function dbHasRegistration(userId: string, examId: string, examType: "mock" | "live"): boolean {
  return load().registrations.some(r =>
    r.userId === userId && r.examId === examId && r.examType === examType
  );
}
export function dbCreateRegistration(input: { userId: string; examId: string; examType: "mock" | "live"; }): ExamRegistration {
  const db = load();
  const existing = db.registrations.find(r =>
    r.userId === input.userId && r.examId === input.examId && r.examType === input.examType
  );
  if (existing) return existing;
  const reg: ExamRegistration = {
    id: "r-" + randomUUID().slice(0, 8),
    userId: input.userId, examId: input.examId, examType: input.examType,
    registeredAt: new Date().toISOString(),
  };
  db.registrations.push(reg);
  save(db);
  return reg;
}
export function dbListUserRegistrations(userId: string): ExamRegistration[] {
  return load().registrations.filter(r => r.userId === userId);
}
export function dbSaveMockAttempt(input: {
  userId: string; examId: string;
  answers: Record<string, number>; score: number;
}): MockExamAttempt {
  const db = load();
  const attempt: MockExamAttempt = {
    id: "ma-" + randomUUID().slice(0, 8),
    userId: input.userId, examId: input.examId,
    answers: input.answers, score: input.score,
    takenAt: new Date().toISOString(),
  };
  db.mockAttempts.push(attempt);
  save(db);
  return attempt;
}
export function dbListUserMockAttempts(userId: string): MockExamAttempt[] {
  return load().mockAttempts.filter(a => a.userId === userId);
}

// ─── Custom Quizzes ───
export function dbListCustomQuizzes(): Quiz[] { return load().customQuizzes; }
export function dbGetCustomQuiz(id: string): Quiz | null {
  return load().customQuizzes.find(q => q.id === id) ?? null;
}
export function dbCreateCustomQuiz(q: Quiz): Quiz {
  const db = load(); db.customQuizzes.push(q); save(db); return q;
}

// ─── Custom Live Classes ───
export function dbListCustomLiveClasses(): LiveClass[] { return load().customLiveClasses; }
export function dbCreateCustomLiveClass(l: LiveClass): LiveClass {
  const db = load(); db.customLiveClasses.push(l); save(db); return l;
}
export function dbGetLiveClassById(id: string): LiveClass | null {
  return load().customLiveClasses.find(l => l.id === id) ?? null;
}
export function dbUpdateLiveClass(id: string, patch: Partial<LiveClass>): LiveClass | null {
  const db = load();
  const idx = db.customLiveClasses.findIndex(l => l.id === id);
  if (idx < 0) return null;
  db.customLiveClasses[idx] = { ...db.customLiveClasses[idx], ...patch };
  save(db);
  return db.customLiveClasses[idx];
}
export function dbDeleteLiveClass(id: string): boolean {
  const db = load();
  const before = db.customLiveClasses.length;
  db.customLiveClasses = db.customLiveClasses.filter(l => l.id !== id);
  save(db);
  return db.customLiveClasses.length < before;
}

// ─── Custom Mock Exams ───
export function dbListCustomMockExams(): MockExam[] { return load().customMockExams; }
export function dbCreateCustomMockExam(m: MockExam): MockExam {
  const db = load(); db.customMockExams.push(m); save(db); return m;
}
export function dbGetMockExamById(id: string): MockExam | null {
  return load().customMockExams.find(m => m.id === id) ?? null;
}
export function dbUpdateMockExam(id: string, patch: Partial<MockExam>): MockExam | null {
  const db = load();
  const idx = db.customMockExams.findIndex(m => m.id === id);
  if (idx < 0) return null;
  db.customMockExams[idx] = { ...db.customMockExams[idx], ...patch };
  save(db);
  return db.customMockExams[idx];
}
export function dbDeleteMockExam(id: string): boolean {
  const db = load();
  const before = db.customMockExams.length;
  db.customMockExams = db.customMockExams.filter(m => m.id !== id);
  save(db);
  return db.customMockExams.length < before;
}

// ─── Tickets ───
export function dbListUserTickets(userId: string): SupportTicket[] {
  return load().tickets.filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
export function dbGetTicket(id: string): SupportTicket | null {
  return load().tickets.find(t => t.id === id) ?? null;
}
export function dbCreateTicket(input: {
  userId: string; userName: string;
  subject: string; category: string; text: string;
}): SupportTicket {
  const db = load();
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: "t-" + randomUUID().slice(0, 8),
    userId: input.userId, userName: input.userName,
    subject: input.subject, category: input.category as any,
    status: "open", createdAt: now, updatedAt: now,
    messages: [{
      id: "m-" + randomUUID().slice(0, 8),
      authorId: input.userId, authorRole: "student", authorName: input.userName,
      text: input.text, sentAt: now,
    }],
  };
  db.tickets.unshift(ticket);
  save(db);
  return ticket;
}
export function dbAddTicketMessage(input: {
  ticketId: string; authorId: string;
  authorRole: "student" | "teacher" | "admin";
  authorName: string; text: string;
}): SupportTicket | null {
  const db = load();
  const idx = db.tickets.findIndex(t => t.id === input.ticketId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const msg: TicketMessage = {
    id: "m-" + randomUUID().slice(0, 8),
    authorId: input.authorId, authorRole: input.authorRole,
    authorName: input.authorName, text: input.text, sentAt: now,
  };
  db.tickets[idx].messages.push(msg);
  db.tickets[idx].updatedAt = now;
  if (input.authorRole === "admin") db.tickets[idx].status = "answered";
  save(db);
  return db.tickets[idx];
}
export function dbListAllTickets(): SupportTicket[] {
  return load().tickets.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ─── Pending Payments ───
export function dbCreatePendingPayment(input: {
  userId: string; userName: string; userPhone?: string;
  plan: PlanId; months: number; price: number;
}): PendingPayment {
  const db = load();
  const p: PendingPayment = {
    id: "pp-" + randomUUID().slice(0, 8),
    userId: input.userId, userName: input.userName, userPhone: input.userPhone,
    plan: input.plan, months: input.months, price: input.price,
    status: "pending_receipt", createdAt: new Date().toISOString(),
  };
  db.pendingPayments.unshift(p);
  save(db);
  return p;
}
export function dbGetPendingPayment(id: string): PendingPayment | null {
  return load().pendingPayments.find(p => p.id === id) ?? null;
}
export function dbUpdatePendingPayment(id: string, patch: Partial<PendingPayment>): PendingPayment | null {
  const db = load();
  const idx = db.pendingPayments.findIndex(p => p.id === id);
  if (idx < 0) return null;
  db.pendingPayments[idx] = { ...db.pendingPayments[idx], ...patch };
  save(db);
  return db.pendingPayments[idx];
}
export function dbListPendingPayments(): PendingPayment[] {
  return load().pendingPayments.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─── Contacts ───
export function dbCreateContact(input: {
  name: string; phone: string; email?: string; message?: string;
  grade?: number; major?: string;
}): ContactRequest {
  const db = load();
  const c: ContactRequest = {
    id: "c-" + randomUUID().slice(0, 8),
    name: input.name, phone: input.phone,
    email: input.email, message: input.message,
    grade: input.grade, major: input.major,
    status: "new", createdAt: new Date().toISOString(),
  };
  db.contacts.unshift(c);
  save(db);
  return c;
}
export function dbListContacts(): ContactRequest[] {
  return load().contacts.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
export function dbUpdateContact(id: string, patch: Partial<ContactRequest>): ContactRequest | null {
  const db = load();
  const idx = db.contacts.findIndex(c => c.id === id);
  if (idx < 0) return null;
  db.contacts[idx] = { ...db.contacts[idx], ...patch };
  save(db);
  return db.contacts[idx];
}

// ─── Testimonials ───
export function dbCreateTestimonial(input: {
  name: string; role: string; text: string; rating: number;
}): Testimonial {
  const db = load();
  const t: Testimonial = {
    id: "ts-" + randomUUID().slice(0, 8),
    name: input.name, role: input.role, text: input.text, rating: input.rating,
    approved: input.rating === 5,
    createdAt: new Date().toISOString(),
  };
  db.testimonials.unshift(t);
  save(db);
  return t;
}
export function dbListVisibleTestimonials(): Testimonial[] {
  return load().testimonials.filter(t => t.rating === 5);
}
export function dbListAllTestimonials(): Testimonial[] {
  return load().testimonials.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
export function dbDeleteTestimonial(id: string): boolean {
  const db = load();
  const before = db.testimonials.length;
  db.testimonials = db.testimonials.filter(t => t.id !== id);
  save(db);
  return db.testimonials.length < before;
}

// ─── Custom Courses ───
export function dbListCustomCourses(): Course[] { return load().customCourses; }
export function dbCreateCustomCourse(c: Course): Course {
  const db = load(); db.customCourses.push(c); save(db); return c;
}
export function dbGetCustomCourse(id: string): Course | null {
  return load().customCourses.find(c => c.id === id) ?? null;
}
export function dbUpdateCustomCourse(id: string, patch: Partial<Course>): Course | null {
  const db = load();
  const idx = db.customCourses.findIndex(c => c.id === id);
  if (idx < 0) return null;
  db.customCourses[idx] = { ...db.customCourses[idx], ...patch };
  save(db);
  return db.customCourses[idx];
}
export function dbDeleteCustomCourse(id: string): boolean {
  const db = load();
  const before = db.customCourses.length;
  db.customCourses = db.customCourses.filter(c => c.id !== id);
  save(db);
  return db.customCourses.length < before;
}

// ─── Custom Articles ───
export function dbListCustomArticles(): Article[] { return load().customArticles; }
export function dbCreateCustomArticle(a: Article): Article {
  const db = load(); db.customArticles.push(a); save(db); return a;
}
export function dbGetCustomArticle(slug: string): Article | null {
  return load().customArticles.find(a => a.slug === slug) ?? null;
}
export function dbUpdateCustomArticle(id: string, patch: Partial<Article>): Article | null {
  const db = load();
  const idx = db.customArticles.findIndex(a => a.id === id);
  if (idx < 0) return null;
  db.customArticles[idx] = { ...db.customArticles[idx], ...patch };
  save(db);
  return db.customArticles[idx];
}
export function dbDeleteCustomArticle(id: string): boolean {
  const db = load();
  const before = db.customArticles.length;
  db.customArticles = db.customArticles.filter(a => a.id !== id);
  save(db);
  return db.customArticles.length < before;
}

// ─── Overrides ───
export function dbGetArticleOverrides(): Record<string, Partial<Article>> {
  return load().articleOverrides;
}
export function dbSetArticleOverride(slug: string, patch: Partial<Article>): void {
  const db = load();
  db.articleOverrides[slug] = { ...(db.articleOverrides[slug] ?? {}), ...patch };
  save(db);
}
export function dbGetArticleDeleted(): string[] {
  return load().articleDeleted;
}
export function dbMarkArticleDeleted(slug: string): void {
  const db = load();
  if (!db.articleDeleted.includes(slug)) {
    db.articleDeleted.push(slug);
    save(db);
  }
}
export function dbRestoreArticle(slug: string): void {
  const db = load();
  db.articleDeleted = db.articleDeleted.filter(s => s !== slug);
  delete db.articleOverrides[slug];
  save(db);
}

export function dbGetCourseOverrides(): Record<string, Partial<Course>> {
  return load().courseOverrides;
}
export function dbSetCourseOverride(id: string, patch: Partial<Course>): void {
  const db = load();
  db.courseOverrides[id] = { ...(db.courseOverrides[id] ?? {}), ...patch };
  save(db);
}
export function dbGetCourseDeleted(): string[] {
  return load().courseDeleted;
}
export function dbMarkCourseDeleted(id: string): void {
  const db = load();
  if (!db.courseDeleted.includes(id)) {
    db.courseDeleted.push(id);
    save(db);
  }
}
export function dbRestoreCourse(id: string): void {
  const db = load();
  db.courseDeleted = db.courseDeleted.filter(s => s !== id);
  delete db.courseOverrides[id];
  save(db);
}

// ─── Q&A ───
export function dbListQandA(): QandAQuestion[] {
  return load().qandaQuestions.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
export function dbGetQuestion(id: string): QandAQuestion | null {
  return load().qandaQuestions.find(q => q.id === id) ?? null;
}
export function dbCreateQuestion(input: {
  userId: string; userName: string;
  userRole: "student" | "teacher" | "admin";
  courseId?: string; lessonId?: string;
  title: string; body: string; tags: string[];
}): QandAQuestion {
  const db = load();
  const now = new Date().toISOString();
  const q: QandAQuestion = {
    id: "qa-" + randomUUID().slice(0, 8),
    userId: input.userId, userName: input.userName, userRole: input.userRole,
    courseId: input.courseId, lessonId: input.lessonId,
    title: input.title, body: input.body, tags: input.tags,
    status: "open", upvotedBy: [],
    createdAt: now, updatedAt: now,
  };
  db.qandaQuestions.unshift(q);
  save(db);
  return q;
}
export function dbDeleteQuestion(id: string): boolean {
  const db = load();
  const before = db.qandaQuestions.length;
  db.qandaQuestions = db.qandaQuestions.filter(q => q.id !== id);
  db.qandaAnswers = db.qandaAnswers.filter(a => a.questionId !== id);
  save(db);
  return db.qandaQuestions.length < before;
}
export function dbUpdateQuestion(id: string, patch: Partial<QandAQuestion>): QandAQuestion | null {
  const db = load();
  const idx = db.qandaQuestions.findIndex(q => q.id === id);
  if (idx < 0) return null;
  db.qandaQuestions[idx] = { ...db.qandaQuestions[idx], ...patch, updatedAt: new Date().toISOString() };
  save(db);
  return db.qandaQuestions[idx];
}
export function dbToggleQuestionUpvote(questionId: string, userId: string): QandAQuestion | null {
  const db = load();
  const idx = db.qandaQuestions.findIndex(q => q.id === questionId);
  if (idx < 0) return null;
  const q = db.qandaQuestions[idx];
  const has = q.upvotedBy.includes(userId);
  q.upvotedBy = has ? q.upvotedBy.filter(u => u !== userId) : [...q.upvotedBy, userId];
  save(db);
  return q;
}
export function dbListAnswers(questionId: string): QandAAnswer[] {
  return load().qandaAnswers
    .filter(a => a.questionId === questionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
export function dbGetAnswer(id: string): QandAAnswer | null {
  return load().qandaAnswers.find(a => a.id === id) ?? null;
}
export function dbCreateAnswer(input: {
  questionId: string; userId: string; userName: string;
  userRole: "student" | "teacher" | "admin"; body: string;
}): QandAAnswer | null {
  const db = load();
  const qIdx = db.qandaQuestions.findIndex(q => q.id === input.questionId);
  if (qIdx < 0) return null;
  const a: QandAAnswer = {
    id: "ans-" + randomUUID().slice(0, 8),
    questionId: input.questionId, userId: input.userId,
    userName: input.userName, userRole: input.userRole,
    body: input.body, upvotedBy: [],
    createdAt: new Date().toISOString(),
  };
  db.qandaAnswers.push(a);
  if (db.qandaQuestions[qIdx].status === "open") db.qandaQuestions[qIdx].status = "answered";
  db.qandaQuestions[qIdx].updatedAt = new Date().toISOString();
  save(db);
  return a;
}
export function dbDeleteAnswer(id: string): boolean {
  const db = load();
  const before = db.qandaAnswers.length;
  db.qandaAnswers = db.qandaAnswers.filter(a => a.id !== id);
  save(db);
  return db.qandaAnswers.length < before;
}
export function dbToggleAnswerUpvote(answerId: string, userId: string): QandAAnswer | null {
  const db = load();
  const idx = db.qandaAnswers.findIndex(a => a.id === answerId);
  if (idx < 0) return null;
  const a = db.qandaAnswers[idx];
  const has = a.upvotedBy.includes(userId);
  a.upvotedBy = has ? a.upvotedBy.filter(u => u !== userId) : [...a.upvotedBy, userId];
  save(db);
  return a;
}
export function dbAcceptAnswer(questionId: string, answerId: string): QandAQuestion | null {
  const db = load();
  const qIdx = db.qandaQuestions.findIndex(q => q.id === questionId);
  if (qIdx < 0) return null;
  const aExists = db.qandaAnswers.some(a => a.id === answerId && a.questionId === questionId);
  if (!aExists) return null;
  db.qandaQuestions[qIdx] = {
    ...db.qandaQuestions[qIdx],
    status: "resolved",
    acceptedAnswerId: answerId,
    updatedAt: new Date().toISOString(),
  };
  save(db);
  return db.qandaQuestions[qIdx];
}
export function dbUnacceptAnswer(questionId: string): QandAQuestion | null {
  const db = load();
  const qIdx = db.qandaQuestions.findIndex(q => q.id === questionId);
  if (qIdx < 0) return null;
  db.qandaQuestions[qIdx] = {
    ...db.qandaQuestions[qIdx],
    status: db.qandaAnswers.some(a => a.questionId === questionId) ? "answered" : "open",
    acceptedAnswerId: undefined,
    updatedAt: new Date().toISOString(),
  };
  save(db);
  return db.qandaQuestions[qIdx];
}

// ═══════════════════════════════════════════
// ─── Notifications ───
// ═══════════════════════════════════════════

export function dbCreateNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}): Notification {
  const db = load();
  const n: Notification = {
    id: "n-" + randomUUID().slice(0, 8),
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(n);
  save(db);
  return n;
}

export function dbListUserNotifications(userId: string, limit: number = 30): Notification[] {
  return load().notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function dbUnreadCount(userId: string): number {
  return load().notifications.filter(n => n.userId === userId && !n.read).length;
}

export function dbMarkNotificationRead(userId: string, id: string): boolean {
  const db = load();
  const idx = db.notifications.findIndex(n => n.id === id && n.userId === userId);
  if (idx < 0) return false;
  db.notifications[idx].read = true;
  save(db);
  return true;
}

export function dbMarkAllNotificationsRead(userId: string): number {
  const db = load();
  let count = 0;
  db.notifications = db.notifications.map(n => {
    if (n.userId === userId && !n.read) {
      count++;
      return { ...n, read: true };
    }
    return n;
  });
  save(db);
  return count;
}

export function dbDeleteNotification(userId: string, id: string): boolean {
  const db = load();
  const before = db.notifications.length;
  db.notifications = db.notifications.filter(n => !(n.id === id && n.userId === userId));
  save(db);
  return db.notifications.length < before;
}

/** ارسال به همهٔ دانش‌آموزان یک پایه/رشته (مثلاً کلاس جدید) */
export function dbBroadcastToStudents(filter: {
  grade?: number;
  major?: string;
}, input: {
  title: string;
  body: string;
  href?: string;
}): number {
  const db = load();
  const targets = db.users.filter(u => {
    if (u.role !== "student") return false;
    if (filter.grade && u.grade !== filter.grade) return false;
    if (filter.major && filter.major !== "عمومی" && u.major && u.major !== filter.major) return false;
    return true;
  });
  const now = new Date().toISOString();
  targets.forEach(u => {
    db.notifications.unshift({
      id: "n-" + randomUUID().slice(0, 8),
      userId: u.id,
      title: input.title,
      body: input.body,
      href: input.href,
      read: false,
      createdAt: now,
    });
  });
  save(db);
  return targets.length;
}
// ═══════════════════════════════════════════
// ─── Live Chat ───
// ═══════════════════════════════════════════

export function dbGetChatState(liveId: string): LiveChatState {
  const db = load();
  const existing = db.liveChatStates[liveId];
  if (existing) {
    return {
      ...existing,
      kickedFromLive: existing.kickedFromLive ?? [],
      bannedFromChat: existing.bannedFromChat ?? [],
    };
  }
  const fresh: LiveChatState = {
    liveId,
    chatMode: "public",
    chatLocked: false,
    kickedFromLive: [],
    bannedFromChat: [],
    updatedAt: new Date().toISOString(),
  };
  db.liveChatStates[liveId] = fresh;
  save(db);
  return fresh;
}

export function dbSetChatState(liveId: string, patch: {
  chatMode?: "public" | "private";
  chatLocked?: boolean;
  kickedFromLive?: string[];
  bannedFromChat?: string[];
}): LiveChatState {
  const db = load();
  const current = db.liveChatStates[liveId] ?? {
    liveId,
    chatMode: "public" as const,
    chatLocked: false,
    kickedFromLive: [] as string[],
    bannedFromChat: [] as string[],
    updatedAt: new Date().toISOString(),
  };
  const next: LiveChatState = {
    ...current,
    kickedFromLive: current.kickedFromLive ?? [],
    bannedFromChat: current.bannedFromChat ?? [],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  db.liveChatStates[liveId] = next;
  save(db);
  return next;
}

/** پیام‌ها با فیلتر دسترسی — بر اساس حالت چت */
export function dbListChatMessages(
  liveId: string,
  viewerId: string,
  viewerRole: "student" | "teacher" | "admin"
): LiveChatMessage[] {
  const state = dbGetChatState(liveId);
  const all = load().liveChatMessages
    .filter(m => m.liveId === liveId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const isStaff = viewerRole === "teacher" || viewerRole === "admin";
  if (isStaff) return all;                     // معلم/ادمین همه را می‌بیند
  if (state.chatMode === "public") return all; // عمومی

  // حالت خصوصی — فقط پیام‌های خودش و معلم‌ها
  return all.filter(m =>
    m.userId === viewerId ||
    m.userRole === "teacher" ||
    m.userRole === "admin"
  );
}

export function dbCreateChatMessage(input: {
  liveId: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  text: string;
}): LiveChatMessage {
  const db = load();
  const msg: LiveChatMessage = {
    id: "lcm-" + randomUUID().slice(0, 8),
    liveId: input.liveId,
    userId: input.userId,
    userName: input.userName,
    userRole: input.userRole,
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  db.liveChatMessages.push(msg);

  // نگه‌داری حداکثر ۲۰۰۰ پیام به ازای هر کلاس
  const forLive = db.liveChatMessages.filter(m => m.liveId === input.liveId);
  if (forLive.length > 2000) {
    const toKeep = new Set(
      forLive
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2000)
        .map(m => m.id)
    );
    db.liveChatMessages = db.liveChatMessages.filter(
      m => m.liveId !== input.liveId || toKeep.has(m.id)
    );
  }

  save(db);
  return msg;
}

export function dbDeleteChatMessage(id: string): boolean {
  const db = load();
  const before = db.liveChatMessages.length;
  db.liveChatMessages = db.liveChatMessages.filter(m => m.id !== id);
  save(db);
  return db.liveChatMessages.length < before;
}