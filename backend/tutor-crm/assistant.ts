import {
  requireNumber,
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { tutor_crm } from "~encore/clients";

export const tutorCrmAssistant: AppAssistantModule = {
  appId: "tutor-crm",
  name: "Tutor CRM",
  description: "Özel ders öğretmenleri için öğrenci, ders, ödev ve ödeme takibi yapar.",
  schema: "tutor_crm",
  tools: [
    {
      name: "list_students",
      description: "Öğrencileri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_student",
      description: "Yeni öğrenci ekler.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Öğrenci adı", required: true },
        subject: { type: "string", description: "Ders", required: true },
        level: { type: "string", description: "Seviye (örn: 8. Sınıf)", required: true },
        parentContact: { type: "string", description: "Veli iletişim bilgisi" },
        hourlyRate: { type: "number", description: "Saatlik ücret", required: true },
      },
    },
    {
      name: "list_lessons",
      description: "Planlanmış dersleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_lesson",
      description: "Yeni ders planlar.",
      permission: "create",
      parameters: {
        studentId: { type: "string", description: "Öğrenci ID", required: true },
        lessonDate: { type: "string", description: "YYYY-MM-DD", required: true },
        startTime: { type: "string", description: "HH:MM", required: true },
        endTime: { type: "string", description: "HH:MM", required: true },
        notes: { type: "string", description: "Ders notları" },
        nextLessonPlan: { type: "string", description: "Gelecek ders planı" },
      },
    },
    {
      name: "list_homeworks",
      description: "Ödevleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_homework",
      description: "Ödev ekler.",
      permission: "create",
      parameters: {
        studentId: { type: "string", description: "Öğrenci ID", required: true },
        task: { type: "string", description: "Ödev tanımı", required: true },
        dueDate: { type: "string", description: "YYYY-MM-DD" },
      },
    },
    {
      name: "list_payments",
      description: "Ödemeleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_students: async ({ userId }) => {
      const res = await tutor_crm.getStudents({ userId });
      return res.students;
    },
    add_student: async ({ userId, args }) => {
      const res = await tutor_crm.addStudent({
        userId,
        name: requireString(args, "name"),
        subject: requireString(args, "subject"),
        level: requireString(args, "level"),
        parentContact: optionalString(args, "parentContact") ?? undefined,
        hourlyRate: requireNumber(args, "hourlyRate"),
      });
      return res.student ? [res.student] : [];
    },
    list_lessons: async ({ userId }) => {
      const res = await tutor_crm.getLessons({ userId });
      return res.lessons;
    },
    add_lesson: async ({ userId, args }) => {
      const res = await tutor_crm.addLesson({
        userId,
        studentId: requireString(args, "studentId"),
        lessonDate: requireString(args, "lessonDate"),
        startTime: requireString(args, "startTime"),
        endTime: requireString(args, "endTime"),
        notes: optionalString(args, "notes") ?? undefined,
        nextLessonPlan: optionalString(args, "nextLessonPlan") ?? undefined,
      });
      return res.lesson ? [res.lesson] : [];
    },
    list_homeworks: async ({ userId }) => {
      const res = await tutor_crm.getHomeworks({ userId });
      return res.homeworks;
    },
    add_homework: async ({ userId, args }) => {
      const res = await tutor_crm.addHomework({
        userId,
        studentId: requireString(args, "studentId"),
        task: requireString(args, "task"),
        dueDate: optionalString(args, "dueDate") ?? undefined,
      });
      return res.homework ? [res.homework] : [];
    },
    list_payments: async ({ userId }) => {
      const res = await tutor_crm.getPayments({ userId });
      return res.payments;
    },
  },
};
