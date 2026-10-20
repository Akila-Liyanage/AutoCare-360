import api from './api';

export interface BackendExpense {
  _id: string;
  vehicleId: string;
  ownerId: string;
  serviceRecordId?: string | null;
  category: string;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  source: 'service_record' | 'manual';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseMonthlyBreakdownItem {
  month: string;
  total: number;
  count: number;
}

export interface BackendExpenseSummary {
  totalExpense: number;
  serviceExpenseTotal: number;
  manualExpenseTotal: number;
  expenseCount: number;
  categoryBreakdown: ExpenseCategoryBreakdownItem[];
  monthlyBreakdown: ExpenseMonthlyBreakdownItem[];
}

export interface CreateExpensePayload {
  category: string;
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  serviceRecordId?: string;
  notes?: string;
}

export interface UpdateExpensePayload {
  category?: string;
  title?: string;
  description?: string;
  amount?: number;
  expenseDate?: string;
  vendor?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface GetVehicleExpensesResponse {
  success: boolean;
  count: number;
  data: {
    expenses: BackendExpense[];
  };
}

export interface GetExpenseResponse {
  success: boolean;
  data: {
    expense: BackendExpense;
  };
}

export interface ExpenseMutationResponse {
  success: boolean;
  message: string;
  data: {
    expense: BackendExpense;
  };
}

export interface DeleteExpenseResponse {
  success: boolean;
  message: string;
}

export interface GetExpenseSummaryResponse {
  success: boolean;
  data: {
    summary: BackendExpenseSummary;
  };
}

/**
 * Fetch all expenses for a specific vehicle
 * GET /api/vehicles/:vehicleId/expenses
 */
export const getVehicleExpenses = async (
  vehicleId: string
): Promise<BackendExpense[]> => {
  const response = await api.get<GetVehicleExpensesResponse>(
    `/vehicles/${vehicleId}/expenses`
  );
  return response.data?.data?.expenses || [];
};

/**
 * Fetch a single expense record by ID
 * GET /api/expenses/:id
 */
export const getExpense = async (id: string): Promise<BackendExpense> => {
  const response = await api.get<GetExpenseResponse>(`/expenses/${id}`);
  return response.data?.data?.expense;
};

/**
 * Create/Log a new manual or service expense
 * POST /api/vehicles/:vehicleId/expenses
 */
export const createExpense = async (
  vehicleId: string,
  payload: CreateExpensePayload
): Promise<BackendExpense> => {
  const response = await api.post<ExpenseMutationResponse>(
    `/vehicles/${vehicleId}/expenses`,
    payload
  );
  return response.data?.data?.expense;
};

/**
 * Update an existing expense record
 * PATCH /api/expenses/:id
 */
export const updateExpense = async (
  id: string,
  payload: UpdateExpensePayload
): Promise<BackendExpense> => {
  const response = await api.patch<ExpenseMutationResponse>(
    `/expenses/${id}`,
    payload
  );
  return response.data?.data?.expense;
};

/**
 * Delete an expense record
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (
  id: string
): Promise<DeleteExpenseResponse> => {
  const response = await api.delete<DeleteExpenseResponse>(`/expenses/${id}`);
  return response.data;
};

/**
 * Get consolidated expense analytics summary for a vehicle
 * GET /api/vehicles/:vehicleId/expenses/summary
 */
export const getExpenseSummary = async (
  vehicleId: string
): Promise<BackendExpenseSummary> => {
  const response = await api.get<GetExpenseSummaryResponse>(
    `/vehicles/${vehicleId}/expenses/summary`
  );
  return response.data?.data?.summary;
};

export default {
  getVehicleExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};
