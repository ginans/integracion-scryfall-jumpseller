import { Module } from '@nestjs/common';
import { DefontanaService } from './defontana.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DefontanaToken, DefontanaTokenSchema } from './entities/defontana.entity';
import {DefontanaCredential, DefontanaCredentialSchema} from "./entities/defontana.credential.entity";

@Module({
  controllers: [],
  imports: [
    MongooseModule.forFeature([
      { name: DefontanaToken.name, schema: DefontanaTokenSchema },
      { name: DefontanaCredential.name, schema: DefontanaCredentialSchema },
    ]),
  ],
  providers: [DefontanaService],
  exports: [DefontanaService],
})
export class DefontanaModule {}
