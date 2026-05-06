import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { taskService } from "../services/taskService";
import type { CreateTaskPayload, Task, TaskPriority, TaskStatus, UpdateTaskPayload } from "../types/task";
import { matchesTaskFilters, sortTasksByPriorityAndDate } from "../utils/taskUtils";

const genericErrorMessage = "Não foi possível concluir a ação. Tente novamente.";

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.error?.message;

    if (typeof apiMessage === "string" && apiMessage.length > 0) {
      return apiMessage;
    }
  }

  return genericErrorMessage;
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "ALL">("ALL");

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedTasks = await taskService.getTasks();
      setTasks(sortTasksByPriorityAndDate(loadedTasks));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesTaskFilters(task, searchTerm, selectedPriority)),
    [tasks, searchTerm, selectedPriority]
  );

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

  const updateTask = useCallback(async (taskId: string, payload: UpdateTaskPayload) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, payload);
      setTasks((currentTasks) =>
        sortTasksByPriorityAndDate(currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      );
      toast.success("Tarefa atualizada com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, status);
      setTasks((currentTasks) =>
        sortTasksByPriorityAndDate(currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  }, []);

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
