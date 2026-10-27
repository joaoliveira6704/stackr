# Working on stackr

Keep everything in English. Code, comments, UI text, error messages, commit messages and your replies too. The demo names and emails in db.json stay in Portuguese, everything else is English.

Write like a normal person. Simple words, short sentences, no jargon when a plain word works. No bullet points or numbered lists in this project, in code comments or in anything you write, and no emojis.

Stackr is a finance app, so keep the interface consistent with Revolut. Quiet and clean: a white background, near-black text, soft grey borders, plenty of spacing, large rounded cards holding each block of content. One accent colour is enough, and the main action on a screen is a dark button with white text while secondary actions are plain outlined buttons. Headings are big and bold, the labels under them are small and grey. Money is always shown with tabular figures so the digits line up in a column, amounts sit right aligned in any list, and list rows follow the pattern already used on the login and dashboard screens: a title, a muted detail below it, the value on the right. Avoid loud colours, gradients, drop shadows and decoration. When you add a screen, make it feel like it has always been part of the same app as the login, sign up and dashboard pages that exist today.

## Code quality

Write clean code and leave every file a little tidier than you found it. Give variables, functions and components names that say what they are or what they do. Keep functions short and focused on one job. If a function needs a comment to explain what it does, rename it or split it up first. Comments should explain why something is done, not what the code already says.

Do not repeat yourself. When the same logic shows up a second or third time, move it into one shared place. Do not over-engineer either. Build what the feature needs today and keep it simple.

Follow the patterns and folder structure already in the project before you invent new ones. Handle errors on purpose, with clear English messages that help the user. Remove dead code, unused imports and leftover debug logs before you finish. Keep money logic in one place so rounding and formatting stay the same across the app.

## Tests

Every new feature comes with unit tests, written using vitest. Write them in the same change as the feature, not later. Test the behaviour the user cares about, and cover the normal case, the edge cases and the error cases. For money, always test rounding, zero, negative amounts and large values.

Keep each test small and focused on one thing. Name tests so a failure reads like a sentence that explains what broke. Tests must not depend on each other or on real network calls, so use simple fakes for outside services and for db.json data. Run the full test suite before you say the work is done, and fix any test your change breaks. When you fix a bug, add a test that would have caught it.
