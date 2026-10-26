function pagination(query) {
  const pageText = query.page ?? "1";
  const limitText = query.limit ?? "10";

  if (
    !/^[1-9]\d*$/.test(String(pageText)) ||
    !/^[1-9]\d*$/.test(String(limitText))
  ) {
    return { error: "page and limit must be positive integers" };
  }

  const page = Number(pageText);
  const limit = Math.min(Number(limitText), 50);

  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    !Number.isSafeInteger((page - 1) * limit)
  ) {
    return { error: "page and limit must be positive integers" };
  }

  return { page, limit, skip: (page - 1) * limit };
}

function meta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { pagination, meta };