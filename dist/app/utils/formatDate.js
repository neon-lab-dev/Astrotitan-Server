"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
// utils/formatDate.ts
const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.toLocaleString("en-US", { month: "short" }); // e.g. "Jan", "Feb", etc.
    return `${day} ${month}, ${year}`;
};
exports.formatDate = formatDate;
