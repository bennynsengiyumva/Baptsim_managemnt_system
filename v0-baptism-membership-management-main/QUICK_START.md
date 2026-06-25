# BMPMS React Frontend - Quick Start Guide

## 🚀 Getting Started in 30 Seconds

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
App opens at: **http://localhost:5174**

### 3. Login Credentials (Test)
Use any email/password with your backend authentication:
- Email: `test@example.com`
- Password: `password123`

---

## 📋 What's Included

### 12 Complete Modules
1. **Candidates** - Candidate management & tracking
2. **Bible Studies** - Course management & enrollment
3. **Spiritual Prep** - Preparation program tracking
4. **Baptism** - Baptism scheduling & records
5. **Membership** - Member registration & management
6. **Transfers** - Member transfer requests
7. **Instructors** - Instructor management
8. **Church Coordination** - Multiple church management
9. **Reports** - Analytics & statistics
10. **Certificates** - Certificate issuance
11. **User Management** - System users & roles
12. **Dashboard** - Overview & statistics

### Features
- ✅ Authentication (JWT)
- ✅ Authorization (Role-based)
- ✅ Search & Filter
- ✅ Dark/Light Mode
- ✅ Multi-language (EN + Kinyarwanda)
- ✅ Responsive Design
- ✅ Data Tables
- ✅ Charts & Analytics
- ✅ Form Validation
- ✅ Real-time Ready

---

## 🔗 API Endpoints Reference

### Base URL: `http://localhost:8080`

#### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/refresh
```

#### Candidates
```
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/:id
PUT    /api/candidates/:id
DELETE /api/candidates/:id
```

#### Bible Studies
```
GET    /api/bible-studies
POST   /api/bible-studies
PUT    /api/bible-studies/:id
DELETE /api/bible-studies/:id
```

#### Spiritual Preparation
```
GET    /api/spiritual-prep
POST   /api/spiritual-prep
PUT    /api/spiritual-prep/:id
DELETE /api/spiritual-prep/:id
```

#### Baptism
```
GET    /api/baptism
POST   /api/baptism
PUT    /api/baptism/:id
DELETE /api/baptism/:id
```

#### Membership
```
GET    /api/membership
POST   /api/membership
PUT    /api/membership/:id
DELETE /api/membership/:id
```

#### Transfers
```
GET    /api/transfer
POST   /api/transfer
PUT    /api/transfer/:id
DELETE /api/transfer/:id
```

#### Instructors
```
GET    /api/instructor
POST   /api/instructor
PUT    /api/instructor/:id
DELETE /api/instructor/:id
```

#### Churches
```
GET    /api/church
POST   /api/church
PUT    /api/church/:id
DELETE /api/church/:id
```

#### Reports
```
GET    /api/reports
POST   /api/reports/export
```

#### Certificates
```
GET    /api/certificates
POST   /api/certificates
GET    /api/certificates/:id/download
DELETE /api/certificates/:id
```

#### Users
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

---

## 📁 File Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components (one per route)
├── store/           # Redux state management
├── services/        # API client (Axios)
├── types/           # TypeScript types
├── i18n/            # Translations
├── App.tsx          # Main routing
└── main.tsx         # Entry point
```

---

## 🎯 User Roles

| Role | Access |
|------|--------|
| **ADMIN** | All features + User Management + Reports |
| **PASTOR** | All features except User Management |
| **INSTRUCTOR** | Candidates, Studies, Baptism, Membership |
| **CANDIDATE** | Dashboard, Studies, Membership, Certificates |

---

## 🔐 Authentication Flow

1. User logs in with email/password
2. Backend returns JWT token + user data
3. Token stored in localStorage
4. Token automatically sent with all API requests
5. On token expiry → Refresh token endpoint called
6. Invalid token → Redirect to login

---

## 📊 Dashboard Features

- **Overview Cards**: Total members, baptisms, studies
- **Membership Trend**: Line chart showing growth
- **Baptism Status**: Pie chart distribution
- **Recent Activity**: Timeline of recent actions
- **Quick Stats**: Key performance indicators

---

## 🎨 Theme & Language

### Toggle Theme
Click moon/sun icon in Navbar

### Toggle Language
Click EN/RW selector in Navbar

### Supported Languages
- English (EN)
- Kinyarwanda (RW)

---

## 🔍 Search & Filter

All list pages support:
- **Search**: Type to filter by name/email
- **Status Filter**: Dropdown to filter by status
- **Type Filter**: Filter by category/type
- **Results Count**: Shows matching items

---

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

---

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Format code
pnpm format

# Check types
pnpm type-check
```

---

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Backend Connection Failed
- Ensure backend is running at `http://localhost:8080`
- Check CORS configuration on backend
- Verify JWT token exists in localStorage

### API 401 Unauthorized
- Token may have expired
- Clear localStorage and log in again
- Check token format in Authorization header

### Missing Translations
- Add key to `src/i18n/locales/en.json`
- Add translation to `src/i18n/locales/rw.json`
- Use `const { t } = useTranslation()` in component

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route configuration |
| `src/store/index.ts` | Redux store setup |
| `src/services/api.ts` | Axios configuration |
| `src/types/index.ts` | TypeScript definitions |
| `vite.config.ts` | Vite configuration |
| `tailwind.config.ts` | Tailwind theming |

---

## 🚀 Deployment

### Build
```bash
pnpm build
```
Creates optimized build in `dist/` folder

### Deploy to Vercel
```bash
vercel deploy
```

### Environment Variables
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 💡 Tips

1. **Add a new page?** Create in `src/pages/`, add route in `App.tsx`, add menu item in `Sidebar.tsx`

2. **Add a new API?** Create thunks in Redux slice, use `dispatch()` in component, select with `useSelector()`

3. **Add translation?** Add key to both `en.json` and `rw.json`, use with `t('key')`

4. **Style components?** Use Tailwind classes, follow existing pattern in other components

5. **Debug Redux?** Install Redux DevTools browser extension to inspect state

---

## 📞 Support

- **API Format**: `{ success: boolean, data: T, message: string }`
- **Error Format**: `{ success: false, message: "error text", errors?: {...} }`
- **Base URL**: `http://localhost:8080`
- **Authentication**: JWT token in `Authorization: Bearer <token>` header

---

## ✨ Next Steps

1. ✅ **Start server** → `pnpm dev`
2. ✅ **Login** → Use test credentials
3. ✅ **Explore** → Click through all pages
4. ✅ **Test API** → Open browser DevTools → Network tab
5. ✅ **Add features** → Follow existing patterns

**Happy coding! 🎉**
