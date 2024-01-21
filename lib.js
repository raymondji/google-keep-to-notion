import fs from 'fs';
import path from 'path';

export function readAllGoogleKeepNotes(dir) {
    return fs.readdirSync(dir)
        .filter(file => path.extname(file) === '.json')
        .map(file => path.resolve(dir, file))
        .map(path => JSON.parse(fs.readFileSync(path)))
        .map(parseGoogleKeepNoteJSON);
}

function parseGoogleKeepNoteJSON(noteJSON) {
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
    const note = {
        title: noteJSON.title,
        created: new Date(noteJSON.createdTimestampUsec / 1000),
        updated: new Date(noteJSON.userEditedTimestampUsec / 1000),
        labels,
        isArchived: noteJSON.isArchived,
        isTrashed: noteJSON.isTrashed,
        isPinned: noteJSON.isPinned,
        hasAttachments: noteJSON.attachments && noteJSON.attachments.length > 0 ? true : false,
    };
    // optional properties - some notes have no content at all
    if (noteJSON.textContent) {
        note.textContent = noteJSON.textContent;
    } else if (noteJSON.listContent) {
        note.listContent = noteJSON.listContent;
    }
    return note;
}

export function getCreatePageParams(dbId, keepNote) {
    const blocks = getNotionBlocks(keepNote);
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
            "Created": {
                date: {
                    "start": keepNote.created.toISOString(),
                },
            },
            "Updated": {
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
    if (keepNote.hasAttachments) {
        metadata.push({ name: "missing attachment(s)" });
    }
    return metadata;
}

function getNotionBlocks(keepNote) {
    if (keepNote.textContent) {
        return keepNote.textContent.split("\n").map(x => {
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
        });
    };
    if (keepNote.listContent) {
        return keepNote.listContent.map(item => {
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
        });
    }
    return undefined;
}


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