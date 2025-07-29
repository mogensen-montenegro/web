export interface TokenInterface {
    token: string | null;
    refreshToken: string | null;
}

export interface LoginResponse extends TokenInterface {
    '@odata.context': string,
    SessionId: string,
    Version: string,
    SessionTimeout: number
}

export interface LoginDataRequest {
    CompanyDB: string,
    UserName: string,
    Password: string,
}
