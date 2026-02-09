export enum EnvironmentResourceStatus {
  NONE = 'none',
  NOT_LOADED = 'NOT_LOADED',
  LOADED = 'LOADED',
}

enum EnvironmentResourceStatusText {
  NONE = 'none',
  NOT_LOADED = 'Not loaded',
  LOADED = 'Loaded',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EnvironmentResourceStatus {
  export const fromProperty = (name: string): EnvironmentResourceStatusText => {
    const key = Object.keys(EnvironmentResourceStatus).find((thisKey: string) => EnvironmentResourceStatus[thisKey] === name);
    return (key != null) ? EnvironmentResourceStatusText[key] as EnvironmentResourceStatusText : EnvironmentResourceStatusText.NONE;
  };
}
