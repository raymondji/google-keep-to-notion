import 'dotenv/config'
import { Client } from "@notionhq/client";
import { getCreateDatabaseParams, readAllGoogleKeepNotes, getCreatePageParams } from "./lib.js";

const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
});

(async () => {
    let keepNotes = readAllGoogleKeepNotes(process.env.GOOGLE_KEEP_TAKEOUT_DIR_PATH);
    console.log(`Importing ${keepNotes.length} Google Keep Notes`);

    const createDbResp = await notion.databases.create(
        getCreateDatabaseParams(process.env.NOTION_PAGE_ID));
    const dbId = createDbResp.id;

    const notionPagesParams = keepNotes.map(note => getCreatePageParams(dbId, note));
    for (const params of notionPagesParams) {
        await notion.pages.create(params);
        await sleep(300);
    }
})();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}