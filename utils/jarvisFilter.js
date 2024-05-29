const FILTR = [
'sex','cum','fuck','dildo','adult','porn'
];

const jarvisFilter = (text) => {
    if(text === null) return true;
    const regxp = new RegExp(FILTR.join('|'),'gui');
    const veryfy = text.match(regxp) !== null;
    return veryfy;
};

module.exports = {
    jarvisFilter
}