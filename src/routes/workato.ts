import { Dataset, createPlaywrightRouter} from 'crawlee';
import { adapters } from '../workato.js'

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    
    await enqueueLinks({
        selector: 'a[class="adapter-list__item-link"]',
        label: 'detail',
    });

});

router.addHandler('detail', async ({ request, page, log }) => {
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    const name = (await page.locator('h1.apps-page__head-title').innerText())?.replace(' integrations and automations', '') as string;
    const description = await page.locator('meta[name="description"]').getAttribute('content') ?? null;

    const app_name = (url?.split('/').at(-1)) ?? "";
    const triggers = adapters[app_name]["triggers"];
    const actions = adapters[app_name]["actions"];

    // fetch templates
    const response = await fetch(`https://app.workato.com/lists/fetch?page=1&per_page=8&context=search_flows&context_id=app:"${name}"`);
    const templates = JSON.parse(await response.text());
    
    await Dataset.pushData({
        name,
        description,
        triggers,
        actions,
        templates,
        url
    });
});