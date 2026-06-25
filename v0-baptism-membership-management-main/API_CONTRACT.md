# BMPMS Frontend - API Contract

This document specifies the exact API endpoints and response formats expected by the BMPMS frontend application.

**Backend Base URL**: `http://localhost:8080`

---

## Authentication Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+250123456789",
      "role": "ADMIN|PASTOR|INSTRUCTOR|CANDIDATE",
      "status": "ACTIVE|INACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Login successful"
}

Response (401):
{
  "success": false,
  "message": "Invalid email or password",
  "errors": {}
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+250123456789"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+250123456789",
    "role": "CANDIDATE",
    "status": "ACTIVE"
  },
  "message": "Registration successful"
}
```

### Get Current User
```
GET /api/auth/me
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+250123456789",
    "role": "ADMIN|PASTOR|INSTRUCTOR|CANDIDATE",
    "status": "ACTIVE|INACTIVE"
  }
}

Response (401):
{
  "success": false,
  "message": "Unauthorized"
}
```

### Logout
```
POST /api/auth/logout
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Candidate Endpoints

### Get All Candidates
```
GET /api/candidates?page=1&pageSize=10&search=&status=ACTIVE
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "candidate_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "phone": "+250123456789",
        "dateOfBirth": "1990-01-15",
        "gender": "FEMALE|MALE|OTHER",
        "address": "Kigali, Rwanda",
        "status": "ACTIVE|INACTIVE|TRANSFERRED|SUSPENDED",
        "joinDate": "2024-01-01T00:00:00Z",
        "baptismDate": "2024-06-01T00:00:00Z" | null,
        "membershipDate": "2024-06-15T00:00:00Z" | null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### Get Candidate by ID
```
GET /api/candidates/{id}
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "candidate_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+250123456789",
    "dateOfBirth": "1990-01-15",
    "gender": "FEMALE",
    "address": "Kigali, Rwanda",
    "status": "ACTIVE",
    "joinDate": "2024-01-01T00:00:00Z",
    "baptismDate": "2024-06-01T00:00:00Z",
    "membershipDate": "2024-06-15T00:00:00Z",
    "bibleStudies": [
      {
        "id": "study_id",
        "title": "Genesis Overview",
        "instructor": "John Doe",
        "status": "COMPLETED"
      }
    ],
    "transfers": [],
    "certificates": []
  }
}
```

### Create Candidate
```
POST /api/candidates
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+250123456789",
  "dateOfBirth": "1990-01-15",
  "gender": "FEMALE",
  "address": "Kigali, Rwanda"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_candidate_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "status": "ACTIVE",
    "joinDate": "2024-01-01T00:00:00Z"
  }
}
```

### Update Candidate
```
PUT /api/candidates/{id}
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+250123456789",
  "address": "Kigali, Rwanda",
  "status": "ACTIVE"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "candidate_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "status": "ACTIVE",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Delete Candidate
```
DELETE /api/candidates/{id}
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Candidate deleted successfully"
}
```

---

## Bible Study Endpoints

### Get All Bible Studies
```
GET /api/bible-study?page=1&pageSize=10
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "study_id",
        "title": "Genesis Overview",
        "description": "A comprehensive study of the book of Genesis",
        "instructor": "John Doe",
        "instructorId": "instructor_id",
        "chapter": "Genesis 1-5",
        "verse": "Genesis 1:1-5:32",
        "status": "ACTIVE|COMPLETED|SCHEDULED",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-03-01T00:00:00Z",
        "participants": 25,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### Create Bible Study
```
POST /api/bible-study
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Genesis Overview",
  "description": "A comprehensive study of the book of Genesis",
  "instructorId": "instructor_id",
  "chapter": "Genesis 1-5",
  "verse": "Genesis 1:1-5:32",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-03-01T00:00:00Z"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_study_id",
    "title": "Genesis Overview",
    "status": "SCHEDULED"
  }
}
```

---

## Baptism Endpoints

### Get All Baptisms
```
GET /api/baptism?page=1&pageSize=10&status=SCHEDULED
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "baptism_id",
        "candidateId": "candidate_id",
        "candidateName": "Jane Smith",
        "scheduledDate": "2024-06-15T00:00:00Z",
        "location": "Church Grounds",
        "status": "SCHEDULED|COMPLETED|CANCELLED",
        "attendees": 50,
        "notes": "Additional notes about the baptism",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 10
  }
}
```

### Create Baptism
```
POST /api/baptism
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "candidateId": "candidate_id",
  "scheduledDate": "2024-06-15T10:00:00Z",
  "location": "Church Grounds",
  "notes": "Additional notes"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_baptism_id",
    "candidateName": "Jane Smith",
    "scheduledDate": "2024-06-15T10:00:00Z",
    "status": "SCHEDULED"
  }
}
```

---

## Membership Endpoints

### Get All Memberships
```
GET /api/membership?page=1&pageSize=10&status=ACTIVE
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "membership_id",
        "candidateId": "candidate_id",
        "candidateName": "Jane Smith",
        "membershipType": "REGULAR|ASSOCIATE|LIFE",
        "joinDate": "2024-06-15T00:00:00Z",
        "status": "ACTIVE|INACTIVE|SUSPENDED",
        "church": "Main Chapel",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 80,
    "page": 1,
    "pageSize": 10
  }
}
```

### Register Member
```
POST /api/membership
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "candidateId": "candidate_id",
  "membershipType": "REGULAR",
  "joinDate": "2024-06-15T00:00:00Z",
  "church": "Main Chapel"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_membership_id",
    "candidateName": "Jane Smith",
    "membershipType": "REGULAR",
    "status": "ACTIVE"
  }
}
```

---

## Transfers Endpoints

### Get All Transfers
```
GET /api/transfers?page=1&pageSize=10&status=PENDING
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "transfer_id",
        "candidateId": "candidate_id",
        "candidateName": "Jane Smith",
        "fromChurch": "Main Chapel",
        "toChurch": "Branch Chapel",
        "requestDate": "2024-01-01T00:00:00Z",
        "status": "PENDING|APPROVED|REJECTED|COMPLETED",
        "notes": "Transfer notes",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10
  }
}
```

### Create Transfer Request
```
POST /api/transfers
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "candidateId": "candidate_id",
  "fromChurch": "Main Chapel",
  "toChurch": "Branch Chapel",
  "notes": "Transfer notes"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_transfer_id",
    "candidateName": "Jane Smith",
    "status": "PENDING"
  }
}
```

---

## Instructors Endpoints

### Get All Instructors
```
GET /api/instructors?page=1&pageSize=10
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "instructor_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+250123456789",
        "specialization": "Old Testament",
        "status": "ACTIVE|INACTIVE",
        "studiesCount": 5,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10
  }
}
```

### Create Instructor
```
POST /api/instructors
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+250123456789",
  "specialization": "Old Testament"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_instructor_id",
    "firstName": "John",
    "lastName": "Doe",
    "specialization": "Old Testament"
  }
}
```

---

## Reports Endpoints

### Get Report Data
```
GET /api/reports?type=MONTHLY&startDate=2024-01-01&endDate=2024-12-31
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "totalCandidates": 150,
    "totalBaptisms": 45,
    "totalMembers": 120,
    "certificatesIssued": 60,
    "completionRate": 75,
    "activeStudies": 8,
    "monthlyData": [
      {
        "month": "January",
        "candidates": 10,
        "baptisms": 3,
        "members": 8
      }
    ],
    "chartData": []
  }
}
```

---

## Users Endpoints (Admin only)

### Get All Users
```
GET /api/users?page=1&pageSize=10&role=ADMIN
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "ADMIN|PASTOR|INSTRUCTOR|CANDIDATE",
        "status": "ACTIVE|INACTIVE",
        "lastLogin": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### Create User (Admin)
```
POST /api/users
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PASTOR",
  "password": "password123"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "new_user_id",
    "email": "newuser@example.com",
    "firstName": "John",
    "role": "PASTOR"
  }
}
```

---

## Error Response Format

All errors follow this format:

```
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "fieldName": ["Field error message"],
    "anotherField": ["Error 1", "Error 2"]
  }
}
```

---

## Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer {jwt_token}
```

The token is stored in localStorage as `authToken` after login.

---

## Important Notes

1. All timestamp fields are ISO 8601 format
2. Pagination uses `page` (1-indexed) and `pageSize` parameters
3. Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
4. All requests must include `Content-Type: application/json` header
5. CORS must be enabled on backend
6. Token should automatically refresh on 401 response
7. All numeric IDs should be strings (UUIDs preferred)
8. Boolean fields can be true/false or "true"/"false" strings
