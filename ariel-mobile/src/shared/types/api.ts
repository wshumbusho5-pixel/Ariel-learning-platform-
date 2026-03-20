export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
