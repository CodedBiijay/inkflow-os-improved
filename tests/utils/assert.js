
export const assert = {
    ok: (value, message) => {
        if (!value) throw new Error(message || "Assertion failed: value is falsy");
    },
    equal: (actual, expected, message) => {
        if (actual !== expected) throw new Error(message || `Expected ${expected}, got ${actual}`);
    },
    status: (res, expectedStatus, message) => {
        if (res.status !== expectedStatus) throw new Error(message || `Expected status ${expectedStatus}, got ${res.status}`);
    },
    includes: (arrayOrString, item, message) => {
        if (!arrayOrString.includes(item)) throw new Error(message || `Expected ${arrayOrString} to include ${item}`);
    }
};
