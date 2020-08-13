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
      if (this.config.colorized) {
        const priceEl = document.createElement('span');
        if (this.config.minimal) {
          priceEl.classList = 'normal small';
        } else {
          priceEs.classList = 'normal medium';
        }
        priceEl.innerHTML = `${this.viewModel.label}`;
        wrapper.appendChild(priceEl);
        const priceEs = document.createElement('span');
        if (this.config.minimal) {
          priceEs.classList = 'bright small';
        } else {
          priceEs.classList = 'bright medium';
        }
        priceEs.innerHTML = ` ${this.viewModel.price}`;
        wrapper.appendChild(priceEs);
      } else {
        const priceEl = document.createElement('div');
        priceEl.innerHTML = `${this.viewModel.label} ${this.viewModel.price}`;
        if (this.config.minimal) {
          priceEl.classList = 'dimmed small';
        }
        wrapper.appendChild(priceEl);
    }

      if (this.config.showChange) {
        const changeEl = document.createElement('div');
        if (this.config.minimal) {
          changeEl.classList = 'dimmed xsmall';
        } else {
          changeEl.classList = 'dimmed small';
        }
        if (this.config.changeType === 'percent') {
          changeEl.innerHTML = ` (${this.viewModel.change}%)`;
        } else {
          changeEl.innerHTML = ` (${this.viewModel.change})`;
        }
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

    // allow value or percent
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
