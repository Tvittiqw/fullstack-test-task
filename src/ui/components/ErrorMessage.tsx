export function ErrorMessage({
  error,
  block = false,
}: {
  error: string | null;
  block?: boolean;
}) {
  if (!error) return null;
  return (
    <p role="alert" className={block ? 'error error--block' : 'error'}>
      {error}
    </p>
  );
}
