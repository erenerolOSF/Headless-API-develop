/* eslint-disable @typescript-eslint/no-explicit-any */
interface ObjectLiteral {
    [key: string]: any;
}

const toCamel = (s: string): string => {
    return s.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace("-", "").replace("_", "");
    });
};

const isArray = function (a: any): boolean {
    return Array.isArray(a);
};

const isObject = function (o: any): boolean {
    return o === Object(o) && !isArray(o) && typeof o !== "function";
};

export const keysToCamel = function (o: any) {
    if (isObject(o)) {
        const n: ObjectLiteral = {};

        Object.keys(o).forEach((k) => {
            n[toCamel(k)] = keysToCamel(o[k]);
        });

        return n;
    } else if (isArray(o)) {
        return o.map((i: any) => {
            return keysToCamel(i);
        });
    }

    return o;
};
