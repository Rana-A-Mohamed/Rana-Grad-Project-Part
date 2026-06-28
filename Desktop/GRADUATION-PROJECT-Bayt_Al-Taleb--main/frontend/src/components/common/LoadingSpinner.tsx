// src/components/common/LoadingSpinner.tsx
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeClasses = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-4",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "جاري التحميل...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      {/* The Spinner */}
      <div
        className={`${sizeClasses[size]} rounded-full border-gray-200 border-t-primary animate-spin`}
      />

      {/* The Text (Optional) */}
      {text && (
        <p className="text-gray-500 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
