import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProblems,
  getStats,
  createProblem,
  updateProblem,
  deleteProblem,
  addRevisionNote,
  deleteRevisionNote,
  getTopics,
  createTopic,
  deleteTopic,
  triggerReminders,
} from '../lib/api';

export function useProblems(filters = {}) {
  return useQuery({
    queryKey: ['problems', filters],
    queryFn: () => getProblems(filters),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProblem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProblem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProblem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useTriggerReminders() {
  return useMutation({
    mutationFn: triggerReminders,
  });
}

export function useAddRevisionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ problemId, note }) => addRevisionNote(problemId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteRevisionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ problemId, noteId }) => deleteRevisionNote(problemId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}
