/* global Module, Log */

/* Magic Mirror Module: MMM-SingleStock (https://github.com/balassy/MMM-SingleStock)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.
 */

Module.register('MMM-SingleStock', {
  defaults: {
    stockSymbol: 'GOOG',
    apiToken: '',
    updateInterval: 3600000,
    showChange: true,
    changeType: '',
    colorized: false,
    minimal: false,
    label: 'symbol' // 'symbol' | 'companyName' | 'none'
  },

  requiresVersion: '2.1.0',

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

    this._getData(() => self.updateDom());

    setInterval(() => {
      self._getData(() => self.updateDom());
    }, this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      const priceEl = document.createElement('div');
      if (this.config.minimal) {
        priceEl.classList = 'small';
      }

      const labelEl = document.createElement('span');
      labelEl.innerHTML = `${this.viewModel.label}`;
      priceEl.appendChild(labelEl);

      const valueEl = document.createElement('span');
      valueEl.innerHTML = ` ${this.viewModel.price}`;
      if (this.config.colorized) {
        valueEl.classList = 'bright';
      }
      priceEl.appendChild(valueEl);

      wrapper.appendChild(priceEl);

      if (this.config.showChange) {
        const changeEl = document.createElement('div');

        changeEl.innerHTML = this.config.changeType === 'percent'
          ? `(${this.viewModel.change}%)`
          : `(${this.viewModel.change})`;

        changeEl.classList = this.config.minimal
          ? 'dimmed xsmall'
          : 'dimmed small';

        if (this.config.colorized)
        {
          if (this.viewModel.change > 0)
          {
            changeEl.style = 'color: #a3ea80';
          }
          if (this.viewModel.change < 0)
          {
            changeEl.style = 'color: #FF8E99';
          }
        }

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

  _getData(onCompleteCallback) {
    const self = this;

    const url = `https://cloud.iexapis.com/v1/stock/${this.config.stockSymbol}/quote?token=${this.config.apiToken}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self._processResponse(this.response);
          onCompleteCallback();
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
      price: response.latestPrice
    };

    switch (this.config.changeType) {
      case 'percent':
        this.viewModel.change = (response.changePercent * 100).toFixed(2);
        break;
      default:
        this.viewModel.change = response.change > 0 ? `+${response.change}` : `${response.change}`;
        break;
    }

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
