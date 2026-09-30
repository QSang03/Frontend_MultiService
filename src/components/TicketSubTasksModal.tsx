'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  ListTodo,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Play,
  Check,
  Star
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export interface TicketSubTask {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  assignedTechId?: string;
  assignedTechName?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  effortRating: number;
  leadRating: number;
  status: string; // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startedAt?: string;
  completedAt?: string;
}

interface TechUser {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role?: string | number;
}

interface TicketSubTasksModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketTitle: string;
  onClose: () => void;
  onTasksUpdated?: () => void;
}

const STANDARD_TEMPLATES = [
  {
    title: 'Khảo sát hiện trường & Chẩn đoán lỗi phần cứng/mạng',
    description: 'Kiểm tra sơ bộ tình trạng vật lý, đo đạc thông số điện/tín hiệu, cô lập linh kiện hỏng.',
    estimatedMinutes: 30,
  },
  {
    title: 'Thay thế linh kiện & Thi công cấu hình kỹ thuật',
    description: 'Tháo lắp linh kiện đạt chuẩn ESD, đấu nối cáp quang/cáp mạng hoặc cài đặt firmware.',
    estimatedMinutes: 60,
  },
  {
    title: 'Kiểm thử tải & Đảm bảo tiêu chuẩn vận hành',
    description: 'Chạy stress test thiết bị, kiểm tra nhiệt độ và tính năng truyền thông liên tục trong 15 phút.',
    estimatedMinutes: 30,
  },
  {
    title: 'Vệ sinh công nghiệp, Thu dọn & Ký số nghiệm thu',
    description: 'Lau chùi khu vực thi công, hướng dẫn bàn giao thiết bị cho khách và chuẩn bị ký xác nhận.',
    estimatedMinutes: 20,
  },
];

export default function TicketSubTasksModal({
  isOpen,
  ticketId,
  ticketTitle,
  onClose,
  onTasksUpdated,
}: TicketSubTasksModalProps) {
  const [tasks, setTasks] = useState<TicketSubTask[]>([]);
  const [technicians, setTechnicians] = useState<TechUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTechId, setNewTechId] = useState('');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(30);

  // Quick edit state for actual minutes & ratings
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editActualMinutes, setEditActualMinutes] = useState<number>(0);
  const [editEffortRating, setEditEffortRating] = useState<number>(3);
  const [editLeadRating, setEditLeadRating] = useState<number>(5);

  const fetchTasks = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách sub-tasks');
      }
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const users: TechUser[] = data.users || [];
        const techs = users.filter(
          (u) => u.role === 2 || u.role === 'technician' || u.role === 'tech'
        );
        setTechnicians(techs.length > 0 ? techs : users);
      }
    } catch {
      // Non-critical if failed
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      fetchTechnicians();
    }
  }, [isOpen, fetchTasks, fetchTechnicians]);

  if (!isOpen) return null;

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề hạng mục công việc');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          assignedTechId: newTechId || undefined,
          estimatedMinutes: Number(newEstimatedMinutes) || 30,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Tạo sub-task thất bại');
      }

      toast.success('Đã thêm hạng mục công việc mới');
      setNewTitle('');
      setNewDescription('');
      setNewTechId('');
      setNewEstimatedMinutes(30);
      setIsAddingTask(false);
      fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tạo sub-task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplates = async () => {
    try {
      setIsSubmitting(true);
      for (const tpl of STANDARD_TEMPLATES) {
        await fetch(`/api/admin/tickets/${ticketId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tpl.title,
            description: tpl.description,
            estimatedMinutes: tpl.estimatedMinutes,
          }),
        });
      }
      toast.success('Đã khởi tạo 4 hạng mục tiêu chuẩn (SRS III.3)');
      fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Khởi tạo mẫu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: TicketSubTask, newStatus: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          status: newStatus,
          actualMinutes: task.actualMinutes || (newStatus === 'COMPLETED' ? task.estimatedMinutes : 0),
        }),
      });

      if (!res.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      toast.success(`Đã chuyển trạng thái sang ${newStatus}`);
      fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMetrics = async (task: TicketSubTask) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          actualMinutes: Number(editActualMinutes),
          effortRating: Number(editEffortRating),
          leadRating: Number(editLeadRating),
        }),
      });

      if (!res.ok) {
        throw new Error('Lưu thông số thất bại');
      }

      toast.success('Đã lưu thông số thời gian & đánh giá công việc');
      setEditingTaskId(null);
      fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu thông số');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hạng mục công việc này?')) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/tickets/${ticketId}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Xóa sub-task thất bại');
      }
      toast.success('Đã xóa hạng mục');
      fetchTasks();
      onTasksUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa sub-task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const percentCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalActualMinutes = tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Phân Tách Hạng Mục Kỹ Thuật (SRS III.3)
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  #{ticketId.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {ticketTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block">Tiến độ hoàn thành:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentCompleted}%` }}
                />
              </div>
              <span className="font-bold text-blue-700 font-mono">
                {completedTasks}/{totalTasks} ({percentCompleted}%)
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-500 block">Tổng thời gian dự tính:</span>
            <span className="font-bold text-gray-800 font-mono mt-1 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {totalEstimatedMinutes} phút ({Math.round(totalEstimatedMinutes / 60 * 10) / 10}h)
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Thời gian thực tế ghi nhận:</span>
            <span className="font-bold text-emerald-700 font-mono mt-1 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {totalActualMinutes} phút ({Math.round(totalActualMinutes / 60 * 10) / 10}h)
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action buttons bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                disabled={isAddingTask}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Hạng Mục Mới
              </button>
              {totalTasks === 0 && (
                <button
                  type="button"
                  onClick={handleApplyTemplates}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Khởi Tạo 4 Mẫu Chuẩn (Standard Breakdown)
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchTasks}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Inline Form to Add Sub-Task */}
          {isAddingTask && (
            <form onSubmit={handleCreateTask} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 uppercase">
                  Tạo Hạng Mục Sub-task Mới
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Tiêu Đề Hạng Mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm tra điện áp nguồn & bo mạch chính..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Mô Tả Chi Tiết / Quy Chuẩn Kỹ Thuật
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết yêu cầu kỹ thuật cần đạt..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Kỹ Thuật Viên Phụ Trách
                  </label>
                  <select
                    value={newTechId}
                    onChange={(e) => setNewTechId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chưa chỉ định (Nhận việc sau) --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || t.full_name || t.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Thời Gian Dự Tính (Phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Lưu Hạng Mục
                </button>
              </div>
            </form>
          )}

          {/* Sub-tasks List */}
          {isLoading && tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Đang tải danh sách hạng mục kỹ thuật...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl p-6">
              <ListTodo className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Ticket này chưa có hạng mục phân tách nào</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Bấm nút &quot;Khởi tạo 4 mẫu chuẩn&quot; ở trên hoặc &quot;Thêm hạng mục mới&quot; để thiết lập quy trình kiểm thử chi tiết.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, idx) => {
                const isCompleted = task.status === 'COMPLETED';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isEditing = editingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : isInProgress
                        ? 'bg-blue-50/30 border-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold ${
                                isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {task.title}
                            </h4>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isCompleted ? 'HOÀN TẤT' : isInProgress ? 'ĐANG THỰC HIỆN' : 'CHỜ XỬ LÝ'}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-gray-400" />
                              {task.assignedTechName || 'Chưa phân công'}
                            </span>

                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-blue-500" />
                              Dự tính: {task.estimatedMinutes}m
                            </span>

                            {task.actualMinutes > 0 && (
                              <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                                Thực tế: {task.actualMinutes}m
                              </span>
                            )}

                            {task.effortRating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                Effort: {task.effortRating}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(task, isInProgress ? 'COMPLETED' : 'IN_PROGRESS')
                            }
                            disabled={isSubmitting}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                              isInProgress
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title={isInProgress ? 'Đánh dấu hoàn thành' : 'Bắt đầu làm'}
                          >
                            {isInProgress ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hoàn Tất
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Bắt Đầu
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingTaskId(null);
                            } else {
                              setEditingTaskId(task.id);
                              setEditActualMinutes(task.actualMinutes || task.estimatedMinutes);
                              setEditEffortRating(task.effortRating || 3);
                              setEditLeadRating(task.leadRating || 5);
                            }
                          }}
                          className="px-2 py-1 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700"
                          title="Ghi nhận giờ thực tế & đánh giá"
                        >
                          {isEditing ? 'Đóng' : 'Đánh giá'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isSubmitting}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa hạng mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Evaluation Editor */}
                    {isEditing && (
                      <div className="mt-3 pt-3 border-t border-gray-200/70 bg-white/80 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                            Số Phút Thực Tế
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={editActualMinutes}
                            onChange={(e) => setEditActualMinutes(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                            Độ Khó (Effort 1-5)
                          </label>
                          <select
                            value={editEffortRating}
                            onChange={(e) => setEditEffortRating(parseInt(e.target.value, 10) || 3)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          >
                            <option value={1}>1 - Rất dễ / Tiêu chuẩn</option>
                            <option value={2}>2 - Trung bình</option>
                            <option value={3}>3 - Yêu cầu kỹ năng tốt</option>
                            <option value={4}>4 - Khó / Cần cô lập lỗi sâu</option>
                            <option value={5}>5 - Rất khó / Khẩn cấp</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                            Lead Đánh Giá (1-5)
                          </label>
                          <select
                            value={editLeadRating}
                            onChange={(e) => setEditLeadRating(parseInt(e.target.value, 10) || 5)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          >
                            <option value={5}>5★ - Xuất sắc</option>
                            <option value={4}>4★ - Tốt</option>
                            <option value={3}>3★ - Đạt yêu cầu</option>
                            <option value={2}>2★ - Cần cải thiện</option>
                            <option value={1}>1★ - Chưa đạt chuẩn</option>
                          </select>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveMetrics(task)}
                            disabled={isSubmitting}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
                          >
                            Lưu Đánh Giá
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Dữ liệu Sub-tasks đồng bộ với hệ thống Team Split 24h Review (SRS III.4).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
