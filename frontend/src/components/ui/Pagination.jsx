import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
}) => {
  // If there are no items, show empty-friendly indicator
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        "...",
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ];
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (typeof page === "number" && page !== safeCurrentPage && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-sm text-gray-600 ${className}`}
    >
      {/* Items count & Page Size Selector */}
      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
        <p className="text-xs sm:text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
          <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
          entries
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Show</span>
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          aria-label="First page"
          onClick={() => handlePageClick(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors text-gray-600"
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => handlePageClick(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors text-gray-600"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-gray-400 select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageClick(p)}
                className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-900 text-white shadow-xs font-semibold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          aria-label="Next page"
          onClick={() => handlePageClick(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors text-gray-600"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          aria-label="Last page"
          onClick={() => handlePageClick(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors text-gray-600"
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
