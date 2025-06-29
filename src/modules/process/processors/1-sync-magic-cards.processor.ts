import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';

@Processor('1-sync-magic-cards')
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    @InjectQueue('2-save-magic-cards')
    private readonly SaveMagicCards: Queue<
      { card: ScryfallCardResponse; totalCards: number },
      string,
      string
    >,
  ) {
    super();
  }
  async process(
    job: Job<{ lang: ILangUrlEnum }, { count: number }, string>,
  ): Promise<number> {
    const lg: ILangUrlEnum = job.data.lang;
    let count: number = 0;
    const allCards: ScryfallCardResponse[] = [];
    try {
      await job.updateProgress(50);
      let page = 1;
      let process = true;
      do {
        const data = await this.scryfallService.getScryfallCards(lg, page);
        allCards.push(...data.data);
        count += data.data.length;
        /**
         * Para probar el flujo de solo 1 card, descomentar la siguiente línea
         * await this.SaveMagicCards.add(`Card:${data[0].id}`, { card: data[0] },{jobId: data[0].id, })
         */
        await Promise.all(
          allCards.map((card) =>
            this.SaveMagicCards.add(
              `Card:${card.id}`,
              {
                card: card,
                totalCards: count,
              },
              {
                jobId: card.id,
                priority: 1,
              },
            ),
          ),
        );
        // process = data.has_more;
        /**
         * Para probar el flujo de solo 1 página, descomentar la siguiente línea;
         */
        if (page == 1) process = false;
        // page++;
        await new Promise((resolve) => setTimeout(resolve, 300));
      } while (process);
      await job.updateProgress(100);
      return count;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
