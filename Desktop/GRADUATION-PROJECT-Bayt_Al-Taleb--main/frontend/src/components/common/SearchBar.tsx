import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "...ابحث",
}) => {
  return (
    <div className="relative w-full">
      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 outline-none focus:border-primary transition-colors bg-white text-primary placeholder:text-gray-400"
      />
    </div>
  );
};

export default SearchBar;
