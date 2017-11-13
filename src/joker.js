const bindAll = require('lodash.bindall')
const { resolve } = require('path')
const { existsSync } = require('fs')
const { open, decode, parse, write } = require('./common')

let instance = null

module.exports = ({
  dbPath = '../jokes.json'
} = {}) => {
  class Joker {
    constructor () {
      this.list = []
      this.page = -1
      this.i = -1
      this._dbPath = resolve(__dirname, dbPath)

      this._loadDb()
    }

    async next () {
      const jokes = await this._getList();
      ++this.i;
      console.log('nextJoke', 'i', this.i, 'len', jokes.length, 'p', this.page)
      this._updateDb()
      return jokes[this.i];
    }

    _getList () {
      if (this.list.length <= (this.i + 1)) return this._loadNewPage();
      return this.list;
    }

    async _loadNewPage () {
      ++this.page;
      console.log('load new jokes', this.page);
      const html = await open('http://bash.im/byrating/' + this.page);
      const { window: { document } } = parse(html);
      const list = Array.from(document.querySelectorAll('.quote .text'))
        .map(e => decode(e.innerHTML.replace(/<[^>]+>/g, '\n')))
      this.list = list;
      this.i = -1;
      this._updateDb();
      return list;
    }

    _updateDb () {
      console.log('_updateDb');
      write(this._dbPath, { i: this.i, page: this.page, list: this.list });
      console.log('jokes db updated', this.page, this.i);
    }

    _loadDb () {
      console.log('_loadDb', 'cwd', process.cwd(), 'path', __dirname, 'dbPath', this._dbPath);
      if (!existsSync(this._dbPath)) return;
      const jokes = require(this._dbPath);
      console.log('jokes db loaded', jokes.page, jokes.i, jokes.list.length)
      this.list = jokes.list;
      this.page = jokes.page;
      this.i = jokes.i;
    }
  }
  return instance || (instance = bindAll(new Joker()))
}
