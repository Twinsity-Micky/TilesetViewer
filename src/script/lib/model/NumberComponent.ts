import BasicComponent from './BasicComponent';
import Container from './Container';
import { ChangeFlags } from './ModelDefines';
import NumberFormatter from './NumberFormatter';

export default class NumberComponent extends BasicComponent<number> {
  private minValue: number = undefined;
  private maxValue: number = undefined;
  private step: number = undefined;
  private minDelta: number = undefined;

  constructor(parent: Container | null, name: string = null, value: number = null, fractionDigits = 0) {
    super(parent, name, value);
    this.setFormatter(new NumberFormatter(fractionDigits));
  }

  public getMinValue(): number {
    return this.minValue;
  }

  public setMinValue(minValue: number) {
    if (this.minValue === minValue) return;

    this.doHeavyLifting(() => {
      this.minValue = minValue;
      this.fireChangeEvent(ChangeFlags.ContainerItemChanged);
  
      if (this.getValue() < minValue) {
        this.setValue(minValue);
      }
    });
  }

  public getMaxValue(): number {
    return this.maxValue;
  }

  public setMaxValue(maxValue: number) {
    if (this.maxValue === maxValue) return;

    this.doHeavyLifting(() => {
      this.maxValue = maxValue;
      this.fireChangeEvent(ChangeFlags.ContainerItemChanged);

      if (this.getValue() > maxValue) {
        this.setValue(maxValue);
      }
    });
  }

  public getStep(): number {
    return this.step;
  }

  public setStep(step: number) {
    if (this.step === step) return;

    this.step = step;
    this.fireChangeEvent(ChangeFlags.ContainerItemChanged);
  }

  public getMinDelta(): number {
    return this.minDelta;
  }

  public setMinDelta(minDelta: number) {
    if (this.minDelta === minDelta) return;
    this.minDelta = minDelta;
    this.fireChangeEvent(ChangeFlags.ContainerItemChanged);
  }

  public override setValue(value: number): void {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      super.setValue(null);
      return;
    }
    if (this.maxValue) {
      value = Math.min(this.maxValue, value);
    }
    if (this.minValue) {
      value = Math.max(this.minValue, value);
    }
    if (this.minDelta) {
      const delta = Math.abs(this.getValue() - value);
      if (delta > this.minDelta) {
        super.setValue(value);
      }
    } else {
      super.setValue(value);
    }
  }
}
