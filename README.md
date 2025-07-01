# GameOverview

This is a PoC. Everything is WIP. It is not production-ready. If you see anything of value here, please let me know.

You will encounter bugs and unexpected behaviour.

Parts of the used API are reverse engineered or simply obtained by misusing certain parts. Use at your own discretion.

## What is this?

Combination of scraper and dashboard to find the currently highest ranked game in my library that I did not play yet.

It saves me a lot of time switching between different accounts (Steam, GoG, Epic, potentially more in the future) finding a great game to play.

## What is this NOT?

Anything remotely complete or user safe.

## Usage

Run `src/main.py` to parse Steam API.

Run `streamlit run game_dashboard.py` to start the streamlit dashboard.


# Sources

## Steam

Go to `https://store.steampowered.com/account/licenses/` and copy only the list of games there to `data/steam`.

Should look like this:

````text
Game 1

Game 2
Game 3
Game 3 Demo
...
````

## GoG

Go to `https://www.gog.com/en/account`. In the devConsole, use Inspector. You should find an object called `gogData`.
Copy the complete script content to `data/gog_1`.

Should look like this:

````text
var gogData = {"sortBy":"date_ ...
````

## Epic Games

Go to `https://www.epicgames.com/account/transactions?lang=de&productName=egs`

There, use the console to run:

```shell
const fetchGamesList = async (pageToken = '', existingList = []) => { 
  const data = await (await fetch(`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?sortDir=DESC&sortBy=DATE&nextPageToken=${pageToken}&locale=en-US`)).json(); 
  const gamesList = data.orders.reduce((acc, value) => [...acc, ...value.items.map(v => v.description)], []);
  console.log(`Games on this page: ${gamesList.length}, Next page starts from date: ${data.nextPageToken}`);
  const newList = [...existingList, ...gamesList];
  if (!data.nextPageToken) return newList; 
  return await fetchGamesList(data.nextPageToken, newList);
}
fetchGamesList().then(console.log);
```
Wait.
Copy results from the console into `data/epic_console_log.json`

Kudos go to [NikkelM](https://github.com/NikkelM/Steam-App-ID-Finder)
