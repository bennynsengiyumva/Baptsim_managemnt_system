import api from './api';
import { Lesson, LessonAttempt, LessonDocument, LessonGrade } from '@/types';

export const lessonService = {
  getAll: () =>
    api.get<Lesson[]>('/api/lessons').then((r) => r.data),

  getById: (id: string, includeAnswers = false) =>
    api.get<Lesson>(`/api/lessons/${id}`, { params: { includeAnswers } }).then((r) => r.data),

  getByInstructor: (instructorId: string) =>
    api.get<Lesson[]>(`/api/lessons/by-instructor/${instructorId}`).then((r) => r.data),

  getByCandidate: (candidateId: string) =>
    api.get<Lesson[]>(`/api/lessons/by-candidate/${candidateId}`).then((r) => r.data),

  getProgress: (candidateId: string) =>
    api.get<number>(`/api/lessons/progress/${candidateId}`).then((r) => r.data),

  create: (formData: FormData) =>
    api.post<Lesson>('/api/lessons/create', formData).then((r) => r.data),

  updateLesson: (lessonId: string, formData: FormData) =>
    api.put<Lesson>(`/api/lessons/${lessonId}`, formData).then((r) => r.data),

  deleteLesson: (lessonId: string) =>
    api.delete(`/api/lessons/${lessonId}`),

  addQuestions: (lessonId: string, questions: any[]) =>
    api.post<Lesson>(`/api/lessons/${lessonId}/questions`, questions).then((r) => r.data),

  startAttempt: (lessonId: string, candidateId: string) =>
    api.post<LessonAttempt>(`/api/lessons/${lessonId}/start-attempt`, null, {
      params: { candidateId },
    }).then((r) => r.data),

  submitAttempt: (lessonId: string, candidateId: string, questionIds: string[], answers: string[]) =>
    api.post<LessonAttempt>(`/api/lessons/${lessonId}/submit-attempt`, {
      candidateId,
      questionIds: questionIds.map(Number),
      answers,
    }).then((r) => r.data),

  getAttempts: (lessonId: string, candidateId: string) =>
    api.get<LessonAttempt[]>(`/api/lessons/${lessonId}/attempts`, {
      params: { candidateId },
    }).then((r) => r.data),

  // DOCUMENTS
  uploadDocument: (lessonId: string, formData: FormData) =>
    api.post<LessonDocument>(`/api/lessons/${lessonId}/documents`, formData).then((r) => r.data),

  getDocuments: (lessonId: string) =>
    api.get<LessonDocument[]>(`/api/lessons/${lessonId}/documents`).then((r) => r.data),

  deleteDocument: (lessonId: string, documentId: string) =>
    api.delete(`/api/lessons/${lessonId}/documents/${documentId}`),

  // GRADES
  getGradesByInstructor: (instructorId: string) =>
    api.get<LessonGrade[]>(`/api/lessons/grades/instructor/${instructorId}`).then((r) => r.data),

  getGradesByLesson: (lessonId: string) =>
    api.get<LessonGrade[]>(`/api/lessons/${lessonId}/grades`).then((r) => r.data),

  getCandidatesByLesson: (lessonId: string) =>
    api.get<LessonGrade[]>(`/api/lessons/${lessonId}/grades`).then((r) => r.data),
};
