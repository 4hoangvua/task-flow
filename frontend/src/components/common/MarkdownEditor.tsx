import React, { useState, useRef, useEffect } from 'react';
import { Button, Space, Segmented, Tooltip, Input, Modal, message, Spin, Card } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  RobotOutlined,
  EyeOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { callGeminiAPI } from '../../utils/gemini';

interface MarkdownEditorProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  taskTitle?: string; // Optional: to let AI generate description based on task title
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập mô tả chi tiết (Hỗ trợ Markdown)...',
  taskTitle = '',
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showCommands, setShowCommands] = useState(false);
  const [slashIndex, setSlashIndex] = useState(-1);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea helper
  const focusEditor = () => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Insert markdown at cursor position
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selection = text.substring(start, end);
    const replacement = before + (selection || '') + after;

    const newValue = text.substring(0, start) + replacement + text.substring(end);

    if (onChange) {
      onChange(newValue);
    }

    focusEditor();

    // Set selection after insert
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + before.length + selection.length + after.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  };

  // Keyboard shortcut or slash commands listener
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const text = textarea.value;

    // Check if the character just typed is "/"
    if (e.key === '/') {
      setShowCommands(true);
      setSlashIndex(cursor - 1);
    } else if (e.key === 'Escape' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Allow escape to close menu
      if (e.key === 'Escape') {
        setShowCommands(false);
      }
    } else {
      // If we backspace past the slash, hide menu
      if (showCommands && (cursor <= slashIndex || text[slashIndex] !== '/')) {
        setShowCommands(false);
      }
    }
  };

  const handleCommandSelect = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea || slashIndex === -1) return;

    const text = textarea.value;
    // Replace the "/" with our syntax
    const newValue = text.substring(0, slashIndex) + syntax + text.substring(textarea.selectionStart);

    if (onChange) {
      onChange(newValue);
    }

    setShowCommands(false);
    focusEditor();

    // Position cursor after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = slashIndex + syntax.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  };

  // AI Content Generator via Gemini
  const handleAiGenerate = async () => {
    setIsAiLoading(true);
    try {
      // Construct a specific markdown generation prompt
      const promptText = aiPrompt.trim()
        ? `Hãy viết một mô tả công việc (task description) chi tiết, có cấu trúc bằng ngôn ngữ Markdown dựa trên yêu cầu sau: "${aiPrompt.trim()}". Viết bằng tiếng Việt.`
        : `Hãy viết một mô tả công việc (task description) chi tiết, chuyên nghiệp và có cấu trúc đẹp mắt bằng ngôn ngữ Markdown cho công việc có tiêu đề sau: "${taskTitle || 'Nhiệm vụ mới'}".
Mô tả nên được định dạng Markdown sạch đẹp, có cấu trúc rõ ràng:
- 🎯 **Mục tiêu**: Nêu mục tiêu chính của công việc này.
- 📋 **Các bước thực hiện**: Liệt kê chi tiết các công việc cần làm dưới dạng danh sách checklist Markdown (- [ ]).
- 🧪 **Yêu cầu nghiệm thu**: Các kết quả mong đợi hoặc phương án kiểm thử.
Viết bằng tiếng Việt, ngắn gọn, súc tích. Không viết bất kỳ lời dẫn nào bên ngoài nội dung Markdown.`;

      const apiKey = localStorage.getItem('gemini_api_key');

      if (!apiKey) {
        throw new Error('Vui lòng cấu hình Gemini API Key cá nhân trong trang Cài đặt để sử dụng trợ lý AI.');
      }

      const generatedMarkdown = await callGeminiAPI(apiKey, [
        { role: 'user', parts: [{ text: promptText }] },
      ]);

      if (onChange) {
        // Clean markdown block wrappers if model outputs markdown block backticks
        let cleanedText = generatedMarkdown.trim();
        if (cleanedText.startsWith('```markdown')) {
          cleanedText = cleanedText.replace(/^```markdown\n/, '').replace(/\n```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        onChange(cleanedText);
      }

      message.success('AI soạn thảo mô tả thành công!');
      setIsAiModalOpen(false);
      setAiPrompt('');
      setMode('edit');
    } catch (error: any) {
      console.error('AI Error:', error);
      message.error(error.message || 'Lỗi khi gọi trợ lý AI. Vui lòng thử lại.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const commands = [
    { name: 'Tiêu đề lớn (H1)', syntax: '# ', desc: 'Gõ: # ' },
    { name: 'Tiêu đề vừa (H2)', syntax: '## ', desc: 'Gõ: ## ' },
    { name: 'Tiêu đề nhỏ (H3)', syntax: '### ', desc: 'Gõ: ### ' },
    { name: 'Chữ in đậm', syntax: '**chữ_đậm**', desc: 'Gõ: **' },
    { name: 'Chữ in nghiêng', syntax: '*chữ_nghiêng*', desc: 'Gõ: *' },
    { name: 'Danh sách gạch đầu dòng', syntax: '- ', desc: 'Gõ: - ' },
    { name: 'Hộp kiểm (Checklist)', syntax: '- [ ] ', desc: 'Gõ: - [ ] ' },
    { name: 'Khối mã nguồn (Code block)', syntax: '```\n\n```', desc: 'Gõ: ```' },
  ];

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg)] flex flex-col min-h-64 relative">
      {/* Toolbar / Mode switcher header */}
      <div className="bg-[var(--bg)] border-b border-[var(--border)] px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Space size={4} wrap className="w-full sm:w-auto">
          <Segmented
            value={mode}
            onChange={(val) => setMode(val as 'edit' | 'preview')}
            options={[
              { value: 'edit', label: 'Soạn thảo', icon: <EditOutlined /> },
              { value: 'preview', label: 'Xem trước', icon: <EyeOutlined /> },
            ]}
            size="small"
          />

          {mode === 'edit' && (
            <div className="flex flex-wrap items-center gap-0.5">
              <div className="w-[1px] h-4 bg-[var(--border)] mx-1 hidden sm:block" />
              <Tooltip title="In đậm">
                <Button size="small" type="text" icon={<BoldOutlined />} onClick={() => insertText('**', '**')} />
              </Tooltip>
              <Tooltip title="In nghiêng">
                <Button size="small" type="text" icon={<ItalicOutlined />} onClick={() => insertText('*', '*')} />
              </Tooltip>
              <Tooltip title="Chèn liên kết">
                <Button size="small" type="text" icon={<LinkOutlined />} onClick={() => insertText('[Tên liên kết](', ')')} />
              </Tooltip>
              <Tooltip title="Danh sách">
                <Button size="small" type="text" icon={<UnorderedListOutlined />} onClick={() => insertText('- ')} />
              </Tooltip>
              <Tooltip title="Checklist">
                <Button size="small" type="text" icon={<CheckSquareOutlined />} onClick={() => insertText('- [ ] ')} />
              </Tooltip>
              <Tooltip title="Khối mã nguồn">
                <Button size="small" type="text" icon={<CodeOutlined />} onClick={() => insertText('```\n', '\n```')} />
              </Tooltip>
              <Tooltip title="Tiêu đề 1">
                <Button size="small" type="text" className="font-bold text-[11px]" onClick={() => insertText('# ')}>H1</Button>
              </Tooltip>
              <Tooltip title="Tiêu đề 2">
                <Button size="small" type="text" className="font-bold text-[11px]" onClick={() => insertText('## ')}>H2</Button>
              </Tooltip>
            </div>
          )}
        </Space>

        <Button
          size="small"
          type="primary"
          ghost
          icon={isAiLoading ? <Spin size="small" /> : <RobotOutlined className="text-sky-500 animate-pulse" />}
          onClick={() => {
            const userKey = localStorage.getItem('gemini_api_key');
            if (!userKey) {
              message.error('Vui lòng cấu hình Gemini API Key cá nhân trong trang Cài đặt để sử dụng trợ lý AI.');
              return;
            }
            setAiPrompt('');
            setIsAiModalOpen(true);
          }}
          disabled={isAiLoading}
          className="border-sky-500/30 hover:border-sky-500 text-sky-600 dark:text-sky-400 font-semibold w-full sm:w-auto"
        >
          Trợ lý AI Soạn thảo
        </Button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col p-2 relative min-h-48">
        {mode === 'edit' ? (
          <>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              onKeyUp={handleKeyUp}
              placeholder={placeholder}
              className="w-full flex-1 p-2 bg-transparent text-[var(--text)] outline-none border-0 resize-y min-h-[160px] text-sm leading-relaxed font-sans placeholder-slate-400 focus:ring-0"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />

            {/* Slash commands popover menu */}
            {showCommands && (
              <Card
                size="small"
                className="absolute z-50 left-4 top-10 w-64 shadow-lg border border-[var(--border)] max-h-56 overflow-y-auto bg-[var(--bg)]"
                styles={{ body: { padding: '4px' } }}
              >
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] px-2.5 py-1 border-b border-[var(--border)] flex items-center gap-1 select-none">
                  <InfoCircleOutlined /> LỆNH SOẠN THẢO NHANH
                </div>
                <div className="py-1">
                  {commands.map((cmd) => (
                    <button
                      key={cmd.name}
                      onClick={() => handleCommandSelect(cmd.syntax)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-[var(--bg)]/80 text-left text-xs text-[var(--text)] transition-colors rounded-md"
                    >
                      <span className="font-medium">{cmd.name}</span>
                      <span className="text-[var(--text-tertiary)] font-mono text-[10px]">{cmd.desc}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <div className="w-full p-4 overflow-y-auto bg-[var(--bg)]/30 rounded-lg min-h-[160px] border border-[var(--border)]/50">
            <MarkdownRenderer content={value} />
          </div>
        )}
      </div>

      {/* AI Prompter Modal */}
      <Modal
        title={
          <span className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-2">
            🤖 Trợ lý AI Soạn thảo (Gemini 1.5 Flash)
          </span>
        }
        open={isAiModalOpen}
        onCancel={() => !isAiLoading && setIsAiModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsAiModalOpen(false)} disabled={isAiLoading}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isAiLoading}
            onClick={handleAiGenerate}
            className="bg-sky-600 hover:bg-sky-500 font-semibold"
          >
            Bắt đầu tạo
          </Button>,
        ]}
      >
        <div className="space-y-3 mt-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Nhập yêu cầu chi tiết hoặc các chỉ thị soạn thảo bên dưới. Nếu để trống, AI sẽ tự động tạo một mô tả chuyên nghiệp đầy đủ cấu trúc mục tiêu, checklist công việc và tiêu chí nghiệm thu dựa trên tiêu đề:
            <strong className="text-[var(--text)] block mt-1">"{taskTitle || 'Chưa nhập tiêu đề'}"</strong>
          </p>
          <Input.TextArea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ví dụ: Mô tả chi tiết việc xây dựng form đăng nhập có các nút Google, Facebook và validate email đúng định dạng..."
            disabled={isAiLoading}
            className="rounded-lg text-sm"
          />
        </div>
      </Modal>
    </div>
  );
};

export default MarkdownEditor;
