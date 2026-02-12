import { useState, useEffect, useCallback } from 'react';
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../utils/api';

const STATUS_CYCLE = ['To Do', 'In Progress', 'Done'];

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTask = useCallback(async (data) => {
    const optimistic = {
      id: Date.now(),
      sheetRow: null,
      task: data.task,
      project: data.project || undefined,
      category: data.category || 'General',
      status: data.status || 'To Do',
      dueDate: data.dueDate || null,
      priority: data.priority || 'Medium',
      notes: data.notes || undefined,
      topTask: data.topTask || false,
    };
    setTasks((prev) => [...prev, optimistic]);
    setSaving(true);
    setError(null);
    try {
      await createTask(data);
      await load();
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      setError('Failed to add task: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [load]);

  const editTask = useCallback(async (sheetRow, data) => {
    const prev = tasks;
    setTasks((cur) =>
      cur.map((t) => (t.sheetRow === sheetRow ? { ...t, ...data } : t))
    );
    setSaving(true);
    setError(null);
    try {
      await updateTask(sheetRow, data);
      await load();
    } catch (err) {
      setTasks(prev);
      setError('Failed to update task: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [tasks, load]);

  const changeStatus = useCallback(async (sheetRow, currentStatus) => {
    const idx = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setTasks((cur) =>
      cur.map((t) => (t.sheetRow === sheetRow ? { ...t, status: nextStatus } : t))
    );
    setSaving(true);
    setError(null);
    try {
      await updateTaskStatus(sheetRow, nextStatus);
    } catch (err) {
      setTasks((cur) =>
        cur.map((t) => (t.sheetRow === sheetRow ? { ...t, status: currentStatus } : t))
      );
      setError('Failed to update status: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  const removeTask = useCallback(async (sheetRow) => {
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.sheetRow !== sheetRow));
    setSaving(true);
    setError(null);
    try {
      await deleteTask(sheetRow);
      await load();
    } catch (err) {
      setTasks(prev);
      setError('Failed to delete task: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [tasks, load]);

  const clearError = useCallback(() => setError(null), []);

  return {
    tasks,
    loading,
    saving,
    error,
    clearError,
    refresh: load,
    addTask,
    editTask,
    changeStatus,
    removeTask,
  };
}
