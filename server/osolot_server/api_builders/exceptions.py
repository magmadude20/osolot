from django.core.exceptions import ValidationError
from ninja.errors import HttpError

# This was AI. It seems like there should be a standard way of converting 
# ValidationError to a ninja HttpError, but I didn't find one.
def validation_error_to_http_error(validation_error: ValidationError) -> HttpError:
    msg = ""
    if getattr(validation_error, "error_dict", None):
        msg = "; ".join(
            str(err) for errs in validation_error.error_dict.values() for err in errs
        )
    if not msg:
        msg = "; ".join(getattr(validation_error, "messages", []) or []) or str(
            validation_error
        )
    return HttpError(400, msg)
