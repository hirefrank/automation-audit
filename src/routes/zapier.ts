import { Dataset, createPlaywrightRouter} from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log }) => {
    // the number of times you want to click "load more"
    // initial page shows 30 items
    // each additional click is 10 items
    // ~1000 results
    const maxPages = 50;
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
    await page.pause();

    const name: string | null = await page.locator('h1[class$="Heading-AppHeader__appNames"]').textContent();
    const url = request.loadedUrl;

    log.info(`${name}`, { url: url });

    const is_zapier: boolean = name?.includes("Zapier") || false;
    const categories = await page.locator('span[data-testid="v3-app-container__categories"] a').allTextContents();
    
    // only grabbing the first 9; first page
    const pairsWith = (await page.locator('div[class$="-AppIntegrationBrowser__gridWrapper"] h3[class$="-AppIntegrationSummary__appNameBase-AppIntegrationSummary__appNameClamped"]').allTextContents()).slice(0,9);
    
    // just grabbing the first page
    const templates = await page.locator('section[id="zap-template-list"] a[class$="-ZapCard__link"]').allTextContents();

    // triggers
    await page.locator('button[aria-label="Triggers"]').click()
    const triggers = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();

    // actions
    await page.locator('button[aria-label="Actions"]').click()
    const actions = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();

    // check to see if premium flag exists
    let is_premium: boolean | null = false; 
    try {
        is_premium = (await page.getByTestId('explore-app-header__tags').textContent())?.includes("Premium") || false;
    } catch (error) {
        console.log(`${name} is not premium`);
    }
    
    // const dataset = await Actor.openDataset('some-name');

    await Dataset.pushData({
        name,
        is_zapier,
        is_premium,
        templates: templates.join(', \n'), 
        triggers: triggers.join(', \n'),
        actions: actions.join(', \n'),
        categories,
        pairsWith,
        url
    });
});