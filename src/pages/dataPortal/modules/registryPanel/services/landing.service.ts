import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { CONTEXT_FACILITY } from 'api/api.service.factory';
import { Domain } from 'api/webApi/data/domain.interface';
import { LoggingService } from 'services/logging.service';
import { Model } from 'services/model/model.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { BaseLandingService } from 'pages/dataPortal/services/baseLanding.service';

/**
 * Service that is used to manage landing page..
 */
@Injectable()
export class LandingService extends BaseLandingService {


  constructor(
    private readonly model: Model,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly apiService: ApiService,
    private readonly loggingService: LoggingService,
  ) {
    super();
  }

  /**
   * The function retrieves a list of domains from an API service, adds two additional domains to the
   * list, sorts the list by ID, and updates the source of the domains.
   */
  public getDomains(): void {
    void this.loggingService.logForPromise(
      this.apiService.getDomains(CONTEXT_FACILITY),
      'List of domains'
    ).then((r: null | Array<Domain>) => {

      if (r !== null) {
        // add ALL
        r.push({
          id: '0',
          title: 'All facilities',
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

        // order by id
        r.sort((a, b) => (a.id !== undefined && Number(a.id)) > (b.id !== undefined && Number(b.id)) ? 1 : -1);

        this.domainsSrc.next(r);
      }

    });
  }

  public getFilters(): Promise<null | DiscoverResponse> {

    return this.loggingService.logForPromise(
      this.apiService.getFilters(CONTEXT_FACILITY),
      'List of filters'
    );

  }

  /**
   * The setDomain function sets the active domain based on the provided value and updates the landing
   * page accordingly.
   * @param {string | boolean} value - The `value` parameter can be either a string or a boolean.
   */
  public setDomain(value: string | boolean): void {
    if (typeof value === 'string') {
      const selectedDomain: Domain = { code: value, isSelected: true };
      this.model.domainMIReg.set(selectedDomain);
      this.setActiveDomain(value);
      this.localStoragePersister.set(
        LocalStorageVariables.LS_CONFIGURABLES,
        selectedDomain.code,
        false,
        LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_FACILITY
      );
    } else {
      this.localStoragePersister.set(
        LocalStorageVariables.LS_CONFIGURABLES,
        '',
        false,
        LocalStorageVariables.LS_DOMAIN_OPEN + CONTEXT_FACILITY
      );
      this.setActiveDomain(false);
    }

    this.showLanding((value === false) ? true : false);
  }

}
