export const generateOtp = (digits: number = 4): string => {
  if (digits < 1) {
    throw new Error("Number of digits must be at least 1");
  }
  
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};