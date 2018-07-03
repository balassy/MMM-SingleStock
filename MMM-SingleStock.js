/* global Module, Log */

/* Magic Mirror Module: MMM-SingleStock
 * By György Balássy
 * MIT Licensed.
 */

Module.register('MMM-SingleStock', {
  defaults: {
    stockSymbol: 'GOOG',
    updateInterval: 3600000,
    showChange: true,
    label: 'symbol' // 'symbol' | 'companyName' | 'none'
  },

  requiresVersion: '2.1.0',

  getScripts() {
    return [];
  },

  getStyles() {
    return [
      'MMM-SingleStock.css'
    ];
  },

  getTranslations() {
    return {
      en: 'translations/en.json',
      hu: 'translations/hu.json'
    };
  },

  start() {
    const self = this;
    this.viewModel = null;
    this.hasData = false;

    this._getData();

    setInterval(() => {
      self.updateDom();
    }, this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      const priceEl = document.createElement('div');
      priceEl.innerHTML = `${this.viewModel.label} ${this.viewModel.price}`;
      wrapper.appendChild(priceEl);

      if (this.config.showChange) {
        const changeEl = document.createElement('div');
        changeEl.classList = 'dimmed small';
        changeEl.innerHTML = ` (${this.viewModel.change})`;
        wrapper.appendChild(changeEl);
      }
    } else {
      const loadingEl = document.createElement('span');
      loadingEl.innerHTML = this.translate('LOADING', { symbol: this.config.stockSymbol });
      loadingEl.classList = 'dimmed small';
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  _getData() {
    const self = this;

    const url = `https://api.iextrading.com/1.0/stock/${this.config.stockSymbol}/quote`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self._processResponse(this.response);
        } else {
          Log.error(self.name, `MMM-SingleStock: Failed to load data. XHR status: ${this.status}`);
        }
      }
    };

    xhr.send();
  },

  _processResponse(responseBody) {
    const response = JSON.parse(responseBody);

    this.viewModel = {
      price: response.latestPrice,
      change: response.change > 0 ? `+${response.change}` : `${response.change}`
    };

    switch (this.config.label) {
      case 'symbol':
        this.viewModel.label = response.symbol;
        break;
      case 'companyName':
        this.viewModel.label = response.companyName;
        break;
      case 'none':
        this.viewModel.label = '';
        break;
      default:
        this.viewModel.label = this.config.label;
        break;
    }

    if (!this.hasData) {
      this.updateDom();
    }

    this.hasData = true;
  }
});
