import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FEISHU_USERS } from '../data/mockData';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(FEISHU_USERS[0].id);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login(selectedUserId);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">H</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">硬件全生命周期管理平台</h1>
        <p className="text-sm text-gray-500 mb-8">智平方机器人</p>

        <div className="mb-4 text-left">
          <label className="block text-xs text-gray-500 mb-1.5">演示账号</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-slate-400 bg-gray-50"
            disabled={loading}
          >
            {FEISHU_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}（{u.role}）— {u.dept}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded text-xs font-bold">飞</span>
          )}
          <span>{loading ? '登录中...' : '使用飞书账号登录'}</span>
        </button>
      </div>
    </div>
  );
}
