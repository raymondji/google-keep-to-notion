import 'dotenv/config'
import { Client } from "@notionhq/client";
import { getCreateDatabaseParams, readAllGoogleKeepNotes, getCreatePageParams, getAppendBlocksChildrenParamsList } from "./lib.js";

const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
});

(async () => {
    const keepNotes = readAllGoogleKeepNotes(process.env.GOOGLE_KEEP_TAKEOUT_DIR_PATH);
    console.log(`Importing ${keepNotes.length} Google Keep Notes`);

    const createDbResp = await notion.databases.create(
        getCreateDatabaseParams(process.env.NOTION_PAGE_ID));
    const dbId = createDbResp.id;

    const failed = [];
    for (const note of keepNotes) {
        try {
            const pageParams = getCreatePageParams(dbId, note);
            const pageResp = await notion.pages.create(pageParams);
            await sleep(1000);

            const blocksParamsList = getAppendBlocksChildrenParamsList(pageResp.id, note);
            for (const blocksParams of blocksParamsList) {
                await notion.blocks.children.append(blocksParams);
                await sleep(250);
            }
        } catch (err) {
            console.error("Failed to import note:", note, "error:", err);
            failed.push(note);
        }
    }
    if (failed.length > 0) {
        console.error(`IMPORTANT: Failed to import ${failed.length} note(s)`);
        for (const note of failed) {
            console.error(`- ${note.path}`);
        }
    }
})();

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}