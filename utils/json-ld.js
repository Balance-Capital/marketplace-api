const product = ({ brand, name, image, description, rating }) => ({
    "@context": "http://www.schema.org",
    "@type": "Product",
    "brand": `${brand}`,
    "name": `${name}`,
    "image": `${image}`,
    "description": `${description}`,
    "aggregateRating": {
        "@type": "aggregateRating",
        "ratingValue": `${rating}`
    }
});

module.exports = { product }
