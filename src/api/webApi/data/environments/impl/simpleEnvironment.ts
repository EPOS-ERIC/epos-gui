import { Confirm } from 'api/webApi/utility/preconditions';
import { Environment } from '../environment.interface';
import { EnvironmentStatus, EnvironmentStatusText } from '../environmentStatus.enum';
import { EnvironmentResource } from '../environmentResource.interface';
import { EnvironmentResourceStatus } from '../environmentResourceStatus.enum';

export class SimpleEnvironment implements Environment {

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly serviceId: string,
    public readonly accessUrl: string,
    public readonly resources: Array<EnvironmentResource>,
    public readonly created: string,
    public readonly status: EnvironmentStatus,
  ) { }

  public static make(identifier: string, name: string, description: string, serviceId: string, accessUrl: string, resources: Array<EnvironmentResource>, created: string, status: EnvironmentStatus): SimpleEnvironment {
    Confirm.requiresValid(identifier);
    Confirm.requiresValidString(name);
    Confirm.requiresValid(description);
    return new SimpleEnvironment(identifier, name, description, serviceId, accessUrl, resources, created, status);
  }


  getName(): string {
    return this.name;
  }
  getIdentifier(): string {
    return this.id;
  }
  getDescription(): string {
    return this.description;
  }

  getServiceId(): string {
    return this.serviceId;
  }

  getAccessUrl(): string {
    return this.accessUrl;
  }

  getResources(): Array<EnvironmentResource> {
    return this.resources;
  }

  getCreated(): string {
    return this.created;
  }

  getStatus(text = false): EnvironmentStatus | EnvironmentStatusText {
    return text === true ? EnvironmentStatus.fromProperty(this.status) : this.status;
  }

  isEnable(): boolean {
    return this.getStatus() !== EnvironmentStatus.NOT_READY;
  }

  isUpdateable(): boolean {
    let toUpdate = false;
    this.getResources().forEach(res => {
      if (res.status !== EnvironmentResourceStatus.LOADED) {
        toUpdate = true;
      }
    });

    return toUpdate;
  }

}
