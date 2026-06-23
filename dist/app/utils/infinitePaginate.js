"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.infinitePaginate = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const infinitePaginate = (model_1, query_1, skip_1, limit_1, ...args_1) => __awaiter(void 0, [model_1, query_1, skip_1, limit_1, ...args_1], void 0, function* (model, query, skip, limit, populate = [], selectFields // Optional: fields to select from populated documents
) {
    const baseQuery = {};
    let dbQuery = model.find(query);
    // Populate with optional field selection
    populate.forEach((pop) => {
        if (typeof pop === 'string') {
            // If pop is a string, use it as the path
            if (selectFields) {
                dbQuery = dbQuery.populate(pop, selectFields);
            }
            else {
                dbQuery = dbQuery.populate(pop);
            }
        }
        else if (typeof pop === 'object' && pop !== null) {
            // If pop is an object with path and select
            dbQuery = dbQuery.populate(Object.assign(Object.assign({}, pop), { select: pop.select || selectFields }));
        }
    });
    const [data, total, filteredTotal] = yield Promise.all([
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
});
exports.infinitePaginate = infinitePaginate;
