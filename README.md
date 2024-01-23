# google-keep-to-notion

## Usage

Clone this repo and create a `.dotenv` file from the template:
```
cp .env.template .env
```

Use [Google Takeout](https://takeout.google.com/) to export your data from Google Keep.
- Unzip the data and copy the folder path to your `.env` file

Obtain a Notion API token (credit for the instructions to https://github.com/trustmaster/gkeep2notion):
- Go to your [Notion integrations](https://www.notion.so/my-integrations)
- Click "Create new integration"
- Enter any name, e.g. google-keep-to-notion.
- After creating the integration copy the "Internal Integration Secret" value to your `.env` file.

Select the Notion page where you want the Notes database to be created (again credit for the instructions to https://github.com/trustmaster/gkeep2notion):
- Click on ••• button on top right of the page and select "Add Connections" (at the bottom) from the menu.
- Search for your integration name and select it. You should press "Confirm" on the dialog that will appear. This will make the page accessible to your integration.
- Copy the URL of the page in the address bar or use "Copy link" in the context menu of the navigation bar
- Extract the page ID from the URL, and copy it to your `.env` file

Run the tool:
```
npm install
npm start // this will take a while!
// Once it's done, any notes that failed to import will be printed.
```

The Notion API does not support uploading attachments/images, so you'll need to upload them manually
- This importer tags the imported notes with "missing attachment(s)" in the Metadata field. You can filter the newly created database by this tag.
- If you open up the note content, the missing attachments will be listed. E.g.
  - <img width="315" alt="Screen Shot 2024-01-22 at 9 07 29 PM" src="https://github.com/raymondji/google-keep-to-notion/assets/34181040/0051ac56-5e51-43b1-b6d9-7a8175849897">
- Manually upload any attachments you care about.

## Notion API references

- https://github.com/makenotion/notion-sdk-js
- https://developers.notion.com/reference/property-value-object
- https://developers.notion.com/reference/block
