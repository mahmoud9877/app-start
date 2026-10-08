import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TestMiddleware } from './app.middleware';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  //implements NestModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(TestMiddleware).forRoutes('/:id');
  // }
}
