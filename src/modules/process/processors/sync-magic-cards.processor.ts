import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { IEnumLangUrl } from '../../magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';


@Processor('sync-magic-cards')
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    @InjectQueue('create-magic-cards') private readonly CreateMagicCards: Queue<{ card: ScryfallCardResponse}, string, string>,
  ) {
    super();
  }
  async process(job: Job<{lang: IEnumLangUrl}, { count: number }, string>): Promise<number> {
    const lg: IEnumLangUrl = job.data.lang
    let count: number = 0;
    try {
      await job.updateProgress(50);
      let page = 1;
      let process = true;
      do {
        const { data, has_more } = await this.scryfallService.getScryfallCards(lg, page);
        await Promise.all(
          data.map(row => this.CreateMagicCards.add(`Card:${row.id}`, { card: row },{jobId: row.id}))
        );
        count += data.length;
        process = has_more;
        //if (page == 1) process = false;
        page++;
        //delay para evitar sobrecarga de peticiones
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de espera
      } while (process);
      await job.updateProgress(100);
      return count;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}