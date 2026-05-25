import React from 'react';

interface TableSkeletonProps {
  rows: number;
  cols: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows, cols }) => {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: cols });

  return (
    <div className="w-full overflow-hidden border border-slate-100 rounded-3xl bg-white shadow-sm animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              {colArray.map((_, colIdx) => (
                <th key={`head-${colIdx}`} className="p-4">
                  <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowArray.map((_, rowIdx) => (
              <tr key={`row-${rowIdx}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                {colArray.map((_, colIdx) => (
                  <td key={`cell-${rowIdx}-${colIdx}`} className="p-4">
                    <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
