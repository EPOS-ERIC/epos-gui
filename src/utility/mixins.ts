/**
 * See: https://www.typescriptlang.org/docs/handbook/mixins.html
 *
 * Example:
 *
 * class SmartObject implements Disposable, Activatable {
 * ...
 * ...
 * }
 * applyMixins(SmartObject, [Disposable, Activatable]);
 *
 * @param derivedCtor
 * @param baseCtors
 */
function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}

