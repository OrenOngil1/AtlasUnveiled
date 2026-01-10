import type { Request } from "express";

export interface User {
    id: number
    name: string
};

export interface UserAccount extends User {
    hashedPassword: string
};

export interface AuthenticatedUser {
    user: User;
    accessToken: string;
    refreshToken: string;
};

export interface LoginRequest {
    username: string;
    password: string;
}


export interface Point {
    x: number;
    y: number;
};

export interface TimestampedPoint extends Point {
    timestamp: number;
};

export interface AuthenticatedRequest extends Request {
    userId?: number;
};

export const isStringNumeric = (str: string): boolean => /^\d+$/.test(str);

export const isString = (x: any): x is String => typeof x === "string";

export const isPoint = (x: any): x is Point => x != null && typeof x === "object" && typeof x.x === "number" && typeof x.y === "number";

export const isTimestampedPoint = (x: any): x is TimestampedPoint => x != null && typeof x === "object" && typeof x.x === "number" && typeof x.y === "number" && typeof x.timestamp === "number";