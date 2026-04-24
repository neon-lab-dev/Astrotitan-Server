/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const infinitePaginate = async (
model: any, query: any, skip: number, limit: number, populate: any[] = [], p0?: ({ $sort: { createdAt: number; }; $skip?: undefined; $limit?: undefined; } | { $skip: number; $sort?: undefined; $limit?: undefined; } | { $limit: number; $sort?: undefined; $skip?: undefined; })[]) => {
  const baseQuery = {};

  let dbQuery = model.find(query);

  populate.forEach((pop) => {
    dbQuery = dbQuery.populate(pop);
  });

  const [data, total, filteredTotal] = await Promise.all([
    dbQuery.skip(skip).limit(limit).sort({ createdAt: -1 }),
    model.countDocuments(baseQuery),
    model.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      total,
      filteredTotal,
      skip,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
      hasMore: skip + data.length < filteredTotal,
    },
  };
};