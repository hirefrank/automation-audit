import { createPlaywrightRouter} from 'crawlee';
import { workato_adapters, datasets } from './main.js';


export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    const url = request.url;
    
    if (url.includes("powerautomate.microsoft.com")) {
        await page.waitForLoadState('networkidle');
    
        await enqueueLinks({
            selector: 'li[class="connectors_list__parent"] a',
            label: 'pa-detail',
        });       
    };

    if (url.includes("zapier.com")) {
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
    
        await enqueueLinks({
            selector: 'a[data-testid="category-app-card--item"]',
            label: 'zapier',
        });

        await enqueueLinks({
            selector: 'a[data-testid="category-app-row--item"]',
            label: 'zapier',
        });
    };

    if (url.includes("workato.com")) {
        await enqueueLinks({
            selector: 'a[class="adapter-list__item-link"]',
            label: 'workato',
        });
    };

});

router.addHandler('zapier', async ({ request, page, log }) => {
    const service = 'zapier';
    await page.pause();

    let name: string | null = await page.locator('h1[class$="Heading-AppHeader__appNames"]').textContent();
    const url = request.loadedUrl;

    log.info(`${name}`, { url: url });

    const is_builtin: boolean = name?.includes("Zapier") || false;
    const categories = await page.locator('span[data-testid="v3-app-container__categories"] a').allTextContents();
    const description = await page.locator('div[class$="-AppDetails__appDescription"]').innerText();

    // only grabbing the first 9; first page
    const pairsWith = (await page.locator('div[class$="-AppIntegrationBrowser__gridWrapper"] h3[class$="-AppIntegrationSummary__appNameBase-AppIntegrationSummary__appNameClamped"]').allTextContents()).slice(0,9);
    
    const templates_css_id = 'div[data-testid="ZapCard__inner"]'
    const num_templates = await page.locator(templates_css_id).count();

    for (let i=0; i<num_templates; i++) {
        const title = await page.locator(`${templates_css_id} h2`).nth(i).textContent();
        const author = await page.locator(`${templates_css_id} span[class$="-ZapCard__authorName"]`).nth(i).textContent();
        const integrations = await page.locator(`${templates_css_id} div[class$="-ZapCard__metaInfoArea"]`).nth(i).textContent();

        await datasets.templates.pushData({
            service,
            title,
            description: null,
            author,
            type: null,
            usage_count: 0,
            integrations: integrations?.split(' + ')
        });

    }

    // // triggers
    await page.locator('button[aria-label="Triggers"]').click()
    const triggers = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();

    triggers.forEach(async (item: any) => {
        const title = item.trim();
        const description = null;
        const type = 'triggers';

        await datasets.connectors.pushData({
            service,
            name,
            type,
            title,
            description
        });
    });

    // actions
    await page.locator('button[aria-label="Actions"]').click()
    const actions = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();

    actions.forEach(async (item: any) => {
        const title = item.trim();
        const description = null;
        const type = 'actions';

        await datasets.connectors.pushData({
            service,
            name,
            type,
            title,
            description
        });
    });

    // check to see if tags exists
    let tag: string | null = null; 
    try {
        tag = (await page.getByTestId('explore-app-header__tags').textContent()) || null;
    } catch (error) {}
    
    if (tag !== null) name = `${name} (${tag})`; 

    await datasets.service.pushData({
        service,
        is_builtin,
        name,
        categories,
        description,
        pairsWith,
        url
    });

});


router.addHandler('pa-templates', async ({ request, page, response, log }) => {
    const service = 'power-automate';
    const url = request.loadedUrl;
    const title = await page.title();
    log.info("JSON response", { url: url });

    const res = (await response?.json()).value; 
    res.forEach(async (item: any) => {
        const title = item.Title.trim() ?? "";
        const description = item.Description.trim() ?? "";
        const author = item.Author.trim() ?? "";
        const type = item.TemplateType.trim() ?? "";
        const usage_count = item.UsageCount ?? 0;
        let integrations: string[] = [];
        (item.Icons).forEach((app: any) => {
            integrations.push(app.Name.trim());
        })

        await datasets.templates.pushData({
            service,
            title,
            description,
            author,
            type,
            usage_count,
            integrations
        });
    });
});

router.addHandler('pa-detail', async ({ request, page, enqueueLinks, log }) => {
    const service = 'power-automate';
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    let name: string = await page.locator('h1').innerText();
    const description: string | null = await page.locator('meta[name="description"]').getAttribute('content') ?? null;
    const app_name = (url?.split('/').at(-3)) ?? "";

    // check to see if tags exists
    let tag: string | null = null; 
    try {
        tag = (await page.locator('span.mc-label').textContent()) || null;
    } catch (error) {}
    
    if (tag !== null) name = `${name} (${tag})`; 

    await datasets.service.pushData({
        service,
        is_builtin: false,
        name,
        categories: [],
        description,
        pairsWith: [],
    });

    await enqueueLinks({
        urls: [`https://powerautomate.microsoft.com/en-us/api/connector/templates/?connectorName=${app_name}`],
        label: 'pa-templates',
    });
});

router.addHandler('workato', async ({ request, page, log }) => {
    const service = 'workato';
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    const name = (await page.locator('h1.apps-page__head-title').innerText())?.replace(' integrations and automations', '') as string;
    const description = await page.locator('meta[name="description"]').getAttribute('content') ?? null;

    // integrations
    await datasets.service.pushData({
        service,
        is_builtin: false,
        name,
        categories: [],
        description,
        pairsWith: [],
    });

    // connectors
    const app_name = (url?.split('/').at(-1)) ?? "";
    const triggers = workato_adapters[app_name]["triggers"] || [];
    const actions = workato_adapters[app_name]["actions"] || [];

    triggers.forEach(async (item: any) => {
        const title = item.title.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const description = item.description.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const type = 'triggers';

        await datasets.connectors.pushData({
            service,
            name,
            type,
            title,
            description
        });
    });

    actions.forEach(async (item: any) => {
        const title = item.title.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const description = item.description.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const type = 'actions';

        await datasets.connectors.pushData({
            service,
            name,
            type,
            title,
            description
        });
    });

    // fetch templates
    const response = await fetch(`https://app.workato.com/lists/fetch?page=1&per_page=8&context=search_flows&context_id=app:"${name}"`);
    const templates = await response.json();

    const res = templates.items; 
    res.forEach(async (item: any) => {
        const title = item.name.trim() ?? "";
        const description = item.description.trim() ?? "";
        const author = item.user_id ?? "";
        const type = item.TemplateType ?? "";
        const integrations = item.applications;
        const usage_count = item.copy_count ?? 0;
    
        await datasets.templates.pushData({
            service,
            title,
            description,
            author,
            type,
            usage_count,
            integrations
        });
    });
});