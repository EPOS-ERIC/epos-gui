/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ComponentRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Due to the use of the {@link CustomReuseStrategy}, routed pages don't necessarily have access
 * to the "normal" component [lifecycle hooks]{@link https://angular.io/guide/lifecycle-hooks}.
 *
 *
 * This decorator is designed to add new hooks that the component can use to run code when it is
 * navigated away from and back to, where ngOnInit etc. are not fired.
 *
 *
 * These hooks are triggered because the standard router has been replaced with
 * [this]{@link AppRouterOutletDirective} custom one.
 *
 * @param subComponentsAttributeName {string} The name of the variable that holds references to
 * and child components that need onAttach or onDetach functions calling.
 */
export const OnAttachDetach = (subComponentsAttributeName: null | string = null): ((constructor: unknown) => void) => {

  return (constructor: Record<string, unknown>) => {
    addTheFunction(constructor, 'onAttach', subComponentsAttributeName);
    addTheFunction(constructor, 'onDetach', subComponentsAttributeName);
  };
};

const addTheFunction = (constructor: Record<string, unknown>, name: string, subComponentsAttributeName: null | string): void => {
  const internalFuncName = `_${name}`;

  (constructor.prototype as Record<string, unknown>)[internalFuncName] = function(
    ref: ComponentRef<unknown>,
    activatedRoute: ActivatedRoute,
  ) {
    // call the function on registered child components
    if ((subComponentsAttributeName != null) && (this[subComponentsAttributeName] != null)) {
      this[subComponentsAttributeName].forEach(component => {
        if (component[internalFuncName] && (typeof component[internalFuncName] === 'function')) {
          component[internalFuncName](ref, activatedRoute);
        }
      });
    }
    // call the function on this component
    if (this[name] && (typeof this[name] === 'function')) {
      this[name](ref, activatedRoute);
    }
  };
};
