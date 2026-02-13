"""
Script to extract xlsx files from Beckett Baseball News website.
Specifically targets the 2023 cards and checklist dropdown to extract the first 5 xlsx files.

NOTE: This script requires internet access to www.beckett.com.
If running in a sandboxed environment, you may need to:
1. Run this script locally on your machine
2. Provide the HTML content manually
3. Request domain access if available

Usage:
    python scrape_beckett.py                    # Interactive mode
    python scrape_beckett.py --demo             # Demo mode with sample data
    python scrape_beckett.py --html file.html   # Process saved HTML file
"""

import os
import sys
import time
import argparse
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup


# Constants
PAGE_LOAD_WAIT_SECONDS = 5
INTERACTION_WAIT_SECONDS = 2


def setup_driver():
    """Set up Chrome WebDriver with headless options."""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.page_load_strategy = 'eager'  # Don't wait for all resources
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.set_page_load_timeout(30)  # Set timeout to 30 seconds
    return driver


def process_html_content(html_content, year='2023', max_files=5):
    """
    Process HTML content to find xlsx files.
    
    Args:
        html_content: HTML string to parse
        year: The year to filter for (default '2023')
        max_files: Maximum number of files to extract (default 5)
    
    Returns:
        List of dictionaries containing xlsx file information
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    xlsx_links = []
    
    # Method 1: Find links directly in the HTML
    for link in soup.find_all('a', href=True):
        href = link['href']
        text = link.get_text(strip=True)
        
        # Check if it's an xlsx or xls file
        if '.xlsx' in href or '.xls' in href:
            # Make absolute URL if needed
            if not href.startswith('http'):
                href = 'https://www.beckett.com' + href
            
            # Check if it matches the year
            if year and year not in text and year not in href:
                continue
                
            xlsx_links.append({
                'url': href,
                'text': text,
                'title': link.get('title', ''),
                'type': 'direct_link'
            })
    
    # Method 2: Look for download buttons or specific patterns
    download_patterns = ['download', 'checklist', 'spreadsheet', 'excel']
    for pattern in download_patterns:
        elements = soup.find_all(['a', 'button'], class_=lambda x: x and pattern in str(x).lower())
        elements += soup.find_all(['a', 'button'], string=lambda x: x and pattern in str(x).lower())
        
        for elem in elements:
            href = elem.get('href', '')
            onclick = elem.get('onclick', '')
            text = elem.get_text(strip=True)
            
            if '.xlsx' in href or '.xls' in href or '.xlsx' in onclick or '.xls' in onclick:
                if href and not href.startswith('http'):
                    href = 'https://www.beckett.com' + href
                if href and href not in [l['url'] for l in xlsx_links]:
                    xlsx_links.append({
                        'url': href,
                        'text': text,
                        'title': elem.get('title', ''),
                        'type': 'button_or_class'
                    })
    
    # Filter by year if specified
    if year:
        filtered_links = []
        for link in xlsx_links:
            if year in link['text'] or year in link['url'] or year in link['title']:
                filtered_links.append(link)
        if filtered_links:
            xlsx_links = filtered_links
    
    # Remove duplicates
    seen = set()
    unique_links = []
    for link in xlsx_links:
        if link['url'] not in seen:
            seen.add(link['url'])
            unique_links.append(link)
    
    # Limit to max_files
    return unique_links[:max_files]


def get_demo_data():
    """Return demo/sample data for testing."""
    return [
        {
            'url': 'https://www.beckett.com/downloads/2023-topps-series-1-checklist.xlsx',
            'text': '2023 Topps Series 1 Baseball Checklist',
            'title': 'Download 2023 Topps Series 1 Checklist',
            'type': 'demo'
        },
        {
            'url': 'https://www.beckett.com/downloads/2023-topps-series-2-checklist.xlsx',
            'text': '2023 Topps Series 2 Baseball Checklist',
            'title': 'Download 2023 Topps Series 2 Checklist',
            'type': 'demo'
        },
        {
            'url': 'https://www.beckett.com/downloads/2023-bowman-checklist.xlsx',
            'text': '2023 Bowman Baseball Checklist',
            'title': 'Download 2023 Bowman Checklist',
            'type': 'demo'
        },
        {
            'url': 'https://www.beckett.com/downloads/2023-topps-chrome-checklist.xlsx',
            'text': '2023 Topps Chrome Baseball Checklist',
            'title': 'Download 2023 Topps Chrome Checklist',
            'type': 'demo'
        },
        {
            'url': 'https://www.beckett.com/downloads/2023-topps-update-checklist.xlsx',
            'text': '2023 Topps Update Series Baseball Checklist',
            'title': 'Download 2023 Topps Update Checklist',
            'type': 'demo'
        }
    ]


def extract_xlsx_from_beckett(url='https://www.beckett.com/news/category/baseball/', year='2023', max_files=5, use_demo=False):
    """
    Extract xlsx files from Beckett Baseball News.
    
    Args:
        url: The URL to scrape
        year: The year to filter for (default '2023')
        max_files: Maximum number of files to extract (default 5)
        use_demo: Use demo data instead of scraping (default False)
    
    Returns:
        List of dictionaries containing xlsx file information
    """
    if use_demo:
        print("Using demo data (not scraping actual website)")
        return get_demo_data()[:max_files]
    
    driver = None
    try:
        print(f"Starting scraper for {url}")
        driver = setup_driver()
        
        print("Loading page...")
        driver.get(url)
        
        # Wait for page to load
        print("Waiting for page to load...")
        time.sleep(PAGE_LOAD_WAIT_SECONDS)
        
        # Get the page source
        page_source = driver.page_source
        
        # Use the HTML processing function
        xlsx_links = process_html_content(page_source, year=year, max_files=max_files)
        
        # Try to find and interact with dropdown menu for 2023 cards and checklist
        if not xlsx_links:
            print(f"No xlsx files found in initial page. Searching for {year} cards and checklist dropdown...")
            
            # Look for dropdowns or select elements
            try:
                dropdowns = driver.find_elements(By.TAG_NAME, 'select')
                print(f"Found {len(dropdowns)} dropdown elements")
                
                # Look for elements containing '2023' or 'checklist'
                elements_with_year = driver.find_elements(By.XPATH, f"//*[contains(text(), '{year}')]")
                print(f"Found {len(elements_with_year)} elements containing '{year}'")
                
                # Try clicking on elements that might reveal the xlsx files
                for element in elements_with_year[:5]:  # Try first 5 elements
                    try:
                        if element.is_displayed() and element.is_enabled():
                            print(f"Clicking element: {element.text[:50]}")
                            element.click()
                            time.sleep(INTERACTION_WAIT_SECONDS)
                            
                            # Refresh page source and try again
                            page_source = driver.page_source
                            xlsx_links = process_html_content(page_source, year=year, max_files=max_files)
                            if xlsx_links:
                                break
                    except Exception as e:
                        continue
            except Exception as e:
                print(f"Error interacting with page: {e}")
        
        print(f"\nFound {len(xlsx_links)} xlsx files:")
        for i, link in enumerate(xlsx_links, 1):
            print(f"{i}. {link['text']} - {link['url']}")
        
        return xlsx_links
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        print("\nThis might be due to:")
        print("1. Network restrictions (domain blocked in sandbox)")
        print("2. Website structure changes")
        print("3. Anti-bot protection")
        print("\nTry using --demo mode or running this script locally.")
        import traceback
        traceback.print_exc()
        return []
    finally:
        if driver:
            driver.quit()


def download_xlsx_files(xlsx_links, download_dir='./downloads'):
    """
    Download xlsx files from the provided links.
    
    Args:
        xlsx_links: List of dictionaries containing xlsx file information
        download_dir: Directory to save the files
    """
    # Create download directory if it doesn't exist
    os.makedirs(download_dir, exist_ok=True)
    
    downloaded_files = []
    
    for i, link in enumerate(xlsx_links, 1):
        try:
            url = link['url']
            # Generate filename from URL or use text
            filename = url.split('/')[-1]
            if not filename.endswith('.xlsx'):
                filename = f"beckett_file_{i}.xlsx"
            
            filepath = os.path.join(download_dir, filename)
            
            print(f"Downloading {i}/{len(xlsx_links)}: {filename}")
            
            # Download the file
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✓ Downloaded: {filepath}")
            downloaded_files.append(filepath)
            
        except Exception as e:
            print(f"✗ Failed to download {url}: {e}")
    
    return downloaded_files


def main():
    """Main function to run the scraper."""
    parser = argparse.ArgumentParser(
        description='Extract xlsx files from Beckett Baseball News website'
    )
    parser.add_argument(
        '--demo',
        action='store_true',
        help='Use demo data instead of scraping (useful for testing)'
    )
    parser.add_argument(
        '--html',
        type=str,
        help='Path to saved HTML file to process'
    )
    parser.add_argument(
        '--year',
        type=str,
        default='2023',
        help='Year to filter for (default: 2023)'
    )
    parser.add_argument(
        '--max-files',
        type=int,
        default=5,
        help='Maximum number of files to extract (default: 5)'
    )
    parser.add_argument(
        '--no-download',
        action='store_true',
        help='Skip downloading files, just list them'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Beckett Baseball News XLSX Extractor")
    print("=" * 60)
    
    xlsx_links = []
    
    # Process HTML file if provided
    if args.html:
        print(f"Processing HTML file: {args.html}")
        try:
            with open(args.html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            xlsx_links = process_html_content(html_content, year=args.year, max_files=args.max_files)
        except Exception as e:
            print(f"Error reading HTML file: {e}")
            return
    # Use demo mode
    elif args.demo:
        xlsx_links = get_demo_data()[:args.max_files]
        print(f"\n{len(xlsx_links)} demo xlsx files (not real URLs):")
        for i, link in enumerate(xlsx_links, 1):
            print(f"{i}. {link['text']}")
            print(f"   URL: {link['url']}")
    # Try to scrape the actual website
    else:
        xlsx_links = extract_xlsx_from_beckett(
            url='https://www.beckett.com/news/category/baseball/',
            year=args.year,
            max_files=args.max_files,
            use_demo=False
        )
    
    if not xlsx_links:
        print("\n⚠ No xlsx files found.")
        print("\nPossible solutions:")
        print("1. Run with --demo flag to see how the tool works")
        print("2. Save the HTML from the website and use --html FILE")
        print("3. Run this script outside the sandbox environment")
        return
    
    # Download files if requested
    if not args.no_download and not args.demo:
        print(f"\nFound {len(xlsx_links)} xlsx file(s).")
        
        # In non-interactive mode, ask for confirmation
        if sys.stdin.isatty():
            download_choice = input("Do you want to download these files? (y/n): ").strip().lower()
        else:
            download_choice = 'n'
            print("Running in non-interactive mode, skipping download.")
        
        if download_choice == 'y':
            downloaded = download_xlsx_files(xlsx_links)
            print(f"\n✓ Downloaded {len(downloaded)} file(s) to ./downloads/")
            for f in downloaded:
                print(f"  - {f}")
        else:
            print("\nSkipping download. URLs found:")
            for i, link in enumerate(xlsx_links, 1):
                print(f"{i}. {link['url']}")
    else:
        print("\nURLs found:")
        for i, link in enumerate(xlsx_links, 1):
            print(f"{i}. {link['text']}")
            print(f"   URL: {link['url']}")
            print()


if __name__ == '__main__':
    main()
