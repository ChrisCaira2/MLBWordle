#!/usr/bin/env python3
"""
Example script showing how to use the Beckett scraper.

This script demonstrates different ways to use scrape_beckett.py
to extract xlsx files from the Beckett Baseball News website.
"""

import subprocess
import sys


def run_demo():
    """Run the scraper in demo mode."""
    print("=" * 70)
    print("DEMO MODE - Showing sample output")
    print("=" * 70)
    subprocess.run([
        sys.executable, 
        'scrape_beckett.py', 
        '--demo', 
        '--no-download'
    ])


def run_scraper_no_download():
    """Run the scraper without downloading (just list URLs)."""
    print("\n" + "=" * 70)
    print("SCRAPER MODE - List URLs only (no download)")
    print("=" * 70)
    subprocess.run([
        sys.executable,
        'scrape_beckett.py',
        '--year', '2023',
        '--max-files', '5',
        '--no-download'
    ])


def run_scraper_with_download():
    """Run the scraper and download files."""
    print("\n" + "=" * 70)
    print("SCRAPER MODE - Download files")
    print("=" * 70)
    print("This will attempt to download xlsx files from the website.")
    response = input("Continue? (y/n): ").strip().lower()
    
    if response == 'y':
        subprocess.run([
            sys.executable,
            'scrape_beckett.py',
            '--year', '2023',
            '--max-files', '5'
        ])


def show_menu():
    """Show interactive menu."""
    while True:
        print("\n" + "=" * 70)
        print("Beckett Baseball News XLSX Extractor - Examples")
        print("=" * 70)
        print("\n1. Demo mode (no internet required)")
        print("2. Scrape website - list URLs only")
        print("3. Scrape website - download files")
        print("4. Exit")
        
        choice = input("\nSelect an option (1-4): ").strip()
        
        if choice == '1':
            run_demo()
        elif choice == '2':
            run_scraper_no_download()
        elif choice == '3':
            run_scraper_with_download()
        elif choice == '4':
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please select 1-4.")


def main():
    """Main function."""
    print("Beckett XLSX Scraper - Example Usage\n")
    
    # Check if running in interactive mode
    if sys.stdin.isatty():
        show_menu()
    else:
        # Non-interactive mode - just run demo
        print("Running in non-interactive mode. Showing demo:")
        run_demo()


if __name__ == '__main__':
    main()
