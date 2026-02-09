import { Confirm } from 'api/webApi/utility/preconditions';
import { EnvironmentResource } from '../environmentResource.interface';
import { EnvironmentResourceStatus } from '../environmentResourceStatus.enum';

export class SimpleEnvironmentResource implements EnvironmentResource {

  private constructor(
    public readonly itemid: string | undefined,
    public readonly resourceid: string,
    public readonly name: string,
    public readonly description: string,
    public readonly format: string,
    public readonly url: string,
    public readonly status: EnvironmentResourceStatus | undefined,
  ) { }

  /**
   * The function creates a new instance of the EnvironmentResource class with the provided parameters.
   * @param {string} resourceid - A unique identifier for the resource.
   * @param {string} name - The name parameter is a string that represents the name of the resource.
   * @param {string} description - The "description" parameter is a string that represents the
   * description of the resource. It provides additional information or details about the resource.
   * @param {string} format - The "format" parameter is a string that represents the format of the
   * resource. It could be a file format, such as "PDF" or "JPEG", or it could be a data format, such as
   * "JSON" or "XML".
   * @param {string} url - The `url` parameter is a string that represents the URL of the resource.
   * @param {string} status - The "status" parameter is a string that represents the status of the
   * resource. It could be used to indicate whether the resource is active, inactive, or any other
   * relevant status.
   * @param {string} [itemid] - The `itemid` parameter is an optional string that represents the unique
   * identifier of the resource item.
   * @returns An instance of the `SimpleEnvironmentResource` class is being returned.
   */
  public static make(resourceid: string, name: string, description: string, format: string, url: string, status?: EnvironmentResourceStatus, itemid?: string): EnvironmentResource {
    Confirm.requiresValidString(resourceid);
    Confirm.requiresValidString(name);
    Confirm.requiresValidString(format);
    Confirm.requiresValidString(url);
    return new SimpleEnvironmentResource(itemid, resourceid, name, description, format, url, status);
  }

  /**
   * The function "getIdentifier" returns the item ID as a string or undefined.
   * @returns a value of type string or undefined.
   */
  getIdentifier(): string | undefined {
    return this.itemid;
  }

  /**
   * The function `getResourceId` returns the resource ID as a string.
   * @returns The method is returning a string value, specifically the value of the variable
   * "resourceid".
   */
  getResourceId(): string {
    return this.resourceid;
  }

  /**
   * The function `getName` returns the value of the `name` property as a string.
   * @returns The name property of the object.
   */
  getName(): string {
    return this.name;
  }

  /**
   * The getDescription function returns the description of an object as a string.
   * @returns The method `getDescription()` is returning a string value.
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * The getFormat function returns the format of the object.
   * @returns The format of the object.
   */
  getFormat(): string {
    return this.format;
  }

  /**
   * The getUrl function returns the URL as a string.
   * @returns The `getUrl()` method is returning a string value.
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * The getStatus function returns the status of an object as a string.
   * @returns The `getStatus()` method is returning a string value.
   */
  getStatus(): string | undefined {
    return this.status;
  }

}
