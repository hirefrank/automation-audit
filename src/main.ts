// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration, Dataset } from 'crawlee';
import { router } from './routes.js';

const startUrls = ['https://zapier.com/apps'];

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    headless: true
});

await crawler.run(startUrls);
await Dataset.exportToCSV('output');

