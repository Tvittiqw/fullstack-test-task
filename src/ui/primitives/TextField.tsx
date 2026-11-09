import type { ComponentProps } from 'react';
import { Field } from './Field';

type TextFieldProps = Omit<ComponentProps<'input'>, 'size'> & {
  label: string;
  labelHidden?: boolean;
  error?: string;
  size?: 'md' | 'sm';
};

export function TextField({
  label,
  labelHidden,
  error,
  size = 'md',
  ...input
}: TextFieldProps) {
  return (
    <Field label={label} labelHidden={labelHidden} error={error}>
      <input
        className={size === 'sm' ? 'input input--sm' : 'input'}
        aria-invalid={error !== undefined}
        {...input}
      />
    </Field>
  );
}
