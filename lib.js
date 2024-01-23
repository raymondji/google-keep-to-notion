import fs from 'fs';
import path from 'path';

export function readAllGoogleKeepNotes(dir) {
    const notes = fs.readdirSync(dir)
        .filter(file => path.extname(file) === '.json')
        .map(file => path.resolve(dir, file))
        .map(path => toGoogleKeepNote(path, JSON.parse(fs.readFileSync(path))));
    // Sort in descending order by the updated ts so that when we create pages in Notion,
    // the relative ordering of Notion created/updated timestamps will still be approximately correct.
    notes.sort((a, b) => b.updated - a.updated);
    return notes;
}

function toGoogleKeepNote(path, noteJSON) {
    function throwParseError(msg) {
        throw new Error(msg + " " + JSON.stringify(noteJSON));
    };

    if (!("title" in noteJSON)) {
        throwParseError("Missing title");
    }
    if (!("createdTimestampUsec" in noteJSON)) {
        throwParseError("Missing created ts");
    }
    if (!("userEditedTimestampUsec" in noteJSON)) {
        throwParseError("Missing edited ts");
    }
    if (!("isArchived" in noteJSON)) {
        throwParseError("Missing isArchived");
    }
    if (!("isTrashed" in noteJSON)) {
        throwParseError("Missing isTrashed");
    }
    if (!("isPinned" in noteJSON)) {
        throwParseError("Missing isPinned");
    }

    const labels = noteJSON.labels ? noteJSON.labels = noteJSON.labels.map(l => { return { name: l.name } }) : [];
    return {
        path,
        title: noteJSON.title,
        created: new Date(noteJSON.createdTimestampUsec / 1000),
        updated: new Date(noteJSON.userEditedTimestampUsec / 1000),
        labels,
        isArchived: noteJSON.isArchived,
        isTrashed: noteJSON.isTrashed,
        isPinned: noteJSON.isPinned,
        attachments: noteJSON.attachments,
        textContent: noteJSON.textContent,
        listContent: noteJSON.listContent,
    };
}

// https://developers.notion.com/reference/patch-block-children
export function getAppendBlocksChildrenParamsList(parentId, keepNote) {
    const blocks = getNotionBlocks(keepNote);
    const paramsList = [];
    // Notion only allows appending <= 100 blocks in a single request, so chunk into multiple requests.
    // Note: we create the first 100 blocks as part of the page creation request, so skip those.
    for (let i = 100; i < blocks.length; i += 100) {
        paramsList.push({
            "block_id": parentId,
            children: blocks.slice(i, i + 100),
        })
    }
    return paramsList;
}

// https://developers.notion.com/reference/post-page
export function getCreatePageParams(dbId, keepNote) {
    // Notion only allows appending <= 100 blocks as part of the page creation request.
    // The rest are handled by getAppendBlocksChildrenParamsList.
    const blocks = getNotionBlocks(keepNote).slice(0, 100);
    const metadata = getNotionMetadata(keepNote);
    const title = keepNote.title ? keepNote.title
        : keepNote.textContent ? keepNote.textContent.split("\n")[0]
            : "No title";

    return {
        "parent": {
            "type": "database_id",
            "database_id": dbId,
        },
        "properties": {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": title,
                        }
                    }
                ]
            },
            "Created (Google Keep)": {
                date: {
                    "start": keepNote.created.toISOString(),
                },
            },
            "Updated (Google Keep)": {
                date: {
                    "start": keepNote.updated.toISOString(),
                },
            },
            "Labels": {
                "multi_select": keepNote.labels,
            },
            "Metadata": {
                "multi_select": metadata,
            }
        },
        "children": blocks,
    };
}

function getNotionMetadata(keepNote) {
    const metadata = [];
    if (keepNote.isArchived) {
        metadata.push({ name: "archived" });
    }
    if (keepNote.isTrashed) {
        metadata.push({ name: "trashed" });
    }
    if (keepNote.isPinned) {
        metadata.push({ name: "pinned" });
    }
    if (keepNote.attachments && keepNote.attachments.length > 0) {
        metadata.push({ name: "missing attachment(s)" });
    }
    return metadata;
}

function getNotionBlocks(keepNote) {
    const blocks = [];
    if (keepNote.attachments && keepNote.attachments.length > 0) {
        blocks.push({
            "object": "block",
            "toggle": {
                "rich_text": [{
                    "type": "text",
                    "text": {
                      "content": "Missing attachments",
                    }
                  }],
                  "children": keepNote.attachments.map(attachment => {
                    return {
                        "object": "block",
                        "to_do": {
                            "rich_text": [
                                {
                                    "text": {
                                        "content": attachment.filePath,
                                    },
                                }
                            ],
                            "checked": false,
                        },
                    };
                }),
            }
        });
    }
    if (keepNote.textContent) {
        blocks.push(...keepNote.textContent.split("\n").map(x => {
            return {
                "object": "block",
                "paragraph": {
                    "rich_text": [
                        {
                            "text": {
                                "content": x,
                            },
                        }
                    ],
                    "color": "default"
                }
            };
        }));
    };
    if (keepNote.listContent) {
        blocks.push(...keepNote.listContent.map(item => {
            return {
                "object": "block",
                "to_do": {
                    "rich_text": [
                        {
                            "text": {
                                "content": item.text,
                            },
                        }
                    ],
                    "color": "default",
                    "checked": item.isChecked,
                },
            };
        }));
    }
    return blocks;
}

// https://developers.notion.com/reference/create-a-database
export function getCreateDatabaseParams(pageId) {
    return {
        parent: {
            type: "page_id",
            page_id: pageId,
        },
        title: [
            {
                type: "text",
                text: {
                    content: "Notes",
                    link: null,
                },
            },
        ],
        properties: {
            Name: {
                title: {},
            },
            "Created": {
                date: {},
            },
            "Updated": {
                date: {},
            },
            "Metadata": {
                type: "multi_select",
                multi_select: {
                    options: [],
                },
            },
            "Labels": {
                type: "multi_select",
                multi_select: {
                    options: [],
                },
            },
        },
    };
}