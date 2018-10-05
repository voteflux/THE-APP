import { Module } from '@nestjs/common';
import {UserModule} from "@n/user/user.module";
import {AuthService} from "@n/auth/auth.service";

@Module({
    imports: [UserModule],
    providers: [AuthService, HttpStrategy]
})
export class AuthModule {}
