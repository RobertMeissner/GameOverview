#!/usr/bin/env python3
"""
GameOverview - Automated Store Import Script

This script automatically fetches your game libraries from Epic Games, Steam, and GOG
using your browser cookies, then imports them directly into GameOverview.

Requirements:
    pip install requests browser-cookie3

Usage:
    python auto_import_stores.py --all                    # Import from all stores
    python auto_import_stores.py --epic                   # Import only Epic Games
    python auto_import_stores.py --gog                    # Import only GOG
    python auto_import_stores.py --steam STEAM_API_KEY STEAM_ID  # Import Steam (requires API key)

    # Configure API URL
    python auto_import_stores.py --api-url http://localhost:8080 --all
"""

import argparse
import json
import re
import sys
from typing import List, Dict, Optional

try:
    import requests
    import browser_cookie3
except ImportError:
    print("Error: Required packages not installed.")
    print("Please run: pip install requests browser-cookie3")
    sys.exit(1)


class GameImporter:
    def __init__(self, api_base_url: str = "http://localhost:8080"):
        self.api_base_url = api_base_url

    @staticmethod
    def clean_name(name: str) -> str:
        """Clean game names by removing date suffixes and promotional text."""
        if not name:
            return name

        # Remove date suffixes like " - Oct 2025"
        name = re.sub(r' - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$', '', name, flags=re.IGNORECASE)
        # Remove promotional text
        name = re.sub(r'Limited Free Promotional Packag(e)?', '', name, flags=re.IGNORECASE)
        # Remove common suffixes
        name = re.sub(r' - Free$', '', name, flags=re.IGNORECASE)
        name = re.sub(r' Demo$', '', name, flags=re.IGNORECASE)
        name = re.sub(r' - $', '', name)

        return name.strip()

    def import_to_gameoverview(self, games: List[Dict], store_name: str) -> Dict:
        """Send games to GameOverview API."""
        print(f"\n📤 Importing {len(games)} games from {store_name} to GameOverview...")

        try:
            response = requests.post(
                f"{self.api_base_url}/import/bulk",
                json=games,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()

            result = response.json()
            print(f"✓ Success! Created: {result['created']}, Updated: {result['updated']}, Failed: {result['failed']}")
            return result
        except requests.exceptions.RequestException as e:
            print(f"✗ Import failed: {e}")
            return {"created": 0, "updated": 0, "failed": len(games)}

    def fetch_epic_games(self, browser: str = 'chrome') -> List[Dict]:
        """Fetch Epic Games library using browser cookies."""
        print("\n🎮 Fetching Epic Games library...")

        try:
            # Get cookies from browser
            if browser == 'chrome':
                cookies = browser_cookie3.chrome(domain_name='epicgames.com')
            elif browser == 'firefox':
                cookies = browser_cookie3.firefox(domain_name='epicgames.com')
            else:
                cookies = browser_cookie3.load(domain_name='epicgames.com')

            all_games = []
            page_token = ''
            page_num = 1

            while True:
                url = f"https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken={page_token}&locale=en-US"
                response = requests.get(url, cookies=cookies)
                response.raise_for_status()

                data = response.json()

                # Extract games from orders
                for order in data.get('orders', []):
                    for item in order.get('items', []):
                        game = {
                            'name': self.clean_name(item.get('description', '')),
                            'store': 'epic',
                            'storeId': item.get('offerId') or item.get('id')
                        }
                        if game['name']:
                            all_games.append(game)

                print(f"  Page {page_num}: {len(data.get('orders', []))} orders processed")

                page_token = data.get('nextPageToken')
                if not page_token:
                    break

                page_num += 1

            print(f"✓ Found {len(all_games)} Epic Games")
            return all_games

        except Exception as e:
            print(f"✗ Epic Games fetch failed: {e}")
            return []

    def fetch_gog_games(self, browser: str = 'chrome') -> List[Dict]:
        """Fetch GOG library using browser cookies."""
        print("\n🎮 Fetching GOG library...")

        try:
            # Get cookies from browser
            if browser == 'chrome':
                cookies = browser_cookie3.chrome(domain_name='gog.com')
            elif browser == 'firefox':
                cookies = browser_cookie3.firefox(domain_name='gog.com')
            else:
                cookies = browser_cookie3.load(domain_name='gog.com')

            all_games = []
            page = 1
            total_pages = 1

            while page <= total_pages:
                url = f"https://www.gog.com/account/getFilteredProducts?mediaType=1&page={page}"
                response = requests.get(url, cookies=cookies)
                response.raise_for_status()

                data = response.json()
                total_pages = data.get('totalPages', 1)

                for product in data.get('products', []):
                    game = {
                        'name': self.clean_name(product.get('title', '')),
                        'store': 'gog',
                        'storeId': str(product.get('id', ''))
                    }
                    if game['name']:
                        all_games.append(game)

                print(f"  Page {page}/{total_pages}: {len(data.get('products', []))} games")
                page += 1

            print(f"✓ Found {len(all_games)} GOG games")
            return all_games

        except Exception as e:
            print(f"✗ GOG fetch failed: {e}")
            return []

    def fetch_steam_games(self, api_key: str, steam_id: str) -> List[Dict]:
        """Fetch Steam library using Steam Web API."""
        print("\n🎮 Fetching Steam library...")

        try:
            url = f"https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"
            params = {
                'key': api_key,
                'steamid': steam_id,
                'format': 'json',
                'include_appinfo': True
            }

            response = requests.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            games_data = data.get('response', {}).get('games', [])

            games = []
            for game in games_data:
                games.append({
                    'name': self.clean_name(game.get('name', '')),
                    'store': 'steam',
                    'storeId': str(game.get('appid', ''))
                })

            print(f"✓ Found {len(games)} Steam games")
            return games

        except Exception as e:
            print(f"✗ Steam fetch failed: {e}")
            return []


def main():
    parser = argparse.ArgumentParser(
        description='Automatically import game libraries into GameOverview'
    )
    parser.add_argument('--api-url', default='http://localhost:8080',
                       help='GameOverview API base URL (default: http://localhost:8080)')
    parser.add_argument('--browser', choices=['chrome', 'firefox', 'auto'], default='auto',
                       help='Browser to extract cookies from (default: auto)')

    # Store selection
    parser.add_argument('--all', action='store_true',
                       help='Import from all supported stores')
    parser.add_argument('--epic', action='store_true',
                       help='Import from Epic Games')
    parser.add_argument('--gog', action='store_true',
                       help='Import from GOG')
    parser.add_argument('--steam', nargs=2, metavar=('API_KEY', 'STEAM_ID'),
                       help='Import from Steam (requires API key and Steam ID)')

    args = parser.parse_args()

    # Validate arguments
    if not any([args.all, args.epic, args.gog, args.steam]):
        parser.print_help()
        sys.exit(1)

    importer = GameImporter(api_base_url=args.api_url)

    print("=" * 60)
    print("GameOverview - Automated Store Import")
    print("=" * 60)

    total_created = 0
    total_updated = 0
    total_failed = 0

    # Import Epic Games
    if args.all or args.epic:
        games = importer.fetch_epic_games(browser=args.browser)
        if games:
            result = importer.import_to_gameoverview(games, "Epic Games")
            total_created += result.get('created', 0)
            total_updated += result.get('updated', 0)
            total_failed += result.get('failed', 0)

    # Import GOG
    if args.all or args.gog:
        games = importer.fetch_gog_games(browser=args.browser)
        if games:
            result = importer.import_to_gameoverview(games, "GOG")
            total_created += result.get('created', 0)
            total_updated += result.get('updated', 0)
            total_failed += result.get('failed', 0)

    # Import Steam
    if args.steam or (args.all and args.steam):
        if args.steam:
            api_key, steam_id = args.steam
            games = importer.fetch_steam_games(api_key, steam_id)
            if games:
                result = importer.import_to_gameoverview(games, "Steam")
                total_created += result.get('created', 0)
                total_updated += result.get('updated', 0)
                total_failed += result.get('failed', 0)
        elif args.all:
            print("\n⚠ Skipping Steam (requires --steam API_KEY STEAM_ID)")

    # Summary
    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"Total Created: {total_created}")
    print(f"Total Updated: {total_updated}")
    print(f"Total Failed:  {total_failed}")
    print("=" * 60)


if __name__ == '__main__':
    main()
