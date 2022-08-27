import { egyClient, egyJsonClient } from './presistentClient.js';

export function searchForShow(query) {
  return egyJsonClient
    .get<{ [key: string]: { t: string; u: string }[] }>('/autoComplete.php', {
      params: {
        q: query
      }
    })
    .then(({ data }) =>
      (Object.values(data)[0] || []).map(_ => ({
        title: _.t,
        url: `/${_.u}`,
        isSerie: _.u.startsWith('series/')
      }))
    );
}

export function getShowDetails(showLink) {
  const isSerie = showLink.startsWith('/series/');

  return egyClient.get(showLink).then(async ({ data }) => {
    const table = /movieTable.+?<\/table/.exec(data)[0];
    const cols = [...table.matchAll(/<td.*?>(.+?)<\/td>/g)]
      .map(_ => _[1])
      .filter((_, i) => i % 2 === 0 && i !== 0);

    const [, rawRating, rawGenres, rawImdb] = cols;

    const genres = [...rawGenres.matchAll(/>(.+?)<\/a>/g)].map(_ => _[1]);
    const rating = /;(.+)/.exec(rawRating)[1].trim();
    const imdb = [...rawImdb.matchAll(/<span>(.+?)</g)]
      .map(_ => _[1])
      .join('/');

    const showDetails = {
      genres,
      rating,
      imdb
    };

    if (isSerie) return showDetails;

    const [showLength, rawResolution] = cols.slice(4);
    const resolution = />(.+?)<\/a/.exec(rawResolution)[1];

    return {
      ...showDetails,
      showLength,
      resolution
    };
  });
}

function matchShowSeasons(data) {
  const seasonRegex = /(\/season\/.+?)" class="movie"/g;
  const matches = [...data.matchAll(seasonRegex)];

  return matches.map(_ => _[1]).reverse();
}

export function getShowSeasons(showName) {
  return egyClient
    .get(`/series/${showName}`)
    .then(_ => {
      console.log(_);
      return _;
    })
    .then(({ data }) => matchShowSeasons(data));
}

function matchSeasonEpisodes(data) {
  const seasonRegex = /(\/episode\/.+?)" class="movie"/g;
  const matches = [...data.matchAll(seasonRegex)];

  return matches.map(_ => _[1]).reverse();
}

export function getSeasonEpisodes(seasonName) {
  return egyClient
    .get(`/season/${seasonName}`)
    .then(({ data }) => matchSeasonEpisodes(data));
}
