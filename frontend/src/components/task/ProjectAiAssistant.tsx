import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Spin, Avatar, Empty, List, Divider } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  UserOutlined,
  ForkOutlined,
  BulbOutlined,
  SettingOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { message } from '../../utils/antd';
import { callGeminiAPI } from '../../utils/gemini';
import type { Project, ProjectMember, Task } from '../../types';

interface ProjectAiAssistantProps {
  projectId: string;
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  onTaskClick?: (taskId: string) => void;
  onTabClick?: (tabKey: string) => void;
  onProjectClick?: (projectId: string) => void;
  onActionClick?: (actionKey: string) => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: Date;
}

export const ProjectAiAssistant: React.FC<ProjectAiAssistantProps> = ({
  projectId,
  project,
  tasks,
  members,
  onTaskClick,
  onTabClick,
  onProjectClick,
  onActionClick,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API Key and conversation history from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    setApiKey(savedKey);

    const savedHistory = localStorage.getItem(`taskflow_ai_history_${projectId}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const mapped = parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
        setMessages(mapped);
      } catch (err) {
        // Silent fail or clear history if corrupted
        localStorage.removeItem(`taskflow_ai_history_${projectId}`);
      }
    } else {
      // Set a default welcoming message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'model',
        text: `Xin chào! Tôi là **Trợ lý Dự án AI** của bạn. 🤖\n\nTôi có thể giúp bạn phân tích thông tin dự án **${project.name}**, theo dõi tiến độ, tìm ra các rủi ro (blockers, task trễ hạn) hoặc phân tích sự phân công công việc của các thành viên.\n\nHãy thử chọn một **Hành động nhanh** bên cạnh hoặc nhập câu hỏi trực tiếp vào khung chat bên dưới!`,
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [projectId, project.name]);

  // Save history to localStorage whenever messages change
  const saveHistory = (newMessages: ChatMessage[]) => {
    localStorage.setItem(`taskflow_ai_history_${projectId}`, JSON.stringify(newMessages));
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!apiKey) {
    return (
      <Card
        className="shadow-sm border border-[var(--border)]"
        title={
          <span className="font-bold text-sm text-[var(--text-h)] flex items-center gap-2">
            <RobotOutlined className="text-sky-500 animate-pulse" /> Trợ lý AI chưa được cấu hình
          </span>
        }
      >
        <div className="py-6 max-w-xl">
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            Để sử dụng tính năng **Trợ lý Dự án AI**, bạn cần cung cấp một **Gemini API Key cá nhân (BYOK)**. Khóa này sẽ được lưu trữ an toàn trong trình duyệt của bạn (localStorage) và chỉ gửi trực tiếp từ máy của bạn tới Google API Studio.
          </p>
          <div className="bg-[var(--bg)]/50 border border-[var(--border)] p-4 rounded-xl mb-6">
            <h4 className="text-xs font-bold text-[var(--text-h)] uppercase tracking-wider mb-2">💡 Hướng dẫn nhanh:</h4>
            <ol className="list-decimal pl-5 text-xs text-[var(--text-secondary)] space-y-2">
              <li>Đăng ký và lấy API Key miễn phí tại <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline font-bold">Google AI Studio</a>.</li>
              <li>Đi tới trang <strong>Cấu hình tài khoản</strong> của bạn trong hệ thống.</li>
              <li>Dán khóa của bạn vào phần <strong>Cấu hình trợ lý AI cá nhân</strong> và lưu lại.</li>
            </ol>
          </div>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => {
              // Direct navigation to settings by firing an activeTab change or routing
              // Since we are in ProjectDetail tab, let's suggest navigating
              message.info('Hãy click vào mục "Cài đặt" trên thanh Sidebar điều hướng để cấu hình key nhé!');
            }}
            className="font-semibold"
          >
            Đi tới cấu hình tài khoản
          </Button>
        </div>
      </Card>
    );
  }

  // Helper to compile project context to text prompt
  const buildProjectContext = () => {
    const memberText = members
      .map((m) => `- ${m.user?.name || 'N/A'} (Email: ${m.user?.email || 'N/A'}, Vai trò: ${m.role})`)
      .join('\n');

    const formatStatus = (s: string) => {
      if (s === 'TODO') return 'Cần làm (TODO)';
      if (s === 'IN_PROGRESS') return 'Đang làm (IN_PROGRESS)';
      if (s === 'REVIEW') return 'Chờ đánh giá (REVIEW)';
      if (s === 'DONE') return 'Hoàn thành (DONE)';
      return s;
    };

    const formatPriority = (p: string) => {
      if (p === 'LOW') return 'Thấp (LOW)';
      if (p === 'MEDIUM') return 'Trung bình (MEDIUM)';
      if (p === 'HIGH') return 'Cao (HIGH)';
      if (p === 'URGENT') return 'Khẩn cấp (URGENT)';
      return p;
    };

    const taskText = tasks
      .map((t) => {
        const assignee = t.assignee?.name ? `${t.assignee.name} (${t.assignee.email})` : 'Chưa giao';
        const start = t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Chưa đặt';
        const end = t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt';
        const deps = t.dependencies && t.dependencies.length > 0 
          ? t.dependencies.map((d) => `"${d.dependsOn.title}" (${formatStatus(d.dependsOn.status)})`).join(', ')
          : 'Không có';
        
        return `### Công việc: ${t.title}
- ID: ${t.id}
- Trạng thái: ${formatStatus(t.status)}
- Độ ưu tiên: ${formatPriority(t.priority)}
- Người thực hiện: ${assignee}
- Ngày bắt đầu: ${start}
- Hạn chót: ${end}
- Công việc cần làm trước: ${deps}
- Mô tả: ${t.description || 'Không có mô tả'}`;
      })
      .join('\n\n');

    return `Dưới đây là thông tin chi tiết về dự án đang quản lý:
DỰ ÁN:
- Tên dự án: ${project.name}
- Mô tả dự án: ${project.description || 'Không có'}
- Trạng thái dự án: ${project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}

DANH SÁCH THÀNH VIÊN:
${memberText || 'Không có thành viên nào khác'}

DANH SÁCH CÔNG VIỆC CỦA DỰ ÁN:
${taskText || 'Chưa có công việc nào được tạo'}

Hôm nay là ngày 30/05/2026.
Yêu cầu:
- Bạn là một trợ lý quản lý dự án AI (AI Project Manager Assistant) chuyên nghiệp của hệ thống TaskFlow.
- Bạn sẽ nhận câu hỏi hoặc lệnh phân tích từ người dùng và phản hồi dựa trên ngữ cảnh dự án đã được cung cấp ở trên.
- Nếu người dùng hỏi các câu hỏi không liên quan đến dự án này hoặc ngoài lĩnh vực quản trị dự án, hãy khéo léo nhắc nhở họ nhưng vẫn trả lời thân thiện.
- Các phản hồi của bạn bắt buộc phải dùng Tiếng Việt và được định dạng chuẩn bằng Markdown đẹp mắt (bảng biểu, in đậm, danh sách gạch đầu dòng...).
- Hãy phân tích sâu sắc, tìm lỗi, đưa ra giải pháp giải quyết rủi ro thực tế chứ không chỉ lặp lại thông tin thô.
- ĐIỀU HƯỚNG & HÀNH ĐỘNG TRỰC QUAN:
  1. BẮT BUỘC: Khi đề cập đến một công việc/nhiệm vụ cụ thể có trong dự án, bạn BẮT BUỘC phải viết nó dưới dạng link: \`[Tên công việc](task:taskId)\`. Ví dụ: \`[API Security Protocol Review](task:ec0bb3fd-a9a7-45ce-8dae-13aaddc13d12)\`. Người dùng có thể click vào link này để mở trực tiếp hộp thoại chi tiết công việc.
  2. BẮT BUỘC: Khi gợi ý hoặc hướng dẫn người dùng sử dụng các phân hệ của dự án, bạn BẮT BUỘC phải viết dưới dạng link: \`[Tên phân hệ/tab](tab:tabKey)\`. Ví dụ: \`[Bảng công việc Kanban](tab:board)\` hoặc \`[Lịch biểu Gantt](tab:timeline)\`.
     Các tabKey hợp lệ bao gồm:
     * \`overview\` (Tổng quan)
     * \`board\` (Bảng công việc Kanban)
     * \`calendar\` (Lịch công việc)
     * \`timeline\` (Lịch biểu Gantt Chart)
     * \`members\` (Danh sách thành viên)
     * \`activity\` (Nhật ký hoạt động)
     * \`charter\` (Quy tắc nhóm)
     * \`settings\` (Cấu hình dự án)
  3. BẮT BUỘC: Khi đề cập đến việc chuyển sang dự án khác hoặc xem danh sách dự án, bạn BẮT BUỘC phải viết dưới dạng link: \`[Tên hành động/Dự án](project:projectId)\` (với projectId là ID dự án cụ thể hoặc \`list\` để quay lại danh sách dự án). Ví dụ: \`[Danh sách dự án](project:list)\` hoặc \`[Dự án Marketing](project:project-uuid-123)\`.
  4. BẮT BUỘC: Khi gợi ý người dùng thực hiện một hành động cụ thể trên giao diện dự án, bạn BẮT BUỘC phải viết dưới dạng link: \`[Tên nút hành động](action:actionKey)\`.
     Các actionKey hợp lệ bao gồm:
     * \`create-task\` (Mở hộp thoại tạo nhiệm vụ mới)
     * \`export-csv\` (Tự động tải xuống tệp báo cáo công việc CSV của dự án)
     * \`invite-member\` (Chuyển sang phân hệ Thành viên)
     * \`manage-labels\` (Chuyển sang phân hệ Cấu hình dự án để quản lý nhãn công việc)
- BẠN CÓ QUYỀN ĐIỀU PHỐI VÀ CẤU HÌNH: Bạn có toàn bộ quyền kiểm soát và điều phối giao diện trang dự án thông qua việc chủ động đề xuất người dùng nhấp vào các liên kết hành động và điều hướng trực quan này.
- PHẢN HỒI NGẮN GỌN & SÚC TÍCH: Hãy viết phản hồi ngắn gọn, súc tích (dưới 3-4 đoạn văn ngắn hoặc dùng gạch đầu dòng/bảng biểu), đi thẳng vào giải pháp thực tế, thể hiện sự am hiểu sâu sắc về quản lý dự án và tránh viết dài dòng lê thê.`;
  };

  const handleSend = async (queryText: string, userDisplayLabel?: string) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    const userMsgText = userDisplayLabel || queryText;
    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: userMsgText,
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputValue('');

    try {
      const context = buildProjectContext();
      const historyContents = updatedMessages.map((msg) => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.text }],
      }));
      
      const answer = await callGeminiAPI(apiKey, historyContents, context);

      if (!answer) {
        throw new Error('Mô hình không trả về phản hồi hợp lệ.');
      }

      const newModelMessage: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: answer,
        createdAt: new Date(),
      };

      const finalMessages = [...updatedMessages, newModelMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err: any) {
      message.error(err.message || 'Lỗi kết nối API.');
      // Remove last user message from screen if failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(`taskflow_ai_history_${projectId}`);
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'model',
      text: `Đã xóa lịch sử trò chuyện.\n\nTôi là **Trợ lý Dự án AI** của bạn. Tôi có thể giúp bạn tổng hợp tiến độ dự án, phân tích rủi ro/blocker, và tối ưu phân bổ công việc.`,
      createdAt: new Date(),
    };
    setMessages([welcomeMessage]);
    message.success('Đã xóa lịch sử trò chuyện thành công!');
  };

  const quickActions = [
    {
      label: 'Tóm tắt dự án',
      icon: <InfoCircleOutlined className="text-sky-500" />,
      prompt: 'Hãy phân tích và viết một báo cáo tóm tắt tiến độ dự án hiện tại dưới dạng Markdown. Bao gồm: tổng số công việc, số lượng công việc theo từng cột trạng thái, tỉ lệ hoàn thành, và nhận xét ngắn gọn về tiến độ hiện tại.',
      displayLabel: '📊 Tóm tắt tiến độ dự án',
    },
    {
      label: 'Phân tích rủi ro & Blockers',
      icon: <WarningOutlined className="text-rose-500" />,
      prompt: 'Hãy phân tích các rủi ro của dự án. Xác định xem có công việc nào đang quá hạn (deadline trong quá khứ so với hôm nay 30/05/2026 và chưa hoàn thành) hoặc công việc nào đang bị cản trở (blocked) bởi các công việc phụ thuộc (dependencies) chưa hoàn thành. Trình bày rõ ràng các nút thắt cổ chai và đề xuất phương án giải quyết dưới dạng Markdown.',
      displayLabel: '⚠️ Phân tích rủi ro & Blockers',
    },
    {
      label: 'Tối ưu phân bổ công việc',
      icon: <UserOutlined className="text-emerald-500" />,
      prompt: 'Hãy phân tích mức độ phân chia công việc (workload distribution) giữa các thành viên. Xem ai đang chịu trách nhiệm nhiều nhất, ai đang rảnh, và đưa ra gợi ý điều phối lại nhân lực để tối ưu hóa tiến độ hoàn thành dự án.',
      displayLabel: '👥 Tối ưu phân bổ công việc',
    },
  ];

  return (
    <div className="flex flex-col border border-[var(--border)] rounded-xl bg-[var(--bg-card)] overflow-hidden h-full w-full animate-in fade-in duration-300">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={onClose}
                size="small"
                className="hover:bg-[var(--border)]/30 hover:text-[var(--text-h)] transition-colors flex items-center justify-center p-1 rounded-full cursor-pointer"
              />
            )}
            <Avatar icon={<RobotOutlined />} className="bg-[var(--accent)] animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-[var(--text-h)] leading-none">Trợ lý Dự án AI</h3>
              <span className="text-[10px] text-[var(--text-tertiary)] font-semibold mt-1 inline-block">Mô hình hoạt động: Gemini 1.5 Flash</span>
            </div>
          </div>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={handleClearHistory}
            disabled={isLoading || messages.length <= 1}
            size="small"
            className="text-xs font-semibold py-1 flex items-center justify-center gap-1 cursor-pointer"
            title="Xóa lịch sử chat"
          >
            <span className="hidden sm:inline">Xóa chat</span>
          </Button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[var(--bg)]/5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className="hidden md:block shrink-0">
                  <Avatar
                    icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                    className={isUser ? 'bg-[var(--accent)]' : 'bg-slate-700'}
                  />
                </div>
                <div className="space-y-1">
                  <div
                    className={`px-4 py-2.5 rounded-lg text-sm border shadow-sm ${
                      isUser
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] rounded-tr-none'
                        : 'bg-[var(--bg)]/60 text-[var(--text)] border-[var(--border)] rounded-tl-none markdown-chat-bubble'
                    }`}
                  >
                    {isUser ? (
                      <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                    ) : (
                      <MarkdownRenderer
                        content={msg.text}
                        onTaskClick={onTaskClick}
                        onTabClick={onTabClick}
                        onProjectClick={onProjectClick}
                        onActionClick={onActionClick}
                      />
                    )}
                  </div>
                  <div className={`text-[10px] text-[var(--text-tertiary)] font-semibold ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-3 max-w-[95%] md:max-w-[85%] mr-auto">
              <Avatar icon={<RobotOutlined />} className="hidden md:block bg-slate-700 animate-bounce" />
              <div className="bg-[var(--bg)]/60 border border-[var(--border)] px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
                <Spin size="small" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Trợ lý AI đang phân tích dữ liệu...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 border-t border-[var(--border)] shrink-0 scrollbar-none bg-[var(--bg)]/10">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              type="dashed"
              icon={action.icon}
              onClick={() => handleSend(action.prompt, action.displayLabel)}
              disabled={isLoading}
              size="small"
              className="rounded-full shrink-0 font-semibold text-[10px] border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer px-2.5 py-1 flex items-center justify-center gap-1.5"
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* Chat Input Area */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)]/10 shrink-0">
          <div className="flex gap-2">
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(inputValue);
                }
              }}
              placeholder="Hỏi trợ lý về tiến độ, blockers, hoặc phân bổ công việc trong dự án..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={isLoading}
              className="flex-1 rounded-lg border-[var(--border)] text-sm py-1.5 focus:border-[var(--accent)]"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="h-auto px-4 rounded-lg font-semibold shrink-0"
            />
          </div>
        </div>
    </div>
  );
};

export default ProjectAiAssistant;
