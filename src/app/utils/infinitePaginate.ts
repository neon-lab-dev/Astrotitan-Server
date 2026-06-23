/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const infinitePaginate = async (
  model: any,
  query: any,
  skip: number,
  limit: number,
  populate: any[] = [],
  selectFields?: string | string[] // Optional: fields to select from populated documents
) => {
  const baseQuery = {};

  let dbQuery = model.find(query);

  // Populate with optional field selection
  populate.forEach((pop) => {
    if (typeof pop === 'string') {
      // If pop is a string, use it as the path
      if (selectFields) {
        dbQuery = dbQuery.populate(pop, selectFields);
      } else {
        dbQuery = dbQuery.populate(pop);
      }
    } else if (typeof pop === 'object' && pop !== null) {
      // If pop is an object with path and select
      dbQuery = dbQuery.populate({
        ...pop,
        select: pop.select || selectFields
      });
    }
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