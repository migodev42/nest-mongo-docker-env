import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';

const url = process.env.MONGO_URL || 'localhost';

@Module({
  // imports: [MongooseModule.forRoot(`mongodb://${url}:27017/test`)],
  controllers: [AppController],
  providers: [AppService],
  imports: [
    MongooseModule.forRoot(
      `mongodb://${url}:27017?serverSelectionTimeoutMS=2000&authSource=admin`,
    ),
  ],
})
export class AppModule {}
