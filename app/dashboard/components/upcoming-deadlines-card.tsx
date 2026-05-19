import { CalendarIcon } from "./dashboard-icons";
import type { DeadlineItem } from "./hard-data/dashboard-types";

type UpcomingDeadlinesCardProps = {
   deadlines: DeadlineItem[];
};

function deadlineColorClass(color: DeadlineItem["color"]) {
   if (color === "red") {
      return "bg-red-500";
   }

   if (color === "amber") {
      return "bg-amber-500";
   }

   return "bg-blue-500";
}

export function UpcomingDeadlinesCard({
   deadlines,
}: UpcomingDeadlinesCardProps) {
   return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
         <div className="mb-4 flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-semibold text-slate-900">
               Upcoming Deadlines
            </h2>
         </div>

         <div className="space-y-3">
            {deadlines.map((deadline) => (
               <article
                  key={deadline.id}
                  className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                     <span
                        className={`h-2.5 w-2.5 rounded-full ${deadlineColorClass(deadline.color)}`}
                     />
                     <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {deadline.course}
                     </p>
                  </div>
                  <p className="text-[1.45rem] font-semibold text-slate-800">
                     {deadline.title}
                  </p>
                  <p className="mt-1 text-base text-slate-500">
                     {deadline.due}
                  </p>
               </article>
            ))}
         </div>
      </section>
   );
}
