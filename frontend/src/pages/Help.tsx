import React, { useState, useMemo } from 'react';
import { Input, Collapse, Table, Tag, Card, Button, Tooltip } from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  UserOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  RocketOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Panel } = Collapse;

interface HelpSection {
  id: string;
  category: string;
  title: string;
  content: React.ReactNode;
  keywords: string[];
}

export const Help: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('intro');
  const [searchText, setSearchText] = useState<string>('');

  const categories = [
    { id: 'intro', label: 'Giới thiệu', icon: <InfoCircleOutlined /> },
    { id: 'quickstart', label: 'Bắt đầu nhanh', icon: <RocketOutlined /> },
    { id: 'rbac', label: 'Vai trò & Phân quyền', icon: <UserOutlined /> },
    { id: 'projects', label: 'Quản lý Dự án', icon: <ProjectOutlined /> },
    { id: 'kanban', label: 'Bảng Kanban & Việc phụ thuộc', icon: <CheckSquareOutlined /> },
    { id: 'collab', label: 'Bình luận & Nhật ký', icon: <MessageOutlined /> },
    { id: 'stats', label: 'Thống kê & Báo cáo', icon: <PieChartOutlined /> },
    { id: 'faq', label: 'Câu hỏi thường gặp', icon: <QuestionCircleOutlined /> },
  ];

  // privilege matrix columns
  const rbacColumns = [
    {
      title: 'Hành động / Quyền hạn',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => <span className="font-medium text-[var(--text-h)]">{text}</span>,
    },
    {
      title: 'Quản trị viên (Admin)',
      dataIndex: 'admin',
      key: 'admin',
      align: 'center' as const,
      render: (val: boolean) => val ? <CheckOutlined className="text-emerald-500 text-lg font-bold" /> : <CloseOutlined className="text-rose-500 text-lg" />,
    },
    {
      title: 'Trưởng nhóm (Leader)',
      dataIndex: 'leader',
      key: 'leader',
      align: 'center' as const,
      render: (val: boolean) => val ? <CheckOutlined className="text-emerald-500 text-lg font-bold" /> : <CloseOutlined className="text-rose-500 text-lg" />,
    },
    {
      title: 'Thành viên (Member)',
      dataIndex: 'member',
      key: 'member',
      align: 'center' as const,
      render: (val: boolean | string) => {
        if (typeof val === 'string') {
          return <span className="text-xs text-[var(--text-secondary)] font-medium italic bg-[var(--bg)] px-2 py-1 rounded">{val}</span>;
        }
        return val ? <CheckOutlined className="text-emerald-500 text-lg font-bold" /> : <CloseOutlined className="text-rose-500 text-lg" />;
      },
    },
  ];

  const rbacData = [
    { key: '1', action: 'Đăng nhập & Sử dụng hệ thống', admin: true, leader: true, member: true },
    { key: '2', action: 'Tạo Dự án mới', admin: true, leader: true, member: 'Dự án cá nhân' },
    { key: '3', action: 'Sửa / Xóa Dự án', admin: true, leader: true, member: false },
    { key: '4', action: 'Thêm / Xóa Thành viên dự án', admin: true, leader: true, member: false },
    { key: '5', action: 'Thay đổi Vai trò thành viên', admin: true, leader: true, member: false },
    { key: '6', action: 'Tạo / Sửa / Xóa Công việc (Task)', admin: true, leader: true, member: false },
    { key: '7', action: 'Cập nhật Trạng thái Công việc được giao', admin: true, leader: true, member: true },
    { key: '8', action: 'Kéo thả thứ tự Công việc (Kanban)', admin: true, leader: true, member: true },
    { key: '9', action: 'Bình luận / Phản hồi bình luận', admin: true, leader: true, member: true },
    { key: '10', action: 'Xóa bình luận của bản thân', admin: true, leader: true, member: true },
    { key: '11', action: 'Xóa bình luận của người khác', admin: true, leader: true, member: false },
    { key: '12', action: 'Xuất dữ liệu dự án ra CSV', admin: true, leader: true, member: false },
    { key: '13', action: 'Xem biểu đồ thống kê dự án', admin: true, leader: true, member: 'Chỉ số cá nhân' },
  ];

  const sections: HelpSection[] = useMemo(() => [
    {
      id: 'intro-detail',
      category: 'intro',
      title: 'Giới thiệu về TaskFlow',
      keywords: ['giới thiệu', 'taskflow', 'là gì', 'tính năng', 'quy trình'],
      content: (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong>TaskFlow</strong> là hệ thống quản lý công việc và cộng tác đội nhóm thời gian thực (real-time). 
            Được xây dựng với mục tiêu tối ưu hóa quy trình làm việc, loại bỏ các thủ tục phức tạp và nâng cao hiệu suất cộng tác.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card size="small" className="notebook-card" title={<span className="text-sm font-semibold"><CheckSquareOutlined className="text-indigo-500 mr-2" /> Trực quan hóa Kanban</span>}>
              <p className="text-xs text-[var(--text-secondary)]">Quản lý trạng thái công việc từ TODO, IN_PROGRESS, REVIEW đến DONE thông qua bảng kéo thả trực quan và đồng bộ tức thời qua Socket.io.</p>
            </Card>
            <Card size="small" className="notebook-card" title={<span className="text-sm font-semibold"><UserOutlined className="text-indigo-500 mr-2" /> Bảo mật & Phân quyền</span>}>
              <p className="text-xs text-[var(--text-secondary)]">Hệ thống phân quyền dựa trên vai trò (RBAC) chặt chẽ cả trên Frontend lẫn API Backend, đảm bảo an toàn thông tin tối đa cho dự án.</p>
            </Card>
            <Card size="small" className="notebook-card" title={<span className="text-sm font-semibold"><MessageOutlined className="text-indigo-500 mr-2" /> Cộng tác thời gian thực</span>}>
              <p className="text-xs text-[var(--text-secondary)]">Bình luận lồng nhau đa cấp và nhật ký thay đổi dòng thời gian (Timeline) giúp đội nhóm theo dõi vết hoạt động và trao đổi chi tiết công việc.</p>
            </Card>
            <Card size="small" className="notebook-card" title={<span className="text-sm font-semibold"><PieChartOutlined className="text-indigo-500 mr-2" /> Thống kê & Báo cáo</span>}>
              <p className="text-xs text-[var(--text-secondary)]">Biểu đồ KPI dự án trực quan giúp các Trưởng nhóm đo lường tiến độ công việc, phát hiện điểm nghẽn và xuất dữ liệu báo cáo nhanh ra file CSV.</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'quickstart-auth',
      category: 'quickstart',
      title: 'Đăng ký & Đăng nhập tài khoản',
      keywords: ['đăng ký', 'đăng nhập', 'mật khẩu', 'tài khoản', 'auth'],
      content: (
        <div className="space-y-3">
          <p className="text-[var(--text-secondary)]">
            Hệ thống hỗ trợ đăng ký tài khoản tự do. Bạn có thể nhấp vào <strong>Đăng ký</strong> từ trang đăng nhập:
          </p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
            <li>Mọi tài khoản đăng ký mới sẽ nhận vai trò mặc định là <strong>Thành viên (MEMBER)</strong>.</li>
            <li>Vai trò <strong>Trưởng nhóm (LEADER)</strong> và <strong>Quản trị viên (ADMIN)</strong> sẽ do quản trị viên hệ thống cấp quyền hoặc gán trực tiếp.</li>
            <li>Phiên đăng nhập được duy trì an toàn bằng Access Token (trong bộ nhớ) và Refresh Token (trong LocalStorage). Bạn sẽ không phải đăng nhập lại mỗi khi mở tab.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'quickstart-theme',
      category: 'quickstart',
      title: 'Cấu hình Cá nhân & Đổi Giao diện Sáng/Tối',
      keywords: ['cấu hình', 'theme', 'giao diện', 'sáng tối', 'avatar', 'profile'],
      content: (
        <div className="space-y-3">
          <p className="text-[var(--text-secondary)]">
            Bạn có thể tùy biến trải nghiệm sử dụng cá nhân hóa dễ dàng tại mục <strong>Cấu hình (Settings)</strong>:
          </p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
            <li><strong>Chuyển giao diện Sáng/Tối (Light/Dark Mode):</strong> Nhấp nhanh vào biểu tượng mặt trời/mặt trăng (Sun/Moon) trên thanh Header góc trên bên phải để chuyển đổi hệ màu tức thì. Hệ màu Dark Mode được tối ưu theo bảng Obsidian Zinc giúp giảm mỏi mắt khi làm việc ban đêm.</li>
            <li><strong>Đổi thông tin cá nhân:</strong> Bạn có thể cập nhật Tên hiển thị và liên kết ảnh đại diện (Avatar URL) trong trang Cấu hình.</li>
            <li><strong>Đổi mật khẩu:</strong> Thực hiện thay đổi mật khẩu định kỳ tại form "Thay đổi mật khẩu" để nâng cao tính bảo mật.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'rbac-matrix',
      category: 'rbac',
      title: 'Bảng đặc quyền vai trò (Privilege Matrix)',
      keywords: ['vai trò', 'quyền hạn', 'phân quyền', 'admin', 'leader', 'member', 'matrix'],
      content: (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Dưới đây là chi tiết phân quyền hoạt động của hệ thống TaskFlow nhằm bảo vệ tính toàn vẹn của dữ liệu:
          </p>
          <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
            <Table
              dataSource={rbacData}
              columns={rbacColumns}
              pagination={false}
              size="small"
              className="notebook-card"
            />
          </div>
        </div>
      )
    },
    {
      id: 'projects-manage',
      category: 'projects',
      title: 'Quản lý dự án & Thêm thành viên',
      keywords: ['dự án', 'tạo dự án', 'thành viên', 'thêm thành viên', 'mời', 'leader', 'personal'],
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-2">1. Tạo dự án mới</h4>
          <p className="text-[var(--text-secondary)]">
            Trưởng nhóm (LEADER) hoặc Admin có thể nhấn nút <strong>"Tạo dự án mới"</strong> ở góc phải trang Dự án. 
            Ngoài ra, đối với các thành viên cấp <strong>MEMBER</strong>, hệ thống hiện tại đã mở rộng tính năng hỗ trợ <strong>Dự án cá nhân (Personal Projects)</strong> giúp thành viên tự làm chủ dự án riêng mà không cần quyền Leader hệ thống.
          </p>
          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-2">2. Mời thành viên mới bằng công cụ gợi ý (AutoComplete)</h4>
          <p className="text-[var(--text-secondary)]">
            Trong tab <strong>Thành viên (Members)</strong> của Dự án, Leader có thể gõ email thành viên. Hệ thống sẽ tự động tìm kiếm, gợi ý danh sách người dùng tương thích để tránh nhập sai email. 
            Bạn cũng có thể thay đổi trực tiếp vai trò của thành viên trong dự án sang `LEADER` (đồng sở hữu) hoặc `MEMBER`.
          </p>
        </div>
      )
    },
    {
      id: 'kanban-board',
      category: 'kanban',
      title: 'Bảng Kanban, Kéo thả & Công việc phụ thuộc',
      keywords: ['kanban', 'kéo thả', 'drag', 'drop', 'phụ thuộc', 'dependencies', 'done', 'todo'],
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-2">1. Quy trình trạng thái Kanban</h4>
          <p className="text-[var(--text-secondary)]">
            Công việc di chuyển theo luồng tự nhiên: <Tag color="default">TODO</Tag> <ArrowRightOutlined className="text-xs text-[var(--text-tertiary)]" /> <Tag color="blue">IN_PROGRESS</Tag> <ArrowRightOutlined className="text-xs text-[var(--text-tertiary)]" /> <Tag color="purple">REVIEW</Tag> <ArrowRightOutlined className="text-xs text-[var(--text-tertiary)]" /> <Tag color="green">DONE</Tag>.
          </p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-1">
            <li>Leader hoặc người tạo có quyền chỉnh sửa toàn bộ trường của Task.</li>
            <li>Thành viên được giao việc (Assignee) có thể cập nhật trạng thái của Task đó.</li>
            <li>Hệ thống áp dụng cơ chế <strong>Optimistic Updates</strong>, cho phép kéo thả nhanh mà không cảm thấy độ trễ từ server.</li>
          </ul>

          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-3">2. Ràng buộc Công việc phụ thuộc (Task Dependencies)</h4>
          <p className="text-[var(--text-secondary)]">
            Hệ thống hỗ trợ cơ chế ràng buộc logic nghiêm ngặt:
          </p>
          <div className="bg-[var(--accent-bg)] border-l-4 border-indigo-500 p-3 rounded-r-md text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong>Ngăn chặn hoàn thành sớm:</strong> Bạn không thể chuyển một công việc sang cột <strong>DONE</strong> nếu các công việc tiền quyết (Prerequisites - công việc mà task này phụ thuộc vào) chưa hoàn thành. Hệ thống sẽ chặn hành động kéo thả và hiển thị cảnh báo lỗi chi tiết.
            <br className="mt-1" />
            <strong>Chống lặp vòng vô hạn:</strong> Khi gán phụ thuộc, hệ thống tự động chạy thuật toán duyệt DFS để kiểm tra chu trình, ngăn chặn việc tạo liên kết phụ thuộc chéo vòng tròn vô lý (ví dụ: A phụ thuộc B, B phụ thuộc C, C lại phụ thuộc A).
          </div>
        </div>
      )
    },
    {
      id: 'collab-comments',
      category: 'collab',
      title: 'Bình luận lồng nhau & Nhật ký Hoạt động',
      keywords: ['bình luận', 'phản hồi', 'timeline', 'lịch sử', 'nhật ký', 'nested comment'],
      content: (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-2">1. Bình luận phản hồi lồng nhau (Threaded Comments)</h4>
          <p className="text-[var(--text-secondary)]">
            Để các cuộc hội thoại công việc diễn ra mạch lạc, hệ thống hỗ trợ bình luận phân cấp:
          </p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-1">
            <li>Bạn có thể trả lời trực tiếp một bình luận cụ thể để tạo luồng trao đổi con (hỗ trợ tối đa 2 cấp lồng nhau để tối ưu hiển thị trên di động).</li>
            <li>Người dùng có thể bấm "Thu gọn" để ẩn bớt các phản hồi dài.</li>
            <li>Project Leader và tác giả bình luận có quyền xóa bỏ bình luận để dọn dẹp thảo luận cũ.</li>
          </ul>

          <h4 className="text-sm font-semibold text-[var(--text-h)] mt-3">2. Nhật ký hoạt động Timeline</h4>
          <p className="text-[var(--text-secondary)]">
            Mọi sự thay đổi về người thực hiện, thời hạn, trạng thái hoặc tiêu đề công việc đều được hệ thống tự động ghi vết và hiển thị ở tab <strong>Nhật ký hoạt động (Timeline)</strong> của dự án, giúp theo dõi lịch sử chỉnh sửa rõ ràng.
          </p>
        </div>
      )
    },
    {
      id: 'stats-reports',
      category: 'stats',
      title: 'Thống kê KPI & Xuất dữ liệu báo cáo ra CSV',
      keywords: ['thống kê', 'kpi', 'csv', 'xuất', 'export', 'dashboard', 'biểu đồ'],
      content: (
        <div className="space-y-3">
          <p className="text-[var(--text-secondary)]">
            TaskFlow cung cấp các công cụ trực quan hóa dữ liệu để theo dõi tiến độ tổng thể của dự án:
          </p>
          <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
            <li><strong>Dashboard cho Leader:</strong> Tổng hợp KPI số lượng công việc theo trạng thái, biểu đồ phân tích độ ưu tiên (Priority), danh sách công việc trễ hạn (Overdue tasks).</li>
            <li><strong>Dashboard cho Member:</strong> Thống kê tóm tắt cá nhân (Số công việc được giao, đã hoàn thành, hoặc sắp hết hạn).</li>
            <li><strong>Xuất dữ liệu dự án (Export CSV):</strong> Trưởng nhóm có thể nhấn vào nút <strong>Xuất báo cáo CSV</strong> tại tab Overview của Dự án. Tệp CSV chứa đầy đủ thông tin chi tiết về các Task, Người được gán, Ngày bắt đầu, Hạn chót, Trạng thái và Mức độ ưu tiên để phục vụ báo cáo.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'faq-details',
      category: 'faq',
      title: 'Các câu hỏi thường gặp (FAQs)',
      keywords: ['faq', 'câu hỏi', 'hỏi đáp', 'lỗi', 'không kéo thả', 'thêm thành viên'],
      content: (
        <Collapse accordion className="notebook-card border-none mt-2 bg-transparent">
          <Panel header={<span className="font-semibold text-xs text-[var(--text-h)]">Làm thế nào để đổi mật khẩu tài khoản?</span>} key="q1" className="border-b border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Bạn truy cập mục <strong>Cấu hình</strong> trên sidebar, cuộn xuống phần <strong>Thay đổi mật khẩu</strong>. Nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới, sau đó nhấn nút Cập nhật.
            </p>
          </Panel>
          <Panel header={<span className="font-semibold text-xs text-[var(--text-h)]">Tại sao tôi (MEMBER) không tạo được công việc mới?</span>} key="q2" className="border-b border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Theo quy định nghiệp vụ hệ thống, chỉ <strong>Admin</strong> hoặc <strong>Trưởng nhóm (LEADER)</strong> của dự án mới có đặc quyền tạo công việc (Task) mới và phân công cho thành viên. MEMBER chỉ có quyền cập nhật trạng thái các task mình được giao và sắp xếp thứ tự hiển thị.
            </p>
          </Panel>
          <Panel header={<span className="font-semibold text-xs text-[var(--text-h)]">Làm sao để biết công việc nào đang bị cản trở bởi công việc khác?</span>} key="q3" className="border-b border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Khi mở <strong>Chi tiết công việc (Task Detail Modal)</strong>, phần thông tin bên phải sẽ hiển thị mục <strong>Công việc phụ thuộc</strong>. Bạn sẽ thấy danh sách các công việc tiền quyết cần làm trước và trạng thái của chúng. Bạn cũng có thể xem trực quan đường nối liên kết tại tab <strong>Timeline (Lịch biểu)</strong>.
            </p>
          </Panel>
          <Panel header={<span className="font-semibold text-xs text-[var(--text-h)]">Hệ thống có chạy ngầm kiểm tra trễ hạn không?</span>} key="q4" className="border-b border-[var(--border)] last:border-none">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Có. Hệ thống Backend có dịch vụ chạy ngầm định kỳ quét các công việc chưa hoàn thành có hạn chót sắp đến (trong vòng 24 giờ tới) và tự động bắn thông báo tức thì <strong>(DEADLINE_APPROACHING)</strong> đến người được giao để tránh chậm trễ.
            </p>
          </Panel>
        </Collapse>
      )
    }
  ], []);

  // Filter sections by search text
  const filteredSections = useMemo(() => {
    if (!searchText.trim()) {
      return sections.filter((s) => s.category === activeCategory);
    }
    const cleanSearch = searchText.toLowerCase().trim();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(cleanSearch) ||
        s.keywords.some((kw) => kw.includes(cleanSearch))
    );
  }, [searchText, activeCategory, sections]);

  return (
    <div className="py-6 max-w-6xl mx-auto min-h-[calc(100vh-100px)]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-h)] flex items-center gap-2">
            <QuestionCircleOutlined className="text-indigo-500" />
            Trung tâm Trợ giúp & Hướng dẫn sử dụng
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tra cứu hướng dẫn thao tác, quyền hạn tài khoản và các câu hỏi thường gặp trên TaskFlow.
          </p>
        </div>
        <div className="w-full md:w-80">
          <Search
            placeholder="Tìm kiếm tài liệu trợ giúp..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined className="text-[var(--text-tertiary)]" />}
            className="notebook-card rounded-lg border-none"
            size="large"
          />
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="notebook-card border border-[var(--border)] rounded-xl p-3 space-y-1.5 sticky top-4">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border)] mb-2">
              Danh mục hướng dẫn
            </div>
            {categories.map((cat) => {
              const isActive = cat.id === activeCategory && !searchText;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchText(''); // Clear search to show category content
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left cursor-pointer font-medium ${
                    isActive
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-l-3 border-indigo-500 pl-2'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text-h)]'
                  }`}
                >
                  <span className={`text-base flex items-center ${isActive ? 'text-indigo-500' : 'text-[var(--text-tertiary)]'}`}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {searchText && (
              <div className="notebook-card border border-[var(--border)] p-4 rounded-xl text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                <span>
                  Kết quả tìm kiếm cho từ khóa: <strong className="text-indigo-500">"{searchText}"</strong>
                </span>
                <span>Tìm thấy {filteredSections.length} mục phù hợp</span>
              </div>
            )}

            {filteredSections.length === 0 ? (
              <Card className="notebook-card border border-[var(--border)] text-center py-16 rounded-xl">
                <QuestionCircleOutlined className="text-slate-300 dark:text-slate-700 text-5xl mb-4" />
                <h3 className="text-base font-bold text-[var(--text-h)]">Không tìm thấy tài liệu phù hợp</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto">
                  Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp với từ khóa của bạn. Hãy thử tìm kiếm từ khóa khác đơn giản hơn.
                </p>
                <Button
                  type="primary"
                  className="mt-5 bg-indigo-600 hover:bg-indigo-700 border-none cursor-pointer"
                  onClick={() => setSearchText('')}
                >
                  Quay lại tài liệu chính
                </Button>
              </Card>
            ) : (
              filteredSections.map((sec) => (
                <Card
                  key={sec.id}
                  className="notebook-card border border-[var(--border)] rounded-xl shadow-xs"
                  styles={{ body: { padding: '24px' } }}
                >
                  <h2 className="text-lg font-bold text-[var(--text-h)] border-b border-[var(--border)] pb-3 mb-4 flex items-center gap-2">
                    <BookOutlined className="text-indigo-500 text-sm shrink-0" />
                    {sec.title}
                  </h2>
                  <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {sec.content}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
