import { Injectable } from '@nestjs/common';
// import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async validateUser(token: string): Promise<any> {
        // Validate if token passed along with HTTP request
        // is associated with any registered account in the database
        return await this.usersService.findOneByToken(token);
    }
}
