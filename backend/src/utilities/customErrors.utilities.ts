export class UserAlreadyExistsError extends Error {
    constructor() {
        super("User Already Exists");
        console.log(`initializing error with message=${this.message}`)
        this.name = "UserAlreadyExistsError";
    }
}

export class WeakPasswordError extends Error {
    constructor() {
        super("Weak Password");
        this.name = "WeakPasswordError";
    }
}

export class UserNotFoundError extends Error {
    constructor() {
        super("User Not Found");
        this.name = "UserNotFoundError";
    }
}