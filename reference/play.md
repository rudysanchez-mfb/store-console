# Google Play Console notes

Base URL shape: `https://play.google.com/console/u/0/developers/<developer-id>/app/<app-id>/...`
App list: `https://play.google.com/console/u/0/developers/<developer-id>/app-list`.

## Navigation that worked

- Left nav items are custom; `clicktext "App content"` style DOM clicks beat `text=`.
- App content tasks: each row has a "Start"/"Manage" link; declarations are radio
  groups plus text inputs. Save button text is "Save".
- Store settings > tags: the tag dialog has a search box; type a tag then click the
  matching option; max 5.
- Testing > Closed testing > track: "Countries/regions" tab -> "Add countries / regions"
  -> select-all checkbox in the dialog header -> "Add countries / regions". The page may
  show 0 targeted right after save; reload before trusting the count.
- Testers tab: "Create email list" or pick an existing list checkbox; "Save changes".
- Releases: "Create new release" -> "Add from library" (the first `text=` match is a
  hidden expansion-file button; click the visible one by coordinates or
  `>> visible=true`) -> pick the bundle row -> "Add to release" -> release name/notes ->
  "Next" -> "Save" (not "Save and publish" unless asked).
- Publishing overview: "Send N changes for review" opens a dialog; confirm with
  `dialog[open] >> button:has-text("Send")`. Result shows "Changes in review".

## Gotchas

- On Linux/VMs, Chrome may not have a GPU; Play Console still renders, but animations
  can make `text=` clicks flaky — prefer `clicktext` and re-read the page after clicks.
- Some buttons are rendered twice (hidden + visible); use `>> visible=true` and `.last()`.
- Dialogs often live outside the main form; scope to `[role=dialog]` or `dialog[open]`.

## Account facts (verify in your own console)

- New personal developer accounts may need a closed test with a minimum number of
  opted-in testers for a set period before applying for production. Check the current
  requirement in Play Console > Dashboard; it changes.
- Advertising ID declarations, news-app declarations and similar answers are
  account/app specific. Prepare them before automating and reuse the approved text.
