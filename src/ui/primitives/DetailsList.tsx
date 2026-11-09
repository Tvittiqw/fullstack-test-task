import { Fragment, type ReactNode } from 'react';

export type DetailsRow = { label: string; value: ReactNode };

type DetailsListProps = { rows: DetailsRow[] };

export function DetailsList({ rows }: DetailsListProps) {
  return (
    <dl className="details">
      {rows.map((row) => (
        <Fragment key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
