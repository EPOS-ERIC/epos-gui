import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { Domain } from 'api/webApi/data/domain.interface';
import { BaseLandingService } from 'pages/dataPortal/services/baseLanding.service';
import { LoggingService } from 'services/logging.service';
import { Model } from 'services/model/model.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';

/**
 * Service that is used to manage landing page for the software panel.
 */
@Injectable()
export class LandingServiceSoftware extends BaseLandingService {

  constructor(
    protected readonly model: Model,
    protected readonly localStoragePersister: LocalStoragePersister,
    protected readonly apiService: ApiService,
    protected readonly loggingService: LoggingService,
  ) {
    super();
  }

  /**
   * The function retrieves a list of domains from an API service, adds two additional domains to the
   * list, sorts the list by ID, and updates the source of the domains.
   */
  public getDomains(): void {
    void this.loggingService.logForPromise(
      this.apiService.getDomains(CONTEXT_SOFTWARE),
      'List of domains'
    ).then((r: null | Array<Domain>) => {

      if (r !== null) {
        // add ALL
        r.push({
          id: '0',
          title: 'All software and services',
          code: 'ALL',
          linkUrl: '',
          imgUrl: 'assets/img/see_all.png',
          domain: false,
          color: '#fff',
        });

        // add FAC
        r.push({
          id: '100',
          title: 'Favourites',
          code: 'FAV',
          linkUrl: '',
          imgUrl: 'assets/img/favourites.png',
          domain: false,
          color: '#fff',
        });
          // new sorting way
           r.sort((a, b) => {
            if (a.code === 'ALL') {
              return -1; // ALL comes first
            }
            if (b.code === 'ALL') {
              return 1;
            }
            if (a.code === 'FAV') {
              return -1; // FAV comes after ALL
            }
            if (b.code === 'FAV') {
              return 1;
            }
            // Sort remaining by id
            return Number(a.id) - Number(b.id);
          });

        this.domainsSrc.next(r);
      }

    });
  }

  /**
   * The setDomain function sets the active domain based on the provided value and updates the landing
   * page accordingly.
   * @param {string | boolean} value - The `value` parameter can be either a string or a boolean.
   */
  public setDomain(value: string | boolean): void {
    if (typeof value === 'string') {
      const selectedDomain: Domain = { code: value, isSelected: true };
      this.model.domainMISoft.set(selectedDomain);
      this.setActiveDomain(value);
      this.localStoragePersister.set(
        LocalStorageVariables.LS_CONFIGURABLES,
        selectedDomain.code,
        false,
        LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_SOFTWARE
      );
    } else {
      this.localStoragePersister.set(
        LocalStorageVariables.LS_CONFIGURABLES,
        '',
        false,
        LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_SOFTWARE
      );
      this.setActiveDomain(false);
    }

    this.showLanding((value === false) ? true : false);
  }

}
