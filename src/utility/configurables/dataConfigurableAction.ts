/** The line `export enum DataConfigurableActionType {` is declaring an enum named
`DataConfigurableActionType` and exporting it. An enum is a way to define a set of named constants.
In this case, the `DataConfigurableActionType` enum defines three constants: `DEFAULT`, `DOWNLOAD`,
and `LINK`. These constants can be used to specify the type of an action associated with an instance
of the `DataConfigurableAction` class. */
export enum DataConfigurableActionType {
  DEFAULT,
  DOWNLOAD,
  LINK,
}

/** The `DataConfigurableAction` class represents an action that can be configured with properties such
as visibility, enabled status, and type. */
export class DataConfigurableAction {

  /** The line `public visible = false;` is declaring a public property named `visible` and initializing
  it with the value `false`. This property is a boolean that determines whether the action associated
  with an instance of the `DataConfigurableAction` class is visible or not. By default, the visibility
  is set to `false`, indicating that the action is not visible. */
  public visible = false;

  /** The line `public enabled = false;` is declaring a public property named `enabled` and initializing
  it with the value `false`. This property is a boolean that determines whether the action associated
  with an instance of the `DataConfigurableAction` class is enabled or not. By default, the action is
  not enabled. */
  public enabled = false;

  /** The line `public type = DataConfigurableActionType.DEFAULT;` is declaring a public property named
  `type` and initializing it with the value `DataConfigurableActionType.DEFAULT`. This property is of
  type `DataConfigurableActionType`, which is an enum. By default, the `type` property is set to
  `DEFAULT`, indicating that the action associated with an instance of the `DataConfigurableAction`
  class has a default type. */
  public type = DataConfigurableActionType.DEFAULT;

  /**
   * The constructor takes in a label, an action function, an enabled evaluation function, and an
   * optional visible evaluation function.
   * @param {string} label - The `label` parameter is a string that represents the label or name of the
   * action. It is used to display the action in the user interface or any other relevant context.
   * @param actionFunction - The `actionFunction` parameter is a function that will be executed when
   * the button associated with this constructor is clicked. It takes no arguments and returns no value
   * (`void`).
   * @param enabledEvalFunction - The `enabledEvalFunction` parameter is a function that takes three
   * boolean parameters: `valid`, `changed`, and `loading`. It is used to determine whether the action
   * associated with the button should be enabled or disabled based on the current state of the
   * application. The function should return a boolean value,
   * @param visibleEvalFunction - The `visibleEvalFunction` parameter is a function that determines
   * whether the button should be visible or not. It takes no arguments and returns a boolean value. If
   * the function returns `true`, the button will be visible. If it returns `false`, the button will be
   * hidden.
   */
  constructor(
    public readonly label: string,
    private readonly actionFunction: () => void,
    private readonly enabledEvalFunction: (valid: boolean, changed: boolean, loading: boolean) => boolean,
    private readonly visibleEvalFunction = () => true,
  ) { }

  /**
   * The function updates the visibility status based on the evaluation of a given function.
   */
  public updateVisibleStatus(
  ): void {
    this.visible = this.visibleEvalFunction();
  }

  /**
   * The function updates the enabled status based on the evaluation of valid, changed, and loading
   * variables.
   * @param {boolean} valid - A boolean value indicating whether the update is valid or not.
   * @param {boolean} changed - The "changed" parameter indicates whether there has been a change in
   * the status.
   * @param {boolean} loading - The `loading` parameter indicates whether the system is currently in a
   * loading state.
   */
  public updateEnabledStatus(
    valid: boolean,
    changed: boolean,
    loading: boolean,
  ): void {
    this.enabled = this.enabledEvalFunction(valid, changed, loading);
  }

  /**
   * The doAction function calls the actionFunction.
   */
  public doAction(): void {
    this.actionFunction();
  }

  /**
   * The function sets the action type of an object and returns the object itself.
   * @param {DataConfigurableActionType} type - The parameter "type" is of type
   * "DataConfigurableActionType".
   * @returns The method is returning the instance of the class on which it is called.
   */
  public setActionTypeAction(type: DataConfigurableActionType): this {
    this.type = type;
    return this;
  }
}
