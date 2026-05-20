type IconProps = {
  className?: string;
};

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9 4.8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.8 7h14.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 7v10.3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.6 10.2v6M13.4 10.2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
