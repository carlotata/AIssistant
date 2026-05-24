import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();

  useEffect(() => {
    // This effect runs when the theme changes to update the system theme class
    // but we are using the class attribute on the html element, so we don't need to do anything here.
    // The ThemeProvider in layout.tsx handles that.
  }, [theme, setTheme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 transition-all hover:border-blue-200 hover:shadow-md active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}