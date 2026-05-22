import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, Input, Button, Checkbox, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  remember: z.boolean().optional(),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = (data: LoginFields) => {
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
      }
    );
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      {localStorage.getItem('authDebugError') && (
        <Alert
          message="Lỗi khôi phục phiên"
          description={
            <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200/50 dark:border-slate-800/50">
              {localStorage.getItem('authDebugError')}
            </pre>
          }
          type="warning"
          showIcon
          closable
          className="mb-4"
          onClose={() => localStorage.removeItem('authDebugError')}
        />
      )}

      {/* Email Input */}
      <Form.Item
        validateStatus={errors.email ? 'error' : ''}
        help={errors.email?.message}
        className="mb-4"
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<MailOutlined className="text-slate-400" />}
              placeholder="Email"
              size="large"
              autoComplete="email"
            />
          )}
        />
      </Form.Item>

      {/* Password Input */}
      <Form.Item
        validateStatus={errors.password ? 'error' : ''}
        help={errors.password?.message}
        className="mb-4"
      >
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="Mật khẩu"
              size="large"
              autoComplete="current-password"
            />
          )}
        />
      </Form.Item>

      {/* Remember me & Forgot Password */}
      <div className="flex justify-between items-center mb-5">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Controller
            name="remember"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <Checkbox {...rest} checked={value} onChange={(e) => onChange(e.target.checked)}>
                <span className="text-xs text-slate-500 dark:text-slate-400">Ghi nhớ đăng nhập</span>
              </Checkbox>
            )}
          />
        </Form.Item>
        <Link to="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
          Quên mật khẩu?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={isLoggingIn}
        className="shadow-lg font-semibold mb-4"
      >
        Đăng nhập
      </Button>

      {/* Register Link */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500">
          Đăng ký ngay
        </Link>
      </div>
    </Form>
  );
};
export default Login;
