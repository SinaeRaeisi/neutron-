import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import type {
  User, Course, Quiz, Attempt, QandAQuestion, QandAAnswer,
  Subscription, Notification, PendingPayment, LiveClass, MockExam,
  SupportTicket, ContactRequest, Testimonial, Article,
  ExamRegistration, MockExamAttempt, LiveChatState, LiveChatMessage,
  PlanId
} from './types'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables")
}

const adapter = new PrismaPg({ connectionString })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const VALID_GRADES = [6, 7, 8, 9, 10, 11, 12]
function normalizeUser(u: any): User {
  const g = typeof u.grade === "string" ? Number(u.grade) : u.grade
  return { ...u, grade: VALID_GRADES.includes(g) ? g : undefined }
}

// ─── Users ───
export async function dbGetUserByPhone(phone: string): Promise<User | null> { 
  const u = await prisma.user.findFirst({ where: { phone } }); return u ? normalizeUser(u) : null 
}
export async function dbGetUserByEmail(email: string): Promise<User | null> { 
  const u = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } }); return u ? normalizeUser(u) : null 
}
export async function dbGetUserById(id: string): Promise<User | null> { 
  const u = await prisma.user.findUnique({ where: { id } }); return u ? normalizeUser(u) : null 
}
export async function dbListUsers(): Promise<User[]> { 
  const users = await prisma.user.findMany(); return users.map(normalizeUser) 
}
export async function dbCreateUser(input: any): Promise<User> {
  const existing = await prisma.user.findFirst({ where: { phone: input.phone } })
  if (existing) throw new Error("duplicate-phone")
  const dummyEmail = input.email || `phone_${input.phone}@neutron.local`
  const u = await prisma.user.create({ data: { name: input.name, phone: input.phone, email: dummyEmail, grade: input.grade, major: input.major, role: "student" } })
  return normalizeUser(u)
}
export async function dbCreateUserWithEmail(input: any): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
  if (existing) throw new Error("duplicate-email")
  const u = await prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), grade: input.grade, major: input.major, phone: input.phone, role: "student" } })
  return normalizeUser(u)
}
export async function dbUpdateUser(id: string, patch: any): Promise<User | null> {
  const u = await prisma.user.update({ where: { id }, data: patch }); return normalizeUser(u)
}

// ─── Subscriptions ───
export async function dbGetActiveSubscription(userId: string): Promise<Subscription | null> {
  return prisma.subscription.findFirst({ where: { userId, status: "active", expiresAt: { gt: new Date() } } }) as any
}
export async function dbCreateSubscription(input: any): Promise<Subscription> {
  const now = new Date(); const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + input.months)
  await prisma.subscription.updateMany({ where: { userId: input.userId, status: "active" }, data: { status: "expired" } })
  return prisma.subscription.create({ data: { ...input, startedAt: now, expiresAt } }) as any
}

// ─── Registrations / Mock Attempts ───
export async function dbHasRegistration(userId: string, examId: string, examType: string): Promise<boolean> {
  const r = await prisma.examRegistration.findFirst({ where: { userId, examId, examType } }); return !!r
}
export async function dbCreateRegistration(input: any): Promise<ExamRegistration> {
  const existing = await prisma.examRegistration.findFirst({ where: { userId: input.userId, examId: input.examId, examType: input.examType } })
  if (existing) return existing as any
  return prisma.examRegistration.create({ data: input }) as any
}
export async function dbListUserRegistrations(userId: string): Promise<ExamRegistration[]> {
  return prisma.examRegistration.findMany({ where: { userId } }) as any
}
export async function dbSaveMockAttempt(input: any): Promise<MockExamAttempt> {
  return prisma.mockExamAttempt.create({ data: input }) as any
}
export async function dbListUserMockAttempts(userId: string): Promise<MockExamAttempt[]> {
  return prisma.mockExamAttempt.findMany({ where: { userId } }) as any
}

// ─── Quizzes ───
export async function dbListCustomQuizzes(): Promise<Quiz[]> { return prisma.quiz.findMany() as any }
export async function dbGetCustomQuiz(id: string): Promise<Quiz | null> { return prisma.quiz.findUnique({ where: { id } }) as any }
export async function dbCreateCustomQuiz(q: any): Promise<Quiz> { return prisma.quiz.create({ data: q }) as any }

// ─── Live Classes ───
export async function dbListCustomLiveClasses(): Promise<LiveClass[]> { return prisma.liveClass.findMany() as any }
export async function dbCreateCustomLiveClass(l: any): Promise<LiveClass> { return prisma.liveClass.create({ data: l }) as any }
export async function dbGetLiveClassById(id: string): Promise<LiveClass | null> { return prisma.liveClass.findUnique({ where: { id } }) as any }
export async function dbUpdateLiveClass(id: string, patch: any): Promise<LiveClass | null> { return prisma.liveClass.update({ where: { id }, data: patch }) as any }
export async function dbDeleteLiveClass(id: string): Promise<boolean> { await prisma.liveClass.delete({ where: { id } }); return true }

// ─── Mock Exams ───
export async function dbListCustomMockExams(): Promise<MockExam[]> { return prisma.mockExam.findMany() as any }
export async function dbCreateCustomMockExam(m: any): Promise<MockExam> { return prisma.mockExam.create({ data: m }) as any }
export async function dbGetMockExamById(id: string): Promise<MockExam | null> { return prisma.mockExam.findUnique({ where: { id } }) as any }
export async function dbUpdateMockExam(id: string, patch: any): Promise<MockExam | null> { return prisma.mockExam.update({ where: { id }, data: patch }) as any }
export async function dbDeleteMockExam(id: string): Promise<boolean> { await prisma.mockExam.delete({ where: { id } }); return true }

// ─── Tickets ───
export async function dbListUserTickets(userId: string): Promise<SupportTicket[]> {
  return prisma.supportTicket.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }) as any
}
export async function dbGetTicket(id: string): Promise<SupportTicket | null> {
  return prisma.supportTicket.findUnique({ where: { id } }) as any
}
export async function dbCreateTicket(input: any): Promise<SupportTicket> {
  const now = new Date().toISOString()
  const msg = { id: "m-" + Math.random().toString(36).slice(2,8), authorId: input.userId, authorRole: "student", authorName: input.userName, text: input.text, sentAt: now }
  return prisma.supportTicket.create({ data: { ...input, messages: [msg], status: "open", createdAt: new Date(now), updatedAt: new Date(now) } }) as any
}
export async function dbAddTicketMessage(input: any): Promise<SupportTicket | null> {
  const t = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } })
  if (!t) return null
  const msgs = (t.messages as any[]) || []
  const msg = { id: "m-" + Math.random().toString(36).slice(2,8), authorId: input.authorId, authorRole: input.authorRole, authorName: input.authorName, text: input.text, sentAt: new Date().toISOString() }
  msgs.push(msg)
  return prisma.supportTicket.update({ where: { id: input.ticketId }, data: { messages: msgs, updatedAt: new Date(), status: input.authorRole === "admin" ? "answered" : t.status } }) as any
}
export async function dbListAllTickets(): Promise<SupportTicket[]> {
  return prisma.supportTicket.findMany({ orderBy: { updatedAt: 'desc' } }) as any
}

// ─── Pending Payments ───
export async function dbCreatePendingPayment(input: any): Promise<PendingPayment> { return prisma.pendingPayment.create({ data: input }) as any }
export async function dbGetPendingPayment(id: string): Promise<PendingPayment | null> { return prisma.pendingPayment.findUnique({ where: { id } }) as any }
export async function dbUpdatePendingPayment(id: string, patch: any): Promise<PendingPayment | null> { return prisma.pendingPayment.update({ where: { id }, data: patch }) as any }
export async function dbListPendingPayments(): Promise<PendingPayment[]> { return prisma.pendingPayment.findMany({ orderBy: { createdAt: 'desc' } }) as any }

// ─── Contacts & Testimonials ───
export async function dbCreateContact(input: any): Promise<ContactRequest> { return prisma.contactRequest.create({ data: input }) as any }
export async function dbListContacts(): Promise<ContactRequest[]> { return prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' } }) as any }
export async function dbUpdateContact(id: string, patch: any): Promise<ContactRequest | null> { return prisma.contactRequest.update({ where: { id }, data: patch }) as any }

export async function dbCreateTestimonial(input: any): Promise<Testimonial> { return prisma.testimonial.create({ data: { ...input, approved: input.rating === 5 } }) as any }
export async function dbListVisibleTestimonials(): Promise<Testimonial[]> { return prisma.testimonial.findMany({ where: { rating: 5 } }) as any }
export async function dbListAllTestimonials(): Promise<Testimonial[]> { return prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } }) as any }
export async function dbDeleteTestimonial(id: string): Promise<boolean> { await prisma.testimonial.delete({ where: { id } }); return true }

// ─── Courses & Articles ───
export async function dbListCustomCourses(): Promise<Course[]> { return prisma.course.findMany() as any }
export async function dbCreateCustomCourse(c: any): Promise<Course> { return prisma.course.create({ data: c }) as any }
export async function dbGetCustomCourse(id: string): Promise<Course | null> { return prisma.course.findUnique({ where: { id } }) as any }
export async function dbUpdateCustomCourse(id: string, patch: any): Promise<Course | null> { return prisma.course.update({ where: { id }, data: patch }) as any }
export async function dbDeleteCustomCourse(id: string): Promise<boolean> { await prisma.course.delete({ where: { id } }); return true }

export async function dbListCustomArticles(): Promise<Article[]> { return prisma.article.findMany() as any }
export async function dbCreateCustomArticle(a: any): Promise<Article> { return prisma.article.create({ data: a }) as any }
export async function dbGetCustomArticle(slug: string): Promise<Article | null> { return prisma.article.findUnique({ where: { slug } }) as any }
export async function dbUpdateCustomArticle(id: string, patch: any): Promise<Article | null> { return prisma.article.update({ where: { id }, data: patch }) as any }
export async function dbDeleteCustomArticle(id: string): Promise<boolean> { await prisma.article.delete({ where: { id } }); return true }

// ─── Overrides (Config) ───
async function getConfig(key: string, defaultVal: any) {
  const c = await prisma.config.findUnique({ where: { key } }); return c ? c.value : defaultVal
}
async function setConfig(key: string, val: any) {
  await prisma.config.upsert({ where: { key }, update: { value: val }, create: { key, value: val } })
}

export async function dbGetArticleOverrides() { return (await getConfig('articleOverrides', {})) as Record<string, any> }
export async function dbSetArticleOverride(slug: string, patch: any) {
  const o = await dbGetArticleOverrides(); o[slug] = { ...(o[slug] || {}), ...patch }; await setConfig('articleOverrides', o)
}
export async function dbGetArticleDeleted() { return (await getConfig('articleDeleted', [])) as string[] }
export async function dbMarkArticleDeleted(slug: string) {
  const d = await dbGetArticleDeleted(); if (!d.includes(slug)) { d.push(slug); await setConfig('articleDeleted', d) }
}
export async function dbRestoreArticle(slug: string) {
  const d = await dbGetArticleDeleted(); await setConfig('articleDeleted', d.filter((s: string) => s !== slug))
  const o = await dbGetArticleOverrides(); delete o[slug]; await setConfig('articleOverrides', o)
}

export async function dbGetCourseOverrides() { return (await getConfig('courseOverrides', {})) as Record<string, any> }
export async function dbSetCourseOverride(id: string, patch: any) {
  const o = await dbGetCourseOverrides(); o[id] = { ...(o[id] || {}), ...patch }; await setConfig('courseOverrides', o)
}
export async function dbGetCourseDeleted() { return (await getConfig('courseDeleted', [])) as string[] }
export async function dbMarkCourseDeleted(id: string) {
  const d = await dbGetCourseDeleted(); if (!d.includes(id)) { d.push(id); await setConfig('courseDeleted', d) }
}
export async function dbRestoreCourse(id: string) {
  const d = await dbGetCourseDeleted(); await setConfig('courseDeleted', d.filter((s: string) => s !== id))
  const o = await dbGetCourseOverrides(); delete o[id]; await setConfig('courseOverrides', o)
}

// ─── Q&A ───
export async function dbListQandA(): Promise<QandAQuestion[]> { return prisma.qandAQuestion.findMany({ orderBy: { updatedAt: 'desc' } }) as any }
export async function dbGetQuestion(id: string): Promise<QandAQuestion | null> { return prisma.qandAQuestion.findUnique({ where: { id } }) as any }
export async function dbCreateQuestion(input: any): Promise<QandAQuestion> { return prisma.qandAQuestion.create({ data: input }) as any }
export async function dbDeleteQuestion(id: string): Promise<boolean> { await prisma.qandAQuestion.delete({ where: { id } }); return true }
export async function dbUpdateQuestion(id: string, patch: any): Promise<QandAQuestion | null> { return prisma.qandAQuestion.update({ where: { id }, data: patch }) as any }
export async function dbToggleQuestionUpvote(questionId: string, userId: string): Promise<QandAQuestion | null> {
  const q = await prisma.qandAQuestion.findUnique({ where: { id: questionId } }); if (!q) return null
  const has = q.upvotedBy.includes(userId); const upvotedBy = has ? q.upvotedBy.filter(u => u !== userId) : [...q.upvotedBy, userId]
  return prisma.qandAQuestion.update({ where: { id: questionId }, data: { upvotedBy } }) as any
}
export async function dbListAnswers(questionId: string): Promise<QandAAnswer[]> { return prisma.qandAAnswer.findMany({ where: { questionId }, orderBy: { createdAt: 'asc' } }) as any }
export async function dbGetAnswer(id: string): Promise<QandAAnswer | null> { return prisma.qandAAnswer.findUnique({ where: { id } }) as any }
export async function dbCreateAnswer(input: any): Promise<QandAAnswer | null> {
  const q = await prisma.qandAQuestion.findUnique({ where: { id: input.questionId } }); if (!q) return null
  const a = await prisma.qandAAnswer.create({ data: input })
  await prisma.qandAQuestion.update({ where: { id: input.questionId }, data: { status: q.status === "open" ? "answered" : q.status, updatedAt: new Date() } })
  return a as any
}
export async function dbDeleteAnswer(id: string): Promise<boolean> { await prisma.qandAAnswer.delete({ where: { id } }); return true }
export async function dbToggleAnswerUpvote(answerId: string, userId: string): Promise<QandAAnswer | null> {
  const a = await prisma.qandAAnswer.findUnique({ where: { id: answerId } }); if (!a) return null
  const has = a.upvotedBy.includes(userId); const upvotedBy = has ? a.upvotedBy.filter(u => u !== userId) : [...a.upvotedBy, userId]
  return prisma.qandAAnswer.update({ where: { id: answerId }, data: { upvotedBy } }) as any
}
export async function dbAcceptAnswer(questionId: string, answerId: string): Promise<QandAQuestion | null> {
  const a = await prisma.qandAAnswer.findFirst({ where: { id: answerId, questionId } }); if (!a) return null
  return prisma.qandAQuestion.update({ where: { id: questionId }, data: { status: "resolved", acceptedAnswerId: answerId, updatedAt: new Date() } }) as any
}
export async function dbUnacceptAnswer(questionId: string): Promise<QandAQuestion | null> {
  const count = await prisma.qandAAnswer.count({ where: { questionId } })
  return prisma.qandAQuestion.update({ where: { id: questionId }, data: { status: count > 0 ? "answered" : "open", acceptedAnswerId: null, updatedAt: new Date() } }) as any
}

// ─── Notifications ───
export async function dbCreateNotification(input: any): Promise<Notification> { return prisma.notification.create({ data: input }) as any }
export async function dbListUserNotifications(userId: string, limit = 30): Promise<Notification[]> { return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit }) as any }
export async function dbUnreadCount(userId: string): Promise<number> { return prisma.notification.count({ where: { userId, read: false } }) }
export async function dbMarkNotificationRead(userId: string, id: string): Promise<boolean> { await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } }); return true }
export async function dbMarkAllNotificationsRead(userId: string): Promise<number> { const res = await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } }); return res.count }
export async function dbDeleteNotification(userId: string, id: string): Promise<boolean> { await prisma.notification.deleteMany({ where: { id, userId } }); return true }
export async function dbBroadcastToStudents(filter: any, input: any): Promise<number> {
  const users = await prisma.user.findMany({ where: { role: "student", grade: filter.grade || undefined, major: filter.major !== "عمومی" ? filter.major : undefined } })
  for (const u of users) { await prisma.notification.create({ data: { userId: u.id, title: input.title, body: input.body, href: input.href } }) }
  return users.length
}

// ─── Live Chat ───
export async function dbGetChatState(liveId: string): Promise<LiveChatState> {
  let s = await prisma.liveChatState.findUnique({ where: { liveId } })
  if (!s) s = await prisma.liveChatState.create({ data: { liveId } })
  return s as any
}
export async function dbSetChatState(liveId: string, patch: any): Promise<LiveChatState> {
  return prisma.liveChatState.upsert({ where: { liveId }, update: patch, create: { liveId, ...patch } }) as any
}
export async function dbListChatMessages(liveId: string, viewerId: string, viewerRole: string): Promise<LiveChatMessage[]> {
  const state = await dbGetChatState(liveId)
  const all = await prisma.liveChatMessage.findMany({ where: { liveId }, orderBy: { createdAt: 'asc' } })
  const isStaff = viewerRole === "teacher" || viewerRole === "admin"
  if (isStaff || state.chatMode === "public") return all as any
  return all.filter((m: any) => m.userId === viewerId || m.userRole === "teacher" || m.userRole === "admin") as any
}
export async function dbCreateChatMessage(input: any): Promise<LiveChatMessage> { return prisma.liveChatMessage.create({ data: input }) as any }
export async function dbDeleteChatMessage(id: string): Promise<boolean> { await prisma.liveChatMessage.delete({ where: { id } }); return true }
export async function dbCreateUserWithPassword(input: {
  name: string;
  email: string;
  password: string;
  grade: number;
  major: string;
  phone?: string;
}): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
  if (existing) throw new Error("duplicate-email")
  
  const passwordHash = await bcrypt.hash(input.password, 10)
  
  const u = await prisma.user.create({ 
    data: { 
      name: input.name, 
      email: input.email.toLowerCase(), 
      passwordHash,
      grade: input.grade, 
      major: input.major, 
      phone: input.phone, 
      role: "student" 
    } 
  })
  return normalizeUser(u)
}

export async function dbVerifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.passwordHash) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return normalizeUser(user)
}