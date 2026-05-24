import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Determine the icon and text based on the resolvedTheme
  const displayIcon = resolvedTheme === 'dark' ? (
    <Sun className="h-4 w-4 text-yellow-500" />
  ) : (
    <Moon className="h-4 w-4 text-slate-600" />
  );

  const displayText = resolvedTheme === 'dark' ? 'Light' : 'Dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 transition-all hover:border-blue-200 hover:shadow-md active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        {displayIcon}
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
        {displayText}
      </span>
    </button>
  );
}