import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ComponentsModule } from 'components/components.module';

import { NotFoundComponent } from './notFound/notFound.component';
import { DirectivesModule } from 'directives/directives.module';
import { LastPageRedirectComponent } from './lastPageRedirect/lastPageRedirect.component';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { DataPortalModule } from './dataPortal/dataPortal.module';


@NgModule({
  declarations: [
    NotFoundComponent,
    LastPageRedirectComponent,
  ],
  imports: [
    RouterModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    DirectivesModule,
    DataPortalModule,
    // angular materials library
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatListModule,
  ],
  exports: [
    NotFoundComponent,
  ],
  providers: [
  ]
})

export class PagesModule { }
