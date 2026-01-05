"use client";

import { MemberData } from "./useGroupDetail";

interface BubbleVisualizationProps {
  members: MemberData[];
  maxBalance: number;
  onMemberClick: (member: MemberData) => void;
  getBubbleSize: (
    balance: number,
    maxBalance: number,
  ) => { class: string; px: number };
  getBubblePosition: (index: number) => { style: React.CSSProperties };
}

export function BubbleVisualization({
  members,
  maxBalance,
  onMemberClick,
  getBubbleSize,
  getBubblePosition,
}: BubbleVisualizationProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="relative w-80 h-64">
        {members.slice(0, 12).map((member, i) => {
          const bubbleSize = getBubbleSize(member.balance, maxBalance);
          const position = getBubblePosition(i);
          return (
            <button
              key={member.id}
              onClick={() => onMemberClick(member)}
              style={position.style}
              className="absolute transition-all duration-300 hover:scale-110 focus:outline-none"
            >
              <div
                className={`${bubbleSize.class} rounded-full flex flex-col items-center justify-center cursor-pointer shadow-lg ${
                  member.balance < 0
                    ? "bg-amber-700/80 hover:bg-amber-600/80"
                    : member.balance > 0
                      ? "bg-emerald-700/60 hover:bg-emerald-600/60"
                      : "bg-gray-600/60 hover:bg-gray-500/60"
                }`}
              >
                <span className="text-white/90 text-xs font-medium truncate max-w-[80%]">
                  {member.name}
                </span>
                <span className="text-sm font-bold text-white">
                  {member.balance < 0 ? "" : member.balance > 0 ? "+" : ""}
                  {member.balance === 0
                    ? "฿0.00"
                    : `฿${Math.abs(member.balance).toFixed(2)}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
