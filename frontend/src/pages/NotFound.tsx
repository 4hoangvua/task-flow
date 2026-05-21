import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <Result
        status="404"
        title={<span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100">404</span>}
        subTitle={<span className="text-slate-500 dark:text-slate-400">Rất tiếc, trang bạn đang cố gắng truy cập không tồn tại.</span>}
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Quay lại trang chủ
          </Button>
        }
      />
    </div>
  );
};
export default NotFound;
