export function escapeRegex(string) {
  if (!string || typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getPaginationParams(request, defaultSize = 10) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const size = Math.max(1, parseInt(searchParams.get("size") || defaultSize));
  const skip = (page - 1) * size;

  return { page, size, skip };
}

export async function paginationQuery(
  collection,
  query = {},
  request,
  datakey = "data",
  defaultSize = 10,
) {
  const { page, size, skip } = getPaginationParams(request, defaultSize);

  const [items, total] = await Promise.all([
    collection.find(query).skip(skip).limit(size).toArray(),
    collection.countDocuments(query),
  ]);

  return {
    [datakey]: items,
    pagination: {
      total,
      totalPage: Math.ceil(total / size),
      currentPage: page,
      size,
    },
  };
}

export async function paginationAggregate(
  collection,
  pipeline = [],
  request,
  datakey = "data",
  defaultSize = 10,
) {
  const { page, size, skip } = getPaginationParams(request, defaultSize);

  const [items, countResult] = await Promise.all([
    collection
      .aggregate([...pipeline, { $skip: skip }, { $limit: size }])
      .toArray(),
    collection.aggregate([...pipeline, { $count: "total" }]).toArray(),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    [datakey]: items,
    pagination: {
      total,
      totalPage: Math.ceil(total / size),
      currentPage: page,
      size,
    },
  };
}
