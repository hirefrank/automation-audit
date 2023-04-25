import { Dataset, createPlaywrightRouter} from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    await page.waitForLoadState('networkidle');

    await enqueueLinks({
        selector: 'li[class="connectors_list__parent"] a',
        label: 'detail',
    });

});

router.addHandler('detail', async ({ request, page, log }) => {
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    const name: string = await page.locator('h1.mc-connector-details__heading').innerText();
    const description: string | null = await page.locator('meta[name="description"]').getAttribute('content') ?? null;

    const templates: object = {
        "integrations": "",
        "description": "",
        "author": "",
        "details": "",
        "count": ""
    }
    
    await Dataset.pushData({
        name,
        description,
        templates,
        url
    });
});