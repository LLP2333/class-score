'use client';

import { cn, getAvatarClass } from '@/lib/utils';
import type { Group, Student } from '@/types';
import { Button } from '@/components/ui/button';

const groupColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

interface GroupCardProps {
  group: Group;
  members: Student[];
  totalScore: number;
  leader: Student | null;
  onAddScore?: () => void;
  onMinusScore?: () => void;
  onEdit?: () => void;
  onManageMembers?: () => void;
}

export function GroupCard({
  group,
  members,
  totalScore,
  leader,
  onAddScore,
  onMinusScore,
  onEdit,
  onManageMembers,
}: GroupCardProps) {
  const bgColor = groupColors[(group.color - 1) % groupColors.length];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div
        className="p-4 text-white"
        style={{ background: bgColor }}
      >
        <div className="text-lg font-semibold">{group.name}</div>
        <div className="text-2xl font-bold">{totalScore}分</div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Leader */}
        {leader && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
            <span className="text-base">👑</span>
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium',
                getAvatarClass(leader.avatar)
              )}
            >
              {leader.name.charAt(0)}
            </div>
            <span className="text-sm font-medium">组长: {leader.name}</span>
          </div>
        )}

        {/* Member count and score buttons */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {members.length} 名成员
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
              onClick={onAddScore}
            >
              +分
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onMinusScore}
            >
              -分
            </Button>
          </div>
        </div>

        {/* Member avatars */}
        <div className="flex flex-wrap gap-1">
          {members.slice(0, 8).map((member) => (
            <div
              key={member.id}
              title={member.name}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                getAvatarClass(member.avatar),
                leader?.id === member.id && 'ring-2 ring-orange-400'
              )}
            >
              {member.name.charAt(0)}
            </div>
          ))}
          {members.length > 8 && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-xs font-medium"
              title={`还有 ${members.length - 8} 人`}
            >
              +{members.length - 8}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onManageMembers}
          >
            成员
          </Button>
        </div>
      </div>
    </div>
  );
}
