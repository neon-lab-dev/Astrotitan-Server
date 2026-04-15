/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';

export const createToken = (jwtPayload: { email: string, role: string, _id: string, roleBasedId: string }, secret: any, expiresIn: any) => {
    return jwt.sign(jwtPayload, secret, { expiresIn });
};