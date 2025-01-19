import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Provider, providerSchema } from './entities/provider.entity';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService],
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: providerSchema },
    ]),
    ConfigModule,
  ],
  exports: [ProvidersService],
})
export class ProvidersModule {}
