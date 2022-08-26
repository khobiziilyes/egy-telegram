import { Telegraf, Markup } from 'telegraf';
import {} from 'telegraf/typings';

import {
  searchForShow,
  getShowSeasons,
  getSeasonEpisodes,
  getDownloadLinks,
} from 'egy-apis';

function reply(ctx, text: string, buttons: any[]) {
  return ctx.reply(text, Markup.inlineKeyboard(buttons, { columns: 1 }));
}

const bot = new Telegraf('5750001271:AAGh4fHIZQ78ASDF8tUCfSV1W9JWE749uOA');
const PORT = process.env.PORT || 3000;
const HOST = 'algbest.netlify.app';

bot.start((ctx) => ctx.reply('Welcome :) just send me the show name.'));

bot.on('text', (ctx) =>
  searchForShow(ctx.message.text).then((shows) =>
    reply(
      ctx,
      'Choose your show',
      shows.map((show) => Markup.button.callback(show.title, show.url)),
    ),
  ),
);

bot.on('callback_query', async (ctx) => {
  const url = ctx.callbackQuery.data;

  if (url.startsWith('/series')) {
    const seasons = await getShowSeasons(url.slice(8));

    reply(
      ctx,
      'Choose the season',
      seasons.map((season) => Markup.button.callback(season, season)),
    );
  }

  if (url.startsWith('/season')) {
    const episodes = await getSeasonEpisodes(url.slice(8));

    reply(
      ctx,
      'Choose the episode',
      episodes.map((episode) => Markup.button.callback(episode, episode)),
    );
  }

  if (url.startsWith('/episode') || url.startsWith('/show')) {
    ctx.reply('Searching ... Keep waiting');

    const downloadLinks = await getDownloadLinks(url);

    reply(
      ctx,
      'Choose the quality',
      downloadLinks.map((link) => Markup.button.url(link.quality, link.link)),
    );
  }
});

// bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);

bot.launch({
  webhook: {
    hookPath: '/',
    domain: HOST,
    port: +PORT,
  },
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
