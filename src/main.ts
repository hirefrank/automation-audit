// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset, Configuration} from 'crawlee';
import { router } from './routes.js';


const dataset_names = {
    service: 'services',
    templates: 'templates',
    connectors: 'connectors'
}

export const datasets = {
    service: await Dataset.open(dataset_names.service),
    templates: await Dataset.open(dataset_names.templates),
    connectors: await Dataset.open(dataset_names.connectors)
}

// get workato adapters (triggers and actions)
const response = await fetch('https://www.workato.com/_content/adapters-operations');
export const workato_adapters = await response.json();

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    headless: true
});

const startUrls = [
    'https://powerautomate.microsoft.com/en-us/connectors/',
    'https://www.workato.com/integrations',
    'https://zapier.com/apps'
];

await crawler.run(startUrls);

await datasets.service.exportToCSV(dataset_names.service);
await datasets.templates.exportToCSV(dataset_names.templates);
await datasets.connectors.exportToCSV(dataset_names.connectors);