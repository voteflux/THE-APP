import {MiddlewareConsumer, MiddlewareFunction, Module, NestModule} from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';
import {UserModule} from "@n/user/user.module";
import {LoggerMiddleware} from "@n/logger/logger.middleware";
import {UserController} from "@n/user/user.controller";
import {Response} from "express";
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';



const cors: MiddlewareFunction = () => (req, res: Response, next) => {
    res.set('Access-Control-Allow-Origin', '*')
    // res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next()
}



@Module({
    imports: [ProfileModule, UserModule, AuthModule],
    providers: [AuthService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {

        consumer.apply(cors(), LoggerMiddleware)
            .forRoutes('*')

        // consumer.apply(AuthMiddleware)
        //     .with(AuthMiddleware.T.User)
        //     .forRoutes(UserController)
    }
}
