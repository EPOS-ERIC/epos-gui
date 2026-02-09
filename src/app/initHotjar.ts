/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/**
 * Initialise the [Hotjar]{@link https://www.hotjar.com/} user feedback plugin.
 */
export const initHotjarFunc = (): void => {

  (function(h, o, t, j) {
    h['hj'] = h['hj'] || function() { (h['hj'].q = h['hj'].q || []).push(arguments); };
    h['_hjSettings'] = { hjid: 1430946, hjsv: 6 };
    const a = o.getElementsByTagName('head')[0];
    const r = o.createElement('script');
    r.async = !!1;
    r.src = t + h['_hjSettings'].hjid + j + h['_hjSettings'].hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
};
