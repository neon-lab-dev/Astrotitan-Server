"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CategoriesSchema = new mongoose_1.Schema({
    category: {
        type: String,
        required: true,
    },
    areaName: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
const Categories = (0, mongoose_1.model)("Categories", CategoriesSchema);
exports.default = Categories;
