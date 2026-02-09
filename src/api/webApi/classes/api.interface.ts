import { SearchApi } from './searchApi.interface';
import { DetailsApi } from './detailsApi.interface';
import { DictionaryApi } from './dictionaryApi.interface';
import { AaaiApi } from './aaaiApi.interface';
import { ExecutionApi } from './executionApi.interface';
import { DiscoverApi } from './discoverApi.interface';
import { EnvironmentApi } from './environments/environmentApi.interface';
import { EnvironmentTypeApi } from './environments/environmentTypeApi.interface';
import { ShareApi } from './shareApi.interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Api extends DiscoverApi, DictionaryApi, SearchApi, DetailsApi, AaaiApi, ExecutionApi, ShareApi, EnvironmentApi, EnvironmentTypeApi {
}
