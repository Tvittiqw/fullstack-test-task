type TableSkeletonProps = { columns: number; rows?: number };

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row}>
      {Array.from({ length: columns }, (_, column) => (
        <td key={column}>
          <span className="skeleton" />
        </td>
      ))}
    </tr>
  ));
}
