import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { MagicCardsModule } from 'src/magic/magic-cards.module';

@Module({
    imports:[MagicCardsModule],
    providers: [ProcessService],
    exports: [ProcessService]
})
export class ProcessModule {
}
