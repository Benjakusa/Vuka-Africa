export declare function forgotPassword(email: string): Promise<{
    message: string;
}>;
export declare function resetPassword(token: string, newPassword: string): Promise<{
    message: string;
}>;
