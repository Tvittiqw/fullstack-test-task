import { Button } from './Button';

type PaginationProps = {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, limit, total, onChange }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const last = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="pagination">
      <span className="muted small">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination__controls">
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </Button>
        <span className="small">
          Page {page} of {last}
        </span>
        <Button
          size="sm"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
