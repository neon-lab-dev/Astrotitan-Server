import { Counter } from "../counter.model";

export async function generateInvoiceId(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoiceCounter" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const value = counter.value;

  // 01 → 99 → 100 → 101
  return value < 100
    ? value.toString().padStart(2, "0")
    : value.toString();
}
