#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const Plex = require('./modules/plex');

function initPlex(program) {
  const plexOptions = {
    token: program.plexToken || process.env.PLEX_TOKEN,
    host: program.plexHost || process.env.PLEX_HOST,
    port: program.plexPort || process.env.PLEX_PORT,
  };

  if (!plexOptions.token) {
    console.log(chalk.red('\n  The plex token is missing'));
    program.help();
    exit(1);
  }
  return new Plex(plexOptions);
}

program
  .version('0.1.0')
  .description('A Utility to remotely perform operations on a plex server')
  .option('--plex-token [token]', 'Plex server API token')
  .option('--plex-host [host]', 'Plex server hostname or ip (default: localhost)')
  .option('--plex-port [port]', 'Plex server hostname or ip (default: 32400)')

program.on('--help', function(){
  console.log('');
  console.log('');
  console.log('  Optionaly a user can pass the --plex-token, --plex-host and --plex-port as environment variables');
  console.log('');
  console.log(chalk.green('  Environment variables:'));
  console.log('');

  console.log('  PLEX_TOKEN   Plex server API token');
  console.log('  PLEX_HOST    Plex server hostname or ip (default: localhost)');
  console.log('  PLEX_PORT    Plex server hostname or ip (default: 32400)');
  console.log('');
});

program
  .command('list-libraries')
  .description('List of the existing libraries in the server')
  .action(async () => {
    const plex = initPlex(program);
    const items = await plex.getSections();
    console.log(' library id type    title');
    console.log(' ---------- ----    -----');
    items.MediaContainer.Directory.sort((section1, section2) => section1.key - section2.key).forEach((section) => {
      console.log(` ${section.key}        ${section.type}   ${section.title}`);
    });

  });

program
  .command('scan-library <libraryId>')
  .description('Scan a library for new items (movies or tv)')
  .action(async () => {
    const plex = initPlex(program);
    const libraryId = program.args[0];
    if (!libraryId) {
      console.log(chalk.red('\n  The libraryId is missing'));
      program.help();
      exit(1);
    }
    try {
      const library = await plex.getSection(libraryId);
      console.log(`  Scanning Library Id: ${libraryId} ${library.MediaContainer.title1}`);
      plex.scanSection(libraryId);
    }
    catch(e) {
      console.log(chalk.red(`\n The "Library Id" ${libraryId} does not exist`));
      const items = await plex.getSections();
      console.log(' library id type    title');
      console.log(' ---------- ----    -----');
      items.MediaContainer.Directory.sort((section1, section2) => section1.key - section2.key).forEach((section) => {
        console.log(` ${section.key}        ${section.type}   ${section.title}`);
      });
    }
  });

program
  .command('refresh-recent-tvshows')
  .description('Refresh the metadata of recently added tvshow episodes')
  .action(async () => {
    const plex = initPlex(program);
    const recentlyAddedItems = await plex.getRecentlyAddedItems(2);

    const items = recentlyAddedItems.MediaContainer.Metadata;
    const tvshows = {};

    for (const item of items) {
      if (item.type === 'episode') {
        tvshows[item.grandparentRatingKey] = {id: item.grandparentRatingKey, title: item.grandparentTitle};
      }
      else if (item.type === 'season') {
        tvshows[item.parentRatingKey] = {id: item.parentRatingKey, title: item.parentTitle};
      }
      else if (item.type === 'show'){
        tvshows[item.ratingKey] = {id: item.ratingKey, title: item.title};
      }
    }

    const tvshowsArr = Object.values(tvshows);
    for (const item of tvshowsArr) {
      console.log(chalk.yellow(`refreshing tvshow: ${item.title}`));
      await plex.refreshItemMetadata(item.id);
    }

    console.log(chalk.bold.green('refresh success'));
  });

program
  .command('refresh-tvshows')
  .description('Refresh the metadata of recently added tvshow episodes')
  .action(async () => {
    const plex = initPlex(program);
    const items = await plex.getRecentlyAddedItems(2);

    const episodeItems = items.MediaContainer.Metadata.filter((item)=> ['episode', 'season'].indexOf(item.type) >= 0);
    for (const item of episodeItems) {
      if (item.type === 'episode') {
        console.log(chalk.yellow(`refreshing ${item.grandparentTitle}, ${item.parentTitle}, episode ${item.index}`));
      }
      else if (item.type === 'season') {
        console.log(chalk.yellow(`refreshing ${item.parentTitle}, season ${item.index}`));
      }
      await plex.refreshItemMetadata(item.ratingKey);
    }
    console.log(chalk.bold.green('refresh success'));
  });

program
  .command('refresh-movies')
  .description('Refresh the metadata of recently added movies')
  .action(async () => {
    const plex = initPlex(program);
    const items = await plex.getRecentlyAddedItems(1);
    const episodeItems = items.MediaContainer.Metadata.filter((item)=> item.type === 'movie');
    for (const item of episodeItems) {
      console.log(chalk.yellow(`refreshing ${item.year}, ${item.title}`));
      await plex.refreshItemMetadata(item.ratingKey);
    }
    console.log(chalk.bold.green('refresh success'));

  });

program.parse(process.argv);
if (!program.args.length) {
  program.help();
}
