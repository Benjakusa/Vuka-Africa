# Vuka — Data Flow & API Integration Guide

## 1. API Client Setup

```typescript
// lib/api.ts
class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(response: { error: { code: string; message: string; details?: any } }, status: number) {
    super(response.error.message);
    this.code = response.error.code;
    this.status = status;
    this.details = response.error.details;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(method: string, path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      credentials: 'include', // Send httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Unknown error' } }));
      throw new ApiError(body, res.status);
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    let url = path;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) search.set(k, String(v));
      });
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>('GET', url);
  }

  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>('POST', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, { body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient();
export { ApiError };
```

## 2. Hook: useAuth

```typescript
// lib/hooks/use-auth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// AuthProvider implementation
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try GET /auth/me, fallback to POST /auth/refresh
  useEffect(() => {
    async function init() {
      try {
        const { user } = await api.get<{ user: User }>('/auth/me');
        setUser(user);
      } catch {
        try {
          const { user } = await api.post<{ user: User }>('/auth/refresh');
          setUser(user);
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await api.post<{ user: User }>('/auth/login', { email, password });
    setUser(user);
  };

  const register = async (data: RegisterInput) => {
    const { user } = await api.post<{ user: User }>('/auth/register', data);
    setUser(user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    // Invalidate all queries
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 3. Idempotency Key Pattern

```typescript
// lib/idempotency.ts
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// Usage in mutations that involve payments
const idempotencyKey = useRef(generateIdempotencyKey());

const enrolMutation = useMutation({
  mutationFn: (courseId: string) =>
    api.post(
      '/enrolments',
      { courseId },
      {
        headers: { 'Idempotency-Key': idempotencyKey.current },
      },
    ),
  onSuccess: () => {
    idempotencyKey.current = generateIdempotencyKey(); // Rotate on success
  },
  onError: (error: ApiError) => {
    if (error.code === 'IDEMPOTENCY_REUSE') {
      // This request was already processed — show success state
      toast.info('Payment already processed. Redirecting...');
      return;
    }
    if (error.status === 409) {
      // Conflict — handle specifically
    }
  },
});
```

## 4. Pagination Integration

```typescript
// lib/hooks/use-pagination.ts
export function usePagination(initialPage = 1) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page')) || initialPage;

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return { page, setPage };
}

// Paginated component
function Pagination({ meta }: { meta: PaginationMeta }) {
  const { page, setPage } = usePagination();

  return (
    <div className="flex items-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-body">
        Page {meta.page} of {meta.totalPages} ({meta.total} results)
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= meta.totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
```

## 5. Filter State Management

```typescript
// lib/hooks/use-filters.ts
export function useFilters(defaults: Record<string, string>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const result: Record<string, string> = { ...defaults };
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [searchParams, defaults]);

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => router.push(pathname);
  const hasActiveFilters = [...searchParams.keys()].some((k) => k !== 'page');

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
```

## 6. Optimistic Update Pattern

```typescript
// Example: Milestone confirmation with optimistic update
function MilestoneActions({ enrolmentId, milestone }: MilestoneActionsProps) {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post(`/enrolments/${enrolmentId}/milestones/${milestone.id}/trainee-confirm`),

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.enrolments.detail(enrolmentId) });
      const previous = queryClient.getQueryData(queryKeys.enrolments.detail(enrolmentId));

      queryClient.setQueryData(queryKeys.enrolments.detail(enrolmentId), (old: EnrolmentDetail) => ({
        ...old,
        milestones: old.milestones.map(m =>
          m.id === milestone.id ? { ...m, status: 'TRAINEE_CONFIRMED' as const } : m
        ),
      }));

      return { previous };
    },

    onError: (err, vars, context) => {
      // Rollback
      queryClient.setQueryData(queryKeys.enrolments.detail(enrolmentId), context?.previous);
      toast.error('Failed to confirm attendance. Please try again.');
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: queryKeys.enrolments.detail(enrolmentId) });
    },
  });

  if (milestone.status !== 'TRAINER_CONFIRMED') return null;

  return (
    <Button
      onClick={() => confirmMutation.mutate()}
      disabled={confirmMutation.isPending}
    >
      {confirmMutation.isPending ? 'Confirming...' : 'I Attended This Session'}
    </Button>
  );
}
```

## 7. File Upload to R2

```typescript
// components/shared/file-upload.tsx
// Uses presigned URL flow:
// 1. Client requests presigned PUT URL: POST /api/upload/presign
//    Body: { fileName: 'id.jpg', contentType: 'image/jpeg' }
//    Response: { uploadUrl: string, publicUrl: string, key: string }
// 2. Client PUTs the file directly to R2 via uploadUrl
// 3. Client submits the publicUrl as part of the form

async function uploadFile(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await api.post('/upload/presign', {
    fileName: file.name,
    contentType: file.type,
  });

  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  return publicUrl;
}
```

## 8. Error Handling Architecture

```
API Error (ApiError)
  ├── 401 Unauthorized
  │   └── AuthProvider attempts silent refresh
  │       ├── Success → retry original request
  │       └── Failure → redirect to /auth/login
  ├── 403 Forbidden
  │   └── Show "You don't have permission" toast
  ├── 404 Not Found
  │   └── Show EmptyState or redirect to 404 page
  ├── 409 Conflict
  │   └── Show specific conflict message (e.g., already enrolled)
  ├── 422 Validation Error
  │   └── Show field-level errors on forms
  ├── 429 Rate Limited
  │   └── Show "Too many requests. Try again in [time]"
  └── 500 Server Error
      └── Show "Something went wrong" + retry
```

```typescript
// lib/hooks/use-api-error.ts
export function useApiError() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 401:
            // AuthProvider handles refresh
            break;
          case 403:
            toast.error("You don't have permission to perform this action");
            break;
          case 404:
            toast.error('Resource not found');
            break;
          case 409:
            toast.error(error.message);
            break;
          case 422:
            // Return for form-level handling
            return error.details;
          case 429:
            toast.error('Too many requests. Please wait a moment.');
            break;
          default:
            toast.error(error.message || 'Something went wrong');
        }
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Connection error. Please check your internet.');
      } else {
        toast.error('An unexpected error occurred');
      }
    },
    [toast],
  );

  return { handleError };
}
```

## 9. State Management Decision Tree

```
For each piece of UI state, choose:

1. Server state (most data)
   → TanStack Query (useQuery / useMutation)
   → Cache key convention: queryKeys.*
   → Example: trainer list, enrolment detail, balance

2. URL state (filters, pagination)
   → URLSearchParams via useSearchParams
   → Example: /trainers?category=Baking&page=2

3. Client state (form inputs, UI toggles)
   → useState / useReducer inside component
   → Example: modal open/closed, active tab, form values

4. Cross-cutting state (auth, toasts)
   → React Context (AuthProvider, ToastProvider)
   → Example: current user, notification toasts

Do NOT use:
- Zustand / Redux (unnecessary for this scope)
- PropTypes (use TypeScript interfaces)
- Class components (functional + hooks only)
```

## 10. Query Invalidation Map

| Mutation                   | Invalidate                                        |
| -------------------------- | ------------------------------------------------- |
| POST /enrolments           | `enrolments.all`, `dashboard.traineeStats`        |
| POST .../milestone/confirm | `enrolments.detail(enrolmentId)`                  |
| POST /payouts/request      | `earnings.summary`, `payouts.list(1)`             |
| POST /trainers/apply       | `trainers.all`, `dashboard.*`                     |
| POST /courses              | `courses.all`, `trainers.courses(userId)`         |
| PATCH /courses/:id/publish | `courses.all`, `courses.detail(slug)`             |
| POST .../verify/pay        | `trainers.detail(slug)` (for verification status) |
| POST .../approve (admin)   | `admin.verifications`, `trainers.all`             |
| POST .../resolve (admin)   | `admin.disputes`, `enrolments.detail(...)`        |
| POST /auth/register        | `auth.me` (via AuthProvider)                      |
| POST /auth/logout          | ALL (via queryClient.clear())                     |
