import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Project {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  currency: string;
  target_budget: number | null;
  group_type: string;
  start_date: string | null;
  end_date: string | null;
  emoji: string;
  created_at: string;
  member_count?: number;
  total_spent?: number;
}

export interface Member {
  id: string;
  project_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
}

export interface ExpenseShare {
  id: string;
  expense_id: string;
  member_id: string;
  share_amount: number;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  payer_member_id: string;
  expense_date: string;
  category: string;
  created_at: string;
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

    return { projects: data || [] };
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
      project: projectData,
      members: membersData || [],
      expenses: expensesData || [],
      shares: sharesData,
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

