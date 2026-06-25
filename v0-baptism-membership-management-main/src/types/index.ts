// Auth & User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  unionName?: string;
  fieldName?: string;
  districtName?: string;
  churchName?: string;
  unionId?: number;
  fieldId?: number;
  districtId?: number;
  churchId?: number;
}

export type UserRole = 'ADMIN' | 'HEAD_OF_RUM' | 'HEAD_OF_FIELD' | 'HEAD_OF_DISTRICT' | 'PASTOR' | 'FIRST_CHURCH_ELDER' | 'INSTRUCTOR' | 'CANDIDATE';

// Candidate Types
export type CandidateStatus =
  | 'REGISTERED'
  | 'IN_PROGRESS'
  | 'READY_FOR_BAPTISM'
  | 'BAPTIZED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'TRANSFERRED'
  | 'SUSPENDED';

export interface Candidate {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  status: CandidateStatus;
  joinDate: string;
  baptismDate?: string;
  membershipDate?: string;
  createdAt: string;
  updatedAt: string;
  churchId?: number;
  churchName?: string;
  instructorId?: number;
  instructorName?: string;
  instructorEmail?: string;
  instructorPhone?: string;
}

export interface CandidateDashboardData {
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

// Bible Study Types
export interface BibleStudy {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: User;
  chapter: string;
  verse: string;
  content: string;
  schedule: string;
  duration: number;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  participants?: string[];
  createdAt: string;
  updatedAt: string;
}

// Spiritual Preparation Types
export interface SpiritualPreparation {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  instructorId: string;
  instructor?: User;
  topic: string;
  content: string;
  schedule: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Lesson / Course Types
export interface Lesson {
  id: string;
  lessonTitle: string;
  lessonDate?: string;
  notes?: string;
  documentUrl?: string;
  candidateName: string;
  candidateId: string;
  instructorName: string;
  instructorId: string;
  requiredScore: number;
  studentScore: number;
  lessonOrder: number;
  maxAttempts: number;
  completed: boolean;
  questions: LessonQuestion[];
}

export interface LessonQuestion {
  id: string;
  question: string;
  options: string[];
  orderIndex: number;
  correctAnswer?: string;
}

export interface LessonAttempt {
  id: string;
  lessonId: string;
  lessonTitle: string;
  candidateId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  attemptsRemaining: number;
  startedAt: string;
  completedAt: string;
}

export interface LessonDocument {
  id: string;
  lessonId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize: number;
  uploadedAt: string;
}

export interface LessonGrade {
  lessonId: string;
  lessonTitle: string;
  candidateId: string;
  candidateName: string;
  studentScore: number;
  requiredScore: number;
  completed: boolean;
  attemptsUsed: number;
  bestScore: number;
}

export interface CandidateDetail {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  status: string;
  churchId?: number;
  churchName?: string;
  instructorId?: number;
  instructorName?: string;
  instructorEmail?: string;
  instructorPhone?: string;
  completedLessons: number;
  progress: number;
  baptized: boolean;
  approved: boolean;
  certificateSigned: boolean;
  certificateNumber?: string;
  baptismId?: number;
  grades: LessonGrade[];
}

// Baptism Types
export interface BaptismEvent {
  id: string;
  eventDate: string;
  location: string;
  officiatingPastor: string;
  description?: string;
  status: 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  registeredCount: number;
  baptizedCount: number;
  registrations: BaptismRegistration[];
}

export interface BaptismRegistration {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  eventId: string;
  baptismDate: string;
  location: string;
  officiatingPastor: string;
  witnessName?: string;
  sponsorName?: string;
  baptized: boolean;
  approved: boolean;
  certificateNumber?: string;
  certificateSigned?: boolean;
  signedAt?: string;
  baptismOrder: number;
  photoUrls?: string[];
  confirmedAt?: string;
}

// Membership Types
export interface Membership {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  membershipNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinDate: string;
  approvedBy: string;
  approver?: User;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Transfer Types
export interface Transfer {
  id: string;
  memberId: string;
  member?: Candidate;
  fromChurch: string;
  toChurch: string;
  transferDate: string;
  approvedBy: string;
  approver?: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Instructor Types
// Instructor Types
export interface Instructor {
  id: string;
  userId: string;
  user?: User;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  qualification?: string;       // renamed from qualifications (string, not array)
  qualifications?: string[];    // keep for backward compat if used elsewhere
  yearsOfService: number;       // added
  churchId?: number;            // added
  assignedStudents?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Church Coordination Types
export interface ChurchCoordination {
  id: string;
  event: string;
  description: string;
  date: string;
  location: string;
  coordinatorId: string;
  coordinator?: User;
  participants?: string[];
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Certificate Types
export interface Certificate {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  recipientName?: string;
  type: 'BAPTISM' | 'MEMBERSHIP' | 'COMPLETION' | 'STUDY';
  issuedDate: string;
  issuedBy: string;
  issuer?: User;
  certificateNumber: string;
  status: 'ISSUED' | 'REVOKED';
  createdAt: string;
  updatedAt: string;
}

export interface Baptism {
  id: string;
  candidateId: number;
  candidate?: Candidate;
  eventId: number;
  event?: BaptismEvent;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BAPTIZED';
  witnessedBy?: string;
  sponsoredBy?: string;
  approvedBy?: number;
  approvedAt?: string;
  certificateNumber?: string;
  certificateSigned?: boolean;
  signedAt?: string;
  signedBy?: number;
  createdAt: string;
  updatedAt: string;
}

// Report Types
export interface ReportData {
  id: string;
  type: 'CANDIDATE' | 'MEMBERSHIP' | 'BAPTISM' | 'STUDY' | 'TRANSFER';
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: string;
  data: any;
  format: 'PDF' | 'CSV' | 'JSON';
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Union {
  id: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface ChurchField {
  id: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  unionId: number;
  unionName?: string;
}

export interface District {
  id: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  fieldId: number;
  fieldName?: string;
}

export interface Church {
  id: number;
  churchName: string;
  districtId: number;
  districtName?: string;
  fieldId?: number;
  fieldName?: string;
  unionId?: number;
  unionName?: string;
  address: string;
  phone: string;
  email: string;
  active?: boolean;
  pastor?: User;
}

export interface ChurchDetail {
  church: Church;
  elders: ElderInfo[];
  instructor: InstructorInfo | null;
  candidates: CandidateInfo[];
  progress: ProgressInfo;
}

export interface ElderInfo {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

export interface InstructorInfo {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

export interface CandidateInfo {
  id: number;
  fullName: string;
  email: string;
  status: string;
}

export interface ProgressInfo {
  totalCandidates: number;
  registered: number;
  inProgress: number;
  readyForBaptism: number;
  baptized: number;
  futureDated: number;
}

export interface FirstChurchElder {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  active?: boolean;
  churchId: number;
  churchName?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  churchId: number;
  head?: { id: number; memberName?: string; localChurch?: string };
  active: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'INSTRUCTOR_ASSIGNED'
  | 'NEW_LESSON'
  | 'BAPTISM_EVENT_AVAILABLE'
  | 'BAPTISM_REGISTERED'
  | 'BAPTISM_CERTIFICATE_READY'
  | 'CHURCH_ANNOUNCEMENT'
  | 'LESSON_REMINDER'
  | 'BAPTISM_APPROVAL'
  | 'BAPTISM_SCHEDULE'
  | 'SYSTEM'
  | 'PROGRESS_UPDATE';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: number;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  entityType?: string;
  entityId?: number;
  success: boolean;
  createdAt: string;
}

export interface KpiCards {
  totalCandidates: number;
  baptized: number;
  inProgress: number;
  registered: number;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  totalInstructors: number;
  totalChurches: number;
  thisMonthBaptisms: number;
}

// Filter Types
export interface FilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  [key: string]: any;
}