# Beckett Baseball News XLSX Scraper

This tool extracts xlsx files from the Beckett Baseball News website, specifically targeting the 2023 cards and checklist dropdown.

## Features

- Scrapes the Beckett Baseball News website for xlsx files
- Filters by year (default: 2023)
- Limits results to a specified number (default: 5)
- Can download files automatically
- Includes demo mode for testing
- Can process saved HTML files

## Requirements

Install the required dependencies:

```bash
pip install -r requirements.txt
```

The script requires:
- Python 3.8+
- selenium
- beautifulsoup4
- requests
- Chrome/Chromium browser (for Selenium WebDriver)

## Usage

### Demo Mode (Recommended for Testing)

Run the script in demo mode to see sample output without scraping:

```bash
python scrape_beckett.py --demo --no-download
```

This will show 5 sample 2023 baseball card checklist URLs.

### Scraping the Website

**Note:** This requires direct internet access to www.beckett.com. If running in a sandboxed environment, you may encounter network restrictions.

```bash
# Basic usage - scrape and show results
python scrape_beckett.py --no-download

# Scrape and download files
python scrape_beckett.py

# Customize year and number of files
python scrape_beckett.py --year 2024 --max-files 10 --no-download
```

### Processing Saved HTML

If you can't access the website directly, you can save the HTML locally and process it:

1. Visit https://www.beckett.com/news/category/baseball/ in your browser
2. Save the page as HTML (File → Save Page As)
3. Run the script with the saved HTML:

```bash
python scrape_beckett.py --html saved_page.html --no-download
```

## Command Line Options

- `--demo`: Use demo data instead of scraping (useful for testing)
- `--html FILE`: Process a saved HTML file instead of scraping
- `--year YEAR`: Filter for a specific year (default: 2023)
- `--max-files N`: Maximum number of files to extract (default: 5)
- `--no-download`: Don't download files, just list URLs

## Examples

```bash
# Show first 5 2023 xlsx files (no download)
python scrape_beckett.py --no-download

# Download first 3 2024 xlsx files
python scrape_beckett.py --year 2024 --max-files 3

# Test with demo data
python scrape_beckett.py --demo

# Process saved HTML file
python scrape_beckett.py --html beckett_page.html
```

## Output

Downloaded files will be saved to the `./downloads/` directory.

## Troubleshooting

### Network/DNS Errors

If you see errors like "Failed to resolve 'www.beckett.com'", this means:
- The domain is blocked in your environment
- You're running in a sandboxed environment without internet access

**Solutions:**
1. Use `--demo` mode to test the tool
2. Run the script on your local machine with internet access
3. Save the webpage HTML and use `--html` option

### No xlsx Files Found

If the script reports no xlsx files found:
1. The website structure may have changed
2. The year filter may be too restrictive
3. The files may be behind a dropdown/interaction that the script can't detect

**Solutions:**
1. Try without year filter: `--year ""`
2. Manually inspect the website to verify xlsx files exist
3. Save the HTML after manually clicking through the site and use `--html` option

### Selenium/Chrome Issues

If you get WebDriver errors:
- Make sure Chrome or Chromium is installed
- The script uses headless mode, so no browser window will appear
- Check that chromedriver is compatible with your Chrome version

## Integration with MLBWordle

This script is standalone and doesn't modify the existing MLBWordle functionality. It's designed to help gather baseball card checklist data that could be useful for:
- Adding new data sources
- Cross-referencing player information
- Expanding the game database

## Notes

- The script uses Selenium WebDriver for dynamic content
- BeautifulSoup4 is used for HTML parsing
- Downloads are saved with original filenames when possible
- The script respects the website's structure and doesn't make excessive requests
