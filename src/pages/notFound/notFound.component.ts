import { Component } from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';

/** The class NotFoundComponent is defined in TypeScript. */
@OnAttachDetach()
@Component({
  selector: 'app-not-found',
  templateUrl: './notFound.component.html',
  styleUrls: ['notFound.component.scss']
})
export class NotFoundComponent {
}
