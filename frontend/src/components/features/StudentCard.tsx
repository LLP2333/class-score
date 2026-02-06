'use client';

import { cn, getAvatarClass } from '@/lib/utils';
import type { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface StudentCardProps {
  student: Student;
  onAddScore?: () => void;
  onMinusScore?: () => void;
  onClick?: () => void;
}

export function StudentCard({ student, onAddScore, onMinusScore, onClick }: StudentCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl p-4 shadow-sm border border-border',
        'flex flex-col items-center gap-2 cursor-pointer',
        'hover:shadow-md hover:border-primary/30 transition-all'
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'text-white text-xl font-semibold',
          getAvatarClass(student.avatar)
        )}
      >
        {student.name.charAt(0)}
      </div>
      
      {/* Name */}
      <div className="text-sm font-medium text-foreground truncate w-full text-center" title={student.name}>
        {student.name}
      </div>
      
      {/* Score */}
      <div className="text-lg font-bold text-primary">
        {student.totalScore}分
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
          onClick={onAddScore}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={onMinusScore}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
