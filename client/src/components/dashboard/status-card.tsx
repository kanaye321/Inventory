interface StatusCardProps {
  title: string;
  value: number;
  change: number;
  changeDirection: 'up' | 'down';
  icon: React.ReactNode;
  isLoading?: boolean;
}

export default function StatusCard({
  title,
  value,
  change,
  changeDirection,
  icon,
  isLoading = false
}: StatusCardProps) {
  return (
    <div className="bg-card text-card-foreground dark:bg-muted dark:text-foreground rounded-lg shadow p-4 sm:p-5 status-card">
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{title}</div>
              <div className="text-xl sm:text-2xl font-semibold mt-1">{value.toLocaleString()}</div>
            </div>
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30">
              {icon}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center mt-3 sm:mt-4">
            <span className={`text-xs sm:text-sm flex items-center ${changeDirection === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {changeDirection === 'up' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm sm:ml-2 mt-1 sm:mt-0">since last month</span>
          </div>
        </>
      )}
    </div>
  );
}
