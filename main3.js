import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Student ──────────────────────────────────────────────────────────────────

export const getStudent = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("student"),
      _creationTime: v.number(),
      name: v.string(),
      class: v.string(),
      school: v.string(),
      year: v.string(),
      classTeacher: v.string(),
      initials: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("student").take(1);
    return rows[0] ?? null;
  },
});

export const upsertStudent = mutation({
  args: {
    name: v.string(),
    class: v.string(),
    school: v.string(),
    year: v.string(),
    classTeacher: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const initials = args.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const rows = await ctx.db.query("student").take(1);
    if (rows[0]) {
      await ctx.db.patch(rows[0]._id, { ...args, initials });
    } else {
      await ctx.db.insert("student", { ...args, initials });
    }
    return null;
  },
});

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const getSubjects = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("subjects"),
    _creationTime: v.number(),
    id: v.string(),
    name: v.string(),
    short: v.string(),
    teacher: v.string(),
    room: v.string(),
    type: v.string(),
    order: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("subjects").withIndex("by_order").collect();
  },
});

export const upsertSubject = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    short: v.string(),
    teacher: v.string(),
    room: v.string(),
    type: v.string(),
    order: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("subjects").collect();
    const found = existing.find(s => s.id === args.id);
    if (found) {
      await ctx.db.patch(found._id, args);
    } else {
      await ctx.db.insert("subjects", args);
    }
    return null;
  },
});

export const deleteSubject = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const all = await ctx.db.query("subjects").collect();
    const found = all.find(s => s.id === args.id);
    if (found) await ctx.db.delete(found._id);
    return null;
  },
});

// ─── Grades ───────────────────────────────────────────────────────────────────

export const getGrades = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("grades"),
    _creationTime: v.number(),
    subjectId: v.string(),
    value: v.number(),
    type: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
    weight: v.optional(v.number()),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("grades").collect();
  },
});

export const addGrade = mutation({
  args: {
    subjectId: v.string(),
    value: v.number(),
    type: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
    weight: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("grades", args);
    return null;
  },
});

export const deleteGrade = mutation({
  args: { id: v.id("grades") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// ─── Timetable ────────────────────────────────────────────────────────────────

export const getTimetable = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("timetable"),
    _creationTime: v.number(),
    day: v.number(),
    period: v.number(),
    subject: v.string(),
    room: v.string(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("timetable").collect();
  },
});

export const setTimetableCell = mutation({
  args: {
    day: v.number(),
    period: v.number(),
    subject: v.string(),
    room: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("timetable")
      .withIndex("by_day_period", q => q.eq("day", args.day).eq("period", args.period))
      .unique();
    if (existing) {
      if (args.subject === '') {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { subject: args.subject, room: args.room });
      }
    } else if (args.subject !== '') {
      await ctx.db.insert("timetable", args);
    }
    return null;
  },
});

// ─── Homework ─────────────────────────────────────────────────────────────────

export const getHomework = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("homework"),
    _creationTime: v.number(),
    subject: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    done: v.boolean(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("homework").order("asc").collect();
  },
});

export const addHomework = mutation({
  args: {
    subject: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("homework", { ...args, done: false });
    return null;
  },
});

export const toggleHomework = mutation({
  args: { id: v.id("homework") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) await ctx.db.patch(args.id, { done: !item.done });
    return null;
  },
});

export const deleteHomework = mutation({
  args: { id: v.id("homework") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

export const getTests = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("tests"),
    _creationTime: v.number(),
    subject: v.string(),
    topic: v.string(),
    date: v.string(),
    teacher: v.string(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("tests").order("asc").collect();
  },
});

export const addTest = mutation({
  args: {
    subject: v.string(),
    topic: v.string(),
    date: v.string(),
    teacher: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("tests", args);
    return null;
  },
});

export const deleteTest = mutation({
  args: { id: v.id("tests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// ─── Attendance ───────────────────────────────────────────────────────────────

export const getAttendance = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("attendance"),
    _creationTime: v.number(),
    date: v.string(),
    status: v.string(),
    note: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("attendance").order("desc").collect();
  },
});

export const addAttendance = mutation({
  args: {
    date: v.string(),
    status: v.string(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("attendance", args);
    return null;
  },
});

export const deleteAttendance = mutation({
  args: { id: v.id("attendance") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// ─── Config / Seed ────────────────────────────────────────────────────────────

export const getConfig = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db.query("config").withIndex("by_key", q => q.eq("key", args.key)).unique();
    return row?.value ?? null;
  },
});

export const setConfig = mutation({
  args: { key: v.string(), value: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.query("config").withIndex("by_key", q => q.eq("key", args.key)).unique();
    if (row) {
      await ctx.db.patch(row._id, { value: args.value });
    } else {
      await ctx.db.insert("config", args);
    }
    return null;
  },
});

// ─── Notes ────────────────────────────────────────────────────────────────────

export const getNotes = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("notes"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("notes").order("desc").collect();
  },
});

export const addNote = mutation({
  args: { title: v.string(), content: v.string() },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("notes", { title: args.title, content: args.content, createdAt: now, updatedAt: now });
  },
});

export const updateNote = mutation({
  args: { id: v.id("notes"), title: v.string(), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title, content: args.content, updatedAt: new Date().toISOString() });
    return null;
  },
});

export const deleteNote = mutation({
  args: { id: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
