export default function SecondaryTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 p-1 bg-gray-100 rounded-lg w-fit ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
            activeTab === t.key
              ? 'bg-white text-blue-600 font-medium shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
