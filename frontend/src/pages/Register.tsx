import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, Input, Button } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Tên phải dài tối thiểu 2 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải chứa tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFields = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isRegistering } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFields) => {
    register(
      { email: data.email, password: data.password, name: data.name },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
      }
    );
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      {/* Full Name Input */}
      <Form.Item
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
        className="mb-4"
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="Họ và tên"
              size="large"
              autoComplete="name"
            />
          )}
        />
      </Form.Item>

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
              autoComplete="new-password"
            />
          )}
        />
      </Form.Item>

      {/* Confirm Password Input */}
      <Form.Item
        validateStatus={errors.confirmPassword ? 'error' : ''}
        help={errors.confirmPassword?.message}
        className="mb-5"
      >
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="Xác nhận mật khẩu"
              size="large"
              autoComplete="new-password"
            />
          )}
        />
      </Form.Item>

      {/* Submit Button */}
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={isRegistering}
        className="shadow-lg font-semibold mb-4"
      >
        Đăng ký
      </Button>

      {/* Login Link */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500">
          Đăng nhập ngay
        </Link>
      </div>
    </Form>
  );
};
export default Register;
