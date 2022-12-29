const { exec, spawn } = require("child_process");
const { mkdirSync, readFileSync, existsSync } = require('fs')
const shellExec = async (cmd, options) => {
    try {
        const stdout = []
        return new Promise((resolve, reject) => {
            const processRun = spawn(cmd, { shell: true });
            if (options.stdout) {
                processRun.stdout.on('data', (data) => {
                    stdout.push(data.toString())
                });
            }
            if (options.log) {
                processRun.stdout.on('data', (data) => {
                    console.log('process log:', data.toString());
                });
            }

            processRun.on('error', (code) => {
                reject(code)
            });
            processRun.on('close', (code) => {
                resolve({ code: code, stdout: stdout.join('\n') })
            });
        })
    } catch (error) {
        return { code: 999 }
    }
}

const execPromise = (command) => {
    return new Promise(function (resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve(null);
                return;
            }

            resolve(stdout.trim());
        });
    });
}

const deplay = async (milliseconds) => new Promise(r => setTimeout(r, milliseconds));

const getArgs = () => {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach(arg => {
            // long arg
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : true;
                args[longArgFlag] = longArgValue;
            }
            // flags
            else if (arg[0] === '-') {
                const flags = arg.slice(1, arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
        });
    return args;
}

const args = getArgs();

Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
    return this;
};

const randomTrueOrFalse = () => Math.floor(Math.random() * 2)

const AutoTraffic = class {
    constructor(arrLink) {
        this.arrLinks = arrLink
        this.checked = false
        this.browser = null
    }

    logger(type, message) {
        console.log(`[${type}]: ${message}`)
    }

    exitApp(message) {
        message ? this.logger('MAIN', message) : 0;
        this.logger('MAIN', 'Force exit process!')
        process.exit(0)
    }

    async checkPackage() {

        try {
            const listPackage = ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1']

            const check = await execPromise(`npm ls ${listPackage.join(' ')}`)
            if (check === null) {
                await execPromise(`npm i ${listPackage.join(' ')}`)
                this.logger('CHECK', 'Package install succes!')
                this.checked = true
                return
            }

            const arrPackageNotFound = []
            for (const packageName of listPackage) {
                if (!check.includes(packageName)) arrPackageNotFound.push(packageName)
            }

            if (arrPackageNotFound.length) {
                this.logger('CHECK', 'Installing ' + arrPackageNotFound.join(' '))
                await execPromise(`npm i ${arrPackageNotFound.join(' ')}`)
                this.logger('CHECK', 'Package install succes!')
                this.checked = true
                return
            }
            this.logger('CHECK', 'Package is installed!')
            this.checked = true

        } catch (error) {
            this.logger('CHECK', 'error with ' + error)
            this.exitApp()
        }

    }

    async createBrowser() {
        try {

            // const listResolution = [{ screenWidth: 1280, screenHeight: 720 }, { screenWidth: 1366, screenHeight: 768 }, { screenWidth: 1600, screenHeight: 900 }, { screenWidth: 1920, screenHeight: 1080 }, { screenWidth: 2560, screenHeight: 1440 }, { screenWidth: 720, screenHeight: 1280 }, { screenWidth: 768, screenHeight: 1366 }, { screenWidth: 900, screenHeight: 1600 }, { screenWidth: 1080, screenHeight: 1920 }, { screenWidth: 1440, screenHeight: 2560 }];
            // const resolution = listResolution[Math.floor(Math.random() * listResolution.length)]

            const browserConfig = JSON.parse(readFileSync('./browserConfig.json', { encoding: 'utf-8' }))

            const options = {
                userDataDir: "./test-browser-proxy",
                // ignoreHTTPSErrors: true,
                // devtools:1,
                headless: 1,
                // defaultViewport: {
                //     width: browserConfig.screenWidth,
                //     height: browserConfig.screenHeight
                // },
                args: [
                    `--window-size=${browserConfig.screenWidth},${browserConfig.screenHeight}`,
                    "--no-sandbox",
                ],
            }

            this.logger('MAIN', 'Browser is starting...');
            const puppeteerVanilla = require('puppeteer')
            const { addExtra } = require('puppeteer-extra')
            const puppeteer = addExtra(puppeteerVanilla)
            // puppeteer-extra plugin
            const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
            stealthPlugin.enabledEvasions.delete("user-agent-override");
            puppeteer.use(stealthPlugin)

            const UserAgentOverride = require("puppeteer-extra-plugin-stealth/evasions/user-agent-override");
            const pluginUserAgentOverride = UserAgentOverride(browserConfig);
            puppeteer.use(pluginUserAgentOverride);

            // end puppeteer-extra plugin
            // rmSync(options.userDataDir, { recursive: true, force: true });
            if (!existsSync(options.userDataDir)) mkdirSync(options.userDataDir)
            this.browser = await puppeteer.launch(options);
            this.logger('MAIN', 'Browser is started!');

        } catch (error) {
            this.logger('MAIN', 'Browser create error with ' + error)
            if (error.message.includes('Cannot find module')) {
                try {
                    this.logger('MAIN', 'Reinstall package')
                    await shellExec('npm i ' + ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1'].join(' '), { stdout: false })
                    await this.createBrowser()
                } catch (error) {
                    this.exitApp()
                }
            }
            this.exitApp()
        }
    }

    async run() {
        const decipher = salt => {
            const textToChars = text => text.split('').map(c => c.charCodeAt(0));
            const applySaltToChar = code => textToChars(salt).reduce((a, b) => a ^ b, code);
            return encoded => encoded.match(/.{1,2}/g)
                .map(hex => parseInt(hex, 16))
                .map(applySaltToChar)
                .map(charCode => String.fromCharCode(charCode))
                .join('');
        }
        const myDecipher = decipher('redocoem')

        const { path } = require("ghost-cursor")

        const dataBot = {
            tabAds: null,
            clickAds: false,
            step: null,
            isPageNumber: 1,
            clickLink: 0,
            mode: "seo",
            domain: null,
            listSeo: JSON.parse(myDecipher(readFileSync('./dataRun', { encoding: 'utf-8' }))),
        };

        // dao vi tri cua cach tu khoa trong listSeo

        for (let index = 0; index < dataBot.listSeo.length; index++)
            dataBot.listSeo.move(
                index,
                Math.floor(Math.random() * dataBot.listSeo.length)
            );

        const openLink = async (page) => {

            if (!dataBot.listSeo.length) {
                this.logger('BROWSER', 'Done! exit browser');
                await this.browser.close();
                process.exit(0);
            }

            const linkData = dataBot.listSeo[0]
            dataBot.domain = linkData.url[0].split('//')[1].split('/')[0]
            this.logger('BROWSER', `run ${linkData.url[0]}`);
            if (linkData.mode === 'view') {

                dataBot.step = true
                await page.goto(linkData.url[0], {
                    waitUntil: "networkidle0",
                    referer: `https://${dataBot.domain}/search?q=${linkData.key.trim().replace(/ /g, '%20')}`
                    // timeout: 0,
                });
                return;
            }
            if (dataBot.mode === 'seo') {

                this.logger('BROWSER', `run search ${linkData.url[0]}`);
                await page.goto("https://www.google.com/", {
                    waitUntil: "networkidle0",
                    // timeout: 0,
                });
                return;
            }

            await page.goto(linkData.url[0], {
                waitUntil: "networkidle0",
                referer: `https://${dataBot.domain}/search?q=${linkData.key.trim().replace(/ /g, '%20')}`
                // timeout: 0,
            });
        }

        const isScrollEnd = async (page, mode, randomStop) => {
            const isBottom = await page.evaluate((mode, randomStop) => {

                if (mode === 1) return (document.scrollingElement.scrollTop + window.innerHeight + randomStop < document.scrollingElement.scrollHeight)
                else return (document.scrollingElement.scrollTop - randomStop) > 0

            }, mode, randomStop);
            return isBottom;
        };

        const autoScroll = async (page, upOrDown) => {
            const randomStop = Math.floor(Math.random() * 250)
            for (let index = 0; await isScrollEnd(page, upOrDown, randomStop); index++) {

                if (index >= 80) break

                await page.mouse.wheel({ deltaY: (Math.random() * 110 + 30) * upOrDown });
                if (!(index % Math.floor(Math.random() * 5 + 6))) await deplay(Math.floor(Math.random() * 22 + 6) * 1000)
            }
        };

        const autoMouseMove = async (page) => {
            await page.mouse.move(0, 0);
            for (let index = 0; index < 500; index++) {
                await page.mouse.move(index, index, { step: 1 });
            }
        };

        const checkAndAcceptCookie = async (page) => {
            console.log("[Browser]: Kiem tra chap nhan coockie");
            await deplay(2000);

            if (await page.$("button#W0wltc")) {
                console.log("[Browser]: Click chap nhan coockie");
                await page.click("button#W0wltc");
            }
        };

        const typeKeyWordAndSearch = async (page) => {
            dataBot.step = "nhap tu khoa";

            console.log("[Browser]: nhap tu khoa");
            await deplay(2000);
            (await page.$('input[name="q"]'))
                ? await page.type('input[name="q"]', dataBot.listSeo[0].key, { delay: 50 })
                : null;

            console.log("[Browser]: tim kiem");
            await deplay(1000);
            await page.keyboard.press("Enter");
        };

        const clickNextPage = async (page) => {
            if ((await page.$("a#pnnext")) && dataBot.isPageNumber < 10) {
                dataBot.isPageNumber = dataBot.isPageNumber + 1;
                console.log("[Browser]: chuyen sang trang tiep theo!");
                await page.click("a#pnnext");
                console.log("[Browser]: da bam chuyen trang!");
            } else {
                console.log(
                    "[Browser]: da o trang cuoi cung hoac tu khoa khong nam trong top 100!"
                );
                console.log("[Browser]: tim kiem voi tu khoa khac!");
                dataBot.listSeo.shift();
                if (dataBot.listSeo.length) {
                    dataBot.step = null;
                    dataBot.isPageNumber = 1;
                    openLink(page)
                } else {
                    console.log("[Browser]: Done! exit browser");
                    process.exit(0);
                }
            }
        };

        const randomS = (sRandom, min) =>
            (Math.floor(Math.random() * sRandom) + min) * 1000;

        // auto click adsen

        const scrollTo = async (page, positionsTarget) => {
            const mode = positionsTarget >= 0 ? 1 : -1
            positionsTarget = Math.abs(positionsTarget) + 100

            const listHeight = [0]

            let numHeigh = positionsTarget

            while (numHeigh >= 50) {
                const num = Math.floor((Math.random() * 21 + 30))
                numHeigh -= num
                listHeight.push(num)
            }

            listHeight.push(numHeigh)

            for (const y of listHeight) {
                await page.mouse.wheel({ deltaY: y * mode });
            }
        }

        const randomPositionsMouse = (boundingBox) => {

            const x = boundingBox.width * 0.2
            const y = boundingBox.height * 0.2

            let randomX = (boundingBox.x + x) + (Math.random() * (boundingBox.width - (2 * x)))
            let randomY = (boundingBox.y + y) + (Math.random() * (boundingBox.height - (2 * y)))

            // console.log(randomX, randomY);

            const from = { x: 0, y: 0 }
            const to = { x: randomX, y: randomY }
            const route = path(from, to)

            return route
        }

        const getPositionsInFrame = async (frame, selector) => {

            const listElem = await frame.$$(selector)

            if (!listElem.length) return null

            let listPositions = await Promise.all(listElem.map(async (elem) => await elem.boundingBox()))

            listPositions = listPositions.filter(e => e && e.height > 20 && e.width > 20)

            return listPositions

        }

        const getListAdsense = async (page, selector) => {

            const listPositions = []

            console.log('[AdClick] : kiem tra', selector)

            const elementFrame = await page.$(selector + ' iframe')
            const frameContent = await elementFrame.contentFrame()

            const listSelectorFind = (selector === '#adsBottomPost' ? ['div[role="link"]'] : ['a', 'div[role="link"]', 'div.clickable'])

            for (const selectorFind of listSelectorFind) {

                const positions = await getPositionsInFrame(frameContent, selectorFind)

                if (positions) {
                    for (const p of positions) {
                        listPositions.push(p)
                    }
                }

            }


            return listPositions

        }

        const scrollToElem = async (page, selector) => {

            const elementFrame = await page.$(selector + ' iframe')
            const positions = await elementFrame.boundingBox()

            await scrollTo(page, positions.y)

        }



        const clickAds = async (browser, page) => {
            const listAdsSelector = ['#HTML1', '#HTML3', '#HTML4', '#HTML6', '#HTML2']

            const listAdsSelectorChecked = []

            for (const iterator of listAdsSelector) {
                if (await page.$(iterator + ' iframe')) listAdsSelectorChecked.push(iterator)
            }

            while (listAdsSelectorChecked.length) {

                const selector = listAdsSelectorChecked.splice(Math.floor(Math.random() * listAdsSelectorChecked.length), 1)[0]


                await scrollToElem(page, selector)

                // console.log('cuon toi iframe');
                await deplay(3000)

                const listPoisitionsAds = await getListAdsense(page, selector)

                // console.log(listPoisitionsAds);

                // console.log('lay danh sach ads xong');

                if (listPoisitionsAds.length) {
                    const adsPoisitions = listPoisitionsAds[Math.floor(Math.random() * listPoisitionsAds.length)]

                    // console.log(adsPoisitions);

                    const route = randomPositionsMouse(adsPoisitions)

                    // console.log(route);


                    await page.mouse.move(0, 0, { step: 1 })

                    for (const positions of route) {
                        await page.mouse.move(positions.x, positions.y)
                    }
                    // console.log('di chuot xong');

                    const positionsClick = route.pop()

                    console.log(positionsClick);

                    await deplay((Math.floor(Math.random() * 3) + 2) * 1000)

                    // await page.mouse.down()
                    // await deplay(Math.floor(Math.random() * 300) + 60)
                    // await page.mouse.up()

                    await page.mouse.click(positionsClick.x, positionsClick.y)

                    console.log('click');
                } else console.log('khong co ads')

                if (listPoisitionsAds.length) break

            } console.log('khong co ads')

            await deplay((Math.floor(Math.random() * 6) + 10) * 1000)

            // focus to tab ads
            const listPage = await this.browser.pages()
            // console.log(listPage.length);
            if (listPage.length > 1) {

                for (const pageChild of listPage) {
                    if (!(pageChild.url()).includes('://' + dataBot.domain)) {
                        dataBot.tabAds = pageChild
                        await pageChild.bringToFront()
                        break
                    }
                }

                dataBot.tabAds ? await autoScroll(dataBot.tabAds, 1) : null

                await deplay(3000)
                dataBot.tabAds ? await dataBot.tabAds.close() : null

            }
        }

        // run

        const page = await this.browser.newPage();
        // const client = await page.target().createCDPSession();
        // await client.send('Network.clearBrowserCookies');
        (await this.browser.pages())[0].close();

        page.on("response", async (response) => {
            if (
                response.url().indexOf("https://www.google.com/search?q=") !== -1 &&
                response.status() === 403
            ) {
                console.log("[Browser]: loi 403");
                // await deplay(((Math.floor(Math.random() * 2) + 2) * 1000));
                // process.exit(0);
                dataBot.step = "dinh recapcha";
                dataBot.mode = "view";
                console.log("[Browser]: Phat hien recapcha chuyen che do");
                openLink(page)
            } else if (
                response.url().includes("https://www.google.com/images/searchbox/") &&
                response.status() === 200
            ) {
                // console.log(dataBot.step);
                // console.log(page.url());
                // console.log(dataBot.listSeo[0].key.replace(/ /gi, "+"));
                // console.log(page.url().includes(dataBot.listSeo[0].key.replace(/ /gi, "+")));
                if (page.url() === "https://www.google.com/" && !dataBot.step) {
                    await checkAndAcceptCookie(page);
                    await typeKeyWordAndSearch(page);
                } else if (
                    page.url().includes(dataBot.listSeo[0].key.replace(/ /gi, "+")) &&
                    dataBot.step === "nhap tu khoa"
                ) {
                    console.log('[Browser]: tim link trong ket qua sau 2s');
                    await deplay(2000);

                    let hasLink = 0;

                    for (const url of dataBot.listSeo[0].url) {

                        if (await page.$('a[href="' + url + '"]')) {
                            dataBot.step = "da bam link";
                            dataBot.clickLink += 1;

                            console.log("[Browser]: Bam link lan", dataBot.clickLink);
                            // const selector = await getSelector(page, 'a[href="' + dataBot.listSeo[0].url + '"]');
                            // console.log(selector)
                            await page.click('a[href="' + url + '"]');
                            hasLink = 1;
                            break;
                        }
                    }

                    console.log('[Browser]: tim link xong');

                    if (!hasLink) {
                        await deplay(randomS(4, 1));
                        await clickNextPage(page);
                    }
                }
            } else if (
                response.url().indexOf("recaptcha") !== -1 &&
                page.url().indexOf("google.com/sorry/index?continue=") !== -1
            ) {
                dataBot.step = "dinh recapcha";
                dataBot.mode = "view";
                console.log("[Browser]: Phat hien recapcha chuyen che do");
                console.log("[Browser]: doi link - " + dataBot.listSeo[0].url[0].trim());
                await page.goto(dataBot.listSeo[0].url[0].trim(), {
                    waitUntil: "networkidle0",
                    // timeout: 0,
                });
                // await deplay(((Math.floor(Math.random() * 2) + 2) * 1000));
                // process.exit(0)
            } else if (
                response.url().includes('googletagmanager.com/gtag/js?id') &&
                response.status() === 200 &&
                dataBot.step
            ) {

                if (dataBot.mode === "seo") {
                    dataBot.step = null; // set trang thai bot ve ban dau de cho lan tim kiem tiep theo
                    dataBot.isPageNumber = 1;
                    if (dataBot.step) return;
                }


                await deplay(randomS(2, 5));

                if (randomTrueOrFalse()) {
                    console.log("[Browser]: Mouse move");
                    await autoMouseMove(page);
                    await deplay(randomS(5, 5));
                }

                console.log("[Browser]: Cuon trang");
                await autoScroll(page, 1);
                await deplay(randomS(3, 2));
                await autoScroll(page, -1);

                if (randomTrueOrFalse()) {
                    console.log("[Browser]: Mouse move");
                    await autoMouseMove(page);
                    await deplay(randomS(5, 5));
                }

                if (args.ads && !dataBot.clickAds) {
                    dataBot.clickAds = true
                    await clickAds(this.browser, page)
                } else {
                    console.log("[Browser]: content table click");
                    await page.$("div.tocify-inner") ? await page.click(
                        "div.tocify-inner"
                    ) : null;
                }

                await deplay(randomS(10, 5));
                dataBot.listSeo.shift()
                openLink(page)

            }
        });

        openLink(page)

    }


};


(async () => {
    try {
        const a = new AutoTraffic({ a: 1 })

        await a.checkPackage()
        if (!a.checked) a.exitApp('checked is false')
        await a.createBrowser()
        if (!a.browser) a.exitApp('browser is null')
        await a.run()

    } catch (error) {
        console.log(error);
    }
})()