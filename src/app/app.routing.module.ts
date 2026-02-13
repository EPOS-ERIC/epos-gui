import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent } from 'pages/notFound/notFound.component';
import { LastPageRedirectComponent } from 'pages/lastPageRedirect/lastPageRedirect.component';
import { DataPortalComponent } from 'pages/dataPortal/dataPortal.component';

export const APP_ROUTES: Routes = [
  // START DATA
  {
    path: '',
    component: DataPortalComponent,
    data: {
      title: 'Catalogue of Services',
      hideHeader: false,
      pageCssClass: '',
    },
  },
  {
    path: 'data/search',
    redirectTo: '',
    data: {
      title: 'Catalogue of Services',
      hideHeader: false,
      pageCssClass: '',
    },
  },
  {
    path: 'last-page-redirect',
    component: LastPageRedirectComponent,
    data: {
      title: 'Catalogue of Services',
      ignoreAsLastPage: true,
    },
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: {
      title: 'Catalogue of Services',
      ignoreAsLastPage: true,
    },
  },
];

/**
 * CAN'T USE 'children' with our custom route reuse strategy, otherwise can't use the onAttach etc. decorator
 */

@NgModule({
  imports: [RouterModule.forRoot(APP_ROUTES, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
