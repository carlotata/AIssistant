import { ChatIcon, GridIcon, ListChecksIcon, SparklesIcon, TrendUpIcon } from "./dashboard-icons";
import type { DashboardTab } from "./dashboard-types";

type DashboardHeaderProps = {
  tabs: DashboardTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
};

function TabIcon({ icon }: Pick<DashboardTab, "icon">) {
  const className = "h-4 w-4";

  if (icon === "dashboard") {
    return <GridIcon className={className} />;
  }

  if (icon === "chat") {
    return <ChatIcon className={className} />;
  }

  if (icon === "tasks") {
    return <ListChecksIcon className={className} />;
  }

  return <TrendUpIcon className={className} />;
}

export function DashboardHeader({ tabs, activeTabId, onTabChange }: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-slate-900">StudyAI</span>
          </div>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Dashboard sections">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-base font-medium transition",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_#dbeafe]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
                  ].join(" ")}
                >
                  <TabIcon icon={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-base font-semibold text-blue-700"
          aria-label="Open profile"
        >
          JS
        </button>
      </div>
    </header>
  );
}
