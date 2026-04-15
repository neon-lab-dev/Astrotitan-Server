import { Counter } from "../counter.model";

export async function generateSequentialId(
  prefixOrCounterName: string,
  counterName?: string
) {
  let prefix = "";
  let counterKey = "";

  if (counterName) {
    prefix = prefixOrCounterName;
    counterKey = counterName;
  } else {
    counterKey = prefixOrCounterName;
  }

  const counter = await Counter.findOneAndUpdate(
    { name: counterKey },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const numberPart = counter.value.toString().padStart(3, "0");
  return `${prefix}${numberPart}`;
}