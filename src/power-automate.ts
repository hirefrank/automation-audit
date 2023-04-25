// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset} from 'crawlee';
import { router } from './routes/power-automate.js';

process.env.CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID = 'power-automate';

const startUrls = ['https://powerautomate.microsoft.com/en-us/connectors/'];

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    headless: true
});

await crawler.run(startUrls);
await Dataset.exportToCSV(process.env.CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID);

