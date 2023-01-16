Vue.createApp({
    data: () => ({
        tickerName: '',
        tickers: [],
        allCoins: [],
        fastAddTickers: [],
        emptyFieldErr: false,
        active: null,
        graph: [],
        numOfPages: [],
        page: 1,
        hasNextPage: true,
        search: '',
        filter: ''
    }),
    created: function() {
        const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());
        if (windowData.search) {
            this.search = windowData.search;
        }
        if (windowData.page) {
            this.page = parseInt(windowData.page);
        }

        this.getAllCoins();

        const savedCoins = localStorage.getItem('coins-list');
        if (savedCoins) {
            this.tickers = JSON.parse(savedCoins);
            this.tickers.forEach(ticker => {
                this.updatesOfPrice(ticker.name);
            })
        }
    },
    methods: {
        filteredTickers() {
            const start = (this.page - 1) * 6;
            const end = this.page * 6;
            const filteredTickers = this.tickers
                .filter(ticker => ticker.name.includes(this.search.toUpperCase()));

            switch (this.filter){
                case '':
                    filteredTickers.reverse();
                    break;
                case 'за спаданням':
                    filteredTickers.sort((ticker1, ticker2) => ticker2['price'] - ticker1['price']);
                    break;
                case 'за зростанням':
                    filteredTickers.sort((ticker1, ticker2) => ticker1['price'] - ticker2['price']);
                    break;
                case 'за алфавітом':
                    filteredTickers.sort((ticker1, ticker2) => ticker1['name'] > ticker2['name'] ? 1 : -1);
                    break;
            }
            this.hasNextPage = filteredTickers.length > end;

            return filteredTickers.slice(start, end);
        },
        addTicker() {
            if (this.tickerName !== ''){
                this.emptyFieldErr = false;
                this.search = '';
                if (!this.tickers.find(e => e.name === this.tickerName)) {
                    const currentTicker = {
                        name: (this.tickerName).toUpperCase(),
                        price: '-',
                    }
                    this.tickers.push(currentTicker);
                    // this.tickers[currentTicker.name] = currentTicker;

                    localStorage.setItem('coins-list', JSON.stringify(this.tickers));
                    this.updatesOfPrice(currentTicker.name);
                }
            } else
                this.emptyFieldErr = true
        },
        updatesOfPrice(tickerName) {
            setInterval(async () => {
                const f = await fetch(
                    `https://min-api.cryptocompare.com/data/price?fsym=${tickerName}&tsyms=USD&api_key=c3633065acae70f5d85544a077f60fd0a3ac5fb9d78fdb92f1e2195f0af3ef08`
                );
                const data = await f.json();
                this.tickers.find(ticker => ticker.name === tickerName).price =
                    data.USD > 1 ? data.USD.toFixed(2) : data.USD.toPrecision(2);
                if (this.active?.name === tickerName) {
                    this.graph.push(data.USD);
                }
            }, 3000);
            this.tickerName = '';
        },
        checkFastTicker() {
            let coins = this.allCoins;
            let matches = coins.filter(s => s.includes(this.tickerName.toUpperCase()));
            this.fastAddTickers = matches.splice(0, 4);
        },
        removeTicker(removedTickerId, removedTicker) {
            let savedCoin = localStorage.getItem('coins-list');
            let savedArr = JSON.parse(savedCoin);

            savedArr.splice(savedArr[removedTickerId], 1);

            // savedArr.forEach(elem => {
            //     if (elem.name === removedTicker.name) {
            //         savedArr.splice(elem, 1);
            //     }
            // })

            // console.log(Object.keys(savedArr));
            // console.log(savedArr);
            // if (savedArr.name === removedTicker.name) {
            //     savedArr.splice(elem, 1);
            // }
            // localStorage.setItem('coins-list', JSON.stringify(savedArr));

            this.tickers.splice(removedTickerId, 1);
            this.active = null;
        },
        choseFastTicker(chosenFastTicker) {
            this.tickerName = chosenFastTicker;
            this.addTicker();
        },
        select(ticker) {
          this.active = ticker;
          this.graph = [];
        },
        normalizeGraph(){
            const maxVal = Math.max(...this.graph);
            const minVal = Math.min(...this.graph);
            return this.graph.map(price => 5+((price - minVal)*95) / (maxVal - minVal));
        },
        async getAllCoins(){
                const t = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');
                const dataCoins = await t.json();
                const dataCoinsObj = dataCoins.Data;

                for (let dataCoin in dataCoinsObj) {
                    let coin = dataCoinsObj[dataCoin];
                    let allCoins = this.allCoins;
                    allCoins.push(coin.Symbol, coin.FullName);
                }
        }
    },
    watch: {
        search(){
            this.page = 1;
            window.history.pushState(
                null,
                document.title, `${window.location.pathname}?search=${this.search}&page=${this.page}`
            )
        },
        page(){
            let filteredUrl = `${window.location.pathname}?page=${this.page}`;
            if (this.search !== ''){
                filteredUrl = filteredUrl + `&?search=${this.search}`;
            }
            window.history.pushState(null, document.title, filteredUrl);
        },
    }
}).mount("#walletApp");