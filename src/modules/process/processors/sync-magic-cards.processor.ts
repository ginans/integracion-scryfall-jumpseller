import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { IEnumLangUrl } from '../../magic/submodules/scryfall/enums/lang.enum';


@Processor('sync-magic-cards')
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    @InjectQueue('queues-get-magic-cards') private readonly QueuesGetMagicCards: Queue,
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
        for(let row of data){
          await this.QueuesGetMagicCards.add(lg, row);
        }
        count += data.length;
        //process = has_more;
        if (page == 1) {
          process = false;
        }
        page++;
      } while (process);
      await job.updateProgress(100);
      return count;
    } catch (error) {
      //throw new Error(`Job failed at step: ${error.message}`);
      return error;
    }
  }
}