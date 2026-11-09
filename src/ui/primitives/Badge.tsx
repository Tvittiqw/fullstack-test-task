type BadgeProps = { kind: 'status' | 'role'; value: string };

export function Badge({ kind, value }: BadgeProps) {
  const modifier = kind === 'role' ? 'role' : value;
  return <span className={`badge badge--${modifier}`}>{value}</span>;
}
