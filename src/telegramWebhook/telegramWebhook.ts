import axios from 'axios';
import { Handler } from '@netlify/functions';

import { Tbuttons, replyFunc, ITelegramUpdate } from './interfaces';
import {
  getShowSeasons,
  getSeasonEpisodes,
  searchForShow,
} from './getShowSeasons';

import { getDownloadLinks } from './getDownloadLinks';
import { egyJsonClient } from './presistentClient';

function byEight<T>(arr: T[]): T[][] {
  return arr.reduce(
    (acc, item) => {
      if (acc[acc.length - 1].length === 8) acc.push([]);
      acc[acc.length - 1].push(item);

      return acc;
    },
    [[]] as T[][],
  );
}

const TELEGRAM_API_KEY = '5750001271:AAGh4fHIZQ78ASDF8tUCfSV1W9JWE749uOA';
const telegramBot = axios.create({
  baseURL: `https://api.telegram.org/bot${TELEGRAM_API_KEY}/`,
});

const sendMessage = (chat_id: number, text: string, buttons: Tbuttons) =>
  telegramBot.post('sendMessage', {
    chat_id,
    text,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });

async function handleStartMessage(reply: replyFunc) {
  await reply('Welcome! to use, simply send the name of the movie/serie.');

  const resp = await egyJsonClient.get(
    '/movie/samaritan-2022/?ref=home-trends&output_format=json',
  );

  console.log(resp);

  return { statusCode: 200 };
}

async function handleSerieRequest(reply: replyFunc, serie: string) {
  const seasons = await getShowSeasons(serie);
  console.log(seasons);

  await reply(
    'Select the season',
    byEight(
      seasons.map((season, i) => ({
        text: i + 1 + '',
        callback_data: season,
      })),
    ),
  );

  return { statusCode: 200 };
}

async function handleSeasonRequest(reply: replyFunc, season: string) {
  const episodes = await getSeasonEpisodes(season);

  await reply(
    'Select the episode',
    byEight(
      episodes.map((season, i) => ({
        text: i + 1 + '',
        callback_data: season,
      })),
    ),
  );

  return { statusCode: 200 };
}

async function handleEpisodeRequest(reply: replyFunc, episode: string) {
  const downloadLinks = await getDownloadLinks(episode);

  await reply(
    'Download your desired episode',
    downloadLinks.map((link) => [
      {
        text: link.quality,
        url: link.link,
      },
    ]),
  );

  return { statusCode: 200 };
}

export const handler: Handler = async (event) => {
  const { message, callback_query } = JSON.parse(
    event.body || '{}',
  ) as ITelegramUpdate;

  const text = (message?.text ?? callback_query?.data)!;
  const chat_id = (message?.chat.id ?? callback_query?.message.chat.id)!;

  const reply: replyFunc = (text, buttons = null) =>
    sendMessage(chat_id, text, buttons);

  if (
    (message?.entities && message.entities[0]?.type === 'bot_command') ||
    callback_query
  ) {
    if (text === '/start') return await handleStartMessage(reply);

    if (text.startsWith('/series'))
      return await handleSerieRequest(reply, text.slice(8));

    if (text.startsWith('/season'))
      return await handleSeasonRequest(reply, text.slice(8));

    if (text.startsWith('/episode') || text.startsWith('/movie'))
      return await handleEpisodeRequest(reply, text);
  }

  await searchForShow(text).then((shows) =>
    reply(
      'Select the relevant show',
      shows.map((show) => [
        {
          text: show.title,
          callback_data: show.url,
        },
      ]),
    ),
  );

  return {
    statusCode: 200,
  };
};
