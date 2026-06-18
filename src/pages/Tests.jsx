import { useState } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const TEST_TYPES = ['功能测试', '老化测试', '终测'];

const DEVICE_STATUS_FOR_TEST = {
  '功能测试': '功能测试中',
  '老化测试': '老化测试中',
  '终测': '终测中',
};

const PASS_NEXT_STATUS = {
  '功能测试': '老化测试中',
  '老化测试': '终测中',
  '终测': '待分配项目',
};

const FAIL_NEXT_STATUS = {
  '功能测试': '整机装配',
  '老化测试': '整机装配',
  '终测': '返修中',
};

function TestRecordModal({ isOpen, onClose, onSubmit, testType, eligibleDevices, currentUser }) {
  const [form, setForm] = useState({
    deviceId: '',
    result: '合格',
    operator: currentUser,
    reportFile: '',
    notes: '',
    duration: '',
    peakTemp: '',
    anomalyCount: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
    setForm({
      deviceId: '',
      result: '合格',
      operator: currentUser,
      reportFile: '',
      notes: '',
      duration: '',
      peakTemp: '',
      anomalyCount: 0,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新增${testType}记录`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">设备 *</label>
          <select
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            required
          >
            <option value="">-- 选择设备 --</option>
            {eligibleDevices.map((d) => (
              <option key={d.id} value={d.id}>{d.sn}</option>
            ))}
          </select>
          {eligibleDevices.length === 0 && (
            <p className="text-xs text-orange-500 mt-1">当前无处于「{DEVICE_STATUS_FOR_TEST[testType]}」状态的设备</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">测试结果 *</label>
            <select
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            >
              <option value="合格">合格</option>
              <option value="不合格">不合格</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">测试员</label>
            <input
              type="text"
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">报告文件名</label>
          <input
            type="text"
            value={form.reportFile}
            onChange={(e) => setForm({ ...form, reportFile: e.target.value })}
            placeholder="e.g. test_report.pdf"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
          />
        </div>

        {testType === '老化测试' && (
          <div className="border border-gray-200 rounded p-3 bg-gray-50">
            <div className="text-xs font-medium text-gray-600 mb-3">老化测试专项参数</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">持续时长</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 72小时"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">温度峰值</label>
                <input
                  type="text"
                  value={form.peakTemp}
                  onChange={(e) => setForm({ ...form, peakTemp: e.target.value })}
                  placeholder="e.g. 75°C"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">异常次数</label>
                <input
                  type="number"
                  min="0"
                  value={form.anomalyCount}
                  onChange={(e) => setForm({ ...form, anomalyCount: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
          />
        </div>

        {form.result === '不合格' && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            不合格 — 设备状态将变更为「{FAIL_NEXT_STATUS[testType]}」
          </div>
        )}
        {form.result === '合格' && form.deviceId && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
            合格 — 设备状态将进阶为「{PASS_NEXT_STATUS[testType]}」
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">取消</button>
          <button
            type="submit"
            disabled={!form.deviceId}
            className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 disabled:opacity-40"
          >
            提交记录
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TestTable({ records, testType, devices }) {
  const getDeviceSN = (id) => devices.find((d) => d.id === id)?.sn || id;

  const filtered = records.filter((r) => r.testType === testType);

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              '记录ID', '设备SN', '测试结果', '测试员', '测试时间', '报告文件',
              ...(testType === '老化测试' ? ['持续时长', '温度峰值', '异常次数'] : []),
              '备注', '状态',
            ].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-400 font-mono text-xs">{r.id}</td>
              <td className="px-3 py-2 font-medium text-gray-800">{getDeviceSN(r.deviceId)}</td>
              <td className="px-3 py-2">
                <StatusBadge status={r.result === '合格' ? '合格' : '不合格'} />
              </td>
              <td className="px-3 py-2 text-gray-600">{r.operator}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{r.testTime}</td>
              <td className="px-3 py-2 text-gray-400 text-xs">{r.reportFile || '—'}</td>
              {testType === '老化测试' && (
                <>
                  <td className="px-3 py-2 text-gray-500 text-xs">{r.duration || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{r.peakTemp || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{r.anomalyCount ?? '—'}</td>
                </>
              )}
              <td className="px-3 py-2 text-gray-400 text-xs max-w-xs truncate">{r.notes || '—'}</td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-8 text-center text-gray-400">暂无{testType}记录</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Tests() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const currentTestType = TEST_TYPES[activeTab];
  const eligibleStatus = DEVICE_STATUS_FOR_TEST[currentTestType];
  const eligibleDevices = state.devices.filter((d) => d.status === eligibleStatus);

  const handleSubmitTest = (form) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const testId = `TEST-${Date.now()}`;
    const nextStatus =
      form.result === '合格'
        ? PASS_NEXT_STATUS[currentTestType]
        : FAIL_NEXT_STATUS[currentTestType];

    const device = state.devices.find((d) => d.id === form.deviceId);
    const prevStatus = device?.status || '';

    // Add test record
    dispatch({
      type: 'ADD_TEST_RECORD',
      payload: {
        id: testId,
        deviceId: form.deviceId,
        testType: currentTestType,
        result: form.result,
        operator: form.operator,
        testTime: now,
        reportFile: form.reportFile,
        notes: form.notes,
        ...(currentTestType === '老化测试' ? {
          duration: form.duration,
          peakTemp: form.peakTemp,
          anomalyCount: form.anomalyCount,
        } : {}),
        status: '有效',
      },
    });

    // Update device status
    dispatch({
      type: 'UPDATE_DEVICE',
      payload: { id: form.deviceId, status: nextStatus, updatedAt: now },
    });

    // Add operation log
    dispatch({
      type: 'ADD_OPERATION_LOG',
      payload: {
        id: `LOG-${Date.now()}`,
        deviceId: form.deviceId,
        operator: form.operator,
        timestamp: now,
        actionType: form.result === '合格' ? `${currentTestType}通过` : `${currentTestType}不合格`,
        fromStatus: prevStatus,
        toStatus: nextStatus,
        notes: form.result === '合格' ? `${currentTestType}合格，进阶状态` : `${currentTestType}不合格，返修`,
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">测试中心</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-800"
        >
          + 新增测试记录
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TEST_TYPES.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
              activeTab === i ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {state.testRecords.filter((r) => r.testType === tab).length}
            </span>
          </button>
        ))}
      </div>

      <TestTable
        records={state.testRecords}
        testType={currentTestType}
        devices={state.devices}
      />

      <TestRecordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitTest}
        testType={currentTestType}
        eligibleDevices={eligibleDevices}
        currentUser={state.currentUser}
      />
    </div>
  );
}
