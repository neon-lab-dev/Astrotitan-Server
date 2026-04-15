import { z } from "zod";

const LoginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required." }),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required." }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    phoneNumber: z.string({ required_error: "Phone number is required." }),
    newPassword: z.string({ required_error: "Enter your new password." }),
  }),
});

export const AuthValidations = {
  LoginValidationSchema,
  refreshTokenValidationSchema,
  forgetPasswordValidationSchema,
  resetPasswordValidationSchema,
};
