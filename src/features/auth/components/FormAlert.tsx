export function FormAlert({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/60 px-3 py-2 text-xs text-destructive"
    >
      {message}
    </p>
  );
}
