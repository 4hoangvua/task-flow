import React, { useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Avatar, Divider } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

export const Settings: React.FC = () => {
  const { user, updateProfile, isUpdatingProfile, changePassword, isChangingPassword } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Populate profile form when user info is loaded
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        avatar: user.avatar || undefined,
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = (values: { name: string; avatar?: string }) => {
    updateProfile({
      name: values.name,
      avatar: values.avatar || null,
    });
  };

  const handleChangePassword = (values: any) => {
    changePassword({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
    passwordForm.resetFields();
  };

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-h)] flex items-center gap-2">
          <SettingOutlined className="text-[var(--accent)]" /> Cấu hình tài khoản
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Quản lý thông tin cá nhân và cài đặt bảo mật của bạn.
        </p>
      </div>

      <Row gutter={[20, 20]}>
        {/* Profile Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-[var(--text-h)]">
                Thông tin cá nhân
              </span>
            }
            className="shadow-sm border border-[var(--border)]"
          >
            <div className="flex flex-col items-center mb-6">
              <Avatar
                src={user?.avatar}
                size={80}
                icon={<UserOutlined />}
                className="bg-[var(--accent)] shadow border-2 border-[var(--border)]"
              />
              <h3 className="text-lg font-bold text-[var(--text-h)] mt-3">
                {user?.name}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{user?.email}</p>
              <Tag color="purple" className="mt-2 uppercase font-semibold">
                {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên'}
              </Tag>
            </div>

            <Divider className="my-4" />

            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên!' },
                  { min: 2, message: 'Tên phải chứa ít nhất 2 ký tự!' },
                ]}
              >
                <Input prefix={<UserOutlined className="text-[var(--text-tertiary)]" />} />
              </Form.Item>

              <Form.Item
                label="Đường dẫn ảnh đại diện (Avatar URL)"
                name="avatar"
                rules={[{ type: 'url', message: 'Vui lòng nhập đường dẫn URL hợp lệ!' }]}
              >
                <Input placeholder="https://example.com/avatar.jpg" />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdatingProfile}
                  className="w-full"
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Security Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className="font-bold text-[var(--text-h)]">
                Bảo mật & Đổi mật khẩu
              </span>
            }
            className="shadow-sm border border-[var(--border)]"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="oldPassword"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
              >
                <Input.Password prefix={<LockOutlined className="text-[var(--text-tertiary)]" />} />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 6, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' },
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-[var(--text-tertiary)]" />} />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-[var(--text-tertiary)]" />} />
              </Form.Item>

              <Form.Item className="mb-0 mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isChangingPassword}
                  className="w-full"
                >
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Helper for Role Tag inside component
const Tag = ({ children, color, className }: any) => {
  const isPurple = color === 'purple';
  return (
    <span
      className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
        isPurple
          ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80'
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Settings;
