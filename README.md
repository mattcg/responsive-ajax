# responsive-ajax

Responsive AJAX for people who know what they're doing.

## Methods

All methods return an instance of `Deferred` created by [tiny-deferred](https://github.com/mattcg/tiny-deferred).

### sendForm(form)

Extract the name and value pairs from all the form's controls and submit them using AJAX. The `action` attribute of the form is used for the request. Methods that aren't supported by HTML forms can be shimmed by adding a form control with the name `_method` (currently only supports `PUT` and `DELETE`).

The `enctype` and `method` attributes of the form may be significant. If the `enctype` attribute is explicitly set to `multipart/form-data` or the form contains a `file` type control then `POST` will be assumed (unless the form contains a control named `_method` with a value of `PUT`).

### canSendForm(form)

Not all browsers are capable of serializing multipart forms. To be safe, check a form using `canSendForm`.

### putJSON(path, data, headers)

Makes a `PUT` request with the given data encoded as JSON in the request entity body.

### postJSON(path, data, headers)

Makes a `POST` request with the given data encoded as JSON in the request entity body.

### del(path, data, headers)

Make a `DELETE` request. Data is URL encoded and appended to the path.

### get(path, data, headers)

Make a `GET` request. Data is URL encoded and appended to the path.