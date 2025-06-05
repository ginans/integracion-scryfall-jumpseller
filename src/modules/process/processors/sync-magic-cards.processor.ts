import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';


@Processor('1-sync-magic-cards')
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    @InjectQueue('2-create-magic-cards') private readonly CreateMagicCards: Queue<{ card: ScryfallCardResponse }, string, string>,
  ) {
    super();
  }
  async process(job: Job<{lang: ILangUrlEnum}, { count: number }, string>): Promise<number> {
    const lg: ILangUrlEnum = job.data.lang
    let count: number = 0;
    try {
      await job.updateProgress(50);
      let page = 1;
      let process = true;
      do {
        const { data, has_more } = await this.scryfallService.getScryfallCards(lg, page);
        /**
         * Para probar el flujo de solo 1 card, descomentar la siguiente línea
         * await this.CreateMagicCards.add(`Card:${data[0].id}`, { card: data[0] },{jobId: data[0].id, })
         */
        await Promise.all(
          data.map(row => this.CreateMagicCards.add(`Card:${row.id}`, { card: row },{jobId: row.id, }))
        );
        count += data.length;
        process = has_more;
        /**
         * Para probar el flujo de solo 1 página, descomentar la siguiente línea;
         */
        // if (page == 1) process = false;
        page++;
        await new Promise(resolve => setTimeout(resolve, 300));
      } while (process);
      await job.updateProgress(100);
      return count;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}