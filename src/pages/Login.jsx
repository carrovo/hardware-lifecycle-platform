import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">H</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">硬件全生命周期</h1>
        <p className="text-sm text-gray-500 mb-8">管理平台</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded text-xs font-bold">飞</span>
          <span>使用飞书账号登录</span>
        </button>
        <p className="text-xs text-gray-400 mt-4">演示模式：点击即可登录</p>
      </div>
    </div>
  );
}
