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
    const name: string | null = await page.locator('h1[class$="Heading-AppHeader__appNames"]').textContent();
    const url = request.loadedUrl;

    log.info(`${name}`, { url: url });

    const is_zapier: boolean = name?.includes("Zapier") || false;
    const categories = await page.getByTestId('explore-app-header__categories').textContent();

    /* todo */
    // add triggers and action

    // check to see if premium flag exists
    let is_premium: boolean | null; 
    try {
        is_premium = (await page.getByTestId('explore-app-header__tags').textContent())?.includes("Premium") || false;
    } catch {
        is_premium = false;
    }

    // grab first 6 apps for pairing
    let pairsWith = [];
    for (let i=0; i < 6; i++) {
        try {
            pairsWith.push(await page.locator('span[class$="AppIntegrationSummary__summary"] h3').nth(i).textContent());
        } catch {
            break;
        }
    }

    // grab first 10 templates
    let templates = [];
    for (let i=0; i < 10; i++) {
        try {
            templates.push(await page.locator('h2[class$="-Heading-ZapCard__title"]').nth(i).textContent());
        } catch {
            break;
        }
    }

    await Dataset.pushData({
        name,
        is_zapier,
        is_premium,
        categories,
        pairsWith: pairsWith.join(', '),
        templates: templates.join(', '),
        url
    });
});