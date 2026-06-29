export default function TertiaryTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
