import type { ClientRule } from "../utilities/utilities";


type Rule = ClientRule & {
    check: (password: string, value?: number | boolean) => boolean;
};

export const rules: Rule[] = [
    {
        type: "minLength",
        value: 8,
        message: 'At least 8 characters',
        check: (str: string, value?: number | boolean): boolean => str.length >= (value as number)
    },
    {
        type: "requireUppercase",
        value: true,
        message: 'One uppercase letter (A-Z)',
        check: (str: string): boolean => /[A-Z]/.test(str)
    },
    {
        type: "requireLowercase",
        value: true,
        message: 'One lowercase letter (a-z)',
        check: (str: string): boolean => /[a-z]/.test(str)
    },
    {
        type: "requireNumber",
        value: true,
        message: 'One number (0-9)',
        check: (str: string): boolean => /\d/.test(str)
    },
    {
        type: "requireSpecial",
        value: true,
        message: 'One special character',
        check: (str: string): boolean => /[!@#$%^&*(),.?":{}|<>]/.test(str)
    }
];

/**
 * Validates password strength against defined rules
 * @param {string} password - Password to validate
 * @returns {string[]} Array of error messages for failed rules (empty if valid)
 */
export const validatePasswordStrength = (password: string): string[] => {
    return rules
        .filter(rule => !rule.check(password, rule.value)) // filter rules that the password does not satisfy
        .map(rule => rule.message); // return the respective error messages
};