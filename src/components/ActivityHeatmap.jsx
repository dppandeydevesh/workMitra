import React from "react";

export default function ActivityHeatmap({ applications = [] }) {
  // Let's create an activity map for the last 12 weeks (84 days)
  const totalDays = 84;
  const days = [];
  const now = new Date();
  
  // Initialize days
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    days.push({
      date: date.toISOString().split("T")[0],
      count: 0
    });
  }

  // Count submissions and actions per date
  applications.forEach(app => {
    if (app.submittedAt) {
      const dStr = new Date(app.submittedAt).toISOString().split("T")[0];
      const match = days.find(d => d.date === dStr);
      if (match) match.count += 1;
    }
    if (app.appliedAt) {
      const dStr = new Date(app.appliedAt).toISOString().split("T")[0];
      const match = days.find(d => d.date === dStr);
      if (match) match.count += 1;
    }
  });

  // Helper to determine background color class based on activity count
  const getColorClass = (count) => {
    if (count === 0) return "bg-ink-100 dark:bg-ink-800 border-ink-200/50 dark:border-ink-700/50";
    if (count === 1) return "bg-marigold-200 dark:bg-marigold-950 border-marigold-300 text-marigold-800";
    if (count === 2) return "bg-marigold-400 dark:bg-marigold-800 border-marigold-500 text-white";
    return "bg-marigold-500 dark:bg-marigold-500 border-marigold-700 text-white font-extrabold";
  };

  // Group into weeks (7 days each)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-ink-900 border dark:border-ink-800 p-6 rounded-3xl shadow-sm flex flex-col space-y-4">
      <div>
        <h4 className="text-xs font-black uppercase text-ink-800 dark:text-white tracking-wider">📅 Practical Task Activity Heatmap</h4>
        <p className="text-[10px] text-ink-400 mt-0.5">Visual log of task applications, iterations, and completions over the last 12 weeks.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1.5 shrink-0">
            {week.map((day, dIdx) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} activities`}
                className={`w-[14px] h-[14px] rounded-sm border transition-all hover:scale-110 ${getColorClass(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-[10px] text-ink-400 pt-1">
        <span>12 Weeks Ago</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-ink-100 dark:bg-ink-800 border rounded-sm" />
          <div className="w-2.5 h-2.5 bg-marigold-200 dark:bg-marigold-950 border rounded-sm" />
          <div className="w-2.5 h-2.5 bg-marigold-400 dark:bg-marigold-800 border rounded-sm" />
          <div className="w-2.5 h-2.5 bg-marigold-500 border rounded-sm" />
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}
