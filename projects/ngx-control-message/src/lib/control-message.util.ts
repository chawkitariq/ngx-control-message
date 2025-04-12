import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { from, Observable, map } from 'rxjs';

// Store validation messages in a WeakMap to keep them specific to each control
const validationMessages = new WeakMap<AbstractControl, Map<string, string>>();

/**
 * Sets a validation message for a specific validator error
 */
export function setControlMessage(validator: ValidatorFn, message: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const error = validator(control);
    
    if (error) {
      const errorKey = Object.keys(error)[0];
      if (!validationMessages.has(control)) {
        validationMessages.set(control, new Map<string, string>());
      }
      validationMessages.get(control)?.set(errorKey, message);
    }
    
    return error;
  };
}

/**
 * Sets a validation message for an async validator error
 */
export function setAsyncControlMessage(validator: AsyncValidatorFn, message: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const validationResult = validator(control);
    
    // Convert the result to an Observable, handling both Promise and Observable cases
    const observable = validationResult instanceof Promise ? from(validationResult) : validationResult;
    
    return observable.pipe(
      map(error => {
        if (error) {
          const errorKey = Object.keys(error)[0];
          if (!validationMessages.has(control)) {
            validationMessages.set(control, new Map<string, string>());
          }  
          validationMessages.get(control)?.set(errorKey, message);
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
  
  const errorKey = Object.keys(control.errors)[0];
  const messages = validationMessages.get(control);
  
  if (messages && messages.has(errorKey)) {
    return messages.get(errorKey) || '';
  }
  
  return '';
}