import { Counter } from "../counter.model";


export async function generateJobId(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { name: "jobId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const numberPart = counter.value.toString().padStart(4, "0");

  return numberPart;
}
