import {Injectable, MiddlewareFunction, NestMiddleware} from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    resolve(...args: any[]): MiddlewareFunction {
        return (req, res, next) => {
            console.log("Got request here to log:", req)
            next();
        };
    }
}
