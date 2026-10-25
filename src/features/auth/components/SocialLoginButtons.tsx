import { useComingSoon } from '@/shared/hooks/use-coming-soon';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4Z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#1877F2" d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8Z" />
    </svg>
  );
}

const buttonClass =
  'flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border text-xs font-medium text-text-secondary transition-colors hover:border-primary/70 hover:text-foreground md:h-9';

export function SocialLoginButtons() {
  const showComingSoon = useComingSoon();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        Ou continue com
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        className={buttonClass}
        onClick={() => showComingSoon('O login com Google')}
      >
        <GoogleMark />
        Continuar com Google
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => showComingSoon('O login com Facebook')}
      >
        <FacebookMark />
        Continuar com Facebook
      </button>
    </div>
  );
}
