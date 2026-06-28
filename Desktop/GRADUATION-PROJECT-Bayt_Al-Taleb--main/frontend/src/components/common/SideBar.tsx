import React from "react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AnchorSidebarProps {
  items: SidebarItem[];
  activeSection: string;
  onItemClick: (id: string) => void;
  icon?: React.ReactNode;
}

const SideBar: React.FC<AnchorSidebarProps> = ({
  items,
  activeSection,
  onItemClick,
  icon,
}) => {
  return (
    <div className="hidden lg:block sticky top-24 self-start">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <ul className="p-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={`  w-full text-right px-4 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-between mb-4 ${
                  activeSection === item.id
                    ? "bg-primary text-paragraph"
                    : "text-primary hover:bg-bgSection hover:text-accent"
                }`}
              >
                {item.label}
                {item.icon && <span className="text-base">{item.icon}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
