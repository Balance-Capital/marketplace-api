/* eslint-disable no-underscore-dangle */

const jarvisEndpointsResponse = ( async ({items}) => {
    const response = await Promise.all( items.map((element) => ({
        id: element._id,
        companyName: element.name,
        companyInformation: element.companyInformation,
        toneOfVoice: 'professional'
    })));
    return response;
});

module.exports = jarvisEndpointsResponse;