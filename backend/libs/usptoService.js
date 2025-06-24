import puppeteer from "puppeteer";

const enviroment = process.env.NODE_ENV;

class USPTOService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    const isProduction = enviroment !== "development";

    const browserOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--single-process",
        "--no-zygote",
      ],
    };

    // For AWS deployment, you might need to specify the Chrome executable path
    if (isProduction && process.env.CHROME_EXECUTABLE_PATH) {
      browserOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH;
    }

    this.browser = await puppeteer.launch(browserOptions);
    this.page = await this.browser.newPage();

    // Set timeout
    this.page.setDefaultTimeout(30000); // 30 seconds timeout

    // Block images and CSS to speed up the process
    await this.page.setRequestInterception(true);
    this.page.on("request", (req) => {
      if (
        req.resourceType() === "image" ||
        req.resourceType() === "stylesheet"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  async wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async navigateToGlobalDossier() {
    await this.page.goto("https://globaldossier.uspto.gov/", {
      waitUntil: "domcontentloaded",
    });

    await this.page.waitForSelector('input[id="query"]', { visible: true });
  }

  async searchApplication(applicationNumber) {
    const searchInputSelector = 'input[id="query"]';
    const searchButtonSelector = 'button[type="submit"][name="search"]';

    await this.page.waitForSelector(searchInputSelector, { visible: true });
    await this.page.type(searchInputSelector, applicationNumber);

    await this.page.waitForSelector(searchButtonSelector, { visible: true });
    await this.page.click(searchButtonSelector);

    await this.wait(3000);
  }

  async clickViewDossier(applicationNumber) {
    await this.wait(2000);
    const clicked = await this.page.evaluate((appNum) => {
      const rows = Array.from(
        document.querySelectorAll(
          "table.table-searchResults tbody .result-tr > tr"
        )
      );

      for (const row of rows) {
        const col3Cell = row.querySelector("td.col3");

        if (col3Cell) {
          const appNumberElement = col3Cell.querySelector("p");
          if (appNumberElement) {
            const cellAppNumber = appNumberElement.textContent.trim();
            if (cellAppNumber === appNum) {
              const viewDossierLink = Array.from(
                col3Cell.querySelectorAll('a[href^="details/"]')
              ).find((link) => link.textContent.includes("View Dossier"));

              if (viewDossierLink) {
                viewDossierLink.click();
                return true;
              }
            }
          }
        }
      }
      return false;
    }, applicationNumber);

    if (!clicked) {
      throw new Error(
        `Could not find View Dossier link for application number: ${applicationNumber}`
      );
    }

    await this.wait(3000);
  }

  async countCLMFromPage() {
    await this.wait(2000);

    const clmCount = await this.page.evaluate(() => {
      let count = 0;
      const rows = document.querySelectorAll("table tbody tr, table tr");

      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3) {
          const codeCell = cells[2];
          if (codeCell) {
            const codeText = codeCell.textContent.trim();
            if (codeText === "CLM") {
              count++;
            }
          }
        }
      }

      // Fallback method
      if (count === 0) {
        const allCells = document.querySelectorAll("td");
        for (const cell of allCells) {
          const text = cell.textContent.trim();
          if (text === "CLM") {
            count++;
          }
        }
      }

      return count;
    });

    return clmCount;
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getCLMCount(applicationNumber) {
    try {
      await this.init();
      await this.navigateToGlobalDossier();
      await this.searchApplication(applicationNumber);
      await this.clickViewDossier(applicationNumber);
      const clmCount = await this.countCLMFromPage();

      return {
        success: true,
        applicationNumber,
        clmCount,
      };
    } catch (error) {
      if (enviroment === "development") {
        console.error("USPTO Service Error:", error.message);
      }
      return {
        success: false,
        error: error.message,
        applicationNumber,
      };
    } finally {
      await this.cleanup();
    }
  }
}

export const getCLMCount = async (applicationNumber) => {
  const service = new USPTOService();
  return await service.getCLMCount(applicationNumber);
};
