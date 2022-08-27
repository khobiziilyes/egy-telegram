import { firstRegexGroup, roundQuality } from './utils.js';
import { egyClient, vidStreamClient } from './presistentClient.js';

export function getDownloadLinks(clipLink) {
  const srcRegex = /auto-size" src="(.*?)"/g;
  const sourceRegex = /(dostream.*?)"/g;

  return egyClient
    .get(clipLink)
    .then(({ data }) => firstRegexGroup(srcRegex, data))
    .then(src =>
      egyClient.get(src).then(async ({ data }): Promise<string> => {
        const sourceLink = firstRegexGroup(sourceRegex, data);
        if (sourceLink) return sourceLink;

        const { adLink, verificationLink, verificationToken } =
          getVerificationTokens(data);

        return egyClient
          .get(adLink)
          .then(() =>
            egyClient.post(verificationLink, {
              [verificationToken]: 'ok'
            })
          )
          .then(() => egyClient.get(src))
          .then(({ data }) => firstRegexGroup(sourceRegex, data));
      })
    )
    .then(m3uLink => vidStreamClient.get(m3uLink))
    .then(({ data }) => parseM3U(data));
}

function getVerificationTokens(data) {
  const jsCodeRegex = /<script.*?>function \w+?\(\)\{(.+?)};<\/script/g;

  const verificationTokenRegex = /\{'([0-9a-zA-Z_]*)':'ok'\}/g;
  const encodedAdLinkVarRegex = /\(([0-9a-zA-Z_]{2,12})\[Math/g;
  const encodingArraysRegex = /,([0-9a-zA-Z_]{2,12})=\[\]/g;

  let jsCode = jsCodeRegex.exec(data)[1];

  const verificationToken = verificationTokenRegex.exec(jsCode)[1];
  const encodedAdLinkVar = encodedAdLinkVarRegex.exec(jsCode)[1];
  const [firstEncodingArrayName, secondEncodingArrayName] = [
    ...jsCode.matchAll(encodingArraysRegex)
  ]
    .slice(1, 3)
    .map(_ => _[1]);

  jsCode =
    jsCode
      .replace(/[;,]\$\('\*'\)(.*)$/g, ';')
      .replace(/,ismob=(.*)\(navigator\[(.*)\]\)[,;]/g, ';')
      .replace(/var a0b=function\(\)(.*)a0a\(\);/g, '') +
    `[${firstEncodingArrayName}, ${secondEncodingArrayName}, ${encodedAdLinkVar}[0]]`;

  const [firstEncodingArray, secondEncodingArray, encodedAdPath] = eval(jsCode);

  const verificationPath = secondEncodingArray.reduce(
    (prev, curr) => prev + (firstEncodingArray[curr] || ''),
    ''
  );

  const encodedAdLink = encodedAdPath + '='.repeat(encodedAdPath.length % 4);
  const adLink = '/' + Buffer.from(encodedAdLink, 'base64');
  const verificationLink = `/tvc.php?verify=${verificationPath}`;

  return {
    adLink,
    verificationLink,
    verificationToken
  };
}

function parseM3U(data) {
  const lines = data.split('\n');
  const details = [];
  const links = [];

  for (const line of lines) {
    if (line.includes('http')) links.push(line);
    if (line.includes('FRAME-RATE')) details.push(line);
  }

  return details.reduce((acc, detail, i) => {
    const link = links[i].replace('/stream/', '/dl/');
    const pixels = detail.split(',')[2].split(/x|=/);
    const quality = roundQuality(pixels[1] * pixels[2]);

    return [
      ...acc,
      {
        link,
        quality
      }
    ];
  }, []);
}
