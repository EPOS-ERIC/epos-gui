import { DistributionDetails } from '../distributionDetails.interface';
import { ObjectAccessUtility } from 'api/webApi/utility/objectAccessUtility';
import { DistributionType } from '../distributionType.enum';
import { SpatialRange } from '../spatialRange.interface';
import { TemporalRange } from '../temporalRange.interface';
import { SimpleDistributionDetails } from './simpleDistributionDetails';
import { ParameterDefinition } from '../parameterDefinition.interface';
import { ParameterType } from '../parameterType.enum';
import { ParameterProperty } from '../parameterProperty.enum';
import { SimpleParameterDefinition } from './simpleParameterDefinition';
import { SimpleSpatialRange } from './simpleSpatialRange';
import { SimpleTemporalRange } from './simpleTemporalRange';
import * as moment from 'moment';
import { DistributionFormat } from '../distributionFormat.interface';
import { SimpleDistributionSummary } from './simpleDistributionSummary';
import { SimpleDistributionFormat } from './simpleDistributionFormat';
import { DistributionSummary } from '../distributionSummary.interface';
import { Optional } from 'api/webApi/utility/optional';
import { Confirm } from 'api/webApi/utility/preconditions';
import { ParameterDefinitions } from '../parameterDefinitions.interface';
import { SimpleParameterDefinitions } from './simpleParameterDefinitions';
import { SimpleDataProvider } from './simpleDataProvider';
import { DataProvider } from '../dataProvider.interface';
import { DistributionContactPoint } from '../distributionContactPoint.interface';
import { DistributionCategories } from '../distributionCategories.interface';
import { Organization } from '../organization.interface';
import { SimpleOrganization } from './simpleOrganization';
import { CONTEXT_SOFTWARE } from 'api/api.service.factory';

export class JSONDistributionFactory {
  // current versioningStatusInfo properties being received from Back-End
  public static versioningStatusInfoProperties: Array<string> = ['changeDate', 'editorFullName'];
  /**
   * The function `jsonToOriginalUrl` takes a JSON object and extracts the 'url' property value,
   * returning it as a nullable string.
   * @param json - The `json` parameter is a JavaScript object (Record<string, unknown>) that contains
   * data in JSON format.
   * @returns The function `jsonToOriginalUrl` is returning an Optional containing either `null` or a
   * string value extracted from the `url` property of the input JSON object.
   */
  public static jsonToOriginalUrl(json: Record<string, unknown>): Optional<null | string> {

    const url = ObjectAccessUtility.getObjectValueString(json, 'url', true, null);

    return Optional.ofNullable(url);
  }

  /**
   * This function converts a JSON object into DistributionDetails.
   * It acts as a dispatcher, checking the context and type to decide
   * which concrete builder to use.
   * @param json The full JSON response from the API.
   * @param context The context (e.g., CONTEXT_SOFTWARE) of the call.
   * @returns An Optional containing a DistributionDetails object or null.
   */
  public static jsonToDistributionDetails(
    json: Record<string, unknown>,
    context: string,
  ): Optional<null | DistributionDetails> {

    if (context === CONTEXT_SOFTWARE && json && json.object && json.type) {

      const detailsType = json.type as string;
      const rawData = json.object as Record<string, unknown>;

      switch (detailsType) {
        case 'distribution':
          // JSON Example 2 (Jupyter Notebook) -> Uses the standard builder
          return this.buildStandardDetails(rawData, detailsType);

        case 'software_source_code':
        case 'software_application':
          // Both types are handled by the same function
          return this.buildSoftwareAsStandardDetails(rawData, detailsType);

        default:
          console.warn(`Unhandled software type: ${detailsType}`);
          return Optional.empty();
      }
    }

    // 2. STANDARD CONTEXT HANDLING (non-software)
    return this.buildStandardDetails(json, null);
  }

  /**
   * The function `jsonToDataProvider` parses a JSON object to create a DataProvider object with
   * specific fields.
   * @param jsonWithParams - The `jsonWithParams` parameter is expected to be an object containing
   * key-value pairs where the keys are strings and the values are of type unknown. This object likely
   * represents some JSON data with parameters that will be used to create a DataProvider object.
   * @param {string} value - The `value` parameter in the `jsonToDataProvider` function is a string
   * that specifies the path to the data provider object within the JSON object `jsonWithParams`. This
   * path is used to access the specific data provider object that needs to be converted into a
   * `DataProvider` object.
   * @returns The `jsonToDataProvider` function returns a `DataProvider` object if the `providerObject`
   * is not null and all required fields (`dataProviderLegalName`, `dataProviderUrl`, and
   * `relatedDataServiceProvider`) are present in the `providerObject`. If any of the required fields
   * are missing or if the `providerObject` itself is null, the function returns null.
   */
  public static jsonToDataProvider(jsonWithParams: Record<string, unknown>, value: string): DataProvider | null {
    const providerObject = ObjectAccessUtility.getObjectValue<Record<string, unknown>>(jsonWithParams, value, false);

    if (providerObject != null) {
      // check required fields
      const dataProviderLegalName = ObjectAccessUtility.getObjectValueString(providerObject, 'dataProviderLegalName', false, null);
      const dataProviderUrl = ObjectAccessUtility.getObjectValueString(providerObject, 'dataProviderUrl', false, null);
      const relatedDataProvider = ObjectAccessUtility.getObjectArray<DataProvider>(providerObject, 'relatedDataServiceProvider', false);
      const dataProviderId = ObjectAccessUtility.getObjectValueString(providerObject, 'uid', false, null);
      const country = ObjectAccessUtility.getObjectValueString(providerObject, 'country', false, null);

      // Create parameter

      const provider = SimpleDataProvider.make(
        dataProviderLegalName,
        dataProviderUrl,
        relatedDataProvider,
        dataProviderId,
        country
      );

      return provider;
    }

    return null;

  }

  /**
   * The function `jsonToArrayDataProvider` converts JSON data into an array of DataProvider objects by
   * extracting specific values and creating instances of DataProvider.
   * @param jsonWithParams - The `jsonWithParams` parameter is expected to be a JSON object containing
   * parameters for data providers. This function takes this JSON object and extracts data provider
   * information from it to create an array of `DataProvider` objects.
   * @param {string} value - The `value` parameter in the `jsonToArrayDataProvider` function is used to
   * specify the key in the `jsonWithParams` object from which to extract an array of objects. This
   * array of objects will then be processed to create an array of `DataProvider` objects.
   * @returns An array of DataProvider objects is being returned from the `jsonToArrayDataProvider`
   * function.
   */
  public static jsonToArrayDataProvider(jsonWithParams: Record<string, unknown>, value: string): Array<DataProvider> {
    const providers = new Array<DataProvider>();
    const providerObjects = ObjectAccessUtility.getObjectArray<Record<string, unknown>>(jsonWithParams, value, false);

    if (providerObjects != null) {
      providerObjects.forEach((providerObj: Record<string, unknown>) => {
        // check required fields
        const dataProviderLegalName = ObjectAccessUtility.getObjectValueString(providerObj, 'dataProviderLegalName', false, null);
        const dataProviderUrl = ObjectAccessUtility.getObjectValueString(providerObj, 'dataProviderUrl', false, null);
        const relatedDataProvider = ObjectAccessUtility.getObjectArray<DataProvider>(providerObj, 'relatedDataServiceProvider', false);
        const dataProviderId = ObjectAccessUtility.getObjectValueString(providerObj, 'uid', false, null);
        const country = ObjectAccessUtility.getObjectValueString(providerObj, 'country', false, null);
        if ((dataProviderLegalName == null)
        ) {
          console.log('Data Provider no name', providerObj);
        } else {
          // Create parameter

          const createdParam = SimpleDataProvider.make(
            dataProviderLegalName,
            dataProviderUrl,
            relatedDataProvider,
            dataProviderId,
            country
          );

          providers.push(createdParam);
        }
      });
    }

    return providers;
  }

  /**
   * The function `jsonToParameters` parses a JSON object containing parameter definitions and returns
   * a list of ParameterDefinitions.
   * @param jsonWithParams - The `jsonWithParams` parameter is expected to be a JSON object containing
   * parameters for creating ParameterDefinitions. This function will extract information from this
   * JSON object to create ParameterDefinition objects.
   * @param {string} value - The function `jsonToParameters` takes in a JSON object `jsonWithParams`
   * and a string `value` as parameters. The function processes the JSON object to extract parameter
   * definitions based on the provided value.
   * @returns The function `jsonToParameters` returns an object of type `ParameterDefinitions`, which
   * is created using the parameters extracted from the provided JSON object `jsonWithParams` based on
   * the specified `value`.
   */
  public static jsonToParameters(jsonWithParams: Record<string, unknown>, value: string): ParameterDefinitions {
    const params = new Array<ParameterDefinition>();
    const parameterObjects = ObjectAccessUtility.getObjectArray<Record<string, unknown>>(jsonWithParams, value, false);

    if (parameterObjects != null) {
      parameterObjects.forEach((paramObj: Record<string, unknown>) => {
        // check required fields
        const paramName = ObjectAccessUtility.getObjectValueString(paramObj, 'name', false, null);
        const paramType = ObjectAccessUtility.getObjectValueString(paramObj, 'type', false, null);
        const paramLabel = ObjectAccessUtility.getObjectValueString(paramObj, 'label', false, null);
        const paramRequired = ObjectAccessUtility.getObjectValueBoolean(paramObj, 'required', false, true);
        const paramTypeEnum = ParameterType[paramType.toUpperCase()] as ParameterType || ParameterType.UNKNOWN;
        const paramProperty = ObjectAccessUtility.getObjectValueString(paramObj, 'property', false, null);
        const paramPropertyEnum = ParameterProperty.fromProperty(paramProperty);

        // empty value -> false
        const paramFree = !!ObjectAccessUtility.getObjectValue(paramObj, 'free', false);

        if ((paramName == null) || (paramLabel == null)
        ) {
          console.log('Distribution Parameter no name or label', paramObj);
        } else {
          // Create parameter

          const createdParam = SimpleParameterDefinition.make(
            paramName,
            paramLabel,
            paramTypeEnum,
            paramPropertyEnum,
            !paramRequired,
            //
            ObjectAccessUtility.getObjectValueString(paramObj, 'minValue', false, null),
            ObjectAccessUtility.getObjectValueString(paramObj, 'maxValue', false, null),
            ObjectAccessUtility.getObjectValueString(paramObj, 'regex', false, null),
            ObjectAccessUtility.getObjectValueString(paramObj, 'valuePattern', false, null),
            ObjectAccessUtility.getObjectArray(paramObj, 'Enum', false),
            paramFree,
            ObjectAccessUtility.getObjectValueString(paramObj, 'readOnlyValue', false, ''),
            ObjectAccessUtility.getObjectValueString(paramObj, 'multipleValue', false, ''),
            ObjectAccessUtility.getObjectValue(paramObj, 'defaultValue', false),
          );

          params.push(createdParam);
        }
      });
    }

    return SimpleParameterDefinitions.make(params);
  }

  /**
   * The function `jsonToSpatialRange` converts a JSON object containing spatial data into a
   * SpatialRange object, handling different spatial shapes like points and polygons.
   * @param jsonWithSpatial - The `jsonWithSpatial` parameter is expected to be a JSON object that
   * contains spatial data in a specific format. The function `jsonToSpatialRange` takes this JSON
   * object and extracts spatial information from it to create a `SpatialRange` object.
   * @param {string} value - The `value` parameter in the `jsonToSpatialRange` function is used to
   * specify the key in the JSON object `jsonWithSpatial` from which the spatial data will be
   * extracted. This key is used to access the spatial information within the JSON object.
   * @returns The function `jsonToSpatialRange` returns an Optional<SpatialRange> object. The returned
   * value can be one of the following:
   * 1. If the input JSON does not contain spatial information (spatial == null), it returns an
   * Optional<SpatialRange> with an unknown SimpleSpatialRange.
   * 2. If the spatial information represents a point with valid x and y coordinates, it returns an
   * Optional<S
   */
  public static jsonToSpatialRange(jsonWithSpatial: Record<string, unknown>, value: string): Optional<SpatialRange> {

    // SPATIAL {}
    const spatial = ObjectAccessUtility.getObjectValue<Record<string, unknown>>(jsonWithSpatial, value, false);
    // If no spatial - unbounded
    if (spatial == null) {
      return Optional.ofNonNullable(SimpleSpatialRange.makeUnknown());
    }

    // POINT
    const x = ObjectAccessUtility.getObjectValueNumber(spatial, 'x', false);
    const y = ObjectAccessUtility.getObjectValueNumber(spatial, 'y', false);
    if (x != null && isFinite(x) && y != null && isFinite(y)) {
      return Optional.ofNonNullable(SimpleSpatialRange.makePoint(x, y));
    }

    // OK we have a spatial object, but it's not a point, lets try to extract number[][][] from paths

    // PATH {}
    const pathsArray: Array<Array<Array<number>>> = ObjectAccessUtility.getObjectArray(spatial, 'paths', false);
    const validatedPathsArray: Array<Array<Array<number>>> = [];


    // Paths arrays is present and has length > 0
    if (pathsArray != null && pathsArray.length > 0) {

      // Check each path/point-array
      pathsArray.forEach((pathPointsArray: Array<Array<number>>) => {
        const validatedPathPointsArray: Array<Array<number>> = [];

        // Path/point-array is present and has length > 3 (need at least 3 points)
        if (pathPointsArray != null && pathPointsArray.length >= 3) {

          // Check each point
          pathPointsArray.forEach((pointValues: Array<number>) => {
            const validatedPointValues: Array<number> = [];


            //  Point is present and has length > 2
            if (pointValues != null && pointValues.length >= 2) {
              const a = pointValues[0];
              const b = pointValues[1];

              // Check that point is made up of sensible numbers
              if (a != null && isFinite(a) && b != null && isFinite(b)) {
                validatedPointValues.push(a);
                validatedPointValues.push(b);
              }
            }

            // Push validated point, need at least 2 dimensions x and y
            if (validatedPointValues.length >= 2) {
              validatedPathPointsArray.push(validatedPointValues);
            }
          });
        }

        // Push validated points, need at least 3 valid points
        if (validatedPathPointsArray.length >= 3) {

          // Also, push a copy of the first to end to ensure poly is closed
          validatedPathPointsArray.push(validatedPathPointsArray[0].slice());

          // Push validated path of points (i.e. poly) to paths array
          validatedPathsArray.push(validatedPathPointsArray);
        }
      });
    }

    if (validatedPathsArray.length > 0) {
      return Optional.ofNonNullable(SimpleSpatialRange.makeNPoly(validatedPathsArray));
    }

    return Optional.ofNonNullable(SimpleSpatialRange.makeUnknown());
  }

  public static jsonToTemporalRange(jsonWithDate: Record<string, unknown>, value: string): Optional<TemporalRange> {
    const temporalCoverage = ObjectAccessUtility.getObjectValue<Record<string, unknown>>(jsonWithDate, value, false);
    let temporalRange = SimpleTemporalRange.makeUnbounded();
    if (null != temporalCoverage) {
      const momentFormat = 'YYYY-MM-DDThh:mm:ssZ'; // this format is an assumption
      const startDate = ObjectAccessUtility.hasKey(temporalCoverage, 'startDate') ?
        moment.utc(ObjectAccessUtility.getObjectValueString(temporalCoverage, 'startDate', true), momentFormat) : null;
      const endDate = ObjectAccessUtility.hasKey(temporalCoverage, 'endDate') ?
        moment.utc(ObjectAccessUtility.getObjectValueString(temporalCoverage, 'endDate', true), momentFormat) : null;
      if (startDate == null && endDate == null) {
        temporalRange = SimpleTemporalRange.makeUnbounded();
      } else if (startDate != null && endDate == null) {
        temporalRange = SimpleTemporalRange.makeWithoutUpperBound(startDate);
      } else if (startDate == null && endDate != null) {
        temporalRange = SimpleTemporalRange.makeWithoutLowerBound(endDate);
      } else if (startDate != null && endDate != null) {
        temporalRange = SimpleTemporalRange.makeBounded(startDate, endDate);
      }
    }
    return Optional.ofNonNullable(temporalRange);
  }


  /**
   * The function `jsonToTemporalRange` converts a JSON object containing date information into a
   * TemporalRange object.
   * @param jsonWithDate - The `jsonWithDate` parameter is a JSON object that contains date information
   * in a specific format. The function `jsonToTemporalRange` takes this JSON object and extracts
   * temporal coverage information from it based on the provided `value`.
   * @param {string} value - The `value` parameter in the `jsonToTemporalRange` function is used to
   * specify the key in the `jsonWithDate` object from which the temporal coverage information will be
   * extracted. This key is used to access the start date and end date values within the
   * `temporalCoverage` object.
   * @returns The function `jsonToTemporalRange` returns an Optional<TemporalRange> object.
   */
  public static jsonToDistributionSummary(distJson: Record<string, unknown>): Optional<null | DistributionSummary> {

    // Extract from JSON
    const title = ObjectAccessUtility.getObjectValueString(distJson, 'title', false);
    const id = ObjectAccessUtility.getObjectValueString(distJson, 'id', false);
    const availableFormatsJSONArray = ObjectAccessUtility.getObjectArray<Record<string, unknown>>(distJson, 'availableFormats', false);
    const status = ObjectAccessUtility.getObjectValueNumber(distJson, 'status', false);
    const statusTimestamp = ObjectAccessUtility.getObjectValueString(distJson, 'statusTimestamp', false);
    const statusURL = ObjectAccessUtility.getObjectValueString(distJson, 'statusURL', false);
    const versioningStatus = ObjectAccessUtility.getObjectValueString(distJson, 'versioningStatus', false);
    const serviceProvider = ObjectAccessUtility.getObjectValue(distJson, 'dataServiceProvider', false);

    // retrieve Versioning Status Info (changeDate, editorFullName)
    const versioningStatusInfo: Record<string, { changeDate: string; editorFullName: string }[]> = {};
    // temporary object to hold versioning info
    const tempVersioningInfo: { [key: string]: Partial<{ changeDate: string; editorFullName: string }> } = {};
    const versioningStatusInfoKey = 'versioningStatusInfo';
    // Initialize temp object for this key if it doesn't exist
    const uid = ObjectAccessUtility.getObjectValueString(distJson, 'uid', false, null);
    if (!tempVersioningInfo[versioningStatusInfoKey]) {
      tempVersioningInfo[versioningStatusInfoKey] = {};
    }
    JSONDistributionFactory.versioningStatusInfoProperties.forEach((property: string) => {
      if (property in distJson && (distJson[property] != null && distJson[property] !== '')) {
        const value = ObjectAccessUtility.getObjectValueString(distJson, property, false);
        tempVersioningInfo[versioningStatusInfoKey][property as 'changeDate' | 'editorFullName'] = value;
      }
    });
    // fallback: if editorFullName is missing, use editorId as author
    if (!tempVersioningInfo[versioningStatusInfoKey].editorFullName) {
      tempVersioningInfo[versioningStatusInfoKey].editorFullName = 'Unknown';
    }
    Object.entries(tempVersioningInfo).forEach(([key, partial]) => {
      if (partial.changeDate && partial.editorFullName) {
        // finally assigning the actual versioning info to the versioningStatusInfo object with which the DistSummary will be created
        versioningStatusInfo[key] = [{
          changeDate: partial.changeDate,
          editorFullName: partial.editorFullName
        }];
      }
    });

    // TEMPORARILY BACK TO 'const' - IF FOLLOWING 'TEMPORARILY DISABLED' PART IS KEPT AND REACTIVATED, RECHANGE IT TO 'let' <<< --- !!!
    const formatsAppendTo: Array<DistributionFormat> = [];

    // If there is a formats array iterate over it
    if (availableFormatsJSONArray != null) {
      availableFormatsJSONArray.forEach(availableFormatJSON => {
        if (availableFormatJSON != null) {
          const format = JSONDistributionFactory.jsonToDistributionFormat(availableFormatJSON);
          if (format != null) {
            format.ifPresent(f => formatsAppendTo.push(f!));
          }
        }
      });
    }

    // TEMPORARILY DISABLED - TO BE ADJUSTED AND REACTIVATED TO SHOW PROPER VISBLE ON RESULTS CARDS <<< --- !!!
    // check in the available formats: if there are available formate with type 'CONVERTED', then include only them in the formatsAppendTo array
    /* if(availableFormatsJSONArray.some(frmt => frmt.type === 'CONVERTED')){
      const onlyConverted = formatsAppendTo.filter(frmt => frmt.getType().toLowerCase() === 'CONVERTED'.toLowerCase());
      formatsAppendTo = onlyConverted;
    } */

    if (Confirm.isValidString(id) && //
      Confirm.isValidString(title)) {
      return Optional.ofNonNullable(SimpleDistributionSummary.make(id, title, formatsAppendTo, status, statusTimestamp, statusURL, versioningStatus, versioningStatusInfo, serviceProvider, uid));
    } else {
      return Optional.empty();
    }
  }


  /**
   * The function `jsonToDistributionFormat` converts a JSON object into a DistributionFormat object if
   * certain string properties are valid.
   * @param formatJson - The `jsonToDistributionFormat` function takes in a JSON object `formatJson` as
   * input. This JSON object is expected to have the following properties:
   * @returns The `jsonToDistributionFormat` function is returning an `Optional` containing either a
   * `DistributionFormat` object created using the provided data from the `formatJson` parameter, or an
   * empty `Optional` if any of the required fields are missing or invalid.
   */
  public static jsonToDistributionFormat(formatJson: Record<string, unknown>): Optional<null | DistributionFormat> {

    // Extract from JSON
    const label = ObjectAccessUtility.getObjectValueString(formatJson, 'label', false);
    const format = ObjectAccessUtility.getObjectValueString(formatJson, 'format', false);
    const originalFormat = ObjectAccessUtility.getObjectValueString(formatJson, 'originalFormat', false);
    const type = ObjectAccessUtility.getObjectValueString(formatJson, 'type', false);
    const href = ObjectAccessUtility.getObjectValueString(formatJson, 'href', false);


    if (Confirm.isValidString(label) && //
      Confirm.isValidString(format) && //
      Confirm.isValidString(originalFormat) && //
      Confirm.isValidString(label) && //
      Confirm.isValidString(href) && //
      Confirm.isValidString(type)) {

      return Optional.ofNonNullable(SimpleDistributionFormat.make(label, format, originalFormat, href, type));
    } else {
      return Optional.empty();
    }
  }

  /**
   * The function `jsonToOrganizations` takes in a JSON object and converts it into an array of
   * `Organization` objects, checking for required fields and logging any missing fields.
   * @param {unknown} json - The `json` parameter is of type `unknown`, which means it can be any type
   * of value. In this case, it is expected to be a JSON object or array.
   * @returns either `null` or an array of `Organization` objects.
   */
  public static jsonToOrganizations(json: unknown): null | Array<Organization> {

    // Extract from JSON
    const organizations = new Array<Organization>();

    if (Array.isArray(json)) {
      json.forEach((element: Record<string, unknown>) => {
        // check required fields
        const id = ObjectAccessUtility.getObjectValueString(element, 'id', false, null);
        const name = ObjectAccessUtility.getObjectValueString(element, 'name', false, null);
        const url = ObjectAccessUtility.getObjectValueString(element, 'url', false, null);
        const country = ObjectAccessUtility.getObjectValueString(element, 'country', false, null);
        const logoUrl = ObjectAccessUtility.getObjectValueString(element, 'logo', false, null);

        if ((id === null && name === null)
        ) {
          console.log('Organization no name or id', element);
        } else {
          // Create parameter

          const organization = SimpleOrganization.make(
            id,
            name,
            url,
            country,
            logoUrl,
          );

          organizations.push(organization);
        }

      });
    }

    return organizations;
  }

  public static jsonToOrganization(json: unknown): Organization | null {
    // Assert json is an array and has at least one element
    if (Array.isArray(json) && json.length > 0) {
      // Extract the first element of the array and assert its type
      const firstElement = json[0] as Record<string, unknown>;

      // Use the existing logic on the first element with type assertions
      const id = ObjectAccessUtility.getObjectValueString(firstElement as Record<string, unknown>, 'id', false);
      const name = ObjectAccessUtility.getObjectValueString(firstElement as Record<string, unknown>, 'name', false);
      const url = ObjectAccessUtility.getObjectValueString(firstElement as Record<string, unknown>, 'url', false);
      const country = ObjectAccessUtility.getObjectValueString(firstElement as Record<string, unknown>, 'country', false);
      const logoUrl = ObjectAccessUtility.getObjectValueString(firstElement as Record<string, unknown>, 'logo', false);

      if (id == null || name == null) {
        return null;
      }
      return SimpleOrganization.make(id, name, url, country, logoUrl);
    }
    // Return null if json is not an array or is empty
    return null;
  }

  /**
   * Builds a standard DistributionDetails object (e.g., for web services or file distributions).
   * This contains the original parsing logic.
   */
  private static buildStandardDetails(
    rawData: Record<string, unknown>,
    detailsType: string | null
  ): Optional<null | DistributionDetails> {

    // read the summary part first
    const summary: Optional<null | DistributionSummary> = JSONDistributionFactory.jsonToDistributionSummary(rawData);

    // If summary is good map else return empty optional
    return summary.map(sum => {
      // details
      const documentation = ObjectAccessUtility.getObjectValueString(rawData, 'serviceDocumentation', false, '');
      // serviceDescription
      const webServiceDescription = ObjectAccessUtility.getObjectValueString(rawData, 'serviceDescription', false, '');
      // serviceProvider
      const webServiceProvider = JSONDistributionFactory.jsonToDataProvider(rawData, 'serviceProvider');
      const webServiceName = ObjectAccessUtility.getObjectValueString(rawData, 'serviceName', false);
      const webServiceEndpoint = ObjectAccessUtility.getObjectValueString(rawData, 'serviceEndpoint', false);
      const description = ObjectAccessUtility.getObjectValueString(rawData, 'description', false);
      const license = ObjectAccessUtility.getObjectValueString(rawData, 'license', false, '');
      const endpoint = ObjectAccessUtility.getObjectValueString(rawData, 'endpoint', false);
      const typeString = ObjectAccessUtility.getObjectValueString(rawData, 'type', false);
      const uid = ObjectAccessUtility.getObjectValueString(rawData, 'uid', false, '');

      let typeEnum: DistributionType | string = DistributionType[typeString.toUpperCase()] as DistributionType;
      if (typeEnum === undefined) {
        typeEnum = typeString;
      }

      const dataProvider = JSONDistributionFactory.jsonToArrayDataProvider(rawData, 'dataProvider');
      // DDSS ID for internal usage/check during implementation phase
      const internalID = ObjectAccessUtility.getObjectArray<string>(rawData, 'internalID', false);
      const doi = ObjectAccessUtility.getObjectArray<string>(rawData, 'DOI', false);
      const downloadURL = ObjectAccessUtility.getObjectValueString(rawData, 'downloadURL', false, '');
      const contactPoints = ObjectAccessUtility.getObjectArray<string>(rawData, 'contactPoints', false);
      const keywords = ObjectAccessUtility.getObjectArray<string>(rawData, 'keywords', false);
      const frequencyUpdate = ObjectAccessUtility.getObjectValueString(rawData, 'frequencyUpdate', false, '');
      // temporal
      const temporalRange: Optional<TemporalRange> = JSONDistributionFactory.jsonToTemporalRange(rawData, 'temporalCoverage');
      const webServiceTemporalCoverage = JSONDistributionFactory.jsonToTemporalRange(rawData, 'serviceTemporalCoverage');

      // spatial
      const spatialRange = JSONDistributionFactory.jsonToSpatialRange(rawData, 'spatial');
      const webServiceSpatialRange = JSONDistributionFactory.jsonToSpatialRange(rawData, 'serviceSpatial');
      // params
      const params = JSONDistributionFactory.jsonToParameters(rawData, 'serviceParameters');

      const qualityAssurance = ObjectAccessUtility.getObjectValueString(rawData, 'qualityAssurance', false, '');

      const level = [];
      const domainCode = '';

      const categories = ObjectAccessUtility.getObjectValue<DistributionCategories>(rawData, 'categories');

      const page = ObjectAccessUtility.getObjectArray<string>(rawData, 'page', false);

      // available contact point
      const availableContactPoints = ObjectAccessUtility.getObjectArray<DistributionContactPoint>(
        rawData, 'availableContactPoints'
      );

      // If all inputs valid create 'details' else null
      if (
        // objects
        Confirm.isValid(params) && //
        Confirm.isValid(temporalRange) && //
        Confirm.isValid(spatialRange)   // &&

      ) {

        // make details
        return SimpleDistributionDetails.makeUnsafeNullsAbound(
          sum, //
          documentation, //
          webServiceDescription,
          webServiceProvider, //
          webServiceName,
          webServiceSpatialRange.orElse(SimpleSpatialRange.makeUnknown()),
          webServiceTemporalCoverage.orElse(SimpleTemporalRange.makeUnbounded()),
          webServiceEndpoint,
          description, //
          license, //
          endpoint, //
          typeEnum, //
          dataProvider, //
          doi, //
          internalID, //
          params, //
          temporalRange.orElse(SimpleTemporalRange.makeUnbounded()), //
          spatialRange.orElse(SimpleSpatialRange.makeUnknown()),
          downloadURL, //
          contactPoints,
          keywords,
          frequencyUpdate,
          qualityAssurance,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          level,
          domainCode,
          availableContactPoints,
          categories,
          page,
          uid,
          detailsType,

          null, // codeRepository
          [], // programmingLanguage
          null, // mainEntityofPage
          null, // softwareVersion
          [],   // requirements
          [],   // runtimePlatform
          []    // creator
        );
      } else {
        return null;
      }
    });
  }

  /**
   * Builds a SimpleDistributionDetails object by "forcing" software fields
   * (both source_code and application) into the extended SimpleDistributionDetails class.
   * * This function behaves exactly like buildStandardDetails, but also parses
   * software-specific fields.
   */
  private static buildSoftwareAsStandardDetails(
    rawData: Record<string, unknown>,
    detailsType: string // This can now be either 'software_source_code' or 'software_application'
  ): Optional<null | DistributionDetails> {

    // --- PATCH: Normalize 'name' to 'title' ---
    const rawTitle = ObjectAccessUtility.getObjectValueString(rawData, 'title', false, null);
    const rawName = ObjectAccessUtility.getObjectValueString(rawData, 'name', false, null);
    if (!rawTitle && rawName) {
      rawData.title = rawName;
    }

    // 1. read the summary part first
    const summary: Optional<null | DistributionSummary> = JSONDistributionFactory.jsonToDistributionSummary(rawData);

    // If summary is good map else return empty optional
    return summary.map(sum => {

      // Initialize lists
      const doiList = ObjectAccessUtility.getObjectArray<string>(rawData, 'DOI', false) || [];
      const internalIdList = ObjectAccessUtility.getObjectArray<string>(rawData, 'internalID', false) || [];

      // details
      const documentation = ObjectAccessUtility.getObjectValueString(rawData, 'serviceDocumentation', false, '');
      const webServiceDescription = ObjectAccessUtility.getObjectValueString(rawData, 'serviceDescription', false, '');
      const webServiceProvider = JSONDistributionFactory.jsonToDataProvider(rawData, 'serviceProvider');
      const webServiceName = ObjectAccessUtility.getObjectValueString(rawData, 'serviceName', false);
      const webServiceEndpoint = ObjectAccessUtility.getObjectValueString(rawData, 'serviceEndpoint', false);
      const description = ObjectAccessUtility.getObjectValueString(rawData, 'description', false);
      const standardLicense = ObjectAccessUtility.getObjectValueString(rawData, 'license', false, '');
      const endpoint = ObjectAccessUtility.getObjectValueString(rawData, 'endpoint', false);
      const typeString = ObjectAccessUtility.getObjectValueString(rawData, 'type', false);
      const uid = ObjectAccessUtility.getObjectValueString(rawData, 'uid', false, '');

      let typeEnum: DistributionType | string = DistributionType[typeString.toUpperCase()] as DistributionType;
      if (typeEnum === undefined) {
        typeEnum = typeString;
      }

      const dataProvider = JSONDistributionFactory.jsonToArrayDataProvider(rawData, 'dataProvider');

      // Use the lists we populated above instead of raw extraction
      const internalID = internalIdList;
      const doi = doiList;

      const standardDownloadURL = ObjectAccessUtility.getObjectValueString(rawData, 'downloadURL', false, '');
      const contactPoints = ObjectAccessUtility.getObjectArray<string>(rawData, 'contactPoints', false);
      const keywords = ObjectAccessUtility.getObjectArray<string>(rawData, 'keywords', false);
      const frequencyUpdate = ObjectAccessUtility.getObjectValueString(rawData, 'frequencyUpdate', false, '');

      const temporalRange: Optional<TemporalRange> = JSONDistributionFactory.jsonToTemporalRange(rawData, 'temporalCoverage');
      const webServiceTemporalCoverage = JSONDistributionFactory.jsonToTemporalRange(rawData, 'serviceTemporalCoverage');
      const spatialRange = JSONDistributionFactory.jsonToSpatialRange(rawData, 'spatial');
      const webServiceSpatialRange = JSONDistributionFactory.jsonToSpatialRange(rawData, 'serviceSpatial');
      const params = JSONDistributionFactory.jsonToParameters(rawData, 'serviceParameters');
      const qualityAssurance = ObjectAccessUtility.getObjectValueString(rawData, 'qualityAssurance', false, '');
      const level = [];
      const domainCode = '';
      const categories = ObjectAccessUtility.getObjectValue<DistributionCategories>(rawData, 'categories');
      const page = ObjectAccessUtility.getObjectArray<string>(rawData, 'page', false);
      const availableContactPoints = ObjectAccessUtility.getObjectArray<DistributionContactPoint>(
        rawData, 'availableContactPoints'
      );

      // --- Software Specific Block ---
      const softwareLicense = ObjectAccessUtility.getObjectValueString(rawData, 'licenseURL', false, null);

      let softwareDownloadLink: string | null = null;
      let codeRepoLink: string | null = null;
      let runtimePlatform: Array<string> = [];

      if (detailsType === 'software_source_code') {
        codeRepoLink = ObjectAccessUtility.getObjectValueString(rawData, 'codeRepository', false, null);
        softwareDownloadLink = codeRepoLink;
        runtimePlatform = ObjectAccessUtility.getObjectArray<string>(rawData, 'runtimePlatform', false);
      } else if (detailsType === 'software_application') {
        softwareDownloadLink = ObjectAccessUtility.getObjectValueString(rawData, 'downloadUrl', false, null);
        runtimePlatform = ObjectAccessUtility.getObjectArray<string>(rawData, 'operatingSystem', false);
      }

      const programmingLanguage = ObjectAccessUtility.getObjectArray<string>(rawData, 'programmingLanguage', false);
      const mainEntityOfPage = ObjectAccessUtility.getObjectValueString(rawData, 'mainEntityOfPage', false, null);
      const softwareVersion = ObjectAccessUtility.getObjectValueString(rawData, 'softwareVersion', false, null);
      const requirements = ObjectAccessUtility.getObjectArray<string>(rawData, 'requirements', false);
      const creator = ObjectAccessUtility.getObjectArray<string>(rawData, 'creator', false);

      const finalDownloadURL = softwareDownloadLink ?? standardDownloadURL;
      const finalLicense = softwareLicense ?? standardLicense;

      // Check Validity
      if (
        Confirm.isValid(params) &&
        Confirm.isValid(temporalRange) &&
        Confirm.isValid(spatialRange)
      ) {
        return SimpleDistributionDetails.makeUnsafeNullsAbound(
          sum,
          documentation,
          webServiceDescription,
          webServiceProvider,
          webServiceName,
          webServiceSpatialRange.orElse(SimpleSpatialRange.makeUnknown()),
          webServiceTemporalCoverage.orElse(SimpleTemporalRange.makeUnbounded()),
          webServiceEndpoint,
          description,
          finalLicense,
          endpoint,
          typeEnum,
          dataProvider,
          doi,          // This now contains parsed DOIs
          internalID,   // This now contains parsed internal IDs
          params,
          temporalRange.orElse(SimpleTemporalRange.makeUnbounded()),
          spatialRange.orElse(SimpleSpatialRange.makeUnknown()),
          finalDownloadURL,
          contactPoints,
          keywords,
          frequencyUpdate,
          qualityAssurance,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          level,
          domainCode,
          availableContactPoints,
          categories,
          page,
          uid,
          detailsType,
          codeRepoLink,
          programmingLanguage,
          mainEntityOfPage,
          softwareVersion,
          requirements,
          runtimePlatform,
          creator
        );
      } else {
        return null;
      }
    });
  }
}
