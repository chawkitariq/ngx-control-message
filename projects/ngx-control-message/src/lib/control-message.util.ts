import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { from, Observable, map } from 'rxjs';

/**
 * Sets a validation message for a specific validator error
 */
export function setControlMessage(
  validator: ValidatorFn,
  message: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error = validator(control);
    if (error) {
      const errorKey = Object.keys(error)[0];
      const updatedError = { ...error };
      updatedError[errorKey] = message;
      return updatedError;
    }
    return error;
  };
}

/**
 * Sets a validation message for an async validator error
 */
export function setAsyncControlMessage(
  validator: AsyncValidatorFn,
  message: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const validationResult = validator(control);
    const observable =
      validationResult instanceof Promise
        ? from(validationResult)
        : validationResult;
    
    return observable.pipe(
      map((error) => {
        if (error) {
          const errorKey = Object.keys(error)[0];
          const updatedError = { ...error };
          updatedError[errorKey] = message;
          return updatedError;
        }
        return error;
      })
    );
  };
}

/**
 * Gets the validation error message for a control
 */
export function getControlMessage(control: AbstractControl | null): string {
  if (!control || !control.errors) {
    return '';
  }
  
  const errorKeys = Object.keys(control.errors);
  if (errorKeys.length === 0) {
    return '';
  }
  
  const errorKey = errorKeys[0];
  const message = control.errors[errorKey];
  
  return typeof message === 'string' ? message : '';
}