type Customer = {
    email: string;
    firstName: string;
    lastName: string;
    login: string;
};

export interface RegisterArgs {
    customer: Customer;
    password: string;
    accessToken: string;
    siteId: string;
}
