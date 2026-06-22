# The Review System

Glide features a built-in approval workflow to ensure high translation quality before texts go live in your applications.

## 1. How It Works (The Lifecycle)
When the Review System is engaged, translations do not go live immediately. Instead, they pass through a drafting phase:
- **Drafting:** When a translator enters a new text, it is saved as a `draftValue` and the translation's `reviewStatus` is set to `PENDING_REVIEW`.
- **Approval:** A designated Reviewer checks the draft. Upon approval, the `draftValue` is moved to the live `value` field, and the status is cleared. The text is now public.
- **Rejection:** If a translation is incorrect, the Reviewer rejects it. The status changes to `REJECTED`, alerting the original translator that changes are required.

## 2. When are Reviews triggered?
The system is highly flexible and can be enforced on two levels:

- **Project Level (`reviewEnabled`):** An administrator can enforce reviews for an entire project. If enabled, *every single translation* entered by anyone must pass through the review process.
- **User Level (`requiresReview`):** If a project does *not* enforce global reviews, administrators can still restrict specific, less-experienced users. If a user has the `requiresReview` flag enabled in their profile, only their translations are sent to the review queue, while trusted users can bypass it.

## 3. Who can Review?
Not everyone can approve translations. 
To approve or reject a draft, a user must have the **`isReviewer`** flag enabled in their account settings, or they must be an Administrator. 

## 4. Bulk Imports
When importing a JSON file via the API or the dashboard, you can optionally pass an `importAsPending: true` flag. This will force all imported keys into the review queue, which is extremely useful when importing machine-translated files or texts from external translation agencies that still need a human check.
