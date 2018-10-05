import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Observable} from 'rxjs';
import {Reflector} from "@nestjs/core";
import {Request} from "express";


const magicBTF = () => ({})


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {

        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true
        }
        const request: Request = context.switchToHttp().getRequest();
        const bearerToken = request.header("Authorization")
        const user = magicBTF(bearerToken)
    }
}
