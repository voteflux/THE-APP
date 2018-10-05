import {Body, Controller, Get, Post, ReflectMetadata, Req, UseGuards} from '@nestjs/common';
import { User } from './interfaces/user.interface';
import {Roles} from "@n/roles.decorator";
import {RolesGuard} from "@n/roles.guard";
import {AuthGuard} from '@nestjs/passport';

@Controller('user')
@UseGuards(RolesGuard)
export class UserController {
    constructor(private readonly db) {}

    @Get('getSelf')
    @UseGuards(AuthGuard('bearer'))
    async myDetails(@Req() req): Promise<User> {
        return 'This action returns all cats';
    }

    @Post('updateSelf')
    @Roles('user')
    async update(@Req() req, @Body() body) {

    }


}
