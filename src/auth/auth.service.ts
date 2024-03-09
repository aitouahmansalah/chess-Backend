import { Injectable,ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt/dist';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

    constructor(private prisma : PrismaService,
                private jwt: JwtService,
                private config: ConfigService) {}

    async signin(dto:AuthDto){

        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });

        if (!user){
            throw new ForbiddenException('email incorrect');
        }

        const pwMatches = await argon.verify(user.hash,dto.password);

        if(!pwMatches)
        throw new ForbiddenException('password incorrecr');

        return this.signToken(user.id,user.email);
    }

    async signup(dto:AuthDto){

        const hash = await argon.hash(dto.password);
        try{
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash,
            },
        });
        
        return this.signToken(user.id, user.email);
    }catch{
        throw new ForbiddenException('Credentials taken')
    }
    }

    async signToken(userId:number,email:string):Promise<{access_token:string}>{
        const data = {
            sub: userId,
            email
        }

        const token = await this.jwt.signAsync(data,{
            expiresIn: '15m',
            secret: this.config.get('JwtSecret')
        })
        
        return {
            access_token: token
        }
    }
}
