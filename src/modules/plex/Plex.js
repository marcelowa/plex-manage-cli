const fetch = require('node-fetch');
const chalk = require('chalk');

class Plex {
  constructor({host, schema, port, token}) {
    this.schema = schema || 'http';
    this.host = host || 'localhost';
    this.port = port || '32400';
    this.token = token || '32400';
    this.baseUrl = `${this.schema}://${this.host}:${this.port}`;

    if (!token) {
      throw new Error('The plex token is missing or invalid');
    }
  }

  async getRecentlyAddedItems(type = 2) { // 2 defaults to tvshows
    const  url = `${this.baseUrl}/hubs/home/recentlyAdded?X-Plex-Token=${this.token}&type=${type}&X-Plex-Container-Start=0&X-Plex-Container-Size=100`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    };

    try {
      const response = await fetch(url, options);
      return response.json();
    }
    catch(e) {
      console.error(chalk.bold.red('Something went wrong'), e);
      return false;
    }
  }

  async refreshItemMetadata(itemId) {
    const url = `${this.baseUrl}/library/metadata/${itemId}/refresh?X-Plex-Token=${this.token}`;

    const options = {
      method: 'PUT',
      headers: {
        accept: 'application/json'
      }
    };
    try {
      const response = await fetch(url, options);
      if (response.status >= 300) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    }
    catch(e) {
      console.error(chalk.bold.red('Something went wrong'), e);
      return false;
    }
  }

  async getSections() {
    const  url = `${this.baseUrl}/library/sections?X-Plex-Token=${this.token}`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    };

    try {
      const response = await fetch(url, options);
      return response.json();
    }
    catch(e) {
      console.error(chalk.bold.red('Something went wrong'), e);
      return false;
    }
  }

  async getSection(sectionId) {
    const  url = `${this.baseUrl}/library/sections/${sectionId}?X-Plex-Token=${this.token}`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    };

    try {
      const response = await fetch(url, options);
      return response.json();
    }
    catch(e) {
      console.error(chalk.bold.red('Something went wrong'), e);
      return false;
    }
  }

  async scanSection(sectionId) {
    const  url = `${this.baseUrl}/library/sections/${sectionId}/refresh?X-Plex-Token=${this.token}`;

    const options = {
      method: 'GET'
    };

    try {
      const response = await fetch(url, options);
      if (response.status >= 300) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    }
    catch(e) {
      console.error(chalk.bold.red('Something went wrong'), e);
      return false;
    }
  }
}


module.exports = Plex;
