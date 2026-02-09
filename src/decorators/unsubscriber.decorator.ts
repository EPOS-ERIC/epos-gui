
/**
 * Attempts to unsubscribe from any subscriptions that have been signed up to
 * when the ngOnDestroy method is called on a object with a lifecycle.
 */
export const Unsubscriber = (unsubscribePropertyNames: string | Array<string> = []): (constructor: unknown) => void => {

  const tryUnsubscribe = (property: unknown) => {
    if (
      (null != property) // not null
      && (typeof (property as Record<string, unknown>).unsubscribe === 'function')
    ) {
      ((property as Record<string, unknown>).unsubscribe as () => void)();
    }
  };

  const unsubscribeProperty = (property: unknown) => {
    if (null !== property) {
      if (Array.isArray(property)) {
        property.forEach((element: unknown) => {
          if (null != element) {
            tryUnsubscribe(element);
          }
        });
      } else {
        tryUnsubscribe(property);
      }
    }
  };

  return (constructor: Record<string, unknown>) => {
    const prototype = constructor.prototype as Record<string, unknown>;
    const propNames = (Array.isArray(unsubscribePropertyNames)) ? unsubscribePropertyNames : [unsubscribePropertyNames];

    const original: null | (() => void) = prototype.ngOnDestroy as () => void;

    // eslint-disable-next-line space-before-function-paren
    prototype.ngOnDestroy = function () {
      propNames.forEach((propName: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (undefined === this[propName]) {
          console.log('Cannot unsubscribe from undefined:', propName, this);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          unsubscribeProperty(this[propName]);
        }
      });

      if (original && typeof original === 'function') {
        // eslint-disable-next-line prefer-rest-params
        original.apply(this, arguments);
      }
    };
  };
};
