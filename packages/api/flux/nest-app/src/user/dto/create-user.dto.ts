


export class CreateUserDto {
    readonly fname: string;
    readonly mnames: string;
    readonly sname: string;
    readonly s: string;
    readonly addr_postcode: string;
    readonly addr_street_no: string;
    readonly addr_street: string;
    readonly addr_suburb: string;
    readonly addr_country: string;
    readonly detailsValid: boolean;
    readonly email: boolean;
    readonly candidature_federal: boolean;
    readonly volunteer: boolean;
    readonly contact_number: string;
    readonly ts: number;
    readonly dobYear: number;
    readonly dobMonth: number;
    readonly dobDay: number;
}
