import { ApolloError } from "apollo-server-errors";

interface ErrorType {
    [key: string]: string;
}

export const errorTypes: ErrorType = {
    LOGIN_ALREADY_EXISTS:
        "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/login-already-in-use",
    INVALID_EMAIL: "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-email",
    INVALID_PASSWORD:
        "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-password",
    CUSTOMER_NOT_FOUND:
        "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/customer-not-found",
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
    CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
    PRODUCT_NOT_FOUND:
        "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/product-not-found",
    NO_STORE_SELECTED: "NO_STORE_SELECTED",
    PRODUCT_NOT_AVAILABLE: "PRODUCT_NOT_AVAILABLE",
    INVALID_CURRENT_PASSWORD:
        "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/update-password",
    BASKET_NOT_FOUND: "BASKET_NOT_FOUND",
    SHIPMENTS_NOT_FOUND: "SHIPMENTS_NOT_FOUND",
    EMPTY_BASKET: "EMPTY_BASKET",
    NO_PRODUCTS_TO_ADD: "NO_PRODUCTS_TO_ADD",
};

function getErrorType(type: string) {
    return Object.keys(errorTypes).find((key) => errorTypes[key] === type) ?? "INTERNAL_SERVER_ERROR";
}

export class CommerceError extends ApolloError {
    constructor(message: string, type = "INTERNAL_SERVER_ERROR") {
        super(message, getErrorType(type));
    }
}
