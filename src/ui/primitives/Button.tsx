import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  pending = false,
  pendingLabel,
  type = 'button',
  disabled,
  children,
  ...button
}: ButtonProps) {
  const className = ['btn', `btn--${variant}`, size === 'sm' ? 'btn--sm' : '']
    .join(' ')
    .trim();
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || pending}
      {...button}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
