type ErrorMessageProps = { error: string | null; block?: boolean };

export function ErrorMessage({ error, block = false }: ErrorMessageProps) {
  if (!error) return null;
  return (
    <p role="alert" className={block ? 'error error--block' : 'error'}>
      {error}
    </p>
  );
}
