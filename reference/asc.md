# App Store Connect notes

Apps: `https://appstoreconnect.apple.com/apps`. The Apple session does not survive the
profile copy; sign in with 2FA in the Chrome window that was launched.

## Version page (`.../apps/<id>/distribution/ios/version/inflight`)

Fields are plain form controls:
`textarea[name=promotionalText]`, `textarea[name=description]`, `input[name=keywords]`,
`input[name=versionString]`, `textarea[name=notes]` (review notes), demo account
`input[name=demoAccountName]` / `input[name=demoAccountPassword]`, plus the
sign-in-required toggle.

Build: "Add Build" / "+" opens a picker; select the row by its text (for example
"4 0.2.2") BEFORE pressing Done, else the wrong build attaches (remove via the "-"
and re-add).

Save: top-right `button:has-text("Save")`. "Add for Review" is the final submit: leave
it for the user unless told otherwise.

## App Information

Subtitle `input[name=subtitle]`; category is a `<select>` (`select[name=primaryCategory]`,
values such as `NEWS`); the Content Rights link opens a dialog with radios
`contentRightsDeclaration=USES_THIRD_PARTY_CONTENT|DOES_NOT_USE_THIRD_PARTY_CONTENT`.

Age rating: "Edit" opens a multi-step wizard, and each step is a named radio group.
Drive it with `asc_wizard.js "name=value,..." Next` and read the printed `RADIOS` to
learn the next step's names; the final step button is "Done", then page "Save".

## App Privacy

"Get Started" -> collect data yes -> checkboxes by data type name
(`input[type=checkbox][name="EMAIL_ADDRESS"]` etc.) -> Save. Then each type shows
"Set Up <Type>"; `asc_priv_type.js` runs purposes -> isLinked -> two definition pages ->
isTracked -> Save. Purposes are checkbox names such as `APP_FUNCTIONALITY`,
`PRODUCT_PERSONALIZATION`, `ANALYTICS`. Finish with the page-level "Publish" button.
Privacy policy URL: `input[name=privacyPolicyUrl]`.

## Pricing and Availability

Pricing: "Add Pricing" -> base country/region US -> price dropdown
(`button[name=basePricePointId]`, or click its coordinates, type `0` in Search,
click `$0.00`) -> Next -> Confirm. Availability: "Set Up Availability" -> all
countries radio (`SETUP_ALL`) -> Confirm.

## Gotchas

- Many buttons are rendered twice (hidden + visible); use `>> visible=true` and `.last()`.
- `text=` clicks often time out on custom components; fall back to `clicktext` or `xy`.
- Dialog buttons: scope to `[role=dialog]`.
- Age-rating answers are app specific. Example values for a 13+ news app: all
  controls/capabilities No; profanity None; horror None; alcohol/drugs Infrequent;
  medical None; mature themes Infrequent; sexual None; cartoon violence None; realistic
  violence Infrequent; prolonged graphic violence None; weapons Infrequent; gambling None.
  Confirm every answer against your own app before submitting.
