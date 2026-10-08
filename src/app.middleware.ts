import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, NextFunction, Response } from 'express'

@Injectable()
export class TestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('request', req.params);
    next()
  }
}