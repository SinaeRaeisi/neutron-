export type Role = "student" | "teacher" | "admin";
export type Grade = 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Major = "ریاضی" | "تجربی" | "انسانی" | "فنی" | "هنر" | "عمومی";
export type Level = "پایه" | "متوسط" | "پیشرفته";
export type CoverColor = "lime" | "sky" | "violet" | "amber" | "rose";

export interface User {
  id: string;
  name: string;
  role: Role;
  phone?: string;
  email?: string;
  bio?: string;
  avatarColor?: CoverColor;
  students?: number;
  rating?: number;
  grade?: Grade;
  major?: Major;
}

export interface Concept {
  id: string;
  title: string;
  subject: string;
  grade: Grade;
  major?: Major;
  requires: string[];
  x: number;
  y: number;
}

export type LessonType = "video" | "article" | "quiz" | "exercise";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  free?: boolean;
  videoUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  grade: Grade;
  major?: Major;
  teacherId: string;
  availableTeachers?: string[];
  conceptIds: string[];
  lessons: Lesson[];
  summary: string;
  level: Level;
  cover: CoverColor;
  rating: number;
  ratingsCount: number;
  students: number;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  conceptId: string;
  weight: number;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  questions: Question[];
  durationMin: number;
}

export interface Attempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, number>;
  score: number;
  gaps: string[];
  takenAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  teacherId: string;
  scheduledAt: string;
  durationMin: number;
  capacity: number;
  enrolled: number;
  status: "upcoming" | "live" | "ended";
  recordingUrl?: string;
  description: string;
  requiredQuizId?: string;
  notes?: string;
  attachments?: Attachment[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  category: string;
  cover: CoverColor;
  coverImage?: string; // ← این خط اضافه شد
  readMinutes: number;
  publishedAt: string;
  tags: string[];
  featured?: boolean;
}

export interface MockExam {
  id: string;
  title: string;
  grade: Grade;
  major: Major;
  scheduledAt: string;
  durationMin: number;
  questionCount: number;
  registered: number;
  capacity: number;
  status: "upcoming" | "live" | "ended";
  subjects: string[];
  description: string;
  fee: number;
  questions?: Question[];
}

export interface MockExamResult {
  id: string;
  mockExamId: string;
  userId: string;
  score: number;
  rank: number;
  percentile: number;
  takenAt: string;
}

export type TicketStatus = "open" | "answered" | "closed";
export type TicketCategory = "پرداخت" | "فنی" | "آموزشی" | "پیشنهاد" | "سایر";

export interface TicketMessage {
  id: string;
  authorId: string;
  authorRole: Role;
  authorName: string;
  text: string;
  sentAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export type PlanId = "basic" | "pro" | "vip";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanId;
  grade: Grade;
  major: Major;
  startedAt: string;
  expiresAt: string;
  durationDays: number;
  price: number;
  status: "active" | "expired" | "cancelled";
}

export interface ExamRegistration {
  id: string;
  userId: string;
  examId: string;
  examType: "mock" | "live";
  registeredAt: string;
}

export interface MockExamAttempt {
  id: string;
  userId: string;
  examId: string;
  answers: Record<string, number>;
  score: number;
  takenAt: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  grade?: number;
  major?: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  approved: boolean;
  createdAt: string;
}

export type PendingPaymentStatus =
  | "pending_receipt"
  | "pending_review"
  | "approved"
  | "rejected";

export interface PendingPayment {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  plan: PlanId;
  months: number;
  price: number;
  status: PendingPaymentStatus;
  receiptUrl?: string;
  receiptName?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type QandAStatus = "open" | "answered" | "resolved";

export interface QandAQuestion {
  id: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  courseId?: string;
  lessonId?: string;
  title: string;
  body: string;
  tags: string[];
  status: QandAStatus;
  acceptedAnswerId?: string;
  upvotedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QandAAnswer {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  body: string;
  upvotedBy: string[];
  createdAt: string;
}

export interface LiveChatState {
  liveId: string;
  chatMode: "public" | "private";
  chatLocked: boolean;
  kickedFromLive: string[];    // userIds اخراج‌شده از کلاس
  bannedFromChat: string[];    // userIds مسدود از چت
  updatedAt: string;
}

export interface LiveChatMessage {
  id: string;
  liveId: string;
  userId: string;
  userName: string;
  userRole: "student" | "teacher" | "admin";
  text: string;
  createdAt: string;
}