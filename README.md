# HH Bitrix Extension

This repository contains a simple Chrome extension that helps export resume data from the hh.kz website. When browsing a resume page as an employer, the extension injects an `Export Resume` button. Clicking the button collects key information from the page and sends it to your custom API.

## Features

- Extracts full name, gender, age, birthday, phone number and email.
- Looks for a link to download the PDF version of the resume and sends its URL.
- API key management in the extension options page.
- Background script placeholder for future features.

## Development

The extension source is located in the `src/` folder. The important files are:

- `manifest.json` – Chrome extension manifest.
- `content.js` – script that runs on resume pages and injects the export button.
- `options.html` / `options.js` – simple interface to store the API key and view subscription info.
- `background.js` – service worker used when the extension is installed.

Load the extension unpacked in Chrome via `chrome://extensions` for testing.
