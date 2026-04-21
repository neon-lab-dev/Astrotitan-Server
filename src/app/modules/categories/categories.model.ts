import { Schema, model } from "mongoose";
import { TCategories } from "./categories.interface";

const CategoriesSchema = new Schema<TCategories>(
  {
    category: {
      type: String,
      required: true,
    },
    areaName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Categories = model<TCategories>("Categories", CategoriesSchema);

export default Categories