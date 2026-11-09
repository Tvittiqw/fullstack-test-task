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
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        <span className="small">
          Page {page} of {last}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
