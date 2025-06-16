function toCamel(key: string) {
    return key.replace(/([-_]+[a-z])/gi, $1 => $1.toUpperCase().replace(/[-_]+/g, ''));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformAPIKeyToCamel(input: object): any {
    if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean' || input === null) {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map(transformAPIKeyToCamel);
    }
    return Object.entries(input).reduce((accumulator, currentValue) => {
        const [key, value] = currentValue;
        const camelKey = toCamel(key);

        let camelValue: unknown = value;
        if (Array.isArray(value)) camelValue = value.map(transformAPIKeyToCamel);
        else if (typeof value === 'object' && value !== null) {
            camelValue = transformAPIKeyToCamel(value);
        }

        return {
            ...accumulator,
            [camelKey]: camelValue
        };
    }, {});
}

const camelToSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformCamelToSnake(input: object): any {
    if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean' || input === null) {
        return input;
    }
    if (Array.isArray(input)) {
        return input.map(transformCamelToSnake);
    }
    return Object.entries(input).reduce((accumulator, currentValue) => {
        const [key, value] = currentValue;
        const snakeKey = camelToSnakeCase(key);

        let snakeValue: unknown = value;
        if (Array.isArray(value)) snakeValue = value.map(transformCamelToSnake);
        else if (typeof value === 'object' && value !== null) {
            snakeValue = transformCamelToSnake(value);
        }

        return {
            ...accumulator,
            [snakeKey]: snakeValue
        };
    }, {});
}
