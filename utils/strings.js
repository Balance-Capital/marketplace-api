const ucFirst = s => s && s[0].toUpperCase() + s.slice(1);
const lcFirst = s => s && s[0].toLowerCase()+ s.slice(1);

module.exports = {
    ucFirst,
    lcFirst
};