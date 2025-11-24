import React from 'react';

export default function Sidebar() {
  const navItems = [
    // { name: 'Dashboard', href: '#', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>) },
    { name: 'Products', href: '#', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4"/></svg>) },
    // { name: 'Categories', href: '#', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>) },
    // { name: 'Reports', href: '#', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17v-6h6v6"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>) },
  ];

  return (
    <aside className="bg-gray-800 text-gray-200 w-64 min-h-screen flex flex-col">
      <div className="px-6 py-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Inventory Manager</h1>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-4">
              <a
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded"
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-6 py-4 border-t border-gray-700 text-sm text-gray-400">
        &copy; Inventory Manager, 2025
      </div>
    </aside>
  );
}
