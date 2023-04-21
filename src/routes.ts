import { Dataset, createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log }) => {
    // the number of times you want to click "load more"
    // initial page shows 30 items
    // each additional click is 10 items
    const maxPages = 5;
    for (let i=0; i<maxPages; i++) {
        console.log(`clicking load more -- ${i} times`);
        await page.pause();
        await page.waitForSelector('div[class$="-CategoryAppTable__loadMore"]'); 
        await page.locator('text=Load more').click()
    }

    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        selector: 'a[data-testid="category-app-card--item"]',
        label: 'detail',
    });
    await enqueueLinks({
        selector: 'a[data-testid="category-app-row--item"]',
        label: 'detail',
    });

});

router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    const url = request.loadedUrl;

    log.info(`${title}`, { url: url });

    let name;
    let categories;
    let pairsWith;

    /* todo */
    // add pairsWith
    // add templates
    // add triggers and action
    // add rank for each integration

    name = await page.locator('h1[class$="Heading-AppHeader__appNames"]').textContent();
    categories = (await page.locator('ul[aria-label="Possible categories"]').textContent())?.replace(/([a-z])([A-Z])/g, '$1, $2');

    await Dataset.pushData({
        name,
        categories,
        url
    });
});