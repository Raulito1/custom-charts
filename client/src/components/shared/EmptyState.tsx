import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-gray-300 mb-4">{icon}</div>
      <h3 className="text-gray-600 font-medium text-base mb-1">{title}</h3>
      {description && <p className="text-gray-400 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
