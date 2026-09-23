export default function WaterDrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M32 4C32 4 12 28 12 42a20 20 0 0 0 40 0C52 28 32 4 32 4z" />
      <ellipse cx="24" cy="42" rx="4" ry="7" fill="#fff" opacity=".55" transform="rotate(-20 24 42)" />
    </svg>
  );
}
