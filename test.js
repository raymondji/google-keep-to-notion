import { getCreateDatabaseParams, readAllGoogleKeepNotes, getCreatePageParams, getAppendBlocksChildrenParamsList } from "./lib.js";
import util from 'util';

printTestName("readAllGoogleKeepNotes")
const keepNotes = readAllGoogleKeepNotes("./testdata");
console.log(`Found ${keepNotes.length} Google Keep Notes`);
for (const note of keepNotes) {
    printObject("keepNote", note);
}

printTestName("getCreateDatabaseParams")
const dbParams = getCreateDatabaseParams("fakePageId-098909");
printObject("dbParams", dbParams);

printTestName("getCreatePageParams")
const notionPagesParams = keepNotes.map(note => getCreatePageParams("fakeDbId-12312312", note));
for (const params of notionPagesParams) {
    printObject("pageParams", params);
}

printTestName("getAppendBlocksChildrenParamsList")
const appendBlocksParamsList = keepNotes.map(note => getAppendBlocksChildrenParamsList("fakeDbPageId-98989", note));
for (const params of appendBlocksParamsList) {
    printObject("appendBlocksChildrenParams", params);
}

// --- Helper functions ---
function printObject(msg, obj) {
    console.log(msg, util.inspect(obj, { showHidden: true, depth: null }));
}

function printTestName(name) {
    console.log(`\n============= Test: ${name} =============\n`);
}