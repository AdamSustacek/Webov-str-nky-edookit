import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Student profile
  student: defineTable({
    name: v.string(),
    class: v.string(),
    school: v.string(),
    year: v.string(),
    classTeacher: v.string(),
    initials: v.string(),
  }),

  // Subjects
  subjects: defineTable({
    id: v.string(),
    name: v.string(),
    short: v.string(),
    teacher: v.string(),
    room: v.string(),
    type: v.string(), // lang | sci | hum | art | tech | sport
    order: v.number(),
  }).index("by_order", ["order"]),

  // Grades
  grades: defineTable({
    subjectId: v.string(),
    value: v.number(),
    type: v.string(),
    date: v.string(),
    note: v.optional(v.string()),
    weight: v.optional(v.number()),
  }).index("by_subject", ["subjectId"]),

  // Timetable
  timetable: defineTable({
    day: v.number(),        // 0=Mon ... 4=Fri
    period: v.number(),     // 1-6
    subject: v.string(),    // short name
    room: v.string(),
  }).index("by_day_period", ["day", "period"]),

  // Homework
  homework: defineTable({
    subject: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    done: v.boolean(),
  }),

  // Tests
  tests: defineTable({
    subject: v.string(),
    topic: v.string(),
    date: v.string(),
    teacher: v.string(),
  }),

  // Attendance
  attendance: defineTable({
    date: v.string(),
    status: v.string(), // present | absent | excused | late | school-event
    note: v.optional(v.string()),
  }),

  // Notes (admin)
  notes: defineTable({
    title: v.string(),
    content: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  // Seed flag
  config: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
