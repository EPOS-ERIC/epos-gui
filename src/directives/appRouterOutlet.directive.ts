import { ComponentRef, Directive } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

/**
 * A custom routing directive that calls custom component functions when routing to and
 * from a component.  Useful for where standard routing isn't being used
 * (e.g. {@link CustomReuseStrategy}).
 *
 *
 * This calls an "attach" function on the component when routing to it, and a "detach function
 * when routing away from it.
 *
 *
 * These functions can be conveniently added to the component using the {@link OnAttachDetach}
 * decorator.
 *
 *
 * Example here as it won't show on the created html page for the {@link OnAttachDetach} decorator
 * function.
 * @example
 * NEED TO ESCAPE at SYMBOL SOMEHOW
 *
 * @OnAttachDetach('onAttachComponents')
 * @Component({
 *  selector: 'app-my-component',
 *  template:
 *    '<app-my-child-component-1 #childComponent></app-my-child-component-1>'
 *    + '<app-my-child-component-2 #childComponent></app-my-child-component-2>'
 *  ,
 * })
 * export class MyComponent {
 *  @ViewChildren('childComponent') onAttachComponents: QueryList<any>;
 *   ...
 *   onAttach(): void {
 *     // do stuff on nav to component
 *   }
 *   onDetach(): void {
 *     // do stuff on nav away component
 *   }
 * }
 */
@Directive({
  selector: '[appRouterOutlet]',
})
export class AppRouterOutletDirective extends RouterOutlet {

  /* THESE ARE ONLY CALLED ON NAVIGATION BACK TO A PREVIOUSLY INITIALISED PAGE  */
  detach(): ComponentRef<unknown> {
    const instance = this.component as Record<string, unknown>;
    // eslint-disable-next-line no-underscore-dangle
    if (instance && typeof instance._onDetach === 'function') {
      // eslint-disable-next-line no-underscore-dangle
      instance._onDetach();
    }
    return super.detach();
  }

  attach(ref: ComponentRef<unknown>, activatedRoute: ActivatedRoute): void {
    super.attach(ref, activatedRoute);
    const refInstance = ref.instance as Record<string, unknown>;
    // eslint-disable-next-line no-underscore-dangle
    if (refInstance && typeof refInstance._onAttach === 'function') {
      // eslint-disable-next-line no-underscore-dangle
      refInstance._onAttach(ref, activatedRoute);
    }
  }
}
