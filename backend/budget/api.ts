import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Project {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  currency: string;
  targetBudget: number | null;
  groupType: string;
  startDate: string | null;
  endDate: string | null;
  emoji: string;
  shareId: string;
  createdAt: string;
  memberCount?: number;
  totalSpent?: number;
  userShare?: number;
}

export interface Member {
  id: string;
  projectId: string;
  name: string;
  userId: string | null;
  createdAt: string;
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  shareAmount: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  payerMemberId: string;
  expenseDate: string;
  category: string;
  createdAt: string;
  shares?: ExpenseShare[];
}

export interface ProjectDetailsResponse {
  project: Project;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface CreateProjectRequest {
  creatorClerkId: string;
  name: string;
  description?: string;
  currency: string;
  targetBudget?: number;
  groupType: string;
  memberNames: string[];
  startDate?: string;
  endDate?: string;
  emoji?: string;
}

interface CreateProjectResponse {
  projectId: string;
}

interface GetUserProjectsResponse {
  projects: Project[];
}

interface AddExpenseRequest {
  projectId: string;
  title: string;
  amount: number;
  payerMemberId: string;
  category: string;
  shares: { member_id: string; share_amount: number }[];
  expenseDate?: string;
}

interface AddExpenseResponse {
  expenseId: string;
}

interface DeleteExpenseResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Creates a new project with members
 */
export const createProject = api(
  { expose: true, method: "POST", path: "/budget/projects" },
  async (req: CreateProjectRequest): Promise<CreateProjectResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("create_project", {
      p_user_id: req.creatorClerkId,
      name_param: req.name,
      description_param: req.description || null,
      currency_param: req.currency,
      target_budget_param: req.targetBudget || null,
      group_type_param: req.groupType,
      member_names_param: req.memberNames,
      start_date_param: req.startDate || null,
      end_date_param: req.endDate || null,
      emoji_param: req.emoji || '🏖️',
    });

    if (error) {
      console.error("createProject error:", error);
      throw APIError.internal(`Failed to create project: ${error.message}`);
    }

    return { projectId: data as string };
  }
);

/**
 * Gets all projects of a user
 */
export const getUserProjects = api(
  { expose: true, method: "GET", path: "/budget/user/:userId/projects" },
  async ({ userId }: { userId: string }): Promise<GetUserProjectsResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("get_user_projects", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getUserProjects error:", error);
      throw APIError.internal(`Failed to load user projects: ${error.message}`);
    }

    return { 
      projects: (data || []).map((p: any) => ({
        id: p.id,
        creatorId: p.creator_id,
        name: p.name,
        description: p.description,
        currency: p.currency,
        targetBudget: p.target_budget,
        groupType: p.group_type,
        startDate: p.start_date,
        endDate: p.end_date,
        emoji: p.emoji,
        shareId: p.share_id,
        createdAt: p.created_at,
        memberCount: p.member_count,
        totalSpent: p.total_spent,
        userShare: p.user_share
      }))
    };
  }
);

/**
 * Gets details of a specific project by share ID
 */
export const getProjectDetailsByShareId = api(
  { expose: true, method: "GET", path: "/budget/share/:shareId" },
  async ({ shareId }: { shareId: string }): Promise<ProjectDetailsResponse> => {
    // 1. Fetch project info by share_id
    const { data: projectData, error: projectError } = await supabase
      .schema("budget")
      .from("projects")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (projectError) {
      console.error("getProjectDetailsByShareId project error:", projectError);
      throw APIError.notFound(`Project not found: ${projectError.message}`);
    }

    const projectId = projectData.id;

    // 2. Fetch members
    const { data: membersData, error: membersError } = await supabase
      .schema("budget")
      .from("members")
      .select("*")
      .eq("project_id", projectId);

    if (membersError) {
      console.error("getProjectDetailsByShareId members error:", membersError);
      throw APIError.internal(`Failed to load members: ${membersError.message}`);
    }

    // 3. Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .schema("budget")
      .from("expenses")
      .select("*")
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });

    if (expensesError) {
      console.error("getProjectDetailsByShareId expenses error:", expensesError);
      throw APIError.internal(`Failed to load expenses: ${expensesError.message}`);
    }

    // 4. Fetch shares of these expenses
    const expenseIds = (expensesData || []).map((e: any) => e.id);
    let sharesData: any[] = [];
    if (expenseIds.length > 0) {
      const { data, error: sharesError } = await supabase
        .schema("budget")
        .from("expense_shares")
        .select("*")
        .in("expense_id", expenseIds);

      if (sharesError) {
        console.error("getProjectDetailsByShareId shares error:", sharesError);
        throw APIError.internal(`Failed to load expense shares: ${sharesError.message}`);
      }
      sharesData = data || [];
    }

    return {
      project: {
        id: projectData.id,
        creatorId: projectData.creator_id,
        name: projectData.name,
        description: projectData.description,
        currency: projectData.currency,
        targetBudget: projectData.target_budget,
        groupType: projectData.group_type,
        startDate: projectData.start_date,
        endDate: projectData.end_date,
        emoji: projectData.emoji,
        shareId: projectData.share_id,
        createdAt: projectData.created_at
      },
      members: (membersData || []).map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        name: m.name,
        userId: m.user_id,
        createdAt: m.created_at
      })),
      expenses: (expensesData || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        title: e.title,
        amount: e.amount,
        payerMemberId: e.payer_member_id,
        expenseDate: e.expense_date,
        category: e.category,
        createdAt: e.created_at
      })),
      shares: (sharesData || []).map((s: any) => ({
        id: s.id,
        expenseId: s.expense_id,
        memberId: s.member_id,
        shareAmount: s.share_amount,
        createdAt: s.created_at
      })),
    };
  }
);

/**
 * Gets details of a specific project (members, expenses, and expense shares)
 */
export const getProjectDetails = api(
  { expose: true, method: "GET", path: "/budget/projects/:projectId" },
  async ({ projectId }: { projectId: string }): Promise<ProjectDetailsResponse> => {
    // 1. Fetch project info
    const { data: projectData, error: projectError } = await supabase
      .schema("budget")
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("getProjectDetails project error:", projectError);
      throw APIError.notFound(`Project not found: ${projectError.message}`);
    }

    // 2. Fetch members
    const { data: membersData, error: membersError } = await supabase
      .schema("budget")
      .from("members")
      .select("*")
      .eq("project_id", projectId);

    if (membersError) {
      console.error("getProjectDetails members error:", membersError);
      throw APIError.internal(`Failed to load members: ${membersError.message}`);
    }

    // 3. Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .schema("budget")
      .from("expenses")
      .select("*")
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });

    if (expensesError) {
      console.error("getProjectDetails expenses error:", expensesError);
      throw APIError.internal(`Failed to load expenses: ${expensesError.message}`);
    }

    // 4. Fetch shares of these expenses
    const expenseIds = (expensesData || []).map((e: any) => e.id);
    let sharesData: any[] = [];
    if (expenseIds.length > 0) {
      const { data, error: sharesError } = await supabase
        .schema("budget")
        .from("expense_shares")
        .select("*")
        .in("expense_id", expenseIds);

      if (sharesError) {
        console.error("getProjectDetails shares error:", sharesError);
        throw APIError.internal(`Failed to load expense shares: ${sharesError.message}`);
      }
      sharesData = data || [];
    }

    return {
      project: {
        id: projectData.id,
        creatorId: projectData.creator_id,
        name: projectData.name,
        description: projectData.description,
        currency: projectData.currency,
        targetBudget: projectData.target_budget,
        groupType: projectData.group_type,
        startDate: projectData.start_date,
        endDate: projectData.end_date,
        emoji: projectData.emoji,
        shareId: projectData.share_id,
        createdAt: projectData.created_at
      },
      members: (membersData || []).map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        name: m.name,
        userId: m.user_id,
        createdAt: m.created_at
      })),
      expenses: (expensesData || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        title: e.title,
        amount: e.amount,
        payerMemberId: e.payer_member_id,
        expenseDate: e.expense_date,
        category: e.category,
        createdAt: e.created_at
      })),
      shares: (sharesData || []).map((s: any) => ({
        id: s.id,
        expenseId: s.expense_id,
        memberId: s.member_id,
        shareAmount: s.share_amount,
        createdAt: s.created_at
      })),
    };
  }
);

/**
 * Adds an expense to a project
 */
export const addExpense = api(
  { expose: true, method: "POST", path: "/budget/expenses" },
  async (req: AddExpenseRequest): Promise<AddExpenseResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("add_expense", {
      project_id_param: req.projectId,
      title_param: req.title,
      amount_param: req.amount,
      payer_member_id_param: req.payerMemberId,
      category_param: req.category,
      shares_param: req.shares,
      expense_date_param: req.expenseDate || null,
    });

    if (error) {
      console.error("addExpense error:", error);
      throw APIError.internal(`Failed to add expense: ${error.message}`);
    }

    return { expenseId: data };
  }
);

/**
 * Deletes an expense
 */
export const deleteExpense = api(
  { expose: true, method: "DELETE", path: "/budget/expenses/:expenseId" },
  async ({ expenseId }: { expenseId: string }): Promise<DeleteExpenseResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("delete_expense", {
      expense_id_param: expenseId,
    });

    if (error) {
      console.error("deleteExpense error:", error);
      throw APIError.internal(`Failed to delete expense: ${error.message}`);
    }

    return { success: !!data };
  }
);

interface UpdateExpenseRequest {
  expenseId: string;
  title: string;
  amount: number;
  payerMemberId: string;
  category: string;
  shares: { member_id: string; share_amount: number }[];
  expenseDate?: string;
}

interface UpdateExpenseResponse {
  success: boolean;
}

/**
 * Updates an existing expense
 */
export const updateExpense = api(
  { expose: true, method: "PUT", path: "/budget/expenses" },
  async (req: UpdateExpenseRequest): Promise<UpdateExpenseResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("update_expense", {
      expense_id_param: req.expenseId,
      title_param: req.title,
      amount_param: req.amount,
      payer_member_id_param: req.payerMemberId,
      category_param: req.category,
      shares_param: req.shares,
      expense_date_param: req.expenseDate || null,
    });

    if (error) {
      console.error("updateExpense error:", error);
      throw APIError.internal(`Failed to update expense: ${error.message}`);
    }

    return { success: !!data };
  }
);

interface UpdateProjectRequest {
  projectId: string;
  name: string;
  description?: string;
  currency: string;
  targetBudget?: number;
  groupType: string;
  startDate?: string;
  endDate?: string;
  emoji?: string;
}

interface UpdateProjectResponse {
  success: boolean;
}

/**
 * Updates project details
 */
export const updateProject = api(
  { expose: true, method: "PUT", path: "/budget/projects" },
  async (req: UpdateProjectRequest): Promise<UpdateProjectResponse> => {
    const { data, error } = await supabase.schema("budget").rpc("update_project", {
      project_id_param: req.projectId,
      name_param: req.name,
      description_param: req.description || null,
      currency_param: req.currency,
      target_budget_param: req.targetBudget || null,
      group_type_param: req.groupType,
      start_date_param: req.startDate || null,
      end_date_param: req.endDate || null,
      emoji_param: req.emoji || '🏖️',
    });

    if (error) {
      console.error("updateProject error:", error);
      throw APIError.internal(`Failed to update project: ${error.message}`);
    }

    return { success: !!data };
  }
);
