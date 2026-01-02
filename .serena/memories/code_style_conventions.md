# Code Style and Conventions

## TypeScript Standards

### Type Definitions

#### 1. Prefer `type` Over `interface`
**Rule**: Always use `type` for consistency across the project

```typescript
// GOOD ✅
type User = {
  id: string;
  name: string;
  email: string;
};

// AVOID ❌
interface User {
  id: string;
  name: string;
  email: string;
}
```

**Exception**: Only use `interface` when you need:
- Declaration merging
- Extending complex class hierarchies

#### 2. Never Use `any` Type
**Rule**: Always specify concrete types. If the type is truly unknown, use alternatives.

```typescript
// BAD ❌
const handleChange = (event: any) => {
  setValue(event.target.value);
};

const fetchData = async (): Promise<any> => { ... };

// GOOD ✅
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};

type ApiResponse = {
  success: boolean;
  data: User[];
};
const fetchData = async (): Promise<ApiResponse> => { ... };
```

**Alternatives to `any`**:
- `unknown` - for values that need type checking before use
- `Record<string, unknown>` - for objects with unknown properties
- Specific union types - `string | number | boolean`
- Generic types - `T extends SomeConstraint`

#### 3. Always Type Function Parameters and Return Types

```typescript
// GOOD ✅
function calculateTotal(items: Item[], taxRate: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}

// BAD ❌
function calculateTotal(items, taxRate) {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}
```

### Avoid Magic Numbers - Use Named Constants

#### Rule
Never use hardcoded numbers directly in code (except 0, 1, -1 in obvious contexts)

```typescript
// BAD ❌
setTimeout(() => refetch(), 30000);
if (score >= 80) { ... }
const maxItems = items.slice(0, 50);

// GOOD ✅
const REFETCH_INTERVAL_MS = 30000; // 30 seconds
setTimeout(() => refetch(), REFETCH_INTERVAL_MS);

const PASSING_SCORE_THRESHOLD = 80;
if (score >= PASSING_SCORE_THRESHOLD) { ... }

const MAX_DISPLAY_ITEMS = 50;
const maxItems = items.slice(0, MAX_DISPLAY_ITEMS);
```

#### When to Use Constants
- Timeouts/intervals: `const POLLING_INTERVAL_MS = 5000;`
- Thresholds/limits: `const MAX_FILE_SIZE_MB = 10;`
- Retry counts: `const MAX_RETRY_ATTEMPTS = 3;`
- Percentages: `const DISCOUNT_PERCENTAGE = 15;`
- Array indices (beyond 0, 1): `const HEADER_ROW_INDEX = 2;`
- Status codes: `const HTTP_OK = 200;`
- Configuration values: `const DEFAULT_PAGE_SIZE = 20;`

#### Naming Convention for Constants
- Use **UPPER_SNAKE_CASE**: `MAX_RETRIES`, `API_TIMEOUT_MS`
- Include units in name when applicable: `_MS` (milliseconds), `_MB` (megabytes), `_PERCENT`
- Make the name self-documenting: reader should understand what it represents

#### Acceptable Magic Numbers
- `0`, `1`, `-1` in obvious contexts (array indices, loop counters, boolean conversions)
- Mathematical constants already named: `Math.PI`, `Math.E`
- Percentages that are immediately clear: `progress / 100`

## File Organization

### Frontend Structure
```
src/
├── components/        # Reusable UI components
├── pages/            # Page components (routed)
├── context/          # React context providers
├── store/            # Redux store and slices
├── services/         # API services and utilities
├── utils/            # Helper functions
├── styles/           # Global styles
└── types/            # TypeScript type definitions
```

### Backend Structure
```
server/
├── controllers/      # Request handlers
├── services/         # Business logic
├── middleware/       # Express middleware
├── routes/          # Route definitions
├── models/          # Data models/types
└── utils/           # Helper functions
```

## Naming Conventions

### Files
- **React Components**: PascalCase - `UserProfile.tsx`, `LoginForm.tsx`
- **Utilities**: camelCase - `environment.ts`, `validation.ts`
- **Types**: camelCase - `user.types.ts`, `api.types.ts`
- **Services**: camelCase - `auth.service.ts`, `api.service.ts`

### Variables and Functions
- **Variables**: camelCase - `userName`, `isLoading`
- **Functions**: camelCase - `handleSubmit`, `fetchUserData`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRIES`, `API_TIMEOUT_MS`
- **React Components**: PascalCase - `UserProfile`, `LoginButton`
- **Types**: PascalCase - `User`, `ApiResponse`, `AuthState`

### Backend Specific
- **Controllers**: PascalCase class - `AuthController`
- **Services**: PascalCase class - `UserService`, `AuthService`
- **Routes**: camelCase file - `auth.routes.ts`
- **Middleware**: camelCase file - `csrf.middleware.ts`

## React Patterns

### Component Structure
```typescript
type ComponentProps = {
  title: string;
  onSubmit: (data: FormData) => void;
};

const Component = ({ title, onSubmit }: ComponentProps): JSX.Element => {
  // Hooks at the top
  const [state, setState] = useState<string>('');
  
  // Event handlers
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setState(event.target.value);
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### State Management
- Use **Redux Toolkit** for global state (user auth, UI state)
- Use **TanStack Query** for server state (API data, caching)
- Use **local state** (useState) for component-specific UI state

## Import Organization
```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '@mui/material';

// 2. Internal imports (using @ alias)
import { fetchUserData } from '@/services/api';
import { User } from '@/types/user.types';
import { useAuth } from '@/context/AuthContext';

// 3. Relative imports
import './styles.css';
```

## Comments and Documentation

### When to Comment
- **Complex logic**: Explain the "why", not the "what"
- **Security considerations**: Document security patterns (CSRF, XSS prevention)
- **Non-obvious decisions**: Explain architectural choices
- **TODO items**: Mark incomplete or pending work

### When NOT to Comment
- **Self-evident code**: Don't add comments where code is already clear
- **Unchanged code**: Don't add docstrings/comments to code you didn't change
- **Type information**: TypeScript types serve as documentation

### Comment Style
```typescript
// GOOD ✅ - Explains why
// Retry after 100ms to allow CSRF token to refresh
await new Promise(resolve => setTimeout(resolve, CSRF_RETRY_DELAY_MS));

// BAD ❌ - States the obvious
// Set loading to true
setLoading(true);
```

## Error Handling

### Frontend
```typescript
// Use try-catch with proper error typing
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  // Type guard for error
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unknown error occurred');
  }
}
```

### Backend
```typescript
// Use custom error classes
throw new AuthenticationError('Invalid credentials');

// Handle in middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AuthenticationError) {
    return res.status(401).json({ error: error.message });
  }
  next(error);
});
```

## Security Best Practices

1. **Input Validation**: Always validate user input on backend
2. **CSRF Protection**: Apply to all state-changing routes (POST, PUT, DELETE, PATCH)
3. **Password Hashing**: Use bcrypt for password storage
4. **JWT Secrets**: Generate strong secrets (48+ bytes), never commit to git
5. **Environment Variables**: Never hardcode secrets, use .env files
6. **SQL Injection**: Use parameterized queries (Supabase handles this)
7. **XSS Prevention**: Sanitize user input, use React's built-in escaping

## Project-Specific Patterns

### Environment Detection
```typescript
import { isLocalEnvironment, isProductionEnvironment } from '@/utils/environment';

// Conditionally render features
{isLocalEnvironment() && <DevOnlyButton />}
```

### CSRF Pattern
```typescript
import { fetchWithCsrf } from '@/services/api';

// Automatically includes CSRF token in requests
const response = await fetchWithCsrf('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Retry on CSRF failure
if (response.status === 403 && errorData?.code === 'CSRF_VALIDATION_FAILED') {
  await new Promise(resolve => setTimeout(resolve, CSRF_RETRY_DELAY_MS));
  // Retry request
}
```

### API Service Pattern
```typescript
// services/api.ts
export const fetchWithAuth = async (url: string, options?: RequestInit): Promise<Response> => {
  const token = getStoredToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};
```
