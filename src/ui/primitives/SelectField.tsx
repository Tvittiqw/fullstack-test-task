import type { ComponentProps } from 'react';
import { Field } from './Field';

type SelectFieldProps = Omit<ComponentProps<'select'>, 'size'> & {
  label: string;
  labelHidden?: boolean;
  error?: string;
  size?: 'md' | 'sm';
};

export function SelectField({
  label,
  labelHidden,
  error,
  size = 'md',
  ...select
}: SelectFieldProps) {
  return (
    <Field label={label} labelHidden={labelHidden} error={error}>
      <select
        className={size === 'sm' ? 'select select--sm' : 'select'}
        aria-invalid={error !== undefined}
        {...select}
      />
    </Field>
  );
}
