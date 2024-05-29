/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
const xorStrings = (key,input) => {
    let output='';
    for(let i=0; i<input.length; i++){
      const c = input.charCodeAt(i);
      const k = key.charCodeAt(i%key.length);
      output += String.fromCharCode(c ^ k);
    };
    return output;
};

const B64XorCipher = {
    encode: (key, data) => Buffer.from(xorStrings(key, data), 'utf8').toString('base64'),
    decode: (key, data) => {
      const dataCoded = Buffer.from(data, 'base64').toString('utf8');
      return xorStrings(key, dataCoded);
    }
};

module.exports = {
    B64XorCipher
}
