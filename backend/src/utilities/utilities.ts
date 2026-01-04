export interface UserData {
    id: number
    name: string
    //token: string
};

export interface Point {
    x: number,
    y: number
};

export const isStringNumeric = (str: string): boolean => /^\d+$/.test(str);

export const isString = (x: any): x is String => typeof x === "string";

export const isPoint = (x: any): x is Point => x != null && typeof x === "object" && typeof x.x === "number" && typeof x.y === "number";