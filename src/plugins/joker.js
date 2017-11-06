const path = require('path');
const { open } = require('../common');

/**
 * take next bash.org joke
 * @example
 * joker.init();
 * const jokeText = await joker.next();
 */

class Joker {
  constructor(dbPath = './jokes.json') {
    this._dbPath = path.resolve(__dirname, dbPath);
    this._loadDb();
    this.list = [];
    this.page = -1;
    this.i = -1;
    this._dbPath = null;
  }

  async nextJoke() {
    const jokes = await this._getList();
    ++this.i;
    console.info('nextJoke', this.i, this.list.length, this.list[this.i]);
    this._updateDb();
    return this.list[this.i];
  }

  // private

  _getList() {
    if (this.list.length <= (this.i + 1)) return this._loadNewPage();
    return this.list;
  }

  async _loadNewPage() {
    ++this.page;
    console.info('load new jokes', this.page);
    const html = await open(`http://bash.im/byrating/${  this.page}`);
    const { window: { document } } = parse(html);
    const list = Array.from(document.querySelectorAll('.quote .text'))
      .map(e => decode(e.innerHTML.replace(/<[^>]+>/g, '\n')));
    this.list = list;
    this.i = -1;
    this._updateDb();
    return list;
  }
  _updateDb() {
    console.log('_updateDb');
    write(this._dbPath, { i: this.i, page: this.page, list: this.list });
    console.log('jokes db updated', this.page, this.i);
  }
  _loadDb() {
    console.log('_loadDb', process.cwd());
    if (!fs.existsSync(this._dbPath)) return;
    const jokes = require('./jokes');
    console.log('jokes db loaded', jokes.page, jokes.i, jokes.list.length);
    this.list = jokes.list;
    this.page = jokes.page;
    this.i = jokes.i;
  }
}

export default dbPath => Joker._instance || (Joker._instance = new joker(dbPath));
