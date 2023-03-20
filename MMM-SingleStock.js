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
    label: 'symbol', // 'symbol' | 'companyName' | 'none'
    api: 'iexcloud', // 'iexcloud' | 'tiingo'
    crypto: ''
  },

  requiresVersion: '2.1.0',
  url: '',
  cryptoUrl: '',

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

    if (this.config.crypto !== '') {
      this._getCrypto(() => self.updateDom());
    } else {
      this._getData(() => self.updateDom());
    }

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

        if (this.config.colorized) {
          if (this.viewModel.change > 0) {
            changeEl.style = 'color: #a3ea80';
          }
          if (this.viewModel.change < 0) {
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

  _getCrypto(onCompleteCallback) {
    const self = this;

    if (this.cryptoUrl === '') {
      this.cryptoUrl = this._getTiingoUrl(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${this.config.crypto}&resampleFreq=5min`);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.cryptoUrl, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self._processCryptoResponse(this.response);
          onCompleteCallback();
        } else {
          Log.error(self.name, `MMM-SingleStock: Failed to load crypto data. XHR status: ${this.status}`);
        }
      }
    };

    xhr.send();
  },

  _getData(onCompleteCallback) {
    const self = this;

    self._SetUrl(this.config.api);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', self.url, true);
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
    const response = this._setResponse(responseBody);

    this.viewModel = {
      price: this._setPrice(response)
    };

    switch (this.config.changeType) {
      case 'percent':
        this.viewModel.change = this._setPercentChange(response);
        break;
      default:
        this.viewModel.change = this._setNumericChange(response);
        break;
    }

    switch (this.config.label) {
      case 'symbol':
        this.viewModel.label = response.ticker;
        break;
      case 'companyName':
        this.viewModel.label = response.ticker;
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
  },

  _processCryptoResponse(responseBody) {
    const parsed = JSON.parse(responseBody);
    // eslint-disable-next-line prefer-destructuring
    const response = parsed[0];
    // eslint-disable-next-line prefer-destructuring
    const openingPriceData = response.priceData[0];
    const priceData = response.priceData[response.priceData.length - 1];

    Log.info(priceData);

    this.viewModel = {
      price: priceData.close.toFixed(2)
    };

    switch (this.config.changeType) {
      case 'percent':
        this.viewModel.change = (
          ((openingPriceData.open - priceData.close) / openingPriceData.open)
          * 100
        ).toFixed(2);
        break;
      default:
        this.viewModel.change = (openingPriceData.open - priceData.close).toFixed(2);
        break;
    }

    switch (this.config.label) {
      case 'symbol':
        this.viewModel.label = response.baseCurrency.toUpperCase();
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
  },

  _setResponse(responseBody) {
    let response = '';
    switch (this.config.api) {
      case 'iexcloud': {
        response = JSON.parse(responseBody);
        break;
      }
      case 'tiingo': {
        const parsed = JSON.parse(responseBody);
        // eslint-disable-next-line prefer-destructuring
        response = parsed[0];
        break;
      }
      default:
        break;
    }

    return response;
  },

  _setPrice(response) {
    let value = '';
    switch (this.config.api) {
      case 'iexcloud':
        value = response.latestPrice;
        break;
      case 'tiingo':
        value = response.last;
        break;
      default:
        break;
    }

    return value;
  },

  _setNumericChange(response) {
    let value = '';
    switch (this.config.api) {
      case 'iexcloud':
        value = response.change > 0 ? `+${response.change}` : `${response.change}`;
        break;
      case 'tiingo':
        value = (response.prevClose - response.last).toFixed(2);
        break;
      default:
        break;
    }

    return value;
  },

  _setPercentChange(response) {
    let value = '';
    switch (this.config.api) {
      case 'iexcloud':
        value = (response.changePercent * 100).toFixed(2);
        break;
      case 'tiingo':
        value = (
          ((response.prevClose - response.last) / response.prevClose)
          * 100
        ).toFixed(2);
        break;
      default:
        break;
    }

    return value;
  },

  _SetUrl(api) {
    switch (api) {
      case 'iexcloud':
        this.url = `https://cloud.iexapis.com/v1/stock/${this.config.stockSymbol}/quote?token=${this.config.apiToken}`;
        break;
      case 'tiingo':
        if (this.url === '') {
          this.url = this._getTiingoUrl(`https://api.tiingo.com/iex/?tickers=${this.config.stockSymbol}`);
        }
        break;
      default:
        Log.error(this.name, `Invalid api config: ${api}`);
        break;
    }
  },

  _getTiingoUrl(baseUrl) {
    const expectedResponseHeaders = [
      'server',
      'date',
      'content-type',
      'content-length',
      'vary',
      'x-frame-options'
    ];
    const requestHeaders = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Authorization', value: `Token ${this.config.apiToken}` }
    ];

    const url = this._getCorsUrl(
      baseUrl,
      requestHeaders,
      expectedResponseHeaders
    );

    return url;
  },

  /**
   * Gets a URL that will be used when calling the CORS-method on the server.
   *
   * @param {string} url the url to fetch from
   * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
   * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
   * @returns {string} to be used as URL when calling CORS-method on server.
   */
  _getCorsUrl(url, requestHeaders, expectedResponseHeaders) {
    if (!url || url.length < 1) {
      throw new Error(`Invalid URL: ${url}`);
    } else {
      // eslint-disable-next-line no-restricted-globals
      let corsUrl = `${location.protocol}//${location.host}/cors?`;

      const requestHeaderString = this._getRequestHeaderString(requestHeaders);
      if (requestHeaderString) corsUrl = `${corsUrl}sendheaders=${requestHeaderString}`;

      // eslint-disable-next-line max-len
      const expectedResponseHeadersString = this._getExpectedResponseHeadersString(expectedResponseHeaders);
      if (requestHeaderString && expectedResponseHeadersString) {
        corsUrl = `${corsUrl}&expectedheaders=${expectedResponseHeadersString}`;
      } else if (expectedResponseHeadersString) {
        corsUrl = `${corsUrl}expectedheaders=${expectedResponseHeadersString}`;
      }

      if (requestHeaderString || expectedResponseHeadersString) {
        return `${corsUrl}&url=${url}`;
      }
      return `${corsUrl}url=${url}`;
    }
  },

  /**
   * Gets the part of the CORS URL that represents the HTTP headers to send.
   *
   * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
   * @returns {string} to be used as request-headers component in CORS URL.
   */
  _getRequestHeaderString(requestHeaders) {
    let requestHeaderString = '';
    if (requestHeaders) {
      // eslint-disable-next-line no-restricted-syntax
      for (const header of requestHeaders) {
        if (requestHeaderString.length === 0) {
          requestHeaderString = `${header.name}:${encodeURIComponent(
            header.value
          )}`;
        } else {
          requestHeaderString = `${requestHeaderString},${
            header.name
          }:${encodeURIComponent(header.value)}`;
        }
      }
      return requestHeaderString;
    }
    return undefined;
  },

  /**
   * Gets the part of the CORS URL that represents the expected HTTP headers to recieve.
   *
   * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
   * @returns {string} to be used as the expected HTTP-headers component in CORS URL.
   */
  _getExpectedResponseHeadersString(expectedResponseHeaders) {
    let expectedResponseHeadersString = '';
    if (expectedResponseHeaders) {
      // eslint-disable-next-line no-restricted-syntax
      for (const header of expectedResponseHeaders) {
        if (expectedResponseHeadersString.length === 0) {
          expectedResponseHeadersString = `${header}`;
        } else {
          expectedResponseHeadersString = `${expectedResponseHeadersString},${header}`;
        }
      }
      return expectedResponseHeaders;
    }
    return undefined;
  }
});
