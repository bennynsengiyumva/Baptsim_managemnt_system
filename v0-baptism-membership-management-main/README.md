# BMPMS (Baptist Member Process Management System) - React Frontend

A comprehensive React + Vite frontend application for managing Baptist church member processes including candidates, baptisms, memberships, transfers, bible studies, and more.

## Technology Stack

- **Framework**: React 18+ with Vite
- **State Management**: Redux Toolkit
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **API Client**: Axios
- **Styling**: Tailwind CSS
- **Charting**: Recharts
- **Form Handling**: Formik + Yup
- **Internationalization**: i18next (English & Kinyarwanda)
- **Real-time**: Socket.io Client
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── layout/          # Layout components (Sidebar, Navbar, Footer)
│   ├── routing/         # Route protection components
│   ├── ui/              # UI components (Button, Card, Modal, DataTable)
│   └── shared/          # Shared utility components
├── pages/               # Page components organized by feature
│   ├── auth/            # Login & Register
│   ├── candidates/      # Candidate management
│   ├── bibleStudy/      # Bible study management
│   ├── spiritualPrep/   # Spiritual preparation
│   ├── baptism/         # Baptism management
│   ├── membership/      # Membership management
│   ├── transfers/       # Transfer management
│   ├── instructors/     # Instructor management
│   ├── church/          # Church coordination
│   ├── reports/         # Reports & analytics
│   ├── certificates/    # Certificate management
│   ├── users/           # User management
│   └── settings/        # Settings & preferences
├── services/            # API service layer
│   ├── api.ts           # Axios client configuration
│   ├── candidateService.ts
│   ├── bibleStudyService.ts
│   ├── baptismService.ts
│   ├── membershipService.ts
│   ├── transferService.ts
│   ├── instructorService.ts
│   ├── churchService.ts
│   ├── certificateService.ts
│   ├── reportService.ts
│   ├── userService.ts
│   └── spiritualPrepService.ts
├── store/               # Redux store
│   ├── index.ts
│   ├── authStore.ts
│   └── slices/
│       ├── candidateSlice.ts
│       ├── bibleStudySlice.ts
│       ├── baptismSlice.ts
│       ├── membershipSlice.ts
│       ├── transferSlice.ts
│       ├── instructorSlice.ts
│       ├── churchSlice.ts
│       ├── certificateSlice.ts
│       ├── reportSlice.ts
│       ├── notificationSlice.ts
│       └── uiSlice.ts
├── types/               # TypeScript type definitions
├── i18n/                # Internationalization
│   ├── i18n.ts
│   └── locales/
│       ├── en.json
│       └── rw.json
├── App.tsx              # Main app component with routing
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## Features

### 1. **Authentication**
- Login and registration pages
- JWT token-based authentication
- Protected routes with role-based access control
- Auto-logout on token expiration

### 2. **Dashboard**
- Real-time statistics cards
- Charts and graphs (Bar, Line, Pie charts)
- Recent activity feed
- Quick action buttons based on user role

### 3. **Candidate Management**
- List, create, edit, and delete candidates
- Detailed candidate profiles
- Track baptism and membership dates
- Search and filter functionality
- Status tracking (ACTIVE, INACTIVE, TRANSFERRED, SUSPENDED)

### 4. **Bible Study**
- Create and manage bible study sessions
- Track participants and instructors
- Schedule management
- Study status tracking (SCHEDULED, ONGOING, COMPLETED)

### 5. **Spiritual Preparation**
- Manage spiritual preparation activities
- Assign instructors to candidates
- Track progress and completion
- Multiple status types

### 6. **Baptism Management**
- Schedule baptism events
- Track baptized members
- Manage baptism locations and dates
- Status tracking (SCHEDULED, COMPLETED, CANCELLED)

### 7. **Membership Management**
- Register new members
- Track membership details
- Membership status tracking
- View membership history

### 8. **Transfer Management**
- Request and approve member transfers between churches
- Track transfer status (PENDING, APPROVED, REJECTED)
- From/To church management

### 9. **Instructor Management**
- Add and manage instructors
- Track specializations and experience
- Assign instructors to studies/activities

### 10. **Church Coordination**
- Manage multiple church locations
- Pastor and location information
- Church status tracking
- Coordination details

### 11. **Reports & Analytics**
- Generate monthly/quarterly/yearly reports
- View membership trends
- Baptism statistics
- Export reports (PDF & CSV)
- Date range filtering

### 12. **Certificate Management**
- Issue certificates
- Track certificate status
- Download certificates (PDF)
- Certificate type management

### 13. **User Management**
- Create and manage system users
- Role assignment (ADMIN, PASTOR, INSTRUCTOR, CANDIDATE)
- User status tracking
- Last login tracking

### 14. **Settings**
- Profile settings
- Preferences (Dark/Light mode)
- Language selection (English/Kinyarwanda)
- Password management

## API Integration

All pages fetch data exclusively from the backend API. The API services are located in the `services/` directory:

### Service Methods Pattern

Each service module provides CRUD operations:

```typescript
// Example: candidateService.ts
export const candidateService = {
  getAllCandidates: (params) => apiClient.get('/api/candidates', { params }),
  getCandidateById: (id) => apiClient.get(`/api/candidates/${id}`),
  createCandidate: (data) => apiClient.post('/api/candidates', data),
  updateCandidate: (id, data) => apiClient.put(`/api/candidates/${id}`, data),
  deleteCandidate: (id) => apiClient.delete(`/api/candidates/${id}`),
};
```

### API Endpoints (Configured for http://localhost:8080)

- `/api/candidates` - Candidate management
- `/api/bible-studies` - Bible study sessions
- `/api/baptisms` - Baptism management
- `/api/memberships` - Membership management
- `/api/transfers` - Transfer management
- `/api/instructors` - Instructor management
- `/api/churches` - Church coordination
- `/api/certificates` - Certificate management
- `/api/reports` - Reports & analytics
- `/api/users` - User management
- `/api/spiritual-prep` - Spiritual preparation
- `/api/auth/login` - Authentication

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm/pnpm
- Backend API running on http://localhost:8080

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables** (if needed):
   Create `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

5. **Preview production build**:
   ```bash
   pnpm preview
   ```

## Authentication Flow

1. User logs in via `/login` page
2. Backend returns JWT token
3. Token stored in Redux state and localStorage
4. All API requests include JWT in Authorization header
5. Protected routes check authentication status
6. Role-based routes check user role

## State Management

- **Redux Store**: Global state for auth, UI, and module data
- **React Query**: Server state management with caching
- **Local Component State**: Form inputs and UI toggles

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Toggle via settings
- **Responsive Design**: Mobile-first approach
- **Custom Theme**: Configurable via tailwind.config.js

## Internationalization

- **Languages**: English (en) and Kinyarwanda (rw)
- **Translation Files**: `src/i18n/locales/*.json`
- **Switch Language**: Settings page

## Key Components

### Layout
- `Layout`: Main layout wrapper with sidebar and navbar
- `Sidebar`: Navigation menu with role-based items
- `Navbar`: Header with user menu, theme toggle, language selector
- `Footer`: App footer

### Routing
- `ProtectedRoute`: Requires authentication
- `RoleBasedRoute`: Requires specific role

### UI Components
- `DataTable`: Reusable data grid with pagination
- `Card`: Content container
- `Button`: Standard button with variants
- `Modal`: Dialog component
- `StatsCard`: Statistics display card

## Development Guidelines

### Adding a New Feature

1. Create page component in `pages/`
2. Create API service in `services/`
3. Create Redux slice in `store/slices/` (if needed)
4. Add route in `App.tsx`
5. Add navigation link in `Sidebar.tsx`
6. Add translations in i18n files

### API Service Example

```typescript
// services/exampleService.ts
import apiClient from './api';

export const exampleService = {
  getAll: (params) => apiClient.get('/api/examples', { params }),
  getById: (id) => apiClient.get(`/api/examples/${id}`),
  create: (data) => apiClient.post('/api/examples', data),
  update: (id, data) => apiClient.put(`/api/examples/${id}`, data),
  delete: (id) => apiClient.delete(`/api/examples/${id}`),
};
```

### Using in a Page

```typescript
import { useQuery } from '@tanstack/react-query';
import { exampleService } from '@/services/exampleService';

export default function ExamplePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['examples'],
    queryFn: () => exampleService.getAll(),
  });

  // Rest of component
}
```

## Performance Optimizations

- React Query caching
- Code splitting with dynamic imports
- Lazy loading of routes
- Image optimization
- Bundle size monitoring

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues
- Ensure backend is running on http://localhost:8080
- Check CORS configuration on backend
- Verify API endpoints are correct

### Authentication Issues
- Clear localStorage and Redux state
- Check JWT token validity
- Verify backend authentication endpoint

### Build Issues
- Clear node_modules and reinstall
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Create components that are reusable
4. Add proper error handling
5. Update translations for new strings
6. Test API integration before submitting

## License

Proprietary - Baptist Member Process Management System

## Support

For issues and questions, contact the development team.
