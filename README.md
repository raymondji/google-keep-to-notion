# google-keep-to-notion

## Usage

Create a `.dotenv` file with these properties:
```
NOTION_API_TOKEN=
NOTION_PAGE_ID=
GOOGLE_KEEP_TAKEOUT_DIR_PATH=
```

Run the tool:
```
npm install
npm start
```

## TODO

Bugs:
- Notion only allows appending 100 blocks in a single API request. Instead of trying to add all blocks as children in one go when creating a page, create an empty page and then append 100 blocks at a time. Sample error: "body failed validation: body.children.length should be ≤ `100`"

Features:
- Include the file names of missing attachments in the page content


## Notion API references

- https://github.com/makenotion/notion-sdk-js
- https://developers.notion.com/reference/property-value-object
- https://developers.notion.com/reference/create-a-database
- https://developers.notion.com/reference/post-page
- https://developers.notion.com/reference/block
- https://developers.notion.com/reference/patch-block-children
