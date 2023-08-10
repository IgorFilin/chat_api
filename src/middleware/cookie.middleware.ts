import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class cookieMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.cookies && req.cookies.authToken) {
    }
    const token = req.cookies.authToken;
    //  try{
    //   // const decodedToken = this.jwtService.verify(token)
    //  }
    console.log('set');
    next();
  }
}
