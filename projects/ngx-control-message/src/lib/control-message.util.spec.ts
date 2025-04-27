import {
  FormControl,
  ValidationErrors,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { firstValueFrom, Observable, of, delay } from 'rxjs';
import {
  setControlMessage,
  setAsyncControlMessage,
  getControlMessage,
} from './control-message.util';

describe('Form Validation Utilities', () => {
  const minLengthValidator = Validators.minLength(5);
  const requiredValidator = Validators.required;

  const asyncValidator = (
    control: AbstractControl
  ): Observable<ValidationErrors | null> => {
    const value = control.value;
    return of(value === 'taken' ? { usernameTaken: true } : null).pipe(
      delay(10)
    );
  };

  describe('setControlMessage', () => {
    it('should set a custom message for a validator error', () => {
      const minLengthMessage = 'Input must be at least 5 characters';
      const customValidator = setControlMessage(
        minLengthValidator,
        minLengthMessage
      );
      const control = new FormControl('abc');

      const result = customValidator(control);

      expect(result).not.toBeNull();
      expect(result!['minlength']).toBe(minLengthMessage);
    });

    it('should pass through null when validation passes', () => {
      const minLengthMessage = 'Input must be at least 5 characters';
      const customValidator = setControlMessage(
        minLengthValidator,
        minLengthMessage
      );
      const control = new FormControl('abcdefg');

      const result = customValidator(control);

      expect(result).toBeNull();
    });

    it('should not interfere with the original validator functionality', () => {
      const requiredMessage = 'This field is required';
      const customValidator = setControlMessage(
        requiredValidator,
        requiredMessage
      );
      const validControl = new FormControl('some value');
      const invalidControl = new FormControl('');

      expect(customValidator(validControl)).toBeNull();
      expect(customValidator(invalidControl)).not.toBeNull();
      expect(customValidator(invalidControl)!['required']).toBe(
        requiredMessage
      );
    });

    it('should work with multiple validators in a chain', () => {
      const requiredMessage = 'This field is required';
      const minLengthMessage = 'Input must be at least 5 characters';

      const control = new FormControl('');

      control.setValidators([
        setControlMessage(requiredValidator, requiredMessage),
        setControlMessage(minLengthValidator, minLengthMessage),
      ]);
      control.updateValueAndValidity();

      expect(control.errors).not.toBeNull();

      expect(control.errors!['required']).toBe(requiredMessage);

      control.setValue('abc');
      control.updateValueAndValidity();
      expect(control.errors!['minlength']).toBe(minLengthMessage);
    });
  });

  describe('setAsyncControlMessage', () => {
    it('should set a custom message for an async validator error', async () => {
      const usernameTakenMessage = 'This username is already taken';
      const customAsyncValidator = setAsyncControlMessage(
        asyncValidator,
        usernameTakenMessage
      );
      const control = new FormControl('taken');

      const result$ = customAsyncValidator(control);

      // @ts-ignore
      const result = await firstValueFrom(result$);

      expect(result).not.toBeNull();

      // @ts-ignore
      expect(result!['usernameTaken']).toBe(usernameTakenMessage);
    });

    it('should pass through null when async validation passes', async () => {
      const usernameTakenMessage = 'This username is already taken';
      const customAsyncValidator = setAsyncControlMessage(
        asyncValidator,
        usernameTakenMessage
      );
      const control = new FormControl('available');

      const result$ = customAsyncValidator(control);

      // @ts-ignore

      const result = await firstValueFrom(result$);

      expect(result).toBeNull();
    });

    it('should work with Promise-based async validators', async () => {
      const promiseValidator = (
        control: AbstractControl
      ): Promise<ValidationErrors | null> => {
        return Promise.resolve(
          control.value === 'invalid' ? { invalid: true } : null
        );
      };

      const errorMessage = 'This value is invalid';
      const customAsyncValidator = setAsyncControlMessage(
        promiseValidator,
        errorMessage
      );
      const control = new FormControl('invalid');

      const result$ = customAsyncValidator(control);

      // @ts-ignore
      const result = await firstValueFrom(result$);

      expect(result).not.toBeNull();

      // @ts-ignore
      expect(result!['invalid']).toBe(errorMessage);
    });

    it('should handle null result from async validator properly', async () => {
      const nullReturnValidator = (
        control: AbstractControl
      ): Observable<ValidationErrors | null> => {
        return of(null);
      };

      const errorMessage = 'Error message that should not be used';
      const customAsyncValidator = setAsyncControlMessage(
        nullReturnValidator,
        errorMessage
      );
      const control = new FormControl('anyValue');

      const result$ = customAsyncValidator(control);

      // @ts-ignore
      const result = await firstValueFrom(result$);

      expect(result).toBeNull();
    });
  });

  describe('getControlMessage', () => {
    it('should return an empty string for null control', () => {
      const message = getControlMessage(null);

      expect(message).toBe('');
    });

    it('should return an empty string for control without errors', () => {
      const control = new FormControl('valid');

      const message = getControlMessage(control);

      expect(message).toBe('');
    });

    it('should return an empty string when control.errors is an empty object', () => {
      const control = new FormControl('valid');
      control.setErrors({});

      const message = getControlMessage(control);

      expect(message).toBe('');
    });

    it('should return the error message for a control with string error', () => {
      const errorMessage = 'This field is required';
      const control = new FormControl('');
      control.setErrors({ required: errorMessage });

      const message = getControlMessage(control);

      expect(message).toBe(errorMessage);
    });

    it('should return an empty string for a control with non-string error', () => {
      const control = new FormControl('');
      control.setErrors({ required: true });

      const message = getControlMessage(control);

      expect(message).toBe('');
    });

    it('should return the first error message when multiple errors exist', () => {
      const requiredMessage = 'This field is required';
      const minLengthMessage = 'Input must be at least 5 characters';
      const control = new FormControl('');
      control.setErrors({
        required: requiredMessage,
        minlength: minLengthMessage,
      });

      const message = getControlMessage(control);

      expect(message).toBe(requiredMessage);
    });

    it('should work with complex error objects', () => {
      const control = new FormControl('');

      control.setErrors({
        minlength: {
          requiredLength: 5,
          actualLength: 0,
          message: 'Min length error',
        },
      });

      const message = getControlMessage(control);

      expect(message).toBe('');
    });
  });

  describe('Integration tests', () => {
    it('should work with both sync and async validators in a real form', async () => {
      const requiredMessage = 'Username is required';
      const minLengthMessage = 'Username must be at least 5 characters';
      const usernameTakenMessage = 'This username is already taken';

      const control = new FormControl('');

      control.setValidators([
        setControlMessage(requiredValidator, requiredMessage),
        setControlMessage(minLengthValidator, minLengthMessage),
      ]);

      control.setAsyncValidators(
        setAsyncControlMessage(asyncValidator, usernameTakenMessage)
      );

      control.updateValueAndValidity();

      expect(getControlMessage(control)).toBe(requiredMessage);

      control.setValue('abc');
      control.updateValueAndValidity();
      expect(getControlMessage(control)).toBe(minLengthMessage);

      control.setValue('taken');
      control.updateValueAndValidity();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(getControlMessage(control)).toBe(usernameTakenMessage);

      control.setValue('available_username');
      control.updateValueAndValidity();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(getControlMessage(control)).toBe('');
    });

    it('should provide the expected error message after form initialization', () => {
      const requiredMessage = 'Field is required';
      const control = new FormControl('', {
        validators: [setControlMessage(requiredValidator, requiredMessage)],
      });

      expect(getControlMessage(control)).toBe(requiredMessage);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string message correctly', () => {
      const emptyMessage = '';
      const customValidator = setControlMessage(
        requiredValidator,
        emptyMessage
      );
      const control = new FormControl('');

      const result = customValidator(control);

      expect(result).not.toBeNull();
      expect(result!['required']).toBe(emptyMessage);

      control.setValidators(customValidator);
      control.updateValueAndValidity();
      expect(getControlMessage(control)).toBe(emptyMessage);
    });

    it('should handle null message without crashing', () => {
      const nullMessage = null as unknown as string;
      const customValidator = setControlMessage(requiredValidator, nullMessage);
      const control = new FormControl('');

      const result = customValidator(control);
      expect(result).not.toBeNull();
      expect(result!['required']).toBe(nullMessage);
    });
  });
});
