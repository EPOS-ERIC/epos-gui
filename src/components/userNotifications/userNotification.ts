import { Button } from 'utility/button';

export enum notificationType {
  POSITIVE,
  NEGATIVE,
  WARNING
}
export class UserNotification {
  private readonly id: string;

  constructor(
    private readonly type: notificationType,
    private readonly notificationText: string,
    private readonly showFor: number,
    private readonly action?: Button,
  ) {
    this.id = Math.random().toString(36).substring(2, 5);
  }

  public getId(): string {
    return this.id;
  }

  public getType(): string {
    const value: string = notificationType[this.type].toString().toLowerCase();
    return value;
  }

  public getNotificationText(): string {
    return this.notificationText;
  }

  public getShowFor(): number {
    return this.showFor;
  }

  public getAction(): null | Button {
    return this.action ?? null;
  }

}
