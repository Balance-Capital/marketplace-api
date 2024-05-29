// const stores = require('./stores');
const redisCacheKeys = require('./redisCacheKeys');

const seeds = [
    // stores,
    redisCacheKeys
];

const run = async () => {
    seeds.forEach( (element) => {
        element.run();
    });
}

run();