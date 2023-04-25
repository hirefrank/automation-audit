// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset} from 'crawlee';
import { router } from './routes/workato.js';

process.env.CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID = 'workato';

// get adapters (triggers and actions)
const response = await fetch('https://www.workato.com/_content/adapters-operations');
export const adapters = JSON.parse(await response.text());

const startUrls = ['https://www.workato.com/integrations'];

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    headless: true
});

await crawler.run(startUrls);
await Dataset.exportToCSV(process.env.CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID);

