# BMPMS React Frontend - Complete Documentation

## Project Overview
BMPMS (Baptism & Membership Preparation Management System) is an enterprise-grade React + Vite frontend application for managing baptisms, memberships, candidates, and church coordination. All data is retrieved from backend APIs running at `http://localhost:8080`.

## Tech Stack
- **Framework**: React 18 + Vite
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Forms**: Formik + Yup
- **Charts**: Recharts
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Internationalization**: i18next (EN + Kinyarwanda)
- **Real-time**: Socket.io Client (for WebSocket notifications)

## Project Structure

```
src/
├── api/                    # API client configuration
├── components/
│   ├── layout/            # Layout components (Sidebar, Navbar, Footer)
│   ├── routing/           # Route protection components
│   └── ui/                # Reusable UI components
├── pages/
│   ├── auth/              # Login & Register pages
│   ├── candidates/        # Candidate management
│   ├── biblestudies/      # Bible study programs
│   ├── spiritual/         # Spiritual preparation
│   ├── baptism/           # Baptism management
│   ├── membership/        # Membership management
│   ├── transfer/          # Member transfers
│   ├── instructor/        # Instructor management
│   ├── church/            # Church coordination
│   ├── reports/           # Reports & analytics
│   ├── certificates/      # Certificate management
│   ├── users/             # User management
│   └── DashboardPage.tsx  # Main dashboard
├── store/
│   ├── index.ts           # Store configuration
│   ├── authStore.ts       # Authentication state
│   └── slices/            # Feature-specific slices
├── services/
│   └── api.ts             # Axios configuration
├── types/                 # TypeScript type definitions
├── i18n/                  # Translation files
├── hooks/                 # Custom React hooks
└── utils/                 # Utility functions
```

## Core Features

### 1. **Authentication**
- JWT-based token authentication
- Login & Registration
- Token refresh mechanism
- Protected routes
- Role-based access control (ADMIN, PASTOR, INSTRUCTOR, CANDIDATE)

**API Endpoints**:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### 2. **Candidate Management**
- View all candidates
- Add new candidates
- Edit candidate information
- Delete candidates
- Search and filter by status

**API Endpoints**:
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### 3. **Bible Study Programs**
- Manage Bible study courses
- Track study progress
- Assign instructors
- Monitor completion rates

**API Endpoints**:
- `GET /api/bible-studies` - Get all studies
- `POST /api/bible-studies` - Create study
- `PUT /api/bible-studies/:id` - Update study
- `DELETE /api/bible-studies/:id` - Delete study

### 4. **Spiritual Preparation**
- Create spiritual preparation programs
- Track spiritual progress
- View preparation materials
- Monitor completion

**API Endpoints**:
- `GET /api/spiritual-prep` - Get all programs
- `POST /api/spiritual-prep` - Create program
- `PUT /api/spiritual-prep/:id` - Update program
- `DELETE /api/spiritual-prep/:id` - Delete program

### 5. **Baptism Management**
- Schedule baptisms
- Manage baptism records
- Track baptism status (SCHEDULED, COMPLETED, CANCELLED)
- View baptism attendance

**API Endpoints**:
- `GET /api/baptism` - Get all baptisms
- `POST /api/baptism` - Schedule baptism
- `PUT /api/baptism/:id` - Update baptism
- `DELETE /api/baptism/:id` - Delete baptism

### 6. **Membership Management**
- Register church members
- Manage member status
- Track membership types
- Monitor member activities

**API Endpoints**:
- `GET /api/membership` - Get all members
- `POST /api/membership` - Register member
- `PUT /api/membership/:id` - Update member
- `DELETE /api/membership/:id` - Delete member

### 7. **Member Transfers**
- Request member transfers between churches
- Approve/Reject transfers
- Track transfer history
- View transfer status

**API Endpoints**:
- `GET /api/transfer` - Get all transfers
- `POST /api/transfer` - Create transfer request
- `PUT /api/transfer/:id` - Update transfer
- `DELETE /api/transfer/:id` - Delete transfer

### 8. **Instructor Management**
- Manage Bible study instructors
- Assign instructors to courses
- Track instructor performance
- Manage instructor availability

**API Endpoints**:
- `GET /api/instructor` - Get all instructors
- `POST /api/instructor` - Add instructor
- `PUT /api/instructor/:id` - Update instructor
- `DELETE /api/instructor/:id` - Delete instructor

### 9. **Church Coordination**
- Manage multiple church locations
- Track church information
- View church statistics
- Coordinate church activities

**API Endpoints**:
- `GET /api/church` - Get all churches
- `POST /api/church` - Create church
- `PUT /api/church/:id` - Update church
- `DELETE /api/church/:id` - Delete church

### 10. **Reports & Analytics**
- View membership statistics
- Track baptism trends
- Monitor completion rates
- Generate PDF/CSV reports
- Export data

**API Endpoints**:
- `GET /api/reports` - Get report data
- `POST /api/reports/export` - Export reports

### 11. **Certificate Management**
- Issue certificates to candidates
- Download certificates as PDF
- Track issued certificates
- Manage certificate revocation

**API Endpoints**:
- `GET /api/certificates` - Get all certificates
- `POST /api/certificates` - Issue certificate
- `GET /api/certificates/:id/download` - Download certificate
- `DELETE /api/certificates/:id` - Delete certificate

### 12. **User Management** (ADMIN only)
- Manage system users
- Assign roles and permissions
- Activate/Deactivate users
- Reset user passwords

**API Endpoints**:
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Redux State Management

### Store Structure
```
store/
├── authStore.ts           # Authentication & user management
├── slices/
│   ├── candidateSlice.ts
│   ├── bibleStudySlice.ts
│   ├── spiritualPrepSlice.ts
│   ├── baptismSlice.ts
│   ├── membershipSlice.ts
│   ├── transferSlice.ts
│   ├── instructorSlice.ts
│   ├── churchSlice.ts
│   ├── certificateSlice.ts
│   ├── reportSlice.ts
│   ├── notificationSlice.ts
│   └── uiSlice.ts
```

### Usage Example
```typescript
// In a component
import { useDispatch, useSelector } from 'react-redux';
import { fetchCandidates, selectCandidates } from '@/store/slices/candidateSlice';

export default function MyComponent() {
  const dispatch = useDispatch();
  const candidates = useSelector(selectCandidates);
  
  useEffect(() => {
    dispatch(fetchCandidates());
  }, [dispatch]);
  
  return <div>{/* component JSX */}</div>;
}
```

## API Service Configuration

All API requests use Axios configured in `/src/services/api.ts`:

```typescript
// Base URL: http://localhost:8080
// Authentication: JWT token in Authorization header
// Headers: Content-Type: application/json

// Token is automatically added to all requests from localStorage
// Routes are automatically protected with role-based access control
```

## Internationalization (i18n)

The application supports two languages:
- **English (EN)** - Default
- **Kinyarwanda (RW)**

Language selection is managed through the Navbar. Translations are stored in:
- `/src/i18n/locales/en.json` - English translations
- `/src/i18n/locales/rw.json` - Kinyarwanda translations

### Usage
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('common.dashboard')}</h1>;
};
```

## Dark Mode

The application supports light and dark themes toggled via the Navbar. Theme state is managed by Redux (`uiSlice`).

## Running the Application

### Prerequisites
- Node.js 16+ installed
- Backend server running at `http://localhost:8080`

### Installation
```bash
cd /vercel/share/v0-project
pnpm install
```

### Development
```bash
pnpm dev
```
The application will start at `http://localhost:5173`

### Build
```bash
pnpm build
```

### Preview
```bash
pnpm preview
```

## API Response Format

All API endpoints follow this response format:

**Success**:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Success message"
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error message",
  "errors": { /* validation errors */ }
}
```

## Authentication Flow

1. User logs in with email/password
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. Token automatically included in all API requests
5. On token expiry, refresh endpoint is called
6. User is redirected to login if refresh fails

## Role-Based Access Control

| Role | Features |
|------|----------|
| **ADMIN** | Full access to all modules, User Management, Reports |
| **PASTOR** | Candidates, Bible Study, Baptism, Membership, Transfers, Instructors, Church, Certificates |
| **INSTRUCTOR** | Candidates, Bible Study, Spiritual Prep, Baptism, Membership, Certificates |
| **CANDIDATE** | Dashboard, Bible Study, Spiritual Prep, Membership, Certificates |

## Component Architecture

### Reusable Components
- `Button.tsx` - Styled button component
- `Card.tsx` - Container card with optional title
- `Modal.tsx` - Modal dialog component
- `DataTable.tsx` - Reusable data table with sorting/filtering
- `Form components` - Formik-integrated form components

### Layout Components
- `Layout.tsx` - Main layout wrapper
- `Sidebar.tsx` - Navigation sidebar
- `Navbar.tsx` - Top navigation bar with user menu
- `Footer.tsx` - Application footer

### Route Protection
- `ProtectedRoute.tsx` - Requires authentication
- `RoleBasedRoute.tsx` - Requires specific roles

## Error Handling

All API requests are wrapped with error handling:
- Network errors show toast notifications
- Validation errors display field-level errors
- Authentication errors redirect to login
- 500 errors show generic error messages

## Performance Optimizations

- Code splitting with React Router lazy loading
- Redux for state management (prevents prop drilling)
- Tailwind CSS for optimized styling
- Memoization of expensive computations
- Image optimization
- Axios request/response interceptors for caching

## Troubleshooting

### Dev server won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
pnpm dev
```

### Backend connection issues
- Ensure backend is running at `http://localhost:8080`
- Check CORS configuration on backend
- Verify JWT token in localStorage

### API errors
- Check browser console for detailed error messages
- Verify user role has access to the resource
- Confirm API endpoint exists on backend

## Contributing Guidelines

1. Follow the existing folder structure
2. Use TypeScript for all components
3. Create Redux slices for new features
4. Add translations for new text
5. Follow naming conventions (camelCase for functions/variables, PascalCase for components)
6. Test components in all supported roles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
