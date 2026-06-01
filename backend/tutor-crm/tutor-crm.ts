import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Student {
    id: string;
    clerk_id: string;
    name: string;
    subject: string;
    level: string;
    parent_contact?: string | null;
    hourly_rate: number;
    created_at: string;
}

export interface Lesson {
    id: string;
    student_id: string;
    student_name?: string;
    clerk_id: string;
    lesson_date: string;
    start_time: string;
    end_time: string;
    notes?: string | null;
    next_lesson_plan?: string | null;
    status: "scheduled" | "completed" | "cancelled";
    created_at: string;
}

export interface Homework {
    id: string;
    student_id: string;
    student_name?: string;
    clerk_id: string;
    task: string;
    due_date?: string | null;
    is_completed: boolean;
    created_at: string;
}

export interface Payment {
    id: string;
    student_id: string;
    student_name?: string;
    clerk_id: string;
    amount: number;
    is_paid: boolean;
    payment_date?: string | null;
    lesson_count: number;
    month?: number | null;
    year?: number | null;
    created_at: string;
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

// ==================== API ENDPOINTS ====================

export const getStudents = api(
    { expose: true, method: "GET", path: "/tutor-crm/students/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ students: Student[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_students", {
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { students: data || [] };
    }
);

export const addStudent = api(
    { expose: true, method: "POST", path: "/tutor-crm/students" },
    async (req: AddStudentRequest): Promise<{ student: Student }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_student", {
            clerk_id_param: req.userId,
            name_param: req.name,
            subject_param: req.subject,
            level_param: req.level,
            parent_contact_param: req.parentContact || null,
            hourly_rate_param: req.hourlyRate,
        });
        if (error) throw APIError.internal(error.message);
        return { student: data?.[0] };
    }
);

export const updateStudent = api(
    { expose: true, method: "PUT", path: "/tutor-crm/students" },
    async (req: UpdateStudentRequest): Promise<{ student: Student }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("update_student", {
            student_id_param: req.studentId,
            clerk_id_param: req.userId,
            name_param: req.name,
            subject_param: req.subject,
            level_param: req.level,
            parent_contact_param: req.parentContact || null,
            hourly_rate_param: req.hourlyRate,
        });
        if (error) throw APIError.internal(error.message);
        return { student: data?.[0] };
    }
);

export const deleteStudent = api(
    { expose: true, method: "DELETE", path: "/tutor-crm/students/:id" },
    async ({ id, userId }: DeleteRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("delete_student", {
            student_id_param: id,
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getLessons = api(
    { expose: true, method: "GET", path: "/tutor-crm/lessons/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ lessons: Lesson[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_lessons", {
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { lessons: data || [] };
    }
);

export const addLesson = api(
    { expose: true, method: "POST", path: "/tutor-crm/lessons" },
    async (req: AddLessonRequest): Promise<{ lesson: Lesson }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_lesson", {
            clerk_id_param: req.userId,
            student_id_param: req.studentId,
            lesson_date_param: req.lessonDate,
            start_time_param: req.startTime,
            end_time_param: req.endTime,
            notes_param: req.notes || null,
            next_lesson_plan_param: req.nextLessonPlan || null,
        });
        if (error) throw APIError.internal(error.message);
        return { lesson: data?.[0] };
    }
);

export const updateLesson = api(
    { expose: true, method: "PUT", path: "/tutor-crm/lessons" },
    async (req: UpdateLessonRequest): Promise<{ lesson: Lesson }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("update_lesson", {
            lesson_id_param: req.lessonId,
            clerk_id_param: req.userId,
            lesson_date_param: req.lessonDate,
            start_time_param: req.startTime,
            end_time_param: req.endTime,
        });
        if (error) throw APIError.internal(error.message);
        return { lesson: data?.[0] };
    }
);

export const deleteLesson = api(
    { expose: true, method: "DELETE", path: "/tutor-crm/lessons/:id" },
    async ({ id, userId }: DeleteRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("delete_lesson", {
            lesson_id_param: id,
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getHomeworks = api(
    { expose: true, method: "GET", path: "/tutor-crm/homeworks/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ homeworks: Homework[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_homeworks", {
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { homeworks: data || [] };
    }
);

export const addHomework = api(
    { expose: true, method: "POST", path: "/tutor-crm/homeworks" },
    async (req: AddHomeworkRequest): Promise<{ homework: Homework }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_homework", {
            clerk_id_param: req.userId,
            student_id_param: req.studentId,
            task_param: req.task,
            due_date_param: req.dueDate || null,
        });
        if (error) throw APIError.internal(error.message);
        return { homework: data?.[0] };
    }
);

export const toggleHomework = api(
    { expose: true, method: "POST", path: "/tutor-crm/homeworks/toggle" },
    async ({ id, userId }: ToggleRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("toggle_homework", {
            homework_id_param: id,
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);

export const getPayments = api(
    { expose: true, method: "GET", path: "/tutor-crm/payments/:userId" },
    async ({ userId }: GetItemsRequest): Promise<{ payments: Payment[] }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("get_payments", {
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { payments: data || [] };
    }
);

export const addPayment = api(
    { expose: true, method: "POST", path: "/tutor-crm/payments" },
    async (req: AddPaymentRequest): Promise<{ payment: Payment }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("add_payment", {
            clerk_id_param: req.userId,
            student_id_param: req.studentId,
            amount_param: req.amount,
            is_paid_param: req.isPaid,
            payment_date_param: req.paymentDate || null,
            lesson_count_param: req.lessonCount,
            month_param: req.month || null,
            year_param: req.year || null,
        });
        if (error) throw APIError.internal(error.message);
        return { payment: data?.[0] };
    }
);

export const togglePayment = api(
    { expose: true, method: "POST", path: "/tutor-crm/payments/toggle" },
    async ({ id, userId }: ToggleRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("tutor_crm").rpc("toggle_payment", {
            payment_id_param: id,
            clerk_id_param: userId,
        });
        if (error) throw APIError.internal(error.message);
        return { success: !!data };
    }
);
