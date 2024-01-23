import 'dotenv/config'
import { Client } from "@notionhq/client";
import { getCreateDatabaseParams, readAllGoogleKeepNotes, getCreatePageParams, getAppendBlocksChildrenParamsList } from "./lib.js";

const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
});

(async () => {
    const keepNotes = readAllGoogleKeepNotes(process.env.GOOGLE_KEEP_TAKEOUT_DIR_PATH)
    console.log(`Importing ${keepNotes.length} Google Keep Notes`);

    const createDbResp = await notion.databases.create(
        getCreateDatabaseParams(process.env.NOTION_PAGE_ID));
    const dbId = createDbResp.id;

    for (const note of keepNotes) {
        const pageParams = getCreatePageParams(dbId, note);
        const pageResp = await notion.pages.create(pageParams);
        await sleep(300);

        const blocksParamsList = getAppendBlocksChildrenParamsList(pageResp.id, note);
        for (const blocksParams of blocksParamsList) {
            await notion.blocks.children.append(blocksParams);
            await sleep(300);
        }
    }
})();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}