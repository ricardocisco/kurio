export function ThankYouMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-16 text-primary"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 26 32 8l24 18v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V26Z" />
      <path d="m8 26 24 18 24-18" />
      <rect x="16" y="14" width="32" height="20" rx="2" fill="var(--kurio-850)" />
      <text
        x="32"
        y="23"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        THANK
      </text>
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        YOU
      </text>
    </svg>
  );
}
