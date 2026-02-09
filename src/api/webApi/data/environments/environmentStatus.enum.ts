export enum EnvironmentStatus {
  NONE = 'none',
  NOT_READY = 'NOT_READY',
  CREATING = 'CREATING',
  UPDATING = 'UPDATING',
  READY = 'READY'
}

export enum EnvironmentStatusText {
  NONE = 'none',
  NOT_READY = 'Not ready',
  CREATING = 'Creating',
  UPDATING = 'Updating',
  READY = 'Ready'
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EnvironmentStatus {
  export const fromProperty = (name: string): EnvironmentStatusText => {
    const key = Object.keys(EnvironmentStatus).find((thisKey: string) => EnvironmentStatus[thisKey] === name);
    return (key != null) ? EnvironmentStatusText[key] as EnvironmentStatusText : EnvironmentStatusText.NONE;
  };
}
