const rules = [
    {
        check: (str: string): boolean => str.length >= 8,
        message: "Password must be at least 8 characters long"
    },
    {
        check: (str: string): boolean => /[A-Z]/.test(str),
        message: "Password must contain at least one uppercase letter"
    },
    {
        check: (str: string): boolean => /[a-z]/.test(str),
        message: "Password must contain at least one lowercase letter"
    },
    {
        check: (str: string): boolean => /\d/.test(str),
        message: "Password must contain at least one digit"
    }
];

// validates password strength against defined rules
export const validatePasswordStrength = (password: string): string[] => {
    return rules
        .filter(rule => !rule.check(password)) // filter rules that the password does not satisfy
        .map(rule => rule.message); // return the respective error messages
};