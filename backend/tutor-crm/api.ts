import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Student {
    id: string;
    userId: string;
    name: string;
    subject: string;
    level: string;
    parentContact?: string | null;
    hourlyRate: number;
    createdAt: string;
}

export interface Lesson {
    id: string;
    studentId: string;
    studentName?: string;
    userId: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
    nextLessonPlan?: string | null;
    status: "scheduled" | "completed" | "cancelled";
    createdAt: string;
}

export interface Homework {
    id: string;
    studentId: string;
    studentName?: string;
    userId: string;
    task: string;
    dueDate?: string | null;
    isCompleted: boolean;
    createdAt: string;
}

export interface Payment {
    id: string;
    studentId: string;
    studentName?: string;
    userId: string;
    amount: number;
    isPaid: boolean;
    paymentDate?: string | null;
    lessonCount: number;
    month?: number | null;
    year?: number | null;
    createdAt: string;
}

export interface Share {
    id: string;
    userId: string;
    isActive: boolean;
    allowStudentNames: boolean;
    createdAt: string;
}

export interface FollowedShare {
    id: string;
    userId: string;
    shareId: string;
    alias?: string | null;
    createdAt: string;
    isActive?: boolean;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetItemsRequest {
    userId: string;
}

interface AddStudentRequest {
    userId: string;
    name: string;
    subject: string;
    level: string;
    parentContact?: string;
    hourlyRate: number;
}

interface UpdateStudentRequest {
    studentId: string;
    userId: string;
    name: string;
    subject: string;
    level: string;
    parentContact?: string;
    hourlyRate: number;
}

interface AddLessonRequest {
    userId: string;
    studentId: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    nextLessonPlan?: string;
}

interface UpdateLessonRequest {
    lessonId: string;
    userId: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
}

interface AddHomeworkRequest {
    userId: string;
    studentId: string;
    task: string;
    dueDate?: string;
}

interface AddPaymentRequest {
    userId: string;
    studentId: string;
    amount: number;
    isPaid: boolean;
    paymentDate?: string;
    lessonCount: number;
    month?: number;
    year?: number;
}

interface ToggleRequest {
    id: string;
    userId: string;
}

interface DeleteRequest {
    id: string;
    userId: string;
}

interface GetShareSettingsRequest {
    userId: string;
}

interface ToggleShareRequest {
    userId: string;
    isActive: boolean;
    allowStudentNames: boolean;
}

interface GetSharedLessonsRequest {
    shareId: string;
}

interface FollowShareRequest {
    userId: string;
    shareId: string;
    alias: string;
}

interface UnfollowShareRequest {
    userId: string;
    shareId: string;
}

interface GetFollowedSharesRequest {
    userId: string;
}

// ==================== API ENDPOINTS ====================

export const getStudents = api(
    { expose: true, method: "GET", path: "/tutor-crm/students/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ students: Student[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_students", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            students: (data || []).map((s: any) => ({
                id: s.id,
                userId: s.user_id,
                name: s.name,
                subject: s.subject,
                level: s.level,
                parentContact: s.parent_contact,
                hourlyRate: s.hourly_rate,
                createdAt: s.created_at
            }))
        };
    }
);

export const addStudent = api(
    { expose: true, method: "POST", path: "/tutor-crm/students" },
    async (req: AddStudentRequest): Promise<{ student: Student }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_student", {
            p_user_id: req.userId,
            p_name: req.name,
            p_subject: req.subject,
            p_level: req.level,
            p_parent_contact: req.parentContact || null,
            p_hourly_rate: req.hourlyRate,
        });
        if (error) throw APIError.internal(error.message);
        const s = data?.[0];
        return { 
            student: {
                id: s.id,
                userId: s.user_id,
                name: s.name,
                subject: s.subject,
                level: s.level,
                parentContact: s.parent_contact,
                hourlyRate: s.hourly_rate,
                createdAt: s.created_at
            }
        };
    }
);

export const updateStudent = api(
    { expose: true, method: "PUT", path: "/tutor-crm/students" },
    async (req: UpdateStudentRequest): Promise<{ student: Student }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("update_student", {
            p_student_id: req.studentId,
            p_user_id: req.userId,
            p_name: req.name,
            p_subject: req.subject,
            p_level: req.level,
            p_parent_contact: req.parentContact || null,
            p_hourly_rate: req.hourlyRate,
        });
        if (error) throw APIError.internal(error.message);
        const s = data?.[0];
        return { 
            student: {
                id: s.id,
                userId: s.user_id,
                name: s.name,
                subject: s.subject,
                level: s.level,
                parentContact: s.parent_contact,
                hourlyRate: s.hourly_rate,
                createdAt: s.created_at
            }
        };
    }
);

export const deleteStudent = api(
    { expose: true, method: "DELETE", path: "/tutor-crm/students/:id" },
    async ({ id, userId }: DeleteRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("delete_student", {
            p_student_id: id,
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getLessons = api(
    { expose: true, method: "GET", path: "/tutor-crm/lessons/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ lessons: Lesson[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_lessons", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            lessons: (data || []).map((l: any) => ({
                id: l.id,
                studentId: l.student_id,
                studentName: l.student_name,
                userId: l.user_id,
                lessonDate: l.lesson_date,
                startTime: l.start_time,
                endTime: l.end_time,
                notes: l.notes,
                nextLessonPlan: l.next_lesson_plan,
                status: l.status,
                createdAt: l.created_at
            }))
        };
    }
);

export const addLesson = api(
    { expose: true, method: "POST", path: "/tutor-crm/lessons" },
    async (req: AddLessonRequest): Promise<{ lesson: Lesson }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_lesson", {
            p_user_id: req.userId,
            p_student_id: req.studentId,
            p_lesson_date: req.lessonDate,
            p_start_time: req.startTime,
            p_end_time: req.endTime,
            p_notes: req.notes || null,
            p_next_lesson_plan: req.nextLessonPlan || null,
        });
        if (error) throw APIError.internal(error.message);
        const l = data?.[0];
        return { 
            lesson: {
                id: l.id,
                studentId: l.student_id,
                userId: l.user_id,
                lessonDate: l.lesson_date,
                startTime: l.start_time,
                endTime: l.end_time,
                notes: l.notes,
                nextLessonPlan: l.next_lesson_plan,
                status: l.status,
                createdAt: l.created_at
            }
        };
    }
);

export const updateLesson = api(
    { expose: true, method: "PUT", path: "/tutor-crm/lessons" },
    async (req: UpdateLessonRequest): Promise<{ lesson: Lesson }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("update_lesson", {
            p_lesson_id: req.lessonId,
            p_user_id: req.userId,
            p_lesson_date: req.lessonDate,
            p_start_time: req.startTime,
            p_end_time: req.endTime,
        });
        if (error) throw APIError.internal(error.message);
        const l = data?.[0];
        return { 
            lesson: {
                id: l.id,
                studentId: l.student_id,
                userId: l.user_id,
                lessonDate: l.lesson_date,
                startTime: l.start_time,
                endTime: l.end_time,
                notes: l.notes,
                nextLessonPlan: l.next_lesson_plan,
                status: l.status,
                createdAt: l.created_at
            }
        };
    }
);

export const deleteLesson = api(
    { expose: true, method: "DELETE", path: "/tutor-crm/lessons/:id" },
    async ({ id, userId }: DeleteRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("delete_lesson", {
            p_lesson_id: id,
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getHomeworks = api(
    { expose: true, method: "GET", path: "/tutor-crm/homeworks/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ homeworks: Homework[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_homeworks", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            homeworks: (data || []).map((h: any) => ({
                id: h.id,
                studentId: h.student_id,
                studentName: h.student_name,
                userId: h.user_id,
                task: h.task,
                dueDate: h.due_date,
                isCompleted: h.is_completed,
                createdAt: h.created_at
            }))
        };
    }
);

export const addHomework = api(
    { expose: true, method: "POST", path: "/tutor-crm/homeworks" },
    async (req: AddHomeworkRequest): Promise<{ homework: Homework }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_homework", {
            p_user_id: req.userId,
            p_student_id: req.studentId,
            p_task: req.task,
            p_due_date: req.dueDate || null,
        });
        if (error) throw APIError.internal(error.message);
        const h = data?.[0];
        return { 
            homework: {
                id: h.id,
                studentId: h.student_id,
                userId: h.user_id,
                task: h.task,
                dueDate: h.due_date,
                isCompleted: h.is_completed,
                createdAt: h.created_at
            }
        };
    }
);

export const toggleHomework = api(
    { expose: true, method: "POST", path: "/tutor-crm/homeworks/toggle" },
    async ({ id, userId }: ToggleRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("toggle_homework", {
            p_homework_id: id,
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getPayments = api(
    { expose: true, method: "GET", path: "/tutor-crm/payments/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ payments: Payment[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_payments", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            payments: (data || []).map((p: any) => ({
                id: p.id,
                studentId: p.student_id,
                studentName: p.student_name,
                userId: p.user_id,
                amount: p.amount,
                isPaid: p.is_paid,
                paymentDate: p.payment_date,
                lessonCount: p.lesson_count,
                month: p.month,
                year: p.year,
                createdAt: p.created_at
            }))
        };
    }
);

export const addPayment = api(
    { expose: true, method: "POST", path: "/tutor-crm/payments" },
    async (req: AddPaymentRequest): Promise<{ payment: Payment }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_payment", {
            p_user_id: req.userId,
            p_student_id: req.studentId,
            p_amount: req.amount,
            p_is_paid: req.isPaid,
            p_payment_date: req.paymentDate || null,
            p_lesson_count: req.lessonCount,
            p_month: req.month || null,
            p_year: req.year || null,
        });
        if (error) throw APIError.internal(error.message);
        const p = data?.[0];
        return { 
            payment: {
                id: p.id,
                studentId: p.student_id,
                userId: p.user_id,
                amount: p.amount,
                isPaid: p.is_paid,
                paymentDate: p.payment_date,
                lessonCount: p.lesson_count,
                month: p.month,
                year: p.year,
                createdAt: p.created_at
            }
        };
    }
);

export const togglePayment = api(
    { expose: true, method: "POST", path: "/tutor-crm/payments/toggle" },
    async ({ id, userId }: ToggleRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("toggle_payment", {
            p_payment_id: id,
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getShareSettings = api(
    { expose: true, method: "GET", path: "/tutor-crm/share/settings/:userId" },
    async ({ userId }: GetShareSettingsRequest): Promise<{ share: Share }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_share_settings", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        const s = data?.[0];
        return { 
            share: {
                id: s.id,
                userId: s.user_id,
                isActive: s.is_active,
                allowStudentNames: s.allow_student_names,
                createdAt: s.created_at
            }
        };
    }
);

export const toggleShare = api(
    { expose: true, method: "POST", path: "/tutor-crm/share/toggle" },
    async (req: ToggleShareRequest): Promise<{ share: Share }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("toggle_share", {
            p_user_id: req.userId,
            p_is_active: req.isActive,
            p_allow_student_names: req.allowStudentNames,
        });
        if (error) throw APIError.internal(error.message);
        const s = data?.[0];
        return { 
            share: {
                id: s.id,
                userId: s.user_id,
                isActive: s.is_active,
                allowStudentNames: s.allow_student_names,
                createdAt: s.created_at
            }
        };
    }
);

export const getSharedLessons = api(
    { expose: true, method: "GET", path: "/tutor-crm/share/lessons/:shareId" },
    async ({ shareId }: GetSharedLessonsRequest): Promise<{ lessons: Lesson[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_shared_lessons", {
            p_share_id: shareId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            lessons: (data || []).map((l: any) => ({
                id: l.id,
                studentId: l.student_id,
                studentName: l.student_name,
                userId: l.user_id,
                lessonDate: l.lesson_date,
                startTime: l.start_time,
                endTime: l.end_time,
                notes: l.notes,
                nextLessonPlan: l.next_lesson_plan,
                status: l.status,
                createdAt: l.created_at
            }))
        };
    }
);

export const followShare = api(
    { expose: true, method: "POST", path: "/tutor-crm/share/follow" },
    async (req: FollowShareRequest): Promise<{ followed: FollowedShare }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("follow_share", {
            p_user_id: req.userId,
            p_share_id: req.shareId,
            p_alias: req.alias,
        });
        if (error) throw APIError.internal(error.message);
        const f = data?.[0];
        return { 
            followed: {
                id: f.id,
                userId: f.user_id,
                shareId: f.share_id,
                alias: f.alias,
                createdAt: f.created_at
            }
        };
    }
);

export const unfollowShare = api(
    { expose: true, method: "POST", path: "/tutor-crm/share/unfollow" },
    async (req: UnfollowShareRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("unfollow_share", {
            p_user_id: req.userId,
            p_share_id: req.shareId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getFollowedShares = api(
    { expose: true, method: "GET", path: "/tutor-crm/share/followed/:userId" },
    async ({ userId }: GetFollowedSharesRequest): Promise<{ followed: FollowedShare[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_followed_shares", {
            p_user_id: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { 
            followed: (data || []).map((f: any) => ({
                id: f.id,
                userId: f.user_id,
                shareId: f.share_id,
                alias: f.alias,
                createdAt: f.created_at,
                isActive: f.is_active
            }))
        };
    }
);
