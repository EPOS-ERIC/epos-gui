import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import moment from 'moment-es6';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import 'jquery';
import { MatRadioChange } from '@angular/material/radio';
import { Model } from 'services/model/model.service';
import { TourService } from 'services/tour.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { RadioTempRangeFilterService } from 'services/radioTempRangeFilter.service';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-temporal-controls',
  templateUrl: './temporalControls.component.html',
  styleUrls: ['./temporalControls.component.scss']
})
export class TemporalControlsComponent implements OnInit, AfterViewInit {

  @Input() temporalRangeSource: BehaviorSubject<TemporalRange>;
  @Input() inputsDisabledSource?: BehaviorSubject<boolean>;
  @Input() disabledRadioButton: boolean;

  @ViewChild('wrapper', { static: true }) wrapper: ElementRef;

  public temporalClearDisabled = true;
  public temporalInputsDisabled = false;
  public startDisplayDate = '';
  public endDisplayDate = '';

  public radioControlDate = '';
  public readonly DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  private rangeFormat = { format: this.DATE_FORMAT, separator: Tracker.TARCKER_DATA_SEPARATION, undefinedStr: 'no defined' };

  constructor(
    private readonly model: Model,
    private readonly tourService: TourService,
    private readonly tracker: Tracker,
    private readonly temporalRadioFilterService: RadioTempRangeFilterService
  ) {

  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.temporalRangeSource.subscribe((temporalRange: TemporalRange) => {
        if (temporalRange != null) {
          const lower = temporalRange.getLowerBound();
          this.startDisplayDate = (null != lower)
            ? `${lower.clone().local().format(this.DATE_FORMAT)}`
            : '';
          this.initDatePicker(true);

          const upper = temporalRange.getUpperBound();
          this.endDisplayDate = (null != upper)
            ? `${upper.clone().local().format(this.DATE_FORMAT)}`
            : '';
          this.initDatePicker(false);
        }
      }),
      this.tourService.triggerDemoTemporalSelectionObservable.subscribe(() => {
        this.radioControlDate = '30';
        const lowerBound = moment().subtract(30, 'days');
        this.setFunctionLower(lowerBound, false);
        this.setFunctionUpper(moment(), false);
      }),
      this.model.dataSearchTemporalRange.valueObs.subscribe((bounds: SimpleTemporalRange) => {
        if (bounds.isUnbounded()) {
          this.radioControlDate = '';
        }
      }),
     this.temporalRadioFilterService.temporalRangeFilterRadioObs().subscribe((radioFilter: string | null) => {
      if(radioFilter != null && radioFilter !== ''){
        this.radioControlDate = radioFilter;
        this.setRadioDate(radioFilter as string);
      }
     })
    );

    if (null != this.inputsDisabledSource) {
      this.subscriptions.push(
        this.inputsDisabledSource.subscribe((state: boolean) => {
          this.temporalInputsDisabled = state;
        })
      );
    }
  }

  public ngAfterViewInit(): void {

    this.initDatePicker(true);
    this.initDatePicker(false);
  }

  public initDatePicker(isStart: boolean): void {
    const currentRange = this.temporalRangeSource.getValue();
    const date = (isStart) ? currentRange.getLowerBound() : currentRange.getUpperBound();
    const selector = (isStart) ? '#daterangepickerstart' : '#daterangepickerend';
    const applySelector = (isStart) ? 'temporalApplyBtnStart' : 'temporalApplyBtnEnd';
    const clearSelector = (isStart) ? 'temporalClearBtnStart' : 'temporalClearBtnEnd';

    // init onkeypress action
    jQuery(this.wrapper.nativeElement).find(`${selector}-input`).keypress((event) => {
      const keycode = (event.keyCode ? event.keyCode : event.which);
      if (keycode === 13) {
        if (isStart) {
          this.startDateChange();
        } else {
          this.endDateChange();
        }
      }
    });

    this.temporalClearDisabled = ((!currentRange.hasLowerBound()) && (!currentRange.hasUpperBound()));

    const minDefault = moment.utc('0001-01-01 00:00:00', this.DATE_FORMAT);
    const maxDefault = moment.utc('3000-01-01 00:00:00', this.DATE_FORMAT);

    const lower = currentRange.getLowerBound();
    const upper = currentRange.getUpperBound();

    const options = {
      startDate: (date == null) ? moment : date.clone().utc(),
      minDate: (isStart) ? minDefault : (lower == null ? minDefault : lower.clone().utc()),
      maxDate: (isStart) ? (upper == null ? maxDefault : upper.clone().utc()) : maxDefault,
      locale: {
        format: this.DATE_FORMAT,
      },
      timePicker: true,
      timePicker24Hour: true,
      timePickerSeconds: true,
      autoUpdateInput: true,
      showDropdowns: true,
      singleDatePicker: true,
      opens: 'right',
      drops: 'down',
      applyButtonClasses: applySelector,
      clearButtonClasses: clearSelector
    };

    const setFunction = (isStart)
      ? (lowerBound: null | moment.Moment) => {
        const thisCurrentRange = this.temporalRangeSource.getValue();
        const tempRange = SimpleTemporalRange.makeUnchecked(lowerBound, thisCurrentRange.getUpperBound());
        if (this.tourService.isActive() === false) {
          this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.TEMPORAL_INTERVAL, tempRange.toFormattedStringExtra(this.rangeFormat));
        }
        this.temporalRangeSource.next(tempRange);
      }
      : (upperBound: null | moment.Moment) => {
        const thisCurrentRange = this.temporalRangeSource.getValue();
        const tempRange = SimpleTemporalRange.makeUnchecked(thisCurrentRange.getLowerBound(), upperBound);
        if (this.tourService.isActive() === false) {
          this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.TEMPORAL_INTERVAL, tempRange.toFormattedStringExtra(this.rangeFormat));
        }
        this.temporalRangeSource.next(tempRange);
      };

    // create picker
    const $pickerElement = jQuery(this.wrapper.nativeElement).find(selector);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/dot-notation
    $pickerElement['daterangepicker'](options);
    const pickerObj = $pickerElement.data('daterangepicker') as Record<string, unknown>;

    const popupContainerElement = pickerObj.container as HTMLElement;
    const applyButt = jQuery(popupContainerElement).find('.' + applySelector);
    applyButt.on('click', () => {
      // Known timezone issue with this library:
      // https://github.com/dangrossman/daterangepicker/issues/343
      // create a utc date with the date that was set, whether that be a local or utc moment
      let value: null | moment.Moment = pickerObj.startDate as moment.Moment;
      value = (null == value) ? null : value.local().utc();
      // this.landingService.showLanding(false);
      this.radioControlDate = '';
      setFunction(value);
    });
    applyButt.after(`<button class="${clearSelector} btn btn-sm btn-primary" type="button">Clear</button>`);

    const clearButt = jQuery(popupContainerElement).find('.' + clearSelector);
    clearButt.on('click', () => {
      this.radioControlDate = '';
      setFunction(null);
    });
  }

  public setFunctionUpper(upperBound: moment.Moment, track = true): void {
    const thisCurrentRange = this.temporalRangeSource.getValue();
    const tempRange = SimpleTemporalRange.makeUnchecked(thisCurrentRange.getLowerBound(), upperBound);

    if (tempRange.toFormattedString() !== (thisCurrentRange as SimpleTemporalRange).toFormattedString()) {
      this.temporalRangeSource.next(tempRange);
      if (track && (this.tourService.isActive() === false)) {
        this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.TEMPORAL_INTERVAL, tempRange.toFormattedStringExtra(this.rangeFormat));
      }
    }
  }

  public setFunctionLower(lowerBound: moment.Moment, track = true): void {
    const thisCurrentRange = this.temporalRangeSource.getValue();
    const tempRange = SimpleTemporalRange.makeUnchecked(lowerBound, thisCurrentRange.getUpperBound());

    if (tempRange.toFormattedString() !== (thisCurrentRange as SimpleTemporalRange).toFormattedString()) {
      this.temporalRangeSource.next(tempRange);
      if (track && (this.tourService.isActive() === false)) {
        this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.TEMPORAL_INTERVAL, tempRange.toFormattedStringExtra(this.rangeFormat));
      }
    }
  }

  public datePickerClearClick(event: Event): void {
    this.temporalRangeSource.next(SimpleTemporalRange.makeUnbounded());
    event.stopPropagation();
    this.radioControlDate = '';
    this.temporalClearDisabled = true;
  }

  public startDateChange(): void {
    const newDate = moment(
      this.startDisplayDate,
      this.DATE_FORMAT,
      true
    ).local().utc();
    const thisCurrentRange = this.temporalRangeSource.getValue();
    const lower = thisCurrentRange.getLowerBound();
    const upper = thisCurrentRange.getUpperBound();

    if (newDate.isValid() && ((null == upper) || (upper.isAfter(newDate)))) {
      this.setFunctionLower(newDate);
    } else {
      this.startDisplayDate = (null != lower)
        ? lower.clone().local().format(this.DATE_FORMAT)
        : '';
    }
    this.radioControlDate = '';
  }

  public endDateChange(): void {
    const newDate = moment(
      this.endDisplayDate,
      this.DATE_FORMAT,
      true
    ).local().utc();
    const thisCurrentRange = this.temporalRangeSource.getValue();
    const lower = thisCurrentRange.getLowerBound();
    const upper = thisCurrentRange.getUpperBound();

    if (newDate.isValid() && ((null == lower) || (lower.isBefore(newDate)))) {
      this.setFunctionUpper(newDate);
    } else {
      this.endDisplayDate = (null != upper)
        ? upper.clone().local().format(this.DATE_FORMAT)
        : '';
    }
    this.radioControlDate = '';
  }

  public setRadioDate(event: MatRadioChange | string): void {
    if(event instanceof MatRadioChange){
      const lowerBound = moment().subtract(event.value as moment.DurationInputArg1, 'days');
      console.warn(event);
      this.setFunctionLower(lowerBound, false);
      this.setFunctionUpper(moment());
      this.temporalRadioFilterService.setTempRadioFilter(event.value as string);
    }
    else{
      const lowerBound = moment().subtract(event as moment.DurationInputArg1, 'days');
      this.setFunctionLower(lowerBound, false);
      this.setFunctionUpper(moment());
      this.temporalRadioFilterService.setTempRadioFilter(event as string);
    }
  }

}
