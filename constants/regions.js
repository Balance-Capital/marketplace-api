const { US, UK, AU, DE, FR, IT, ES, NL, BR, DK } = require('./countriesSupport')

module.exports = Object.freeze({
    US: [US],
    SA: [BR],
    EU: [DE,FR,IT,ES,NL,DK],
    UK: [UK],
    AUS: [AU]
})