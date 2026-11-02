import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { taskService } from "../services/taskService";
import type { CreateTaskPayload, Task, TaskPriority, TaskStatus, UpdateTaskPayload } from "../types/task";
import { getApiErrorMessage } from "../utils/apiError";
import { matchesTaskFilters, sortTasksByPriorityAndDate } from "../utils/taskUtils";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "ALL">("ALL");

  // Mirror of `tasks` so async callbacks can read the latest list (e.g. for rollback).
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    let isCancelled = false;

    taskService
      .getTasks()
      .then((loadedTasks) => {
        if (!isCancelled) {
          setTasks(sortTasksByPriorityAndDate(loadedTasks));
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setErrorMessage(getApiErrorMessage(error));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [reloadToken]);

  const loadTasks = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadToken((currentToken) => currentToken + 1);
  }, []);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesTaskFilters(task, searchTerm, selectedPriority)),
    [tasks, searchTerm, selectedPriority]
  );

  const replaceTask = useCallback((updatedTask: Task) => {
    setTasks((currentTasks) =>
      sortTasksByPriorityAndDate(currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    );
  }, []);

  const createTask = useCallback(async (payload: CreateTaskPayload) => {
    try {
      const createdTask = await taskService.createTask(payload);
      setTasks((currentTasks) => sortTasksByPriorityAndDate([createdTask, ...currentTasks]));
      toast.success("Tarefa criada com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }, []);

  const updateTask = useCallback(
    async (taskId: string, payload: UpdateTaskPayload) => {
      try {
        const updatedTask = await taskService.updateTask(taskId, payload);
        replaceTask(updatedTask);
        toast.success("Tarefa atualizada com sucesso.");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
    [replaceTask]
  );

  /**
   * Optimistic update: the card moves immediately and is rolled back if the API fails,
   * so drag and drop feels instant without hiding errors from the user.
   */
  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const previousTask = tasksRef.current.find((task) => task.id === taskId);
      if (!previousTask || previousTask.status === status) {
        return;
      }

      replaceTask({ ...previousTask, status });

      try {
        const updatedTask = await taskService.updateTaskStatus(taskId, status);
        replaceTask(updatedTask);
      } catch (error) {
        replaceTask(previousTask);
        toast.error(getApiErrorMessage(error));
      }
    },
    [replaceTask]
  );

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      toast.success("Tarefa excluída com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }, []);

  return {
    tasks,
    filteredTasks,
    isLoading,
    errorMessage,
    searchTerm,
    selectedPriority,
    setSearchTerm,
    setSelectedPriority,
    loadTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
  };
};
