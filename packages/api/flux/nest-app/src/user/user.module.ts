import {DB} from "../../../db";
import {fromNullable, Option} from "fp-ts/lib/Option";
import {UserV1Object} from "flux-lib/types/db";


import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserSchema } from './schemas/user.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule {
    constructor(private readonly db: DB) {}

    async findUserByToken(token: string): Promise<Option<UserV1Object>> {
        return fromNullable(await this.db.getUserFromS(token))
    }
}
