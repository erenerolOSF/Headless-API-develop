export class CommerceUser {
    constructor(
        readonly accessToken: string,
        readonly refreshToken: string,
        readonly customerId: string,
        readonly usid: string
    ) {}
}
