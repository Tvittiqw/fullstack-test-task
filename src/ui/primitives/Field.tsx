import type { ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';

type FieldProps = {
  label: string;
  labelHidden?: boolean;
  error?: string;
  children: ReactNode;
};

export function Field({
  label,
  labelHidden = false,
  error,
  children,
}: FieldProps) {
  return (
    <label className="field">
      <span className={labelHidden ? 'sr-only' : 'label'}>{label}</span>
      {children}
      <ErrorMessage error={error ?? null} />
    </label>
  );
}
