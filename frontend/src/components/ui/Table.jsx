import React from "react";

export const Table = ({ columns, data = [], emptyMessage = "No records found" }) => {
  return (
    <div className="overflow-x-auto w-full border border-gray-200 rounded-xl bg-white shadow-xs">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider font-semibold text-gray-500">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-3.5">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row._id || rowIndex} className="hover:bg-gray-50/80 transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
