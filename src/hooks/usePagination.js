import { useState } from "react";

const usePagination = (data = [], itemsPerPage = 5) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(data.length / itemsPerPage)
  );

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    setCurrentPage(
      Math.min(Math.max(1, page), totalPages)
    );
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage: goToPage,
  };
};

export default usePagination;