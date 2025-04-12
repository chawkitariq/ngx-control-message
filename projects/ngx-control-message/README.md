# ngx-control-message

An Angular library for binding a message to a synchronous or asynchronous form control validator.

## Installation

```bash
npm install ngx-control-message
```

## Usage

`form.component.ts`
```typescript
import { getControlMessage, setControlMessage, setAsyncControlMessage } from "ngx-control-message";

class FormComponent {
   getControlMessage = getControlMessage;
   
   name = new FormControl('', {
      validators: [
         setControlMessage(Validators.required, 'Name is required.'),
         setControlMessage(Validators.minLength(4), 'Name must be at least 4 characters long.'),
         setControlMessage(forbiddenNameValidator(/bob/i), 'Name cannot be Bob.'),
      ],
      asyncValidators: [
         setAsyncControlMessage(nameExistsAsyncValidator, 'Name already exists.')
      ]
   });
}
```

`form.component.html`
```html
<input type="text" id="name" class="form-control" formControlName="name" required />
@if (name.invalid && (name.dirty || name.touched)) {
  <div class="alert alert-danger">{{ getControlMessage(name) }}</div>
}
```

## API

### setControlMessage()

```typescript
/**
 * Sets a validation message for a specific validator error
 */
export declare function setControlMessage(validator: ValidatorFn, message: string): ValidatorFn;
```

### setAsyncControlMessage()

```typescript
/**
 * Sets a validation message for an async validator error
 */
export declare function setAsyncControlMessage(validator: AsyncValidatorFn, message: string): AsyncValidatorFn;
```

### getControlMessage()

```typescript
/**
 * Gets the validation error message for a control
 */
export declare function getControlMessage(control: AbstractControl | null): string;
```